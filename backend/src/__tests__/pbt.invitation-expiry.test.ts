/**
 * Property 5: Invitation Expiry
 *
 * Validates: Requirements 8.3, 6.1
 *
 * Property: For any invitation whose `expiresAt` timestamp is in the past,
 * calling `acceptInvitation` MUST:
 *   1. Throw a BadRequestError whose message contains 'This invitation has expired'
 *   2. Call `prisma.invitation.update` with `{ status: 'expired' }` for that record
 *
 * PBT approach:
 *   - Use `fc.date({ max: new Date() })` to generate arbitrary past timestamps
 *   - Build a pending invitation record with `expiresAt` set to the generated past date
 *   - Mock `bcrypt.compare` to return true (valid token match)
 *   - Assert BadRequestError is thrown with the expected message
 *   - Assert `prisma.invitation.update` was called with `{ data: { status: 'expired' } }`
 */

import * as fc from 'fast-check';

// ── Mock bcrypt: compare always returns true (token always matches) ─────────
jest.mock('bcryptjs', () => ({
  hash: jest.fn(async (data: string) => `hashed:${data}`),
  compare: jest.fn(async () => true),
  getRounds: jest.fn(() => 10),
}));

// ── Mock prisma (no real DB required) ──────────────────────────────────────
jest.mock('../config/db', () => ({
  __esModule: true,
  default: {
    invitation: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import prisma from '../config/db';
import { InvitationService } from '../services/invitation.service';
import { BadRequestError } from '../utils/errors';

const mockFindMany = prisma.invitation.findMany as jest.Mock;
const mockUpdate   = prisma.invitation.update   as jest.Mock;

// ── Helper: build a pending invitation with a given past expiresAt ──────────
function buildExpiredInvitation(expiresAt: Date) {
  const rawToken    = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
  const tokenPrefix = rawToken.slice(0, 8);

  return {
    id:             'inv-expired-id',
    organizationId: 'org-test-id',
    email:          'invited@example.com',
    roleId:         'role-test-id',
    invitedById:    'inviter-id',
    token:          `hashed:${rawToken}`, // bcrypt.compare is mocked to return true
    tokenPrefix,
    status:         'pending',
    expiresAt,      // ← in the past
    createdAt:      new Date(),
    updatedAt:      new Date(),
    acceptedAt:     null,
    organization:   { id: 'org-test-id', name: 'Test Org' },
    role:           { id: 'role-test-id', name: 'sales_rep', displayName: 'Sales Rep' },
  };
}

const RAW_TOKEN = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';

// ── Test suite ──────────────────────────────────────────────────────────────

describe('Property 5: Invitation Expiry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: update resolves successfully
    mockUpdate.mockResolvedValue({});
  });

  /**
   * Control test: confirms the mock wiring is correct.
   * A pending invitation with expiresAt in the past must be rejected.
   */
  it('rejects a past-expired invitation (control check)', async () => {
    const pastDate = new Date(Date.now() - 1000); // 1 second ago
    const expiredInv = buildExpiredInvitation(pastDate);

    mockFindMany.mockResolvedValue([expiredInv]);

    await expect(
      InvitationService.acceptInvitation({ token: RAW_TOKEN, name: 'Alice', password: 'password123' })
    ).rejects.toThrow(BadRequestError);

    await expect(
      InvitationService.acceptInvitation({ token: RAW_TOKEN, name: 'Alice', password: 'password123' })
    ).rejects.toThrow('This invitation has expired');

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: expiredInv.id },
        data:  { status: 'expired' },
      })
    );
  });

  /**
   * Property 5: for ANY past timestamp used as `expiresAt`, the acceptance
   * attempt MUST throw BadRequestError containing 'This invitation has expired'
   * and MUST call `prisma.invitation.update` with `status: 'expired'`.
   *
   * **Validates: Requirements 8.3, 6.1**
   */
  it('Property 5: always rejects and marks expired for any past expiresAt', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a date strictly in the past (max = now - 1ms)
        fc.date({ max: new Date(Date.now() - 1) }),
        async (pastExpiresAt) => {
          jest.clearAllMocks();
          mockUpdate.mockResolvedValue({});

          const expiredInv = buildExpiredInvitation(pastExpiresAt);
          mockFindMany.mockResolvedValue([expiredInv]);

          // ── Assert: throws BadRequestError ──────────────────────────────
          let thrownError: unknown;
          try {
            await InvitationService.acceptInvitation({
              token:    RAW_TOKEN,
              name:     'Test User',
              password: 'password123',
            });
          } catch (err) {
            thrownError = err;
          }

          // Must have thrown
          expect(thrownError).toBeDefined();

          // Must be a BadRequestError (HTTP 400)
          expect(thrownError).toBeInstanceOf(BadRequestError);
          expect((thrownError as BadRequestError).statusCode).toBe(400);

          // Message must contain 'This invitation has expired'
          expect((thrownError as BadRequestError).message).toContain(
            'This invitation has expired'
          );

          // ── Assert: invitation.update called with status='expired' ──────
          expect(mockUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
              where: { id: expiredInv.id },
              data:  { status: 'expired' },
            })
          );
        }
      ),
      { numRuns: 50, verbose: true }
    );
  });
});
