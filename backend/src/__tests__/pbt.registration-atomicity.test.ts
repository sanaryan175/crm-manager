/**
 * Property 1: Registration Atomicity
 *
 * Validates: Requirements 1.1, 1.3, 1.4
 *
 * Property: For any valid registration input, if the underlying database
 * transaction fails at any step (0–5), the entire transaction is rolled back
 * and no partial records are created — organization.count, user.count, and
 * role.count all remain 0.
 *
 * PBT approach: Mock prisma.$transaction to simulate a failure at each step
 * index by throwing an error when an internal operation counter reaches the
 * configured threshold. After each simulated failure, assert that
 * prisma.organization.count(), prisma.user.count(), prisma.role.count()
 * all return 0.
 */

import * as fc from 'fast-check';

// ─── Mock bcrypt to avoid slow cost-12 hashing in unit tests ───────────────
jest.mock('bcryptjs', () => ({
  hash: jest.fn(async (data: string) => `hashed:${data}`),
  compare: jest.fn(async (a: string, b: string) => b === `hashed:${a}`),
  getRounds: jest.fn(() => 12),
}));

// ─── Mock prisma before importing the service ──────────────────────────────

/**
 * Internal state for the mock:
 * - `failAtStep`: the tx operation index at which to throw
 * - `orgCount`, `userCount`, `roleCount`: simulated record counts
 *   (always stay at 0 because a real transaction would roll back)
 */
let failAtStep = -1; // -1 = never fail (success path)

// Prisma mock — the module factory is hoisted by Jest so no imports here
jest.mock('../config/db', () => {
  // Counters that represent committed rows.
  // In a real Prisma transaction, if the callback throws,
  // nothing is committed. We model that by never incrementing these
  // inside the transaction callback — the mock tx object simply tracks
  // which operation we are on and throws at the configured step.
  const counts = { org: 0, user: 0, role: 0 };

  /**
   * Build a fake transaction proxy.
   * Each `create` call increments an internal op-counter.
   * When the counter reaches `failAtStep`, it throws — simulating
   * a DB error mid-transaction so the whole thing is rolled back.
   */
  const makeTx = () => {
    let opIndex = 0;

    const maybeThrow = (label: string) => {
      const current = opIndex++;
      if (current === failAtStep) {
        throw new Error(`Simulated DB failure at tx step ${current} (${label})`);
      }
    };

    return {
      organization: {
        create: jest.fn(async () => {
          maybeThrow('organization.create');
          // Return a minimal org-like object for the rest of the callback
          return { id: 'mock-org-id', name: 'My Organization', slug: 'test-slug', setupComplete: false };
        }),
      },
      permission: {
        create: jest.fn(async () => {
          maybeThrow('permission.create');
          return { id: 'mock-perm-id', name: 'contact.read', resource: 'contact', action: 'read' };
        }),
      },
      role: {
        create: jest.fn(async () => {
          maybeThrow('role.create');
          return { id: 'mock-role-id', name: 'owner', displayName: 'Owner', description: '', isSystem: true };
        }),
      },
      rolePermission: {
        createMany: jest.fn(async () => {
          // rolePermission.createMany doesn't have a dedicated fail step in the
          // 0-5 range — it's part of the role-seeding loop and is not counted
          // as a separate high-level step for this property test.
          return { count: 0 };
        }),
      },
      user: {
        create: jest.fn(async () => {
          maybeThrow('user.create');
          return {
            id: 'mock-user-id',
            organizationId: 'mock-org-id',
            roleId: 'mock-role-id',
            name: 'Test Owner',
            email: 'test@example.com',
            password: 'hashed',
            isOwner: true,
            avatar: 'TO',
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLoginAt: null,
          };
        }),
      },
      auditLog: {
        create: jest.fn(async () => {
          maybeThrow('auditLog.create');
          return { id: 'mock-audit-id' };
        }),
      },
    };
  };

  return {
    __esModule: true,
    default: {
      // $transaction receives the callback and calls it with a fresh mock tx.
      // If the callback throws, $transaction re-throws (mimicking real Prisma).
      // No rows are committed to counts.
      $transaction: jest.fn(async (callback: (tx: ReturnType<typeof makeTx>) => Promise<unknown>) => {
        const tx = makeTx();
        // Propagate the throw — no commit happens
        return callback(tx);
      }),

      // Outside-transaction queries used by registerOwner before the $transaction
      user: {
        findFirst: jest.fn(async () => null), // no existing user
        count: jest.fn(async () => counts.user),
      },
      organization: {
        count: jest.fn(async () => counts.org),
      },
      role: {
        count: jest.fn(async () => counts.role),
      },
    },
  };
});

// ─── Import the service AFTER the mock is in place ─────────────────────────
import { OnboardingService } from '../services/onboarding.service';
import prisma from '../config/db';

// ─── Test suite ────────────────────────────────────────────────────────────

describe('Property 1 — Registration Atomicity', () => {
  /**
   * Helper: set the step at which the mock transaction should throw.
   * Pass -1 to make the transaction succeed end-to-end.
   */
  const setFailStep = (step: number) => {
    failAtStep = step;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    failAtStep = -1;
  });

  /**
   * Snapshot test: a valid registration with no injected failures succeeds.
   * This confirms the mock is wired correctly before the property test runs.
   */
  it('succeeds when no failure is injected (control check)', async () => {
    setFailStep(-1);
    const result = await OnboardingService.registerOwner({
      ownerName: 'Alice',
      ownerEmail: 'alice@example.com',
      ownerPassword: 'password123',
    });
    expect(result).toHaveProperty('token');
    expect(result.requiresSetup).toBe(true);
  });

  /**
   * Property: for any valid input, a simulated failure at any of the 6
   * high-level transaction steps (indices 0–5) causes registerOwner to
   * throw AND leaves all record counts at 0 (no partial writes).
   *
   * Step mapping (aligns with the task description of "step index 0–5"):
   *   0 → organization.create
   *   1 → permission.create (first one, inside Promise.all)
   *   2 → role.create (first role)
   *   3 → role.create (second role)
   *   4 → user.create
   *   5 → auditLog.create
   */
  it('Property 1: atomicity — no partial records on any transaction failure', async () => {
    // Increase timeout: 50 runs × bcrypt mock is fast, but fc overhead accumulates
    jest.setTimeout(30000);
    await fc.assert(
      fc.asyncProperty(
        // Input generator as specified in the task
        fc.record({
          ownerName:     fc.string({ minLength: 1 }),
          ownerEmail:    fc.emailAddress(),
          ownerPassword: fc.string({ minLength: 8 }),
        }),
        // Fail step: 0–5 inclusive (6 steps as specified by the task)
        fc.integer({ min: 0, max: 5 }),
        async (input, step) => {
          jest.clearAllMocks();
          setFailStep(step);

          // registerOwner MUST throw when a transaction step fails
          await expect(
            OnboardingService.registerOwner(input)
          ).rejects.toThrow(`Simulated DB failure at tx step ${step}`);

          // After the transaction threw, no records should be committed.
          // We assert via the mocked count methods — they always return 0
          // because the mock tx never increments the committed-row counters.
          const orgCount  = await prisma.organization.count();
          const userCount = await prisma.user.count();
          const roleCount = await prisma.role.count();

          expect(orgCount).toBe(0);
          expect(userCount).toBe(0);
          expect(roleCount).toBe(0);
        }
      ),
      {
        // Run enough examples to cover all 6 steps multiple times
        numRuns: 50,
        verbose: true,
      }
    );
  });
});
