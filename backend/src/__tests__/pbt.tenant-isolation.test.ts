/**
 * Property 10: Tenant Data Isolation
 *
 * Validates: Requirements 10.1, 10.2, 10.5, 12.4
 *
 * Property: For any two distinct organizations A and B, when an authenticated
 * user from org A attempts to access tenant-scoped resources belonging to org B
 * (contacts, deals, user profiles, invitations), the system MUST return HTTP 403
 * (Forbidden) or HTTP 404 (Not Found) — never HTTP 200.
 *
 * This ensures that the JWT's organizationId correctly scopes all DB queries
 * and that no resource from one tenant is accessible to another tenant.
 *
 * PBT approach:
 *   - Register two separate owner accounts (org A and org B) via the real API.
 *   - For each org, create sample resources (contacts, deals, invitations).
 *   - For each tenant-scoped endpoint (GET /contacts/:id, GET /deals/:id,
 *     PATCH /auth/me, GET /invitations), call it using org A's JWT while
 *     providing resource IDs from org B.
 *   - Assert every cross-tenant request returns 403 or 404 (never 200).
 */

import * as fc from 'fast-check';
import request from 'supertest';
import app from '../app';
import prisma from '../config/db';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Generate a stable unique suffix for creating distinct email addresses across
 * test runs. Uses a counter + timestamp to guarantee no collisions.
 */
let counter = 0;
function uniqueEmail(label: string): string {
  return `pbt-tenant-${label}-${Date.now()}-${++counter}@example.com`;
}

/**
 * Register a fresh owner account via the real POST /api/auth/register endpoint.
 * Returns { token, orgId, userId }.
 */
async function registerOrg(name: string, email: string, password: string) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      ownerName:       name,
      ownerEmail:      email,
      ownerPassword:   password,
      confirmPassword: password,
    });

  if (res.status !== 201) {
    throw new Error(
      `registerOrg failed: status=${res.status} body=${JSON.stringify(res.body)}`
    );
  }

  const { token, organization, user } = res.body.data;
  return {
    token: token as string,
    orgId: organization.id as string,
    userId: user.id as string,
  };
}

/**
 * Create a contact for a given org using its owner JWT.
 * Returns the created contact ID.
 */
async function createContact(token: string, email: string) {
  const res = await request(app)
    .post('/api/contacts')
    .set('Authorization', `Bearer ${token}`)
    .send({
      firstName: 'Bob',
      lastName:  'Tenant',
      email,
    });

  if (res.status !== 201) {
    throw new Error(
      `createContact failed: status=${res.status} body=${JSON.stringify(res.body)}`
    );
  }

  return res.body.data.id as string;
}

/**
 * Create a deal for a given org using its owner JWT.
 * Returns the created deal ID.
 */
async function createDeal(token: string, title: string) {
  const res = await request(app)
    .post('/api/deals')
    .set('Authorization', `Bearer ${token}`)
    .send({ title, value: 50000, currency: 'USD' });

  if (res.status !== 201) {
    throw new Error(
      `createDeal failed: status=${res.status} body=${JSON.stringify(res.body)}`
    );
  }

  return res.body.data.id as string;
}

/**
 * Send an invitation from a given org to get an invitation ID owned by that org.
 * Returns the invitation ID.
 */
async function sendInvitation(token: string, orgId: string, toEmail: string) {
  const roles = await prisma.role.findMany({ where: { organizationId: orgId } });
  const salesRepRole = roles.find(r => r.name === 'sales_rep');
  if (!salesRepRole) throw new Error('sales_rep role not found');

  const res = await request(app)
    .post('/api/invitations')
    .set('Authorization', `Bearer ${token}`)
    .send({ email: toEmail, roleId: salesRepRole.id });

  if (res.status !== 201) {
    throw new Error(
      `sendInvitation failed: status=${res.status} body=${JSON.stringify(res.body)}`
    );
  }

  return res.body.data.invitation.id as string;
}

// ─── Test suite ────────────────────────────────────────────────────────────

describe('Property 10 — Tenant Data Isolation', () => {
  jest.setTimeout(120_000);

  // ── Control: owner can access their own resources ────────────────────────

  it('allows access to own contact (control check)', async () => {
    const orgA = await registerOrg('Owner A', uniqueEmail('ctrl-a-own'), 'password123');
    const contactId = await createContact(orgA.token, uniqueEmail('contact-ctrl'));

    const res = await request(app)
      .get(`/api/contacts/${contactId}`)
      .set('Authorization', `Bearer ${orgA.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(contactId);
  });

  it('allows access to own deal (control check)', async () => {
    const orgA = await registerOrg('Owner A2', uniqueEmail('ctrl-a2-own'), 'password123');
    const dealId = await createDeal(orgA.token, 'My Own Deal');

    const res = await request(app)
      .get(`/api/deals/${dealId}`)
      .set('Authorization', `Bearer ${orgA.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(dealId);
  });

  // ── Control: cross-tenant access returns 403 or 404 ─────────────────────

  it('returns 404 when org A reads org B contact by ID (control check)', async () => {
    const orgA = await registerOrg('Owner A3', uniqueEmail('ctrl-a3'), 'password123');
    const orgB = await registerOrg('Owner B3', uniqueEmail('ctrl-b3'), 'password123');

    const contactIdB = await createContact(orgB.token, uniqueEmail('contact-b3'));

    const res = await request(app)
      .get(`/api/contacts/${contactIdB}`)
      .set('Authorization', `Bearer ${orgA.token}`);

    expect(res.status).toBe(404);
  });

  it('returns 404 when org A reads org B deal by ID (control check)', async () => {
    const orgA = await registerOrg('Owner A4', uniqueEmail('ctrl-a4'), 'password123');
    const orgB = await registerOrg('Owner B4', uniqueEmail('ctrl-b4'), 'password123');

    const dealIdB = await createDeal(orgB.token, 'Org B Deal');

    const res = await request(app)
      .get(`/api/deals/${dealIdB}`)
      .set('Authorization', `Bearer ${orgA.token}`);

    expect(res.status).toBe(404);
  });

  it('GET /invitations for org A does not include org B invitations (control check)', async () => {
    const orgA = await registerOrg('Owner A5', uniqueEmail('ctrl-a5'), 'password123');
    const orgB = await registerOrg('Owner B5', uniqueEmail('ctrl-b5'), 'password123');

    const invIdB = await sendInvitation(orgB.token, orgB.orgId, uniqueEmail('invitee-b5'));

    const res = await request(app)
      .get('/api/invitations')
      .set('Authorization', `Bearer ${orgA.token}`);

    expect(res.status).toBe(200);
    const ids = (res.body.data as Array<{ id: string }>).map(inv => inv.id);
    expect(ids).not.toContain(invIdB);
  });

  it('PATCH /auth/me only updates the authenticated user (tenant isolation on profile endpoint)', async () => {
    const orgA = await registerOrg('Owner A6', uniqueEmail('ctrl-a6'), 'password123');
    const orgB = await registerOrg('Owner B6', uniqueEmail('ctrl-b6'), 'password123');

    const res = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${orgA.token}`)
      .send({ name: 'Renamed A6' });

    expect(res.status).toBe(200);
    // Updated user belongs to org A — not org B
    expect(res.body.data.organizationId).toBe(orgA.orgId);
    expect(res.body.data.id).toBe(orgA.userId);
    expect(res.body.data.organizationId).not.toBe(orgB.orgId);
  });

  // ── Property 10 ──────────────────────────────────────────────────────────

  /**
   * Property 10: For any two distinct organizations A and B, when org A
   * attempts to access tenant-scoped resources belonging to org B, the system
   * MUST return HTTP 403 or HTTP 404 — never HTTP 200.
   *
   * Endpoints tested:
   *   - GET /api/contacts/:id  — org A uses a contact ID owned by org B
   *   - GET /api/deals/:id     — org A uses a deal ID owned by org B
   *   - GET /api/invitations   — org A lists invitations; org B's inv must not appear
   *
   * **Validates: Requirements 10.1, 10.2, 10.5, 12.4**
   */
  it('Property 10: cross-tenant resource access always returns 403 or 404', async () => {
    // Use fast-check to vary just the data labels across runs while keeping
    // the isolation invariant fixed. Generating fresh unique emails per run
    // prevents email-uniqueness collisions across property runs.
    await fc.assert(
      fc.asyncProperty(
        // Generate a small unique index per run to vary test data
        fc.integer({ min: 1, max: 1000 }),
        async (runIdx) => {
          // Create two distinct orgs with unique emails
          const orgA = await registerOrg(
            `OrgA-${runIdx}`,
            uniqueEmail(`prop-a-${runIdx}`),
            'password123'
          );
          const orgB = await registerOrg(
            `OrgB-${runIdx}`,
            uniqueEmail(`prop-b-${runIdx}`),
            'password123'
          );

          // Create org B's resources
          const contactIdB = await createContact(
            orgB.token,
            uniqueEmail(`contact-b-${runIdx}`)
          );
          const dealIdB = await createDeal(orgB.token, `OrgB Deal ${runIdx}`);
          const invIdB = await sendInvitation(
            orgB.token,
            orgB.orgId,
            uniqueEmail(`invitee-b-${runIdx}`)
          );

          // ── Test 1: GET /contacts/:id — org A reads org B's contact ───────
          const contactRes = await request(app)
            .get(`/api/contacts/${contactIdB}`)
            .set('Authorization', `Bearer ${orgA.token}`);

          expect(contactRes.status).not.toBe(200);
          expect([403, 404]).toContain(contactRes.status);

          // ── Test 2: GET /deals/:id — org A reads org B's deal ─────────────
          const dealRes = await request(app)
            .get(`/api/deals/${dealIdB}`)
            .set('Authorization', `Bearer ${orgA.token}`);

          expect(dealRes.status).not.toBe(200);
          expect([403, 404]).toContain(dealRes.status);

          // ── Test 3: GET /invitations — org A's list excludes org B's inv ──
          const invRes = await request(app)
            .get('/api/invitations')
            .set('Authorization', `Bearer ${orgA.token}`);

          expect(invRes.status).toBe(200);
          const invIds = (invRes.body.data as Array<{ id: string }>).map(inv => inv.id);
          expect(invIds).not.toContain(invIdB);

          // ── Test 4: PATCH /auth/me — profile update scoped to org A ───────
          const patchRes = await request(app)
            .patch('/api/auth/me')
            .set('Authorization', `Bearer ${orgA.token}`)
            .send({ name: `Owner A ${runIdx} Updated` });

          expect(patchRes.status).toBe(200);
          // The updated record must belong to org A, not org B
          expect(patchRes.body.data.organizationId).toBe(orgA.orgId);
          expect(patchRes.body.data.organizationId).not.toBe(orgB.orgId);
        }
      ),
      {
        // Keep numRuns small: each run creates 2 orgs + 3 resources with real DB calls
        numRuns: 5,
        verbose: true,
      }
    );
  });

  // ─── Cleanup ─────────────────────────────────────────────────────────────

  afterAll(async () => {
    // Delete test data in reverse dependency order
    await prisma.auditLog.deleteMany({});
    await prisma.invitation.deleteMany({});
    await prisma.activity.deleteMany({});
    await prisma.deal.deleteMany({});
    await prisma.contact.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.permission.deleteMany({});
    await prisma.organization.deleteMany({});
    await prisma.$disconnect();
  });
});
