# Implementation Plan: Onboarding Flow

## Overview

Implement the complete onboarding flow for the multi-tenant SaaS CRM: Owner registration with atomic transaction and role/permission seeding, organization setup wizard with `requireOwner` middleware, login response fix to include the organization relation, route guard redirect logic, invitation sending with hierarchy enforcement and bcrypt token hashing, invitation acceptance with `tokenPrefix` optimization and atomic transaction, invitation management (list/resend/revoke), post-acceptance profile completion, and all known gap fixes from the design document. Property-based tests cover all 10 correctness properties.

---

## Tasks

- [x] 1. Fix known gaps — schema, middleware, and login response
  - [x] 1.1 Add `invite_revoked` to `AuditAction` enum and add `tokenPrefix` column to `Invitation` model
    - In `backend/prisma/schema.prisma`, add `invite_revoked` to the `AuditAction` enum
    - Add `tokenPrefix  String?  @map("token_prefix")` field to the `Invitation` model (nullable for backward compatibility)
    - Add `@@index([tokenPrefix, status])` to `Invitation` for O(1) filtered lookup
    - Run `prisma migrate dev --name add_invite_revoked_and_token_prefix` to generate and apply the migration
    - _Requirements: 11.3, 13.2, 14.1_

  - [x] 1.2 Wire `requireOwner` middleware into `POST /auth/setup` route
    - In `backend/src/routes/auth.routes.ts`, import `requireOwner` from `../middleware/auth`
    - Change the `/setup` route to: `router.post('/setup', authenticate, requireOwner, validate(organizationSetupSchema), AuthController.setup)`
    - This enforces Requirement 12.4 — any role other than `'owner'` gets HTTP 403 before the handler runs
    - _Requirements: 4.10, 10.4, 12.4_

  - [x] 1.3 Fix `AuthService.login()` to include the organization relation
    - In `backend/src/services/auth.service.ts`, update the `prisma.user.findFirst` include block to add: `organization: { select: { id: true, name: true, setupComplete: true, country: true, currency: true } }`
    - This ensures the login response carries `organization.setupComplete` so the frontend can route correctly without a second `/auth/me` call
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 1.4 Fix revocation audit log to use `invite_revoked` action
    - In `backend/src/services/invitation.service.ts`, in `revokeInvitation()`, change `action: 'invite_sent'` to `action: 'invite_revoked'`
    - This makes the audit trail accurate per design gap #5
    - _Requirements: 11.3, 14.1_

- [x] 2. Fix `INVITE_PERMISSIONS` to allow Owner-to-Owner invitations
  - [x] 2.1 Update `INVITE_PERMISSIONS.owner` to include `'owner'` in the allowed target roles
    - In `backend/src/rbac/permissions.ts`, change `owner: ['admin', 'sales_manager', 'sales_rep', 'marketing', 'support']` to `owner: ['owner', 'admin', 'sales_manager', 'sales_rep', 'marketing', 'support']`
    - This matches Requirement 6.9 which explicitly states Owner can invite other Owners
    - _Requirements: 6.7, 6.9_

- [x] 3. Implement `tokenPrefix` optimization in `InvitationService`
  - [x] 3.1 Update `sendInvitation()` to store `tokenPrefix` alongside `tokenHash`
    - In `backend/src/services/invitation.service.ts`, after generating `rawToken`, compute `tokenPrefix = rawToken.slice(0, 8)` and include it in `prisma.invitation.create({ data: { ..., tokenPrefix } })`
    - _Requirements: 6.2, 6.3, 13.2_

  - [x] 3.2 Update `resendInvitation()` to store `tokenPrefix` on the new invitation record
    - In `InvitationService.resendInvitation()`, compute and persist `tokenPrefix = rawToken.slice(0, 8)` when creating the new invitation
    - _Requirements: 11.2, 13.2_

  - [x] 3.3 Refactor `acceptInvitation()` to use `tokenPrefix`-filtered lookup
    - Replace the `findMany({ where: { status: 'pending' } })` full scan with `findMany({ where: { status: 'pending', tokenPrefix: data.token.slice(0, 8) } })`
    - This reduces bcrypt comparisons from O(n) to O(1) in the typical case
    - Keep the `bcrypt.compare` loop on the filtered candidates to maintain correctness
    - _Requirements: 8.1, 13.4_

- [x] 4. Validate and harden `OnboardingService.registerOwner()`
  - [x] 4.1 Confirm `registerOwner` transaction includes all required entities and the audit log
    - Read through `OnboardingService.registerOwner` and verify the `$transaction` includes: `organization.create`, `permission.create × N`, `role.create × 6` + `rolePermission.createMany × 6`, `user.create` (isOwner=true), `auditLog.create` (action='create', resource='organization', metadata.step='owner_registered')
    - If any step is missing, add it; the current implementation looks complete but must be confirmed against requirements
    - Ensure the `requiresSetup: true` field is present in the return value
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.10, 1.11_

  - [x] 4.2 Write property test for Registration Atomicity (Property 1)
    - **Property 1: Registration Atomicity**
    - **Validates: Requirements 1.1, 1.3, 1.4**
    - Install `fast-check` and a test runner (`jest` + `ts-jest`) in `backend/`
    - Use `fc.record({ ownerName: fc.string({ minLength: 1 }), ownerEmail: fc.emailAddress(), ownerPassword: fc.string({ minLength: 8 }) })` as the input generator
    - Mock `prisma.$transaction` to simulate a failure at each step index (0–5) using a counter
    - After each simulated failure, assert `prisma.organization.count()`, `prisma.user.count()`, `prisma.role.count()` all return 0 (no partial records)
    - _Requirements: 1.1, 1.3, 1.4_

  - [x] 4.3 Write property test for Email Uniqueness (Property 2)
    - **Property 2: Email Uniqueness**
    - **Validates: Requirements 1.7, 12.3**
    - Use `fc.emailAddress()` to generate random emails
    - For each email, call `registerOwner` twice concurrently and assert that at most one User record exists with that email globally (case-insensitive)
    - Assert the second call returns HTTP 400 with message "An account with this email already exists"
    - _Requirements: 1.7, 12.3_

- [x] 5. Validate and harden `OnboardingService.completeSetup()`
  - [x] 5.1 Confirm `completeSetup` regenerates slug, sets `setupComplete=true`, and writes audit log
    - Read `OnboardingService.completeSetup` and verify: slug regeneration from `name` using the design's formula, `organization.update` includes `setupComplete: true`, and `auditLog.create` includes `action='update'`, `resource='organization'`, `metadata.step='setup_complete'`
    - No changes needed if confirmed; fix any missing pieces
    - _Requirements: 4.1, 4.8, 4.9_

  - [x] 5.2 Write property test for `setupComplete` Gate (Property 3)
    - **Property 3: setupComplete Gate**
    - **Validates: Requirements 2.2, 2.3, 5.2**
    - Generate arbitrary protected route paths (excluding `/auth/setup`) as `fc.constantFrom('/dashboard', '/contacts', '/deals', '/activities', '/settings')`
    - For a freshly registered owner (where `setupComplete=false`), call each generated route with the owner's JWT
    - Assert every call returns HTTP 403 or HTTP 404 (never HTTP 200)
    - Note: the route guard logic is client-side; test the `requireOwner` middleware for the setup endpoint separately via unit test
    - _Requirements: 2.2, 2.3, 5.2_

- [x] 6. Validate and harden `InvitationService.sendInvitation()`
  - [x] 6.1 Confirm `sendInvitation` validates hierarchy, expires duplicates, generates secure token, and writes audit log
    - Read `InvitationService.sendInvitation` and verify: target role lookup with 404 guard, `INVITE_PERMISSIONS` hierarchy check with 403, existing user check with 400, `invitation.updateMany` to expire prior pending invites, `crypto.randomBytes(32).toString('hex')` token generation, `bcrypt.hash(rawToken, 10)`, `invitation.create` with all fields, and `auditLog.create` with `action='invite_sent'` and metadata
    - Fix any missing pieces
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.10_

  - [x] 6.2 Write property test for Role Hierarchy Enforcement (Property 6)
    - **Property 6: Role Hierarchy Enforcement**
    - **Validates: Requirements 6.7, 6.9**
    - Enumerate all (inviterRoleName, targetRoleName) pairs where `targetRoleName ∉ INVITE_PERMISSIONS[inviterRoleName]`
    - For each forbidden pair, call `POST /invitations` with the inviter's JWT and assert HTTP 403
    - _Requirements: 6.7, 6.9_

- [x] 7. Validate and harden `InvitationService.acceptInvitation()`
  - [x] 7.1 Confirm `acceptInvitation` atomic transaction creates user, updates invitation, and writes audit log
    - Read `InvitationService.acceptInvitation` and verify: `$transaction` wraps `user.create`, `invitation.update(status='accepted', acceptedAt=now())`, `auditLog.create(action='invite_accepted')`; JWT is generated with correct `{ userId, organizationId, roleId, roleName }`; `organizationId` comes from invitation (not request body)
    - _Requirements: 8.4, 8.5, 8.6, 8.7, 10.1, 10.2, 10.5_

  - [x] 7.2 Write property test for Invitation Token Non-Replayability (Property 4)
    - **Property 4: Invitation Token Non-Replayability**
    - **Validates: Requirements 8.1, 8.2, 13.4**
    - Create a valid invitation, accept it successfully once, then immediately replay the identical raw token in a second `POST /invitations/accept` request
    - Assert the second call returns HTTP 400
    - Use `fc.string({ minLength: 1 })` for the `name` and `fc.string({ minLength: 8 })` for the `password` to vary acceptance inputs
    - _Requirements: 8.1, 8.2, 13.4_

  - [x] 7.3 Write property test for Invitation Expiry (Property 5)
    - **Property 5: Invitation Expiry**
    - **Validates: Requirements 8.3, 6.1**
    - Use `fc.date({ max: new Date() })` to generate arbitrary past timestamps as `expiresAt`
    - Create an invitation record with `expiresAt` in the past and `status='pending'`
    - Attempt acceptance; assert HTTP 400 with message containing 'This invitation has expired' and DB `status = 'expired'`
    - _Requirements: 8.3, 6.1_

- [x] 8. Validate and harden `InvitationService` management methods
  - [x] 8.1 Confirm `listInvitations` returns only pending invitations for the caller's org, ordered by `createdAt` desc
    - Read `InvitationService.listInvitations` and verify the query filters on `organizationId` and `status='pending'` with `orderBy: { createdAt: 'desc' }`
    - _Requirements: 11.1_

  - [x] 8.2 Confirm `resendInvitation` hierarchy check, expires old record, creates new invitation with fresh token
    - Read `InvitationService.resendInvitation` and verify: `INVITE_PERMISSIONS` check, `invitation.update(status='expired')`, `crypto.randomBytes(32)`, `bcrypt.hash(rawToken, 10)`, new `invitation.create` with 72h expiry
    - _Requirements: 11.2, 11.4, 11.5_

  - [x] 8.3 Confirm `revokeInvitation` sets `status='revoked'` and writes correct audit log
    - Read `InvitationService.revokeInvitation` and verify: `findFirst(id, orgId, status='pending')` with 404 guard, `invitation.update(status='revoked')`, and after Task 1.4 the audit log uses `action='invite_revoked'`
    - _Requirements: 11.3, 11.4, 14.1_

- [x] 9. Checkpoint — backend logic complete
  - Ensure all TypeScript files compile without errors: `cd backend && npx tsc --noEmit`
  - Verify the Prisma migration ran and `@prisma/client` is regenerated: `npx prisma generate`
  - Ask the user if any questions arise before proceeding to frontend tasks.

- [x] 10. Fix `RootLayoutClient` route guard logic
  - [x] 10.1 Verify and harden route guard redirect rules in `frontend/components/layout/root-layout.tsx`
    - Confirm the `useEffect` implements all four rules from the design exactly:
      1. `!user && !isPublicRoute` → `router.replace('/login')`
      2. `user && !setupComplete && pathname !== '/onboarding/setup'` → `router.replace('/onboarding/setup')`
      3. `user && setupComplete && pathname === '/login'` → `router.replace('/dashboard')`
    - Confirm `PUBLIC_ROUTES = ['/login', '/onboarding/setup', '/invitations/accept']` is the complete list
    - Confirm sidebar is only rendered when `!isPublicRoute && user` is truthy — prevents sidebar flash on public pages
    - Fix any deviations from the design spec
    - _Requirements: 2.2, 2.3, 2.4, 3.4, 5.1, 5.2_

  - [x] 10.2 Verify `SetupWizardPage` local guard logic
    - In `frontend/app/onboarding/setup/page.tsx`, confirm the local `useEffect` guard: `if (!user) router.replace('/login')` and `if (user.organization?.setupComplete) router.replace('/dashboard')`
    - This guard is the primary enforcement for Requirement 2.5 (unauthenticated users redirected to login, already-setup owners redirected to dashboard)
    - _Requirements: 2.5_

- [x] 11. Fix login response routing on the frontend
  - [x] 11.1 Update `LoginPage` login handler to route based on `organization.setupComplete`
    - In `frontend/app/login/page.tsx`, after a successful `login()` call, inspect `user.organization?.setupComplete`
    - If `setupComplete === false`, call `router.replace('/onboarding/setup')` instead of going to dashboard
    - If `setupComplete === true` (or undefined), call `router.replace('/dashboard')`
    - The existing `useEffect` already handles this redirection when `user` state updates — verify the approach is correct and covers both the `useEffect` path and the `handleSubmit` path
    - _Requirements: 3.2, 3.3_

- [x] 12. Implement post-acceptance profile completion prompt
  - [x] 12.1 Create `ProfileCompletionModal` component
    - Create `frontend/components/profile/ProfileCompletionModal.tsx`
    - The modal renders if `user.avatar` equals the auto-generated 2-char initials pattern (i.e., `jobTitle` is not stored on the User model, so use absence of a real avatar URL as the signal) or if `user.avatar` is exactly 2 uppercase characters matching initials
    - Collect: display name (pre-filled from `user.name`), job title text field (optional, stored locally for display only since there is no `jobTitle` column), avatar URL (optional)
    - On submit, call `PATCH /auth/me` with `{ name, avatar }` via `apiFetch`
    - On skip, dismiss the modal with no API call
    - Show the modal as a non-blocking overlay — it MUST NOT prevent dashboard access
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 12.2 Wire `ProfileCompletionModal` into the dashboard page
    - In `frontend/app/dashboard/page.tsx`, import and render `<ProfileCompletionModal />` conditionally
    - Show when `user` is authenticated and `user.avatar` matches the 2-char initials pattern (i.e., `/^[A-Z]{1,2}$/` and no other avatar set)
    - Dismissal state is managed via local React state; no persistence needed
    - _Requirements: 9.1, 9.4, 9.5_

- [x] 13. Harden `AcceptInvitePage` — token validation and post-acceptance routing
  - [x] 13.1 Verify `AcceptInvitePage` reads token from URL and shows error when absent
    - In `frontend/app/invitations/accept/page.tsx`, confirm the `useEffect` that calls `setError(...)` when `!token` is present
    - Confirm the form submit button is `disabled={!token}` when token is absent
    - Verify that after successful acceptance the page calls `localStorage.setItem('auth_token', data.token)` and then `router.replace('/dashboard')`
    - _Requirements: 8.11, 9.5_

- [x] 14. Set up property-based testing infrastructure
  - [x] 14.1 Install and configure Jest + ts-jest + fast-check in the backend
    - Run `npm install --save-dev jest@29.7.0 ts-jest@29.1.4 @types/jest@29.5.12 fast-check@3.19.0` in `backend/`
    - Create `backend/jest.config.ts` with `preset: 'ts-jest'`, `testEnvironment: 'node'`, `testMatch: ['**/__tests__/**/*.test.ts']`
    - Add `"test": "jest --runInBand"` and `"test:run": "jest --runInBand --forceExit"` to `backend/package.json` scripts
    - Create `backend/src/__tests__/` directory
    - _Requirements: N/A (infrastructure)_

- [x] 15. Implement property-based tests for all 10 correctness properties
  - [x] 15.1 Write property test for bcrypt Cost Factor (Property 8)
    - Create `backend/src/__tests__/pbt.bcrypt-cost.test.ts`
    - **Property 8: bcrypt Cost Factor**
    - **Validates: Requirements 1.10, 8.10, 13.7**
    - After `registerOwner()`, read the stored password hash from the test DB and assert `bcrypt.getRounds(hash) >= 12`
    - After `acceptInvitation()`, read the new user's password hash and assert `bcrypt.getRounds(hash) >= 12`
    - Use `fc.record({ ownerName: fc.string({ minLength: 1 }), ownerPassword: fc.string({ minLength: 8 }) })` to generate inputs
    - _Requirements: 1.10, 8.10, 13.7_

  - [x] 15.2 Write property test for JWT Payload Integrity (Property 9)
    - Create `backend/src/__tests__/pbt.jwt-payload.test.ts`
    - **Property 9: JWT Payload Integrity**
    - **Validates: Requirements 1.5, 3.1, 8.6, 13.1**
    - After `registerOwner()`, decode the returned JWT (without verifying) and assert `{ userId, organizationId, roleId, roleName }` strictly match the DB user record
    - After `acceptInvitation()`, decode the returned JWT and assert all four fields match the DB user record
    - Use `fc.record(...)` to generate varied registration and acceptance inputs
    - _Requirements: 1.5, 3.1, 8.6, 13.1_

  - [x] 15.3 Write property test for One Owner Per Organization (Property 7)
    - Create `backend/src/__tests__/pbt.one-owner.test.ts`
    - **Property 7: One Owner Per Organization**
    - **Validates: Requirements 12.1, 12.2**
    - After each `registerOwner()` call and after each `acceptInvitation()` call, query the DB for `users.count({ where: { organizationId, isOwner: true } })` and assert it equals exactly 1 per org
    - Use `fc.array(fc.record({ ... }), { minLength: 1, maxLength: 5 })` to generate sequences of registrations
    - _Requirements: 12.1, 12.2_

  - [x] 15.4 Write property test for Tenant Data Isolation (Property 10)
    - Create `backend/src/__tests__/pbt.tenant-isolation.test.ts`
    - **Property 10: Tenant Data Isolation**
    - **Validates: Requirements 10.1, 10.2, 10.5, 12.4**
    - Register two organizations (org A and org B) with respective owner JWTs
    - For each tenant-scoped endpoint (`GET /contacts`, `GET /deals`, `PATCH /auth/me`, `GET /invitations`), call using org A's JWT but with resource IDs from org B
    - Assert every cross-tenant request returns HTTP 403 or HTTP 404
    - _Requirements: 10.1, 10.2, 10.5, 12.4_

- [x] 16. Final checkpoint — all tests green, compilation clean
  - Run `cd backend && npx tsc --noEmit` to confirm no TypeScript errors
  - Run `cd backend && npm run test:run` to execute all property-based and unit tests
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP delivery
- Each task references specific requirements for traceability
- The `tokenPrefix` optimization (Tasks 1.1, 3.1–3.3) is a schema migration — run `prisma migrate dev` before running the backend
- Property tests (Tasks 4.2, 4.3, 5.2, 6.2, 7.2, 7.3, 15.1–15.4) require a test database; configure `DATABASE_URL` in `backend/.env.test` to point at a separate test schema
- `requireOwner` middleware already exists in `middleware/auth.ts` — Task 1.2 only wires it into the route
- The `invite_revoked` enum gap (Task 1.1) and the wrong audit action (Task 1.4) are tightly coupled — complete both in the same PR
- Tasks 2 and 3 are independent of each other and can be done in parallel

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "3.1", "3.2"] },
    { "id": 2, "tasks": ["3.3", "4.1", "5.1", "6.1", "7.1", "8.1", "8.2", "8.3"] },
    { "id": 3, "tasks": ["4.2", "4.3", "5.2", "6.2", "7.2", "7.3"] },
    { "id": 4, "tasks": ["10.1", "10.2", "11.1", "14.1"] },
    { "id": 5, "tasks": ["12.1", "13.1"] },
    { "id": 6, "tasks": ["12.2", "15.1", "15.2", "15.3", "15.4"] }
  ]
}
```
