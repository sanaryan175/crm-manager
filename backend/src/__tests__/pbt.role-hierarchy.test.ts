/**
 * Property 6: Role Hierarchy Enforcement
 *
 * Validates: Requirements 6.7, 6.9
 *
 * Property: For any inviter role R and target role T, if T is NOT in
 * INVITE_PERMISSIONS[R], then InvitationService.sendInvitation() must throw
 * a ForbiddenError (HTTP 403).
 *
 * PBT approach:
 *   - Enumerate all (inviterRoleName, targetRoleName) pairs where
 *     targetRoleName ∉ INVITE_PERMISSIONS[inviterRoleName].
 *   - Use fast-check to iterate over these forbidden pairs as the input
 *     universe, paired with arbitrary email addresses.
 *   - Mock prisma so that role.findFirst returns a role object for the
 *     target role, and user.findFirst returns null (no existing member).
 *   - Assert that sendInvitation throws ForbiddenError with statusCode 403.
 */

import * as fc from 'fast-check';

// ─── Mock bcrypt (not used in sendInvitation hierarchy path, but imported) ──
jest.mock('bcryptjs', () => ({
  hash: jest.fn(async (data: string) => `hashed:${data}`),
  compare: jest.fn(async (a: string, b: string) => b === `hashed:${a}`),
  getRounds: jest.fn(() => 12),
}));

// ─── Mock prisma before importing the service ──────────────────────────────
jest.mock('../config/db', () => ({
  __esModule: true,
  default: {
    role: {
      findFirst: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    invitation: {
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

import { InvitationService } from '../services/invitation.service';
import { ForbiddenError } from '../utils/errors';
import { INVITE_PERMISSIONS } from '../rbac/permissions';
import { TokenPayload } from '../utils/jwt';
import prisma from '../config/db';

// ─── Constants ──────────────────────────────────────────────────────────────

const ALL_ROLES = ['owner', 'admin', 'sales_manager', 'sales_rep', 'marketing', 'support'] as const;
type RoleName = typeof ALL_ROLES[number];

/** Lookup for displayName by role name */
const ROLE_DISPLAY_NAMES: Record<RoleName, string> = {
  owner:         'Owner',
  admin:         'Admin',
  sales_manager: 'Sales Manager',
  sales_rep:     'Sales Representative',
  marketing:     'Marketing',
  support:       'Support',
};

/**
 * Build the complete list of (inviterRoleName, targetRoleName) pairs where
 * the target role is NOT permitted by INVITE_PERMISSIONS[inviterRole].
 * This is the exhaustive set of forbidden pairs that must return HTTP 403.
 */
function buildForbiddenPairs(): Array<{ inviterRoleName: RoleName; targetRoleName: RoleName }> {
  const pairs: Array<{ inviterRoleName: RoleName; targetRoleName: RoleName }> = [];

  for (const inviterRole of ALL_ROLES) {
    const allowed = INVITE_PERMISSIONS[inviterRole] ?? [];
    for (const targetRole of ALL_ROLES) {
      if (!allowed.includes(targetRole)) {
        pairs.push({ inviterRoleName: inviterRole, targetRoleName: targetRole });
      }
    }
  }

  return pairs;
}

const FORBIDDEN_PAIRS = buildForbiddenPairs();

/**
 * Build a minimal TokenPayload for the inviter.
 * organizationId and userId are fixed UUIDs — the service only uses them
 * to scope DB queries (which are mocked).
 */
function buildInviterPayload(roleName: RoleName): TokenPayload {
  return {
    userId:         'inviter-user-id',
    organizationId: 'org-test-id',
    roleId:         `role-${roleName}-id`,
    roleName,
  };
}

/**
 * Build the minimal role object that prisma.role.findFirst would return.
 * The service only reads `.name` and `.displayName` from this record.
 */
function buildTargetRole(roleName: RoleName) {
  return {
    id:             `role-${roleName}-id`,
    organizationId: 'org-test-id',
    name:           roleName,
    displayName:    ROLE_DISPLAY_NAMES[roleName],
    description:    '',
    isSystem:       true,
    createdAt:      new Date(),
    updatedAt:      new Date(),
  };
}

// ─── Test suite ────────────────────────────────────────────────────────────

describe('Property 6 — Role Hierarchy Enforcement', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: no existing user for the email
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
    // Default: invitation.updateMany is a no-op
    (prisma.invitation.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
    // Default: invitation.create should never be reached in forbidden-pair tests
    (prisma.invitation.create as jest.Mock).mockResolvedValue({});
    // Default: auditLog.create should never be reached in forbidden-pair tests
    (prisma.auditLog.create as jest.Mock).mockResolvedValue({});
  });

  // ── Control: a permitted pair succeeds (owner inviting admin) ─────────────
  it('succeeds when owner invites admin (control — permitted pair)', async () => {
    const inviter = buildInviterPayload('owner');
    const targetRole = buildTargetRole('admin');

    (prisma.role.findFirst as jest.Mock).mockResolvedValue(targetRole);

    // invitation.create returns a minimal shape so the service can continue
    (prisma.invitation.create as jest.Mock).mockResolvedValue({
      id:             'inv-id',
      organizationId: inviter.organizationId,
      email:          'admin@example.com',
      roleId:         targetRole.id,
      token:          'hashed-token',
      tokenPrefix:    'abcdef01',
      expiresAt:      new Date(Date.now() + 72 * 3_600_000),
      status:         'pending',
      createdAt:      new Date(),
      updatedAt:      new Date(),
      invitedById:    inviter.userId,
      role:           { name: targetRole.name, displayName: targetRole.displayName },
      invitedBy:      { name: 'Owner', email: 'owner@example.com' },
      organization:   { name: 'Test Org' },
    });

    const result = await InvitationService.sendInvitation(inviter, {
      email:  'admin@example.com',
      roleId: targetRole.id,
    });

    expect(result).toHaveProperty('invitation');
    expect(result).toHaveProperty('inviteToken');
  });

  // ── Control: a known forbidden pair throws ForbiddenError ─────────────────
  it('throws ForbiddenError when sales_rep tries to invite anyone (control — forbidden pair)', async () => {
    const inviter = buildInviterPayload('sales_rep');
    const targetRole = buildTargetRole('sales_rep');

    (prisma.role.findFirst as jest.Mock).mockResolvedValue(targetRole);

    await expect(
      InvitationService.sendInvitation(inviter, {
        email:  'someone@example.com',
        roleId: targetRole.id,
      })
    ).rejects.toThrow(ForbiddenError);
  });

  // ── Control: verify the forbidden-pairs list is non-empty ─────────────────
  it('has forbidden pairs to test (sanity check)', () => {
    // With 6 roles and a restrictive hierarchy there must be many forbidden combos
    expect(FORBIDDEN_PAIRS.length).toBeGreaterThan(0);

    // sales_rep, marketing, support cannot invite anyone → 6 forbidden targets each
    const salesRepForbidden = FORBIDDEN_PAIRS.filter(p => p.inviterRoleName === 'sales_rep');
    expect(salesRepForbidden).toHaveLength(ALL_ROLES.length);
  });

  /**
   * Property 6: For ALL (inviterRole, targetRole) pairs where
   * targetRole ∉ INVITE_PERMISSIONS[inviterRole], sendInvitation MUST throw
   * ForbiddenError with HTTP status 403.
   *
   * **Validates: Requirements 6.7, 6.9**
   */
  it('Property 6: every forbidden (inviterRole, targetRole) pair throws ForbiddenError (403)', async () => {
    jest.setTimeout(60_000);

    // Arbitrary: pick a random forbidden pair index and a random email address.
    // fast-check will explore different combinations across numRuns iterations.
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: FORBIDDEN_PAIRS.length - 1 }),
        fc.emailAddress(),
        async (pairIndex, email) => {
          jest.clearAllMocks();

          const { inviterRoleName, targetRoleName } = FORBIDDEN_PAIRS[pairIndex];

          const inviter    = buildInviterPayload(inviterRoleName);
          const targetRole = buildTargetRole(targetRoleName);

          // Mock role.findFirst to return the target role —
          // so the service proceeds past the "role not found" check and
          // reaches the hierarchy check we want to test.
          (prisma.role.findFirst as jest.Mock).mockResolvedValue(targetRole);
          (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

          let thrownError: unknown;
          try {
            await InvitationService.sendInvitation(inviter, {
              email,
              roleId: targetRole.id,
            });
          } catch (err) {
            thrownError = err;
          }

          // Must have thrown
          expect(thrownError).toBeDefined();

          // Must be a ForbiddenError
          expect(thrownError).toBeInstanceOf(ForbiddenError);

          // Must carry HTTP 403
          expect((thrownError as ForbiddenError).statusCode).toBe(403);

          // The error message must mention the inviter's role
          expect((thrownError as ForbiddenError).message).toContain(inviterRoleName);
        }
      ),
      {
        // Cover all forbidden pairs multiple times with varied emails
        numRuns: FORBIDDEN_PAIRS.length * 3,
        verbose: true,
      }
    );
  });

  /**
   * Exhaustive coverage check: iterate every forbidden pair exactly once
   * and assert ForbiddenError — complementary to the property test above.
   *
   * **Validates: Requirements 6.7, 6.9**
   */
  it('throws ForbiddenError for every forbidden pair (exhaustive enumeration)', async () => {
    jest.setTimeout(60_000);

    for (const { inviterRoleName, targetRoleName } of FORBIDDEN_PAIRS) {
      jest.clearAllMocks();

      const inviter    = buildInviterPayload(inviterRoleName);
      const targetRole = buildTargetRole(targetRoleName);

      (prisma.role.findFirst as jest.Mock).mockResolvedValue(targetRole);
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        InvitationService.sendInvitation(inviter, {
          email:  'test@example.com',
          roleId: targetRole.id,
        })
      ).rejects.toThrow(ForbiddenError);

      // Also assert the status code explicitly
      let caughtError: unknown;
      try {
        await InvitationService.sendInvitation(inviter, {
          email:  'test@example.com',
          roleId: targetRole.id,
        });
      } catch (err) {
        caughtError = err;
      }

      expect((caughtError as ForbiddenError).statusCode).toBe(403);
    }
  });
});
