/**
 * Property 4: Invitation Token Non-Replayability
 *
 * Validates: Requirements 8.1, 8.2, 13.4
 *
 * A valid invitation token MUST be accepted exactly once.
 * After the first successful acceptance, replaying the same raw token
 * MUST throw BadRequestError('Invalid or expired invitation token').
 */

import * as fc from 'fast-check';
import * as bcrypt from 'bcryptjs';
import { InvitationService } from '../services/invitation.service';
import { BadRequestError } from '../utils/errors';

// ── Mock prisma (no real DB required) ──────────────────────────────────────────
jest.mock('../config/db', () => ({
  __esModule: true,
  default: {
    invitation: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// ── Import the mocked prisma AFTER jest.mock ────────────────────────────────────
import prisma from '../config/db';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// ── Property test ───────────────────────────────────────────────────────────────

describe('Property 4: Invitation Token Non-Replayability', () => {
  // Increase timeout at describe-level — bcrypt hash is computed once but
  // fc.assert runs 25 iterations, each doing two bcrypt.compare calls.
  jest.setTimeout(60_000);

  /**
   * **Validates: Requirements 8.1, 8.2, 13.4**
   *
   * For every (name, password) pair:
   * 1. First acceptance of a valid pending invitation succeeds.
   * 2. Replaying the identical raw token against an already-accepted
   *    invitation returns HTTP 400 (BadRequestError).
   *
   * The raw token and its bcrypt hash are computed once before fc.assert
   * so the expensive hash is not re-done on every fast-check run.
   */
  it('rejects a replayed token that was already accepted', async () => {
    const RAW_TOKEN = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789'; // 64 hex chars

    // Pre-compute the bcrypt hash ONCE outside fast-check to avoid timeout
    const TOKEN_HASH = await bcrypt.hash(RAW_TOKEN, 10);
    const TOKEN_PREFIX = RAW_TOKEN.slice(0, 8);
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 h from now

    // Build a reusable pending invitation object (no async needed — hash already computed)
    const pendingInv = {
      id: 'inv-test-id',
      organizationId: 'org-test-id',
      email: 'invited@example.com',
      roleId: 'role-test-id',
      invitedById: 'inviter-id',
      token: TOKEN_HASH,
      tokenPrefix: TOKEN_PREFIX,
      status: 'pending',
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
      acceptedAt: null,
      organization: { id: 'org-test-id', name: 'Test Org' },
      role: { id: 'role-test-id', name: 'sales_rep', displayName: 'Sales Rep' },
    };

    const acceptedInv = { ...pendingInv, status: 'accepted', acceptedAt: new Date() };

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name:     fc.string({ minLength: 1 }),
          password: fc.string({ minLength: 8 }),
        }),
        async ({ name, password }) => {
          // Reset all mocks before each property run
          jest.clearAllMocks();

          const createdUser = {
            id: 'user-test-id',
            organizationId: pendingInv.organizationId,
            roleId: pendingInv.roleId,
            name,
            email: pendingInv.email,
            password: 'hashed-pw',
            avatar: name.slice(0, 2).toUpperCase(),
            isOwner: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLoginAt: null,
          };

          // First call → pending invitation found (first acceptance)
          // Second call → empty result (token already consumed — status is now 'accepted')
          (mockPrisma.invitation.findMany as jest.Mock)
            .mockResolvedValueOnce([pendingInv])  // first acceptInvitation call
            .mockResolvedValueOnce([]);            // replay attempt — no pending match

          // No existing user for the email
          (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);

          // $transaction executes the callback and returns the created user
          (mockPrisma.$transaction as jest.Mock).mockImplementation(
            async (fn: (tx: typeof prisma) => Promise<typeof createdUser>) => {
              const tx = {
                user:       { create: jest.fn().mockResolvedValue(createdUser) },
                invitation: { update: jest.fn().mockResolvedValue(acceptedInv) },
                auditLog:   { create: jest.fn().mockResolvedValue({}) },
              } as unknown as typeof prisma;
              return fn(tx);
            }
          );

          // ── First acceptance: must succeed ───────────────────────────────────
          const result = await InvitationService.acceptInvitation({
            token: RAW_TOKEN,
            name,
            password,
          });
          expect(result).toHaveProperty('token');
          expect(result).toHaveProperty('user');

          // ── Replay: must throw BadRequestError with the canonical message ────
          // Capture the rejection once and assert both type and message
          let replayError: unknown;
          try {
            await InvitationService.acceptInvitation({ token: RAW_TOKEN, name, password });
          } catch (err) {
            replayError = err;
          }

          expect(replayError).toBeInstanceOf(BadRequestError);
          expect((replayError as Error).message).toContain('Invalid or expired');
        }
      ),
      { numRuns: 25, verbose: true }
    );
  });
});
