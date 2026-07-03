/**
 * Property 2: Email Uniqueness
 *
 * Validates: Requirements 1.7, 12.3
 *
 * Property: For any valid email address, registering a second owner account
 * with the same email (case-insensitive) must throw a BadRequestError with
 * the message "An account with this email already exists".
 *
 * PBT approach:
 *   - Mock prisma.user.findFirst so the first call returns null (no duplicate)
 *     and the second call returns a mock user object (simulating the first
 *     registration having succeeded and written a row).
 *   - Mock prisma.$transaction to simulate a successful first registration.
 *   - For each generated email: call registerOwner once (succeeds), then call
 *     it again with the same email and assert BadRequestError is thrown.
 */

import * as fc from 'fast-check';

// ─── Mock bcrypt to avoid slow cost-12 hashing in unit tests ───────────────
jest.mock('bcryptjs', () => ({
  hash: jest.fn(async (data: string) => `hashed:${data}`),
  compare: jest.fn(async (a: string, b: string) => b === `hashed:${a}`),
  getRounds: jest.fn(() => 12),
}));

// ─── Mock jwt so generateToken doesn't need a real secret ──────────────────
jest.mock('../utils/jwt', () => ({
  generateToken: jest.fn(() => 'mock-jwt-token'),
}));

// ─── State shared between mock calls ───────────────────────────────────────
// transactionCallCount tracks how many times $transaction has been called.
// This allows us to control what findFirst returns per "registration attempt".
let transactionCallCount = 0;

// ─── Mock prisma before importing the service ──────────────────────────────
jest.mock('../config/db', () => {
  /**
   * Build a minimal fake transaction context.
   * Returns enough shape for OnboardingService.registerOwner to complete
   * without throwing inside the transaction callback.
   */
  const makeTx = () => {
    let roleCallCount = 0;
    const roleIds: Record<string, string> = {};

    return {
      organization: {
        create: jest.fn(async () => ({
          id: 'mock-org-id',
          name: 'My Organization',
          slug: 'test-slug',
          setupComplete: false,
        })),
      },
      permission: {
        create: jest.fn(async ({ data }: { data: { name: string } }) => ({
          id: `perm-${data.name}`,
          name: data.name,
          resource: data.name.split('.')[0],
          action: data.name.split('.')[1],
        })),
      },
      role: {
        create: jest.fn(async ({ data }: { data: { name: string; displayName: string; description: string; isSystem: boolean } }) => {
          const id = `role-${data.name}-${++roleCallCount}`;
          roleIds[data.name] = id;
          return { id, name: data.name, displayName: data.displayName, description: data.description, isSystem: data.isSystem };
        }),
      },
      rolePermission: {
        createMany: jest.fn(async () => ({ count: 0 })),
      },
      user: {
        create: jest.fn(async ({ data }: { data: { name: string; email: string } }) => ({
          id: 'mock-user-id',
          organizationId: 'mock-org-id',
          roleId: 'role-owner-1',
          name: data.name,
          email: data.email,
          password: 'hashed',
          isOwner: true,
          avatar: 'MO',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: null,
        })),
      },
      auditLog: {
        create: jest.fn(async () => ({ id: 'mock-audit-id' })),
      },
    };
  };

  // The mock user returned on the second findFirst call to simulate a
  // duplicate — as if the first registration already wrote a row.
  const mockExistingUser = {
    id: 'existing-user-id',
    email: 'duplicate@example.com',
    name: 'Existing Owner',
    organizationId: 'mock-org-id',
    roleId: 'mock-role-id',
    isOwner: true,
    password: 'hashed',
    avatar: 'EO',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
  };

  return {
    __esModule: true,
    default: {
      /**
       * findFirst:
       *   - Before the first successful transaction (transactionCallCount === 0):
       *     return null — no duplicate yet.
       *   - After the first transaction (transactionCallCount >= 1):
       *     return a mock user — simulating the duplicate check finding the
       *     row that was committed by the first registration.
       */
      user: {
        findFirst: jest.fn(async () => {
          if (transactionCallCount >= 1) {
            return mockExistingUser;
          }
          return null;
        }),
      },
      /**
       * $transaction: runs the callback with a fresh mock tx context.
       * Increments transactionCallCount on each successful completion so
       * findFirst knows a registration has been committed.
       */
      $transaction: jest.fn(async (callback: (tx: ReturnType<typeof makeTx>) => Promise<unknown>) => {
        const tx = makeTx();
        const result = await callback(tx);
        transactionCallCount += 1;
        return result;
      }),
    },
  };
});

// ─── Import service and error class AFTER the mock is in place ─────────────
import { OnboardingService } from '../services/onboarding.service';
import { BadRequestError } from '../utils/errors';

// ─── Test suite ────────────────────────────────────────────────────────────

describe('Property 2 — Email Uniqueness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    transactionCallCount = 0;
  });

  /**
   * Control: a single registration with a fresh email succeeds.
   * Confirms the mock wiring is correct before the property test runs.
   */
  it('succeeds for a first-time registration (control check)', async () => {
    const result = await OnboardingService.registerOwner({
      ownerName: 'Alice',
      ownerEmail: 'alice@example.com',
      ownerPassword: 'password12345',
    });
    expect(result).toHaveProperty('token');
    expect(result.requiresSetup).toBe(true);
  });

  /**
   * Control: a second registration with the same email throws BadRequestError.
   * Confirms the duplicate-detection path before the property test runs.
   */
  it('throws BadRequestError on duplicate email (control check)', async () => {
    // First call: succeeds
    await OnboardingService.registerOwner({
      ownerName: 'Bob',
      ownerEmail: 'bob@example.com',
      ownerPassword: 'password12345',
    });

    // Second call: findFirst now returns a mock user → should throw
    await expect(
      OnboardingService.registerOwner({
        ownerName: 'Bob Clone',
        ownerEmail: 'bob@example.com',
        ownerPassword: 'password12345',
      })
    ).rejects.toThrow(BadRequestError);
  });

  /**
   * Property 2: for ANY valid email address, calling registerOwner twice with
   * that email causes the second call to throw BadRequestError with the
   * exact message "An account with this email already exists".
   *
   * **Validates: Requirements 1.7, 12.3**
   */
  it('Property 2: second registration with same email always throws BadRequestError', async () => {
    jest.setTimeout(30_000);

    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 8, maxLength: 50 }),
        async (email, ownerName, ownerPassword) => {
          // Reset state for each run
          jest.clearAllMocks();
          transactionCallCount = 0;

          const input = { ownerName, ownerEmail: email, ownerPassword };

          // First registration must succeed
          const firstResult = await OnboardingService.registerOwner(input);
          expect(firstResult).toHaveProperty('token');
          expect(firstResult.requiresSetup).toBe(true);

          // Second registration with the same email must throw BadRequestError
          let thrownError: unknown;
          try {
            await OnboardingService.registerOwner(input);
          } catch (err) {
            thrownError = err;
          }

          // Assert it threw at all
          expect(thrownError).toBeDefined();

          // Assert it is a BadRequestError
          expect(thrownError).toBeInstanceOf(BadRequestError);

          // Assert the exact message from the service
          expect((thrownError as BadRequestError).message).toBe(
            'An account with this email already exists'
          );

          // Assert HTTP status code is 400
          expect((thrownError as BadRequestError).statusCode).toBe(400);
        }
      ),
      {
        numRuns: 50,
        verbose: true,
      }
    );
  });
});
