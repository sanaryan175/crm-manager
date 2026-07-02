# CRM Manager — Bug Fix Report

**Date:** 2026-07-01  
**Scope:** Full project audit covering frontend (Next.js App Router) and backend (Express + Prisma)  
**Status:** ✅ All issues resolved

---

## Table of Contents

1. [Critical — All API calls returning 404](#1-critical--all-api-calls-returning-404)
2. [Critical — `/bulk` route shadowed by `/:id` wildcard](#2-critical--bulk-route-shadowed-by-id-wildcard)
3. [Logic Bug — Stale closure in `addToast`](#3-logic-bug--stale-closure-in-addtoast)
4. [Logic Bug — All filtered queries sharing one cache key](#4-logic-bug--all-filtered-queries-sharing-one-cache-key)
5. [Logic Bug — `triggerRefresh` not hitting filtered cache keys](#5-logic-bug--triggerrefresh-not-hitting-filtered-cache-keys)
6. [Type Bug — Missing fields in `updateDeal` data object](#6-type-bug--missing-fields-in-updatedeal-data-object)
7. [Runtime Bug — `req.query`/`req.params` wiped by validate middleware](#7-runtime-bug--reqqueryreqparams-wiped-by-validate-middleware)
8. [Build Issue — `ignoreBuildErrors: true` masking TypeScript errors](#8-build-issue--ignorebuilderstrue-masking-typescript-errors)
9. [Dead Code / Crash — `app/login.tsx` and `app/signup.tsx` using wrong router API](#9-dead-code--crash--applogintsx-and-appsignuptsx-using-wrong-router-api)

---

## 1. Critical — All API calls returning 404

**File:** `frontend/.env.local` · `frontend/lib/api.ts`  
**Severity:** 🔴 Critical

### Problem

`NEXT_PUBLIC_API_URL` was set to `http://localhost:5000`, but the Express backend mounts **all routes under `/api`** (`app.use('/api', routes)`). This meant every frontend fetch was targeting paths like:

```
http://localhost:5000/contacts      ← WRONG (404)
http://localhost:5000/auth/login    ← WRONG (404)
```

Instead of the correct:

```
http://localhost:5000/api/contacts
http://localhost:5000/api/auth/login
```

The `apiFetch` URL construction also had a minor fragility — it didn't strip trailing slashes from the base URL.

### Fix

**`frontend/.env.local`**
```diff
- NEXT_PUBLIC_API_URL=http://localhost:5000
+ NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**`frontend/lib/api.ts`**
```diff
- const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
- const url = `${API_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
+ const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
+ const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
+ const url = `${API_URL}${path}`;
```

---

## 2. Critical — `/bulk` route shadowed by `/:id` wildcard

**File:** `backend/src/routes/contact.routes.ts`  
**Severity:** 🔴 Critical

### Problem

Express matches routes in declaration order. `POST /bulk` was registered **after** `GET /:id`, so when the frontend called `POST /contacts/bulk`, Express matched the `/:id` wildcard with `id = "bulk"` and routed it to `getContactById` — which then threw a 404 "Contact not found" error.

```ts
// BEFORE — wrong order
router.get('/:id', ContactController.getContactById);   // ← catches /bulk first
router.post('/bulk', ...ContactController.bulkOperations);
```

### Fix

```ts
// AFTER — static routes declared before wildcards
router.get('/', ContactController.getContacts);
router.post('/', validate(createContactSchema), ContactController.createContact);
router.post('/bulk', validate(bulkContactSchema), ContactController.bulkOperations);  // ← moved up
router.get('/:id', ContactController.getContactById);
router.put('/:id', validate(updateContactSchema), ContactController.updateContact);
router.delete('/:id', ContactController.deleteContact);
```

---

## 3. Logic Bug — Stale closure in `addToast`

**File:** `frontend/lib/context.tsx`  
**Severity:** 🟠 High

### Problem

`addToast` was defined **before** `removeToast` in the component body and called `removeToast(id)` inside a `setTimeout`. At the time `addToast` was defined, `removeToast` didn't exist yet, causing a runtime error when the auto-dismiss timer fired.

```ts
// BEFORE — addToast references removeToast before it's defined
const addToast = useCallback((toast) => {
  const id = ...;
  setToasts((prev) => [...prev, { ...toast, id }]);
  setTimeout(() => {
    removeToast(id);  // ← ReferenceError: removeToast is not defined
  }, duration);
}, []);

const removeToast = useCallback((id) => { ... }, []);
```

### Fix

Swapped declaration order and replaced the `removeToast` call inside the timeout with a direct `setToasts` functional update — eliminating the dependency entirely:

```ts
// AFTER — removeToast first, addToast uses setToasts directly
const removeToast = useCallback((id: string) => {
  setToasts((prev) => prev.filter((t) => t.id !== id));
}, []);

const addToast = useCallback((toast) => {
  const id = Math.random().toString(36).substr(2, 9);
  setToasts((prev) => [...prev, { ...toast, id }]);
  if (duration > 0) {
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id)); // ← no closure dependency
    }, duration);
  }
}, []);
```

---

## 4. Logic Bug — All filtered queries sharing one cache key

**File:** `frontend/lib/hooks.ts`  
**Severity:** 🟠 High

### Problem

`useContacts`, `useDeals`, and `useActivities` all passed a **hardcoded base string** as the cache key to `useQuery`, regardless of the active filter parameters:

```ts
// BEFORE — every filter variant uses the same key
useQuery<Contact[]>('contacts', `/contacts?status=active`)
useQuery<Contact[]>('contacts', `/contacts?status=inactive`)
// Both register under 'contacts' → the second overwrites the first listener
```

This caused multiple mounted instances of the same hook with different filters to stomp on each other's listener registrations, resulting in incorrect data being displayed.

### Fix

The cache key now includes the full query string, making each filter combination unique:

```ts
// AFTER — each filter variant has its own key
const cacheKey = `contacts?${queryString}`;
useQuery<Contact[]>(cacheKey, `/contacts?${queryString}`);

// Same pattern applied to useDeals and useActivities
const cacheKey = `deals?${queryString}`;
const cacheKey = `activities?${queryString}`;
```

---

## 5. Logic Bug — `triggerRefresh` not hitting filtered cache keys

**File:** `frontend/lib/hooks.ts`  
**Severity:** 🟠 High

### Problem

After fix #4, `triggerRefresh('contacts')` no longer matched cache keys like `contacts?status=active` — so mutations (create, update, delete) stopped refreshing filtered list views.

```ts
// BEFORE — exact key match only
export const triggerRefresh = (key: string) => {
  const cbs = listeners.get(key); // ← misses 'contacts?status=active'
  if (cbs) cbs.forEach((cb) => cb());
};
```

### Fix

`triggerRefresh` now does **prefix-based matching** across all registered keys:

```ts
// AFTER — prefix match invalidates all variants
export const triggerRefresh = (keyPrefix: string) => {
  listeners.forEach((cbs, key) => {
    if (key === keyPrefix || key.startsWith(`${keyPrefix}?`) || key.startsWith(`${keyPrefix}/`)) {
      cbs.forEach((cb) => cb());
    }
  });
};
```

---

## 6. Type Bug — Missing fields in `updateDeal` data object

**File:** `backend/src/services/deal.service.ts`  
**Severity:** 🟡 Medium

### Problem

Inside `updateDeal`, the `updatedData` object was typed as a plain copy of the `data` parameter. The function then conditionally added `closedAt` and `closeReason` to `updatedData` — but those fields weren't part of the original `data` type, causing a TypeScript error under strict mode.

```ts
// BEFORE — type doesn't include closedAt / closeReason
const updatedData = { ...data };
updatedData.closedAt = new Date(); // ← TS error: property does not exist
```

### Fix

Extended the type with an intersection:

```ts
// AFTER — type explicitly allows the extra fields
const updatedData: typeof data & { closedAt?: Date | null; closeReason?: DealCloseReason | null } = { ...data };
```

---

## 7. Runtime Bug — `req.query`/`req.params` wiped by validate middleware

**File:** `backend/src/middleware/validate.ts`  
**Severity:** 🟡 Medium

### Problem

When a Zod validation schema only defined a `body` shape (no `query` or `params` keys), `schema.parseAsync()` returned `undefined` for those fields. The middleware then assigned `undefined` back to `req.query` and `req.params`, wiping out the original values for any downstream controller that needed them.

```ts
// BEFORE — unconditional assignment
req.body = parsed.body;
req.query = parsed.query;   // ← undefined when schema has no query shape
req.params = parsed.params; // ← undefined when schema has no params shape
```

### Fix

Added null-guards so only defined parsed values overwrite the originals:

```ts
// AFTER — safe assignment
req.body = parsed.body ?? req.body;
if (parsed.query !== undefined) req.query = parsed.query;
if (parsed.params !== undefined) req.params = parsed.params;
```

---

## 8. Build Issue — `ignoreBuildErrors: true` masking TypeScript errors

**File:** `frontend/next.config.mjs`  
**Severity:** 🟡 Medium

### Problem

`typescript.ignoreBuildErrors: true` tells Next.js to skip the TypeScript compiler check during `next build`. This means **all type errors are silently ignored**, allowing broken code to ship to production undetected.

```js
// BEFORE
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,  // ← hides all TS errors at build time
  },
  ...
}
```

### Fix

Removed the flag entirely so the build fails fast on type errors:

```js
// AFTER
const nextConfig = {
  images: {
    unoptimized: true,
  },
}
```

---

## 9. Dead Code / Crash — `app/login.tsx` and `app/signup.tsx` using wrong router API

**Files:** `frontend/app/login.tsx` · `frontend/app/signup.tsx`  
**Severity:** 🟡 Medium

### Problem

Both files imported `useRouter` from `next/router` — the **Pages Router** API. This project uses the **App Router** (`next/navigation`). Calling `next/router` in an App Router project throws a runtime error:

```
Error: NextRouter was not mounted.
```

Additionally:
- Both files had no real auth logic (just a redirect on submit).
- `app/login.tsx` conflicted as a layout-level file alongside the proper `app/login/page.tsx`.
- `app/signup.tsx` had no corresponding route in the app at all.

### Fix

Both files were **deleted**. The real login/register flow lives at `app/login/page.tsx` and uses `next/navigation` correctly with full auth context integration.

---

## Summary Table

| # | Severity | File(s) | Issue | Status |
|---|----------|---------|-------|--------|
| 1 | 🔴 Critical | `frontend/.env.local`, `lib/api.ts` | API base URL missing `/api` prefix — all requests 404 | ✅ Fixed |
| 2 | 🔴 Critical | `backend/src/routes/contact.routes.ts` | `/bulk` route shadowed by `/:id` wildcard | ✅ Fixed |
| 3 | 🟠 High | `frontend/lib/context.tsx` | Stale closure crash in `addToast` auto-dismiss | ✅ Fixed |
| 4 | 🟠 High | `frontend/lib/hooks.ts` | Filtered queries sharing one cache key → data corruption | ✅ Fixed |
| 5 | 🟠 High | `frontend/lib/hooks.ts` | `triggerRefresh` not invalidating filtered cache variants | ✅ Fixed |
| 6 | 🟡 Medium | `backend/src/services/deal.service.ts` | Missing type fields for `closedAt`/`closeReason` in `updateDeal` | ✅ Fixed |
| 7 | 🟡 Medium | `backend/src/middleware/validate.ts` | `req.query`/`req.params` wiped to `undefined` by validate middleware | ✅ Fixed |
| 8 | 🟡 Medium | `frontend/next.config.mjs` | `ignoreBuildErrors: true` hiding all TypeScript errors at build time | ✅ Fixed |
| 9 | 🟡 Medium | `frontend/app/login.tsx`, `app/signup.tsx` | Wrong router API (`next/router` in App Router project), dead code | ✅ Fixed (deleted) |
