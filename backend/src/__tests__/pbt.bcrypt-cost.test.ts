/**
 * Property 8: bcrypt Cost Factor
 *
 * Validates: Requirements 1.10, 8.10, 13.7
 *
 * Property: For any valid password input, the stored password hash MUST
 * use a bcrypt cost factor of at least 12 for both Owner registration
 * and invitation acceptance paths. This ensures passwords resist brute-force
 * attacks even if the database is compromised.
 *
 * PBT approach:
 *   - Register a fresh owner account via POST /api/auth/register
 *   - Query the User record from the DB and extract the password hash
 *   - Assert bcrypt.getRounds(hash) >= 12
 *   - Send an invitation, accept it via POST /api/invitations/accept
 *   - Query the newly created invited user's record and extract the hash
 *   - Assert bcrypt.getRounds(hash) >= 12
 */

import * as fc from 'fast-check';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import app from '../app';
import prisma from '../config/db';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Generate a stable unique email suffix for creating distinct email addresses
 * across test runs. Uses a counter + timestamp to guarantee no collisions.
 */
let counter = 0;
function uniqueEmail(label: string): string {
  return `pbt-bcrypt-${label}-${Date.now()}-${++counter}@example.com`;
}

/**
 * Register a fresh owner account via the real POST /api/auth/register endpoint.
 * Returns { token, orgId, userId, email }.
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
    email: user.email as string,
  };
}

// ─── Test suite ────────────────────────────────────────────────────────────

describe('Property 8 — bcrypt Cost Factor', () => {
  jest.setTimeout(120_000);

  // ── Control: single registration produces cost-12 hash ────────────────────

  it('stores password with cost factor >= 12 after owner registration (control check)', async () => {
    const email = uniqueEmail('ctrl-owner');
    const { userId } = await registerOwner('Control Owner', email, 'password123');

    const user = await prisma.user.findFirst({ where: { id: userId } });
    expect(user).toBeTruthy();
    expect(user!.password).toBeTruthy();

    const rounds = bcrypt.getRounds(user!.password);
    expect(rounds).toBeGreaterThanOrEqual(12);
  });

  it('stores password with cost factor >= 12 after invitation acceptance (control check)', async () => {
    const ownerEmail = uniqueEmail('ctrl-owner2');
    const owner = await registerOwner('Owner 2', ownerEmail, 'password123');

    // Get the sales_rep role ID for the invitation
    const roles = await prisma.role.findMany({ where: { organizationId: owner.orgId } });
    const salesRepRole = roles.find(r => r.name === 'sales_rep');
    if (!salesRepRole) throw new Error('sales_rep role not found');

    // Send invitation
    const inviteRes = await request(app)
      .post('/api/invitations')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ email: uniqueEmail('invitee-ctrl'), roleId: salesRepRole.id });

    expect(inviteRes.status).toBe(201);
    const rawToken = inviteRes.body.data.inviteToken;

    // Accept invitation
    const acceptRes = await request(app)
      .post('/api/invitations/accept')
      .send({
        token: rawToken,
        name: 'Invited User Control',
        password: 'invited-pass-123',
      });

    expect(acceptRes.status).toBe(200);
    const invitedUserId = acceptRes.body.data.user.id;

    // Query the invited user's password hash
    const invitedUser = await prisma.user.findFirst({ where: { id: invitedUserId } });
    expect(invitedUser).toBeTruthy();
    expect(invitedUser!.password).toBeTruthy();

    const rounds = bcrypt.getRounds(invitedUser!.password);
    expect(rounds).toBeGreaterThanOrEqual(12);
  });

  // ── Property 8 ──────────────────────────────────────────────────────────

  /**
   * Property 8: For any valid registration or invitation acceptance input,
   * the stored password hash MUST use bcrypt cost factor >= 12.
   *
   * This test covers both paths:
   * 1. Owner registration via POST /api/auth/register
   * 2. Invitation acceptance via POST /api/invitations/accept
   *
   * **Validates: Requirements 1.10, 8.10, 13.7**
   */
  it('Property 8: all stored password hashes use cost factor >= 12', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          ownerName:     fc.string({ minLength: 1, maxLength: 50 }),
          ownerPassword: fc.string({ minLength: 8, maxLength: 50 }),
          inviteeName:   fc.string({ minLength: 1, maxLength: 50 }),
          inviteePassword: fc.string({ minLength: 8, maxLength: 50 }),
        }),
        async ({ ownerName, ownerPassword, inviteeName, inviteePassword }) => {
          // ── Step 1: Register owner and verify cost factor ───────────────

          const ownerEmail = uniqueEmail(`prop-owner-${counter}`);
          const owner = await registerOwner(ownerName, ownerEmail, ownerPassword);

          const ownerUser = await prisma.user.findFirst({ where: { id: owner.userId } });
          expect(ownerUser).toBeTruthy();
          expect(ownerUser!.password).toBeTruthy();

          const ownerRounds = bcrypt.getRounds(ownerUser!.password);
          expect(ownerRounds).toBeGreaterThanOrEqual(12);

          // ── Step 2: Send invitation ─────────────────────────────────────

          const roles = await prisma.role.findMany({ where: { organizationId: owner.orgId } });
          const salesRepRole = roles.find(r => r.name === 'sales_rep');
          if (!salesRepRole) throw new Error('sales_rep role not found');

          const inviteeEmail = uniqueEmail(`prop-invitee-${counter}`);
          const inviteRes = await request(app)
            .post('/api/invitations')
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ email: inviteeEmail, roleId: salesRepRole.id });

          expect(inviteRes.status).toBe(201);
          const rawToken = inviteRes.body.data.inviteToken;

          // ── Step 3: Accept invitation and verify cost factor ────────────

          const acceptRes = await request(app)
            .post('/api/invitations/accept')
            .send({
              token: rawToken,
              name: inviteeName,
              password: inviteePassword,
            });

          expect(acceptRes.status).toBe(200);
          const invitedUserId = acceptRes.body.data.user.id;

          const invitedUser = await prisma.user.findFirst({ where: { id: invitedUserId } });
          expect(invitedUser).toBeTruthy();
          expect(invitedUser!.password).toBeTruthy();

          const invitedRounds = bcrypt.getRounds(invitedUser!.password);
          expect(invitedRounds).toBeGreaterThanOrEqual(12);
        }
      ),
      {
        // Keep numRuns low: each run creates an org with full setup + 1 invited user
        numRuns: 3,
        verbose: true,
      }
    );
  });

  // ─── Cleanup ─────────────────────────────────────────────────────────────

  afterAll(async () => {
    // Delete test data in reverse dependency order to avoid FK constraint violations
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
