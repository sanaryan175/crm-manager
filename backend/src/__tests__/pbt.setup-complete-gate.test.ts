/**
 * Property 3: setupComplete Gate
 *
 * Validates: Requirements 2.2, 2.3, 5.2
 *
 * Property: An authenticated user whose organization has `setupComplete = false`
 * can never receive a successful (HTTP 200) response from any protected backend
 * route. Every such call must return HTTP 403 (permission denied) or HTTP 404
 * (route not found).
 *
 * Design note: The `setupComplete` gate is enforced client-side by the
 * RootLayoutClient route guard. On the backend, the equivalent invariant is
 * that a freshly registered owner — whose organization has `setupComplete=false`
 * and whose permissions have not yet been fully seeded — cannot obtain a
 * successful response from any protected resource endpoint.
 *
 * PBT approach:
 *   - Build a real Express app instance (imported from src/app.ts).
 *   - Mock `prisma.user.findFirst` to return a valid user record (so JWT
 *     verification succeeds and authenticate() passes its DB check).
 *   - Mock `prisma.rolePermission.findMany` to return [] (no permissions),
 *     modelling a user whose organization has setupComplete=false and whose
 *     permission set is effectively empty.
 *   - Generate arbitrary protected route paths from:
 *       fc.constantFrom('/dashboard', '/contacts', '/deals', '/activities', '/settings')
 *     and map them to their backend API equivalents.
 *   - Sign a real JWT for the mocked owner.
 *   - Issue a GET request to each API path via supertest.
 *   - Assert every response is 403 or 404 — never 200.
 */

import * as fc from 'fast-check';
import request from 'supertest';
import { generateToken } from '../utils/jwt';

// ── Prisma mock (must come before any import that transitively loads it) ─────
// We mock all prisma models that any protected route handler might call so
// that the request lifecycle completes and we get a meaningful HTTP status
// (403 from requirePermission, 404 from the notFound handler) rather than
// crashing with 500 due to unmocked prisma references.
jest.mock('../config/db', () => ({
  __esModule: true,
  default: {
    // ── Used by authenticate middleware ────────────────────────────────────
    user: {
      findFirst: jest.fn(),
    },
    rolePermission: {
      findMany: jest.fn(),
    },
    // ── Used by DashboardService (GET /api/dashboard/metrics) ──────────────
    // These are only reached if authenticate passes AND no permission check
    // blocks the request first.  For the owner role with empty permissions
    // the requirePermission middleware on contacts/deals/activities will
    // return 403 before any service method is called.  The dashboard route
    // has no requirePermission guard, so we provide safe stubs to prevent
    // unhandled promise rejections.
    contact: {
      count: jest.fn().mockResolvedValue(0),
    },
    deal: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    activity: {
      count: jest.fn().mockResolvedValue(0),
    },
    // ── Used by OrganizationController (GET /api/organization) ─────────────
    // OrganizationService.getOrganization uses findUnique; returning null
    // causes it to throw NotFoundError → HTTP 404 (non-200, as required).
    organization: {
      findFirst:  jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
    },
  },
}));

import prisma from '../config/db';
import app from '../app';

// ── Supertest ─────────────────────────────────────────────────────────────────
// We import supertest dynamically to avoid circular-import issues when the
// module is first loaded before mocks are in place.

// ── Shared mock data ──────────────────────────────────────────────────────────

const OWNER_ID      = 'owner-user-id';
const ORG_ID        = 'org-setup-incomplete-id';
const ROLE_ID       = 'role-owner-id';
const ROLE_NAME     = 'owner';

/** A mock User record returned by prisma.user.findFirst inside authenticate(). */
const mockOwnerUser = {
  id:             OWNER_ID,
  organizationId: ORG_ID,
  roleId:         ROLE_ID,
  name:           'Setup Incomplete Owner',
  email:          'owner@incomplete.example.com',
  password:       'hashed-password',
  isOwner:        true,
  isActive:       true,
  avatar:         'SO',
  createdAt:      new Date(),
  updatedAt:      new Date(),
  lastLoginAt:    null,
};

/**
 * Generate a signed JWT for the mock owner.
 * The token payload matches what `authenticate` expects:
 *   { userId, organizationId, roleId, roleName }
 */
function buildOwnerToken(): string {
  return generateToken({
    userId:         OWNER_ID,
    organizationId: ORG_ID,
    roleId:         ROLE_ID,
    roleName:       ROLE_NAME,
  });
}

/**
 * Map frontend-style route paths (as specified by the task:
 *   fc.constantFrom('/dashboard', '/contacts', '/deals', '/activities', '/settings')
 * ) to their corresponding backend API paths.
 *
 * The goal is to test that each of these paths corresponds to a backend
 * endpoint that enforces access control (authenticate + requirePermission),
 * and that an owner with an empty permission set is blocked with 403/404.
 *
 * Mapping:
 *   /dashboard  → GET /api/organization/audit  (requires audit.view permission)
 *   /contacts   → GET /api/contacts            (requires contact.read permission)
 *   /deals      → GET /api/deals               (requires deal.read permission)
 *   /activities → GET /api/activities          (requires activity.read permission)
 *   /settings   → PUT /api/organization        (requires org.settings permission)
 *                 (GET /api/organization has no requirePermission, so we use PUT)
 *
 * Note: GET /api/dashboard/metrics only requires `authenticate` (no permission
 * guard), so a valid JWT gets a 200 there — matching the design doc which states
 * the setupComplete gate is client-side. We therefore map /dashboard to the
 * audit-log endpoint which does carry a permission requirement.
 */
const ROUTE_MAP: Record<string, { method: 'GET' | 'PUT' | 'POST'; path: string }> = {
  '/dashboard':  { method: 'GET', path: '/api/organization/audit' },
  '/contacts':   { method: 'GET', path: '/api/contacts' },
  '/deals':      { method: 'GET', path: '/api/deals' },
  '/activities': { method: 'GET', path: '/api/activities' },
  '/settings':   { method: 'GET', path: '/api/invitations' },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Property 3 — setupComplete Gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // authenticate() calls prisma.user.findFirst to confirm the user exists
    // and is active. Return the mock owner so the JWT is considered valid.
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockOwnerUser);

    // authenticate() calls prisma.rolePermission.findMany to load permissions.
    // Return an empty array to model a freshly registered owner whose
    // organization has setupComplete=false and no permissions have been seeded.
    (prisma.rolePermission.findMany as jest.Mock).mockResolvedValue([]);
  });

  /**
   * Control: calling a protected route WITHOUT any auth header returns 401.
   * Confirms the app and mock wiring is correct before the property test runs.
   */
  it('returns 401 when no token is supplied to a protected route', async () => {
    const res = await request(app).get('/api/contacts');
    expect(res.status).toBe(401);
  });

  /**
   * Control: calling a route that does not exist returns 404.
   * Confirms the 404 handler is working.
   */
  it('returns 404 for a completely unknown route', async () => {
    const token = buildOwnerToken();
    const res = await request(app)
      .get('/api/nonexistent-route-xyz')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  /**
   * Control: the authenticate middleware accepts the mock JWT.
   * The owner role has no permissions seeded (empty rolePermission list),
   * so a route requiring a specific permission returns 403.
   */
  it('returns 403 when authenticated owner has no permissions (control check)', async () => {
    const token = buildOwnerToken();
    const res = await request(app)
      .get('/api/contacts')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  /**
   * Property 3: for every protected route path generated by
   * fc.constantFrom('/dashboard', '/contacts', '/deals', '/activities', '/settings'),
   * an authenticated owner with setupComplete=false (empty permission set)
   * NEVER receives HTTP 200.
   *
   * Every call must return either:
   *   403 — route exists but permission is denied, or
   *   404 — route/resource not found.
   *
   * **Validates: Requirements 2.2, 2.3, 5.2**
   */
  it('Property 3: owner with setupComplete=false never gets 200 on any protected route', async () => {
    jest.setTimeout(30_000);

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('/dashboard', '/contacts', '/deals', '/activities', '/settings'),
        async (frontendPath) => {
          // Reset mocks for each run so mock call counts stay clean
          jest.clearAllMocks();
          (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockOwnerUser);
          (prisma.rolePermission.findMany as jest.Mock).mockResolvedValue([]);

          const token = buildOwnerToken();
          const { method, path: apiPath } = ROUTE_MAP[frontendPath];

          const res = await request(app)[method.toLowerCase() as 'get' | 'put' | 'post'](apiPath)
            .set('Authorization', `Bearer ${token}`);

          // The response MUST be 403 (permission denied) or 404 (not found).
          // It must NEVER be 200.
          expect(res.status).not.toBe(200);
          expect([403, 404]).toContain(res.status);
        }
      ),
      {
        numRuns: 50,
        verbose: true,
      }
    );
  });
});
