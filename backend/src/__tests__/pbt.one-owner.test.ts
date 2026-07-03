/**
 * Property 7: One Owner Per Organization
 *
 * Validates: Requirements 12.1, 12.2
 *
 * Property: After each `registerOwner()` call and after each `acceptInvitation()`
 * call, querying the DB for `users.count({ where: { organizationId, isOwner: true } })`
 * MUST equal exactly 1 per organization.
 *
 * This ensures the Owner invariant is maintained across all registration and
 * invitation acceptance flows. Each organization has exactly one owner at all times.
 *
 * PBT approach:
 *   - Generate sequences of registrations using fc.array of fc.record
 *   - For each registration: call POST /api/auth/register (real HTTP + DB)
 *   - After each registration, assert the organization has exactly 1 owner
 *   - Also test invitation acceptance: register one owner, send a non-owner invitation,
 *     accept it, and assert the org still has exactly 1 owner (the invited user is NOT an owner)
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
  return `pbt-oneowner-${label}-${Date.now()}-${++counter}@example.com`;
}

/**
 * Register a fresh owner account via the real POST /api/auth/register endpoint.
 * Returns { token, orgId, userId }.
 */
async function registerOwner(name: string, email: string, password: string) {
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
      `registerOwner failed: status=${res.status} body=${JSON.stringify(res.body)}`
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
 * Count how many users with isOwner=true exist for a given org.
 */
async function countOwners(orgId: string): Promise<number> {
  return prisma.user.count({
    where: { organizationId: orgId, isOwner: true },
  });
}

/**
 * Send an invitation from a given org to get an invitation token.
 * Returns { invitationId, rawToken }.
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

  return {
    invitationId: res.body.data.invitation.id as string,
    rawToken: res.body.data.inviteToken as string,
  };
}

/**
 * Accept an invitation to join an organization as a non-owner.
 * Returns { userId, orgId }.
 */
async function acceptInvitation(rawToken: string, name: string, password: string) {
  const res = await request(app)
    .post('/api/invitations/accept')
    .send({ token: rawToken, name, password });

  if (res.status !== 200) {
    throw new Error(
      `acceptInvitation failed: status=${res.status} body=${JSON.stringify(res.body)}`
    );
  }

  const { user, organization } = res.body.data;
  return {
    userId: user.id as string,
    orgId: organization.id as string,
  };
}

// ─── Test suite ────────────────────────────────────────────────────────────

describe('Property 7 — One Owner Per Organization', () => {
  jest.setTimeout(120_000);

  // ── Control: a single registration creates exactly 1 owner ────────────────

  it('creates exactly 1 owner after registration (control check)', async () => {
    const email = uniqueEmail('ctrl-single');
    const owner = await registerOwner('Alice Control', email, 'password123');

    const ownerCount = await countOwners(owner.orgId);
    expect(ownerCount).toBe(1);

    const user = await prisma.user.findUnique({ where: { id: owner.userId } });
    expect(user?.isOwner).toBe(true);
  });

  // ── Control: multiple registrations each create their own org with 1 owner ──

  it('each registration creates a distinct org with exactly 1 owner (control check)', async () => {
    const owner1 = await registerOwner('Bob Control 1', uniqueEmail('ctrl-multi-1'), 'password123');
    const owner2 = await registerOwner('Bob Control 2', uniqueEmail('ctrl-multi-2'), 'password123');

    const count1 = await countOwners(owner1.orgId);
    const count2 = await countOwners(owner2.orgId);

    expect(count1).toBe(1);
    expect(count2).toBe(1);
    expect(owner1.orgId).not.toBe(owner2.orgId);
  });

  // ── Control: accepting an invitation does not create a second owner ─────

  it('invited user is NOT an owner (control check)', async () => {
    const owner = await registerOwner('Charlie Owner', uniqueEmail('ctrl-invite'), 'password123');
    const invite = await sendInvitation(owner.token, owner.orgId, uniqueEmail('ctrl-invitee'));
    const invitedUser = await acceptInvitation(invite.rawToken, 'Charlie Invited', 'password123');

    expect(invitedUser.orgId).toBe(owner.orgId);

    const ownerCount = await countOwners(owner.orgId);
    expect(ownerCount).toBe(1); // Still exactly 1 owner

    const user = await prisma.user.findUnique({ where: { id: invitedUser.userId } });
    expect(user?.isOwner).toBe(false); // Invited user is NOT an owner
  });

  // ── Property 7 ──────────────────────────────────────────────────────────

  /**
   * Property 7: For any sequence of owner registrations, each organization
   * has exactly 1 user with isOwner=true after each registration completes.
   *
   * **Validates: Requirements 12.1, 12.2**
   */
  it('Property 7: each registration creates exactly 1 owner per org', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate 1-3 registration records to keep DB calls manageable
        fc.array(
          fc.record({
            name:  fc.string({ minLength: 1, maxLength: 30 }),
            label: fc.integer({ min: 1, max: 10000 }), // unique label per registration
          }),
          { minLength: 1, maxLength: 3 }
        ),
        async (registrations) => {
          const createdOrgIds: string[] = [];

          // For each registration in the sequence
          for (const reg of registrations) {
            const email = uniqueEmail(`prop7-${reg.label}`);
            const owner = await registerOwner(reg.name, email, 'password123');

            createdOrgIds.push(owner.orgId);

            // Assert: exactly 1 owner for this org
            const ownerCount = await countOwners(owner.orgId);
            expect(ownerCount).toBe(1);

            // Assert: the created user is marked as owner
            const user = await prisma.user.findUnique({ where: { id: owner.userId } });
            expect(user?.isOwner).toBe(true);
            expect(user?.organizationId).toBe(owner.orgId);
          }

          // Assert: each org is distinct
          const uniqueOrgIds = new Set(createdOrgIds);
          expect(uniqueOrgIds.size).toBe(registrations.length);
        }
      ),
      {
        numRuns: 3, // Keep DB calls manageable
        verbose: true,
      }
    );
  });

  /**
   * Property 7 (Invitation Path): After inviting and accepting a non-owner role,
   * the organization still has exactly 1 owner. The invited user does NOT become an owner.
   *
   * **Validates: Requirements 12.1, 12.2**
   */
  it('Property 7: invitation acceptance does not create additional owners', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate 1-3 invitation acceptance sequences
        fc.array(
          fc.record({
            ownerName:   fc.string({ minLength: 1, maxLength: 30 }),
            inviteeName: fc.string({ minLength: 1, maxLength: 30 }),
            label:       fc.integer({ min: 1, max: 10000 }),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        async (inviteSequences) => {
          for (const seq of inviteSequences) {
            // Register owner
            const ownerEmail = uniqueEmail(`prop7-owner-${seq.label}`);
            const owner = await registerOwner(seq.ownerName, ownerEmail, 'password123');

            // Assert: exactly 1 owner after registration
            let ownerCount = await countOwners(owner.orgId);
            expect(ownerCount).toBe(1);

            // Send invitation to a non-owner role (sales_rep)
            const inviteeEmail = uniqueEmail(`prop7-invitee-${seq.label}`);
            const invite = await sendInvitation(owner.token, owner.orgId, inviteeEmail);

            // Accept invitation
            const invitedUser = await acceptInvitation(invite.rawToken, seq.inviteeName, 'password123');

            // Assert: still exactly 1 owner after invitation acceptance
            ownerCount = await countOwners(owner.orgId);
            expect(ownerCount).toBe(1);

            // Assert: invited user is NOT an owner
            const user = await prisma.user.findUnique({ where: { id: invitedUser.userId } });
            expect(user?.isOwner).toBe(false);
            expect(user?.organizationId).toBe(owner.orgId);
          }
        }
      ),
      {
        numRuns: 3, // Keep DB calls manageable
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
