# CRM Manager

A production-grade, multi-tenant SaaS CRM built with Next.js 16, Express, PostgreSQL, and Prisma.

---

## Features

- **Multi-Tenant Architecture** — Every organization is completely isolated. All data is scoped by `organizationId`.
- **Enterprise RBAC** — Granular role-based access control with 6 default roles (Owner, Admin, Sales Manager, Sales Rep, Marketing, Support) and 22 specific permissions.
- **Contact Management** — Full CRUD with tagging, search, filtering, status tracking, and CSV-ready data model.
- **Visual Deal Pipeline** — Drag-and-drop Kanban board across 7 customizable stages (New → Contacted → Demo Scheduled → Proposal Sent → Negotiation → Closed Won/Lost).
- **Activity Tracking** — Log calls, emails, meetings, notes, and tasks with due dates, assignment, and completion toggling.
- **Team Invitations** — Secure, time-limited invite tokens sent via email (Brevo) with role-based invite hierarchy.
- **File Management** — Upload, organize in folders, preview, and download files (scoped per organization).
- **Dashboard & Analytics** — Pipeline metrics, conversion rates, revenue forecasts, and recent activities.
- **Multi-Currency & Regional Support** — INR, USD, EUR, GBP, JPY, CAD, AUD, SGD, CHF, AED with locale-aware formatting and lakh/crore notation for INR.
- **Audit Logs** — Comprehensive history for every significant action (login, create, update, delete, invite, etc.).
- **Password Reset Flow** — 3-step flow (email → 6-digit PIN → new password) with PIN expiry.
- **Dark Mode** — System-aware with localStorage persistence, no flash on load.
- **Responsive Design** — Full mobile support with collapsible sidebar and touch-friendly Kanban.

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.2.6 | App Router, React framework |
| React | 19 | UI library |
| TypeScript | 5.7.3 | Type safety |
| Tailwind CSS | 4.2.0 | Utility-first CSS |
| Framer Motion | 12.42.2 | Animations & page transitions |
| @dnd-kit | 6.3.1 | Drag-and-drop Kanban |
| React Hook Form | 7.80.0 | Form management |
| Zod | 4.4.3 | Schema validation |
| Recharts | 3.9.1 | Charts (dashboard) |
| date-fns | 4.4.0 | Date formatting |
| Lucide React | 1.16.0 | Icons |
| shadcn/ui | 4.8.0 | Component primitives |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 4.18 | HTTP framework |
| TypeScript | 5.3 | Type safety |
| Prisma | 5.10 | ORM / migrations |
| PostgreSQL | 14+ | Database |
| jsonwebtoken | 9.0 | JWT auth |
| bcryptjs | 2.4 | Password hashing |
| Zod | 3.22 | Request validation |
| Multer | 2.2 | File uploads |
| @getbrevo/brevo | 6.0 | Transactional emails |
| Jest + Supertest | 29 | Testing |

---

## Project Structure

```
crm-manager/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema (12 models, 7 enums)
│   │   ├── seed.ts                # Demo data seeder
│   │   └── migrations/            # 13 migration files
│   ├── src/
│   │   ├── app.ts                 # Express app setup
│   │   ├── server.ts              # Entry point
│   │   ├── config/
│   │   │   └── db.ts              # PrismaClient singleton
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT verify, permission/role guards
│   │   │   ├── error.ts           # Global error handler
│   │   │   ├── validate.ts        # Zod schema validation
│   │   │   └── cors.ts            # CORS config
│   │   ├── routes/
│   │   │   ├── index.ts           # Route aggregator
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── organization.routes.ts
│   │   │   ├── contact.routes.ts
│   │   │   ├── deal.routes.ts
│   │   │   ├── activity.routes.ts
│   │   │   ├── invitation.routes.ts
│   │   │   ├── notification.routes.ts
│   │   │   ├── file.routes.ts
│   │   │   └── dashboard.routes.ts
│   │   ├── controllers/           # 10 controller files
│   │   ├── services/              # 12 service files (business logic)
│   │   ├── validations/           # 6 Zod schema files
│   │   ├── rbac/
│   │   │   └── permissions.ts     # Role/permission definitions + invite hierarchy
│   │   ├── utils/
│   │   │   ├── errors.ts          # Custom error classes
│   │   │   ├── jwt.ts             # Token generation/verification
│   │   │   └── response.ts        # Standard response helpers
│   │   ├── __tests__/             # 9 property-based test files
│   │   └── scripts/
│   │       ├── verify-api.ts      # Endpoint verification
│   │       └── backfill-permissions.ts
│   ├── .env.production.example
│   ├── tsconfig.json
│   ├── jest.config.ts
│   ├── railway.toml
│   └── render.yaml
│
└── frontend/
    ├── app/
    │   ├── layout.tsx             # Root layout (HTML, theme, providers)
    │   ├── globals.css            # Tailwind + CSS variables
    │   ├── page.tsx               # Landing page (Spline 3D hero)
    │   ├── login/page.tsx         # Login / Register
    │   ├── forgot-password/page.tsx
    │   ├── dashboard/page.tsx     # Metrics, pipeline, activities
    │   ├── contacts/page.tsx      # Contact list + CRUD
    │   ├── deals/page.tsx         # Kanban board + list view
    │   ├── activities/page.tsx    # Activity list + CRUD
    │   ├── reports/page.tsx       # File manager
    │   ├── settings/page.tsx      # 6-tab settings panel
    │   └── onboarding/
    │       ├── setup/page.tsx     # Org setup wizard (owner)
    │       ├── user/page.tsx      # User onboarding (invited)
    │       └── welcome/page.tsx   # Post-setup welcome
    ├── components/
    │   ├── ui/                    # Button, Card, Badge, Modal
    │   ├── layout/                # Sidebar, TopNav, RootLayout, Toast, FAQ
    │   ├── dashboard/             # Metrics, PipelineOverview, QuickStats
    │   ├── contacts/              # ContactsList
    │   ├── deals/                 # KanbanBoard, KanbanColumn, DealList
    │   └── profile/               # ProfileCompletionModal
    ├── lib/
    │   ├── api.ts                 # apiFetch — unified HTTP client
    │   ├── context.tsx            # Auth, UI, Filter, Region providers
    │   ├── hooks.ts               # 8 custom data hooks with auto-refetch
    │   ├── types.ts               # All TypeScript interfaces
    │   ├── rbac.ts                # Invite permission hierarchy
    │   ├── regions.ts             # Currency/country definitions + formatting
    │   ├── dateTime.ts            # Date/time formatting utilities
    │   ├── utils.ts               # cn() classname merge
    │   └── mockData.ts            # Demo data for development
    ├── .env.local
    ├── next.config.mjs
    ├── tsconfig.json
    ├── postcss.config.mjs
    └── components.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+ (v24 recommended)
- PostgreSQL 14+
- npm (or pnpm)

### 1. Create the Database

```sql
CREATE DATABASE crm_manager;
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/crm_manager?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRE="24h"
NODE_ENV="development"
FRONTEND_URL=http://localhost:3000
```

Run migrations and seed:

```bash
npm run prisma:migrate
npm run prisma:seed
```

Start the backend:

```bash
npm run dev
```

The API is now running at `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

The app is now running at `http://localhost:3000`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | API server port |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string |
| `JWT_SECRET` | **Yes** | — | JWT signing secret (use a long random string) |
| `JWT_EXPIRE` | No | `24h` | Token expiration duration |
| `NODE_ENV` | No | `development` | Environment mode |
| `FRONTEND_URL` | **Yes** | — | Frontend URL (CORS + invite links) |
| `CORS_ORIGIN` | No | falls back to `FRONTEND_URL` | Comma-separated allowed origins |
| `BREVO_API_KEY` | No | — | Brevo transactional email API key |
| `BREVO_SENDER_EMAIL` | No | — | Verified Brevo sender email |
| `BREVO_SENDER_NAME` | No | — | Sender display name |

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | **Yes** | `http://localhost:5000/api` | Backend API base URL |

## API Reference

All endpoints are prefixed with `/api`. Authentication uses `Authorization: Bearer <token>`.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register org + owner account |
| POST | `/auth/login` | — | Login with email/password |
| POST | `/auth/setup` | JWT (Owner) | Complete organization setup |
| GET | `/auth/me` | JWT | Get current user profile |
| PATCH | `/auth/me` | JWT | Update own profile |
| POST | `/auth/change-password` | JWT | Change password |
| POST | `/auth/complete-onboarding` | JWT | Mark onboarding complete |
| POST | `/auth/forgot-password` | — | Request 6-digit reset PIN |
| POST | `/auth/reset-password` | — | Reset password with PIN |

### Contacts

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/contacts` | `contact.read` | List contacts (filter: status, source, q) |
| POST | `/contacts` | `contact.create` | Create contact |
| POST | `/contacts/bulk` | `contact.delete` | Bulk assign/tag/delete |
| GET | `/contacts/:id` | `contact.read` | Get contact by ID |
| PUT | `/contacts/:id` | `contact.update` | Update contact |
| DELETE | `/contacts/:id` | `contact.delete` | Delete contact |

### Deals

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/deals` | `deal.read` | List deals (filter: stage) |
| POST | `/deals` | `deal.create` | Create deal |
| GET | `/deals/:id` | `deal.read` | Get deal by ID |
| PUT | `/deals/:id` | `deal.update` | Update deal |
| PUT | `/deals/:id/stage` | `deal.update` | Update deal stage |
| DELETE | `/deals/:id` | `deal.delete` | Delete deal |

### Activities

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/activities` | `activity.read` | List activities (filter: contactId, dealId, type) |
| POST | `/activities` | `activity.create` | Create activity |
| GET | `/activities/:id` | `activity.read` | Get activity by ID |
| PUT | `/activities/:id` | `activity.update` | Update activity |
| PUT | `/activities/:id/complete` | `activity.update` | Toggle completion |
| DELETE | `/activities/:id` | `activity.delete` | Delete activity |

### Users

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/users` | `user.read` | List org members |
| GET | `/users/:id` | `user.read` | Get user by ID |
| PATCH | `/users/:id/role` | `user.update` | Change user role |
| DELETE | `/users/:id` | `user.remove` | Deactivate user |

### Organization

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/organization` | — | Get org settings |
| PUT | `/organization` | `org.settings` | Update org settings |
| GET | `/organization/roles` | — | List roles with permissions |
| GET | `/organization/audit` | `audit.view` | Get audit logs |

### Invitations

| Method | Path | Permission | Description |
|---|---|---|---|
| POST | `/invitations/accept` | — | Accept invitation (public) |
| GET | `/invitations` | `user.invite` | List pending invitations |
| POST | `/invitations` | `user.invite` | Send invitation |
| POST | `/invitations/:id/resend` | `user.invite` | Resend invitation |
| DELETE | `/invitations/:id` | `user.invite` | Revoke invitation |

### Files

| Method | Path | Permission | Description |
|---|---|---|---|
| GET | `/files/folders` | `reports.view` | List all folders |
| GET | `/files/all` | `reports.view` | List all files with folder structure |
| POST | `/files/folders` | `reports.view` | Create folder |
| POST | `/files/upload` | `reports.view` | Upload file |
| POST | `/files/upload-multiple` | `reports.view` | Upload up to 10 files |
| GET | `/files` | `reports.view` | List files in folder |
| GET | `/files/:id` | `reports.view` | Get file metadata |
| GET | `/files/:id/download` | `reports.view` | Download file |
| DELETE | `/files/:id` | `reports.view` | Delete file |

### Dashboard & Notifications

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/dashboard/metrics` | JWT | Pipeline KPIs and metrics |
| GET | `/notifications` | JWT | User notifications |

---

## Database Schema

12 models, 7 enums, 13 migrations.

### Models

| Model | Table | Key Fields |
|---|---|---|
| **Organization** | `organizations` | id, name, slug, industry, country, currency, timezone, dateFormat, timeFormat, setupComplete |
| **Role** | `roles` | id, organizationId, name, displayName, isSystem |
| **Permission** | `permissions` | id, organizationId, resource, action |
| **RolePermission** | `role_permissions` | roleId ↔ permissionId (join table) |
| **User** | `users` | id, organizationId, roleId, name, email, password, isOwner, onboardingComplete, resetPin, lastLoginAt |
| **Invitation** | `invitations` | id, organizationId, email, roleId, token, status (pending/accepted/expired/revoked), expiresAt |
| **Contact** | `contacts` | id, organizationId, firstName, lastName, email, phone, company, status, source, tags, assignedToId |
| **Deal** | `deals` | id, organizationId, title, contactId, value, stage, priority, expectedCloseDate, closeReason, assignedToId |
| **Activity** | `activities` | id, organizationId, type (call/email/meeting/note/task), subject, description, contactId, dealId, dueDate, completed |
| **FileEntry** | `file_entries` | id, organizationId, name, mimeType, size, folder, uploadedById |
| **AuditLog** | `audit_logs` | id, organizationId, userId, action, resource, resourceId, metadata (JSON), ipAddress |

### Key Patterns

- **Multi-tenancy**: All data models include `organizationId` with every query scoped to the requesting org.
- **RBAC**: Permissions are stored per-organization. Roles link to permissions via a join table. JWT carries `userId` + `roleId`; permissions are loaded live from the DB on each request.
- **Cascade deletes**: All child models cascade-delete when their organization is deleted.

---

## RBAC System

### Roles

| Role | Permissions | Can Invite |
|---|---|---|
| **Owner** | 18 (all) | Admin, Manager, Rep, Marketing, Support |
| **Admin** | 16 | Manager, Rep, Marketing, Support |
| **Sales Manager** | 12 | Sales Rep |
| **Sales Rep** | 10 | — |
| **Marketing** | 8 | — |
| **Support** | 6 | — |

### Permission Strings

`contact.create`, `contact.read`, `contact.update`, `contact.delete`, `contact.import`, `deal.create`, `deal.read`, `deal.update`, `deal.delete`, `activity.create`, `activity.read`, `activity.update`, `activity.delete`, `user.invite`, `user.read`, `user.update`, `user.remove`, `org.settings`, `org.delete`, `pipeline.manage`, `reports.view`, `billing.manage`, `audit.view`

---

## Available Scripts

### Backend

| Script | Command | Purpose |
|---|---|---|
| `dev` | `nodemon src/server.ts` | Development server with hot reload |
| `build` | `tsc` | Compile TypeScript → JavaScript |
| `start` | `node dist/server.js` | Production server |
| `test` | `jest --runInBand` | Run test suite |
| `prisma:migrate` | `prisma migrate dev` | Run pending migrations |
| `prisma:seed` | `ts-node prisma/seed.ts` | Seed demo data |
| `verify` | `ts-node src/scripts/verify-api.ts` | Verify all API endpoints |

### Frontend

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev` | Development server with Turbopack |
| `build` | `next build` | Production build |
| `start` | `next start` | Production server |
| `lint` | `eslint .` | Run ESLint |

---

## Authentication Flow

1. **Register** → creates org + owner account, returns JWT
2. **Login** → validates credentials, returns JWT (24h expiry)
3. **JWT in localStorage** (`auth_token`), sent as `Authorization: Bearer <token>`
4. **Permissions loaded live** from DB on every request (never cached in JWT)
5. **401 handling** → `apiFetch` dispatches `auth:unauthorized` event → AuthContext logs out → toast notification
6. **Password reset** → 6-digit PIN sent via Brevo email → verify PIN → set new password

---

## Architecture

```
Browser
   │
   ├── Next.js (Frontend) ──── apiFetch() ──── Express (Backend) ──── Prisma ──── PostgreSQL
   │    :3000                         │           :5000
   │                                  │
   │                            JWT Auth
   │                           + RBAC Guard
   │
   └── Spline 3D (Landing page)
       (loaded dynamically, SSR disabled)
```

### Request Lifecycle

1. Frontend calls `apiFetch('/contacts')`
2. `apiFetch` reads `auth_token` from localStorage, attaches `Authorization: Bearer`
3. Express receives request → `authenticate` middleware verifies JWT
4. `authenticate` loads user + permissions from DB, attaches to `req`
5. Route handler (e.g., `requirePermission('contact.read')`) checks permission
6. Controller calls service → Prisma query (scoped to `organizationId` from JWT)
7. Response formatted via `sendSuccess(data)` → returned to frontend

---

## Deployment

### Backend → Render

1. Push to GitHub
2. Create a Web Service on [render.com](https://render.com) from `backend/`
3. Set build command: `npm install && npm run build && npx prisma generate`
4. Set start command: `npx prisma migrate deploy && node dist/server.js`
5. Add environment variables (`DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, etc.)
6. Create a PostgreSQL database in Render, link to service

### Frontend → Vercel

1. Push to GitHub
2. Create a project on [vercel.com](https://vercel.com) from `frontend/`
3. Set framework: Next.js
4. Add env var: `NEXT_PUBLIC_API_URL` = your Render backend URL
5. Update backend's `FRONTEND_URL` and `CORS_ORIGIN` to your Vercel URL

See `DEPLOYMENT.md` for full step-by-step instructions.

---

## Testing

The backend includes 9 property-based tests using Jest + fast-check:

- bcrypt cost factor validation
- Email uniqueness enforcement
- Invitation expiry handling
- JWT payload structure
- Single-owner constraint
- Registration atomicity
- Role hierarchy enforcement
- Setup-complete gate
- Tenant isolation
- Token non-replayability

```bash
cd backend
npm test
```
