/**
 * Property 9: JWT Payload Integrity
 *
 * Validates: Requirements 1.5, 3.1, 8.6, 13.1
 *
 * Property: After registerOwner() or acceptInvitation(), the returned JWT
 * payload MUST contain { userId, organizationId, roleId, roleName } that
 * strictly match the DB user record.
 *
 * This ensures the JWT correctly encodes the user's identity and tenant scope,
 * preventing privilege escalation or tenant isolation bypasses.
 *
 * PBT approach:
 *   - Register owner accounts via POST /api/auth/register with varied inputs.
 *   - Accept invitations via POST /api/invitations/accept with varied inputs.
 *   - Decode each returned JWT (without verification) and query the DB for
 *     the user record.
 *   - Assert all 4 payload fields exactly match the DB values.
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
  return `pbt-jwt-${label}-${Date.now()}-${++counter}@example.com`;
}

/**
 * Decode a JWT payload without verifying the signature.
 * Returns the parsed payload object.
 */
function decodeJWT(token: string): {
  userId: string;
  organizationId: string;
  roleId: string;
  roleName: string;
  iat: number;
  exp: number;
} {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
  return JSON.parse(payload);
}

// ─── Test suite ────────────────────────────────────────────────────────────

describe('Property 9 — JWT Payload Integrity', () => {
  jest.setTimeout(120_000);

  // ── Control: registerOwner returns valid JWT with matching DB fields ──────

  it('registerOwner JWT matches DB user (control check)', async () => {
    const email = uniqueEmail('ctrl-owner');
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        ownerName:       'Owner Control',
        ownerEmail:      email,
        ownerPassword:   'password123',
        confirmPassword: 'password123',
      });

    expect(res.status).toBe(201);
    const { token } = res.body.data;

    const payload = decodeJWT(token);
    const user = await prisma.user.findFirst({
      where:   { email: email.toLowerCase() },
      include: { role: true },
    });

    expect(user).toBeDefined();
    expect(payload.userId).toBe(user!.id);
    expect(payload.organizationId).toBe(user!.organizationId);
    expect(payload.roleId).toBe(user!.roleId);
    expect(payload.roleName).toBe(user!.role.name);
  });

  // ── Control: acceptInvitation returns valid JWT with matching DB fields ───

  it('acceptInvitation JWT matches DB user (control check)', async () => {
    // Register org owner
    const ownerEmail = uniqueEmail('ctrl-inv-owner');
    const ownerRes = await request(app)
      .post('/api/auth/register')
      .send({
        ownerName:       'Owner Inv',
        ownerEmail:      ownerEmail,
        ownerPassword:   'password123',
        confirmPassword: 'password123',
      });

    expect(ownerRes.status).toBe(201);
    const ownerToken = ownerRes.body.data.token;
    const ownerOrgId = ownerRes.body.data.organization.id;

    // Find sales_rep role
    const roles = await prisma.role.findMany({ where: { organizationId: ownerOrgId } });
    const salesRepRole = roles.find((r) => r.name === 'sales_rep');
    expect(salesRepRole).toBeDefined();

    // Send invitation
    const inviteeEmail = uniqueEmail('ctrl-invitee');
    const invRes = await request(app)
      .post('/api/invitations')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: inviteeEmail, roleId: salesRepRole!.id });

    expect(invRes.status).toBe(201);
    const inviteToken = invRes.body.data.inviteToken;

    // Accept invitation
    const acceptRes = await request(app)
      .post('/api/invitations/accept')
      .send({
        token:           inviteToken,
        name:            'Invitee Control',
        password:        'password123',
        confirmPassword: 'password123',
      });

    expect(acceptRes.status).toBe(200);
    const { token } = acceptRes.body.data;

    const payload = decodeJWT(token);
    const user = await prisma.user.findFirst({
      where:   { email: inviteeEmail.toLowerCase() },
      include: { role: true },
    });

    expect(user).toBeDefined();
    expect(payload.userId).toBe(user!.id);
    expect(payload.organizationId).toBe(user!.organizationId);
    expect(payload.roleId).toBe(user!.roleId);
    expect(payload.roleName).toBe(user!.role.name);
  });

  // ── Property 9: JWT payload fields match DB user across varied inputs ─────

  /**
   * Property 9: After registerOwner() or acceptInvitation(), the returned JWT
   * payload MUST contain { userId, organizationId, roleId, roleName } that
   * strictly match the DB user record.
   *
   * **Validates: Requirements 1.5, 3.1, 8.6, 13.1**
   */
  it('Property 9: JWT payload fields always match DB user record', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          ownerName:     fc.string({ minLength: 1, maxLength: 50 }),
          ownerPassword: fc.string({ minLength: 8, maxLength: 50 }),
          inviteeName:   fc.string({ minLength: 1, maxLength: 50 }),
          inviteePassword: fc.string({ minLength: 8, maxLength: 50 }),
        }),
        async ({ ownerName, ownerPassword, inviteeName, inviteePassword }) => {
          // ── Test 1: registerOwner JWT integrity ───────────────────────────

          const ownerEmail = uniqueEmail('prop-owner');
          const regRes = await request(app)
            .post('/api/auth/register')
            .send({
              ownerName,
              ownerEmail,
              ownerPassword,
              confirmPassword: ownerPassword,
            });

          expect(regRes.status).toBe(201);
          const ownerToken = regRes.body.data.token;
          const ownerOrgId = regRes.body.data.organization.id;

          // Decode JWT and query DB
          const ownerPayload = decodeJWT(ownerToken);
          const ownerUser = await prisma.user.findFirst({
            where:   { email: ownerEmail.toLowerCase() },
            include: { role: true },
          });

          expect(ownerUser).toBeDefined();
          expect(ownerPayload.userId).toBe(ownerUser!.id);
          expect(ownerPayload.organizationId).toBe(ownerUser!.organizationId);
          expect(ownerPayload.roleId).toBe(ownerUser!.roleId);
          expect(ownerPayload.roleName).toBe(ownerUser!.role.name);

          // ── Test 2: acceptInvitation JWT integrity ────────────────────────

          // Find sales_rep role
          const roles = await prisma.role.findMany({
            where: { organizationId: ownerOrgId },
          });
          const salesRepRole = roles.find((r) => r.name === 'sales_rep');
          expect(salesRepRole).toBeDefined();

          // Send invitation
          const inviteeEmail = uniqueEmail('prop-invitee');
          const invRes = await request(app)
            .post('/api/invitations')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ email: inviteeEmail, roleId: salesRepRole!.id });

          expect(invRes.status).toBe(201);
          const inviteToken = invRes.body.data.inviteToken;

          // Accept invitation
          const acceptRes = await request(app)
            .post('/api/invitations/accept')
            .send({
              token:           inviteToken,
              name:            inviteeName,
              password:        inviteePassword,
              confirmPassword: inviteePassword,
            });

          expect(acceptRes.status).toBe(200);
          const inviteeToken = acceptRes.body.data.token;

          // Decode JWT and query DB
          const inviteePayload = decodeJWT(inviteeToken);
          const inviteeUser = await prisma.user.findFirst({
            where:   { email: inviteeEmail.toLowerCase() },
            include: { role: true },
          });

          expect(inviteeUser).toBeDefined();
          expect(inviteePayload.userId).toBe(inviteeUser!.id);
          expect(inviteePayload.organizationId).toBe(inviteeUser!.organizationId);
          expect(inviteePayload.roleId).toBe(inviteeUser!.roleId);
          expect(inviteePayload.roleName).toBe(inviteeUser!.role.name);
        }
      ),
      {
        numRuns: 3,
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
