# CRM Manager

A production-grade, multi-tenant SaaS CRM built with Next.js 16, Express, PostgreSQL, and Prisma. Features enterprise RBAC, team invitations, audit logging, multi-currency support, and a Kanban pipeline.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, Framer Motion, Lucide Icons |
| Charts | Recharts |
| Backend | Express.js, TypeScript, Node.js |
| Database | PostgreSQL |
| ORM | Prisma v5 |
| Auth | JWT (jsonwebtoken) |
| Validation | Zod |
| Password Hashing | bcryptjs |

---

## Project Structure

```
crm-manager/
├── backend/                        # Express API
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema
│   │   └── seed.ts                 # Demo data seeder
│   └── src/
│       ├── rbac/
│       │   └── permissions.ts      # All permissions + role definitions
│       ├── controllers/            # Request handlers (thin layer)
│       │   ├── auth.controller.ts
│       │   ├── contact.controller.ts
│       │   ├── deal.controller.ts
│       │   ├── activity.controller.ts
│       │   ├── dashboard.controller.ts
│       │   ├── organization.controller.ts
│       │   ├── invitation.controller.ts
│       │   └── user.controller.ts
│       ├── services/               # Business logic
│       │   ├── auth.service.ts
│       │   ├── onboarding.service.ts
│       │   ├── contact.service.ts
│       │   ├── deal.service.ts
│       │   ├── activity.service.ts
│       │   ├── dashboard.service.ts
│       │   ├── organization.service.ts
│       │   ├── invitation.service.ts
│       │   └── user.service.ts
│       ├── middleware/
│       │   ├── auth.ts             # authenticate, requirePermission, requireRole
│       │   ├── validate.ts         # Zod request validation
│       │   └── error.ts            # Global error handler
│       ├── routes/                 # Route definitions
│       │   ├── index.ts
│       │   ├── auth.routes.ts
│       │   ├── contact.routes.ts
│       │   ├── deal.routes.ts
│       │   ├── activity.routes.ts
│       │   ├── dashboard.routes.ts
│       │   ├── organization.routes.ts
│       │   ├── invitation.routes.ts
│       │   └── user.routes.ts
│       ├── validations/            # Zod schemas
│       └── utils/
│           ├── jwt.ts
│           ├── errors.ts
│           └── response.ts
│
└── frontend/                       # Next.js App
    ├── app/
    │   ├── login/page.tsx          # Login + Register
    │   ├── dashboard/page.tsx
    │   ├── contacts/page.tsx
    │   ├── deals/page.tsx
    │   ├── activities/page.tsx
    │   └── settings/page.tsx       # Team management + invitations
    ├── components/
    │   ├── layout/                 # Sidebar, TopNav, Toast, RootLayout
    │   ├── dashboard/              # Metrics, Pipeline, QuickStats
    │   ├── deals/                  # KanbanBoard, KanbanColumn
    │   ├── contacts/               # ContactsList
    │   └── ui/                     # Card, Badge, Button, Modal
    └── lib/
        ├── api.ts                  # apiFetch utility
        ├── context.tsx             # Auth, UI, Filter, Region contexts
        ├── hooks.ts                # Data fetching hooks
        ├── types.ts                # TypeScript interfaces
        ├── regions.ts              # Currency + country formatting
        └── rbac.ts                 # INVITE_PERMISSIONS for frontend
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally
- A database named `crm_manager`

Create the database:
```sql
CREATE DATABASE crm_manager;
```

---

### 1. Backend Setup

```bash
cd backend
npm install
```

Configure `backend/.env`:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/crm_manager?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRE="24h"
NODE_ENV="development"
```

Run migration and seed:
```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

Start the server:
```bash
npm run dev
```

Backend runs on **http://localhost:5000**

---

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Configure `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start the dev server:
```bash
npm run dev
```

Frontend runs on **http://localhost:3000**

---

### 3. Login

Open **http://localhost:3000** and log in with the seeded demo account:

| Field    | Value                  |
|----------|------------------------|
| Email    | `sarah@company.com`    |
| Password | `password123`          |
| Role     | Owner (full access)    |

Other seeded accounts (all use `password123`):

| Email                   | Role           |
|-------------------------|----------------|
| `marcus@company.com`    | Admin          |
| `emily@company.com`     | Sales Manager  |
| `david@company.com`     | Sales Rep      |

---

## Features

### CRM Core
- **Contacts** — create, edit, search, filter by status/source, bulk operations
- **Deals** — Kanban pipeline board with 7 stages, stage drag tracking
- **Activities** — calls, emails, meetings, notes, tasks with completion tracking
- **Dashboard** — KPI metrics, pipeline bar chart, recent activities feed

### Multi-Currency & Regional Support
- Organization-level default currency (INR, USD, EUR, GBP, AED, and more)
- Per-deal currency override
- Locale-aware formatting — INR uses ₹5,00,000 (lakh grouping), USD uses $500,000
- Country-aware date formatting

### Multi-Tenant Architecture
- Every organization is completely isolated
- All data is scoped by `organizationId` — no cross-tenant data leakage
- Organization has its own roles, permissions, users, and CRM data

### RBAC — Role-Based Access Control

#### Roles

| Role           | What they can do |
|----------------|-----------------|
| **Owner**      | Everything — billing, delete org, manage all settings |
| **Admin**      | Manage users, all CRM data, settings. Cannot delete org |
| **Sales Manager** | Full CRM access, view all team data and reports |
| **Sales Rep**  | Own contacts, deals, activities only |
| **Marketing**  | Import contacts, view analytics |
| **Support**    | View customers, manage support activities |

#### Permissions (22 total)

```
contact.create   contact.read    contact.update   contact.delete   contact.import
deal.create      deal.read       deal.update      deal.delete
activity.create  activity.read   activity.update  activity.delete
user.invite      user.read       user.update      user.remove
org.settings     org.delete
pipeline.manage  reports.view    billing.manage   audit.view
```

#### How it works
- JWT contains: `userId`, `organizationId`, `roleId`, `roleName`
- On every request, live permissions are loaded from DB (never cached in JWT)
- Role changes take effect on the user's very next request
- Middleware: `requirePermission('deal.create')` on every route

#### Ownership Rules
Sales Reps can only see/edit resources they created or were assigned to. Other roles see all org data.

### Team Invitations
- Owner/Admin can invite new members via email
- Each role can only invite roles below them in the hierarchy
- Invites expire after 72 hours
- Tokens are bcrypt-hashed in the database (raw token only in the email link)
- Pending invites can be revoked

### Audit Logs
Every significant action is recorded:
- `login`, `create`, `update`, `delete`
- `invite_sent`, `invite_accepted`
- `role_changed`, `permission_changed`

Accessible via `GET /api/organization/audit` (owner and admin only).

---

## API Reference

All endpoints are prefixed with `/api`.

### Auth
```
POST   /api/auth/register          Create organization + owner account
POST   /api/auth/login             Login
GET    /api/auth/me                Get current user profile
PATCH  /api/auth/me                Update profile
POST   /api/auth/change-password   Change password
```

### Contacts
```
GET    /api/contacts               List contacts (filtered by role)
POST   /api/contacts               Create contact
GET    /api/contacts/:id           Get contact
PUT    /api/contacts/:id           Update contact
DELETE /api/contacts/:id           Delete contact
POST   /api/contacts/bulk          Bulk assign / tag / delete
```

### Deals
```
GET    /api/deals                  List deals (filtered by role)
POST   /api/deals                  Create deal
GET    /api/deals/:id              Get deal
PUT    /api/deals/:id              Update deal
PUT    /api/deals/:id/stage        Update deal stage only
DELETE /api/deals/:id              Delete deal
```

### Activities
```
GET    /api/activities             List activities
POST   /api/activities             Create activity
GET    /api/activities/:id         Get activity
PUT    /api/activities/:id         Update activity
PUT    /api/activities/:id/complete  Mark complete/incomplete
DELETE /api/activities/:id         Delete activity
```

### Organization
```
GET    /api/organization           Get org settings
PUT    /api/organization           Update org settings (requires org.settings)
GET    /api/organization/roles     List all roles with permissions
GET    /api/organization/audit     Audit log (requires audit.view)
```

### Users
```
GET    /api/users                  List team members
GET    /api/users/:id              Get user
PATCH  /api/users/:id/role         Change user role
DELETE /api/users/:id              Deactivate user
```

### Invitations
```
POST   /api/invitations            Send invitation (requires user.invite)
GET    /api/invitations            List pending invitations
DELETE /api/invitations/:id        Revoke invitation
POST   /api/invitations/accept     Accept invite (public — no auth needed)
```

### Dashboard
```
GET    /api/dashboard/metrics      KPI metrics for current org
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable       | Description                          | Default |
|---------------|--------------------------------------|---------|
| `PORT`         | Server port                          | `5000`  |
| `DATABASE_URL` | PostgreSQL connection string         | —       |
| `JWT_SECRET`   | Secret for signing JWTs              | —       |
| `JWT_EXPIRE`   | Token expiry duration                | `24h`   |
| `NODE_ENV`     | Environment                          | `development` |

### Frontend (`frontend/.env.local`)

| Variable              | Description           | Default |
|----------------------|-----------------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL  | `http://localhost:5000/api` |

---

## Database Schema

```
organizations     — company settings, country, currency, timezone
roles             — per-org roles (owner, admin, sales_manager, sales_rep, marketing, support)
permissions       — per-org permission records (deal.create, contact.read, etc.)
role_permissions  — many-to-many role ↔ permission mapping
users             — org members with role reference
invitations       — pending/accepted/expired/revoked invites with hashed tokens
audit_logs        — full action history per org
contacts          — customer contacts (org-scoped)
deals             — sales deals with stage and currency (org-scoped)
activities        — calls, emails, meetings, notes, tasks (org-scoped)
```

---

## Scripts

### Backend
```bash
npm run dev              # Start dev server with hot reload
npm run build            # Compile TypeScript
npm run start            # Run compiled production build
npm run prisma:migrate   # Run database migrations
npm run prisma:generate  # Regenerate Prisma client
npm run prisma:seed      # Seed demo data
```

### Frontend
```bash
npm run dev     # Start Next.js dev server
npm run build   # Production build
npm run start   # Serve production build
npm run lint    # Run ESLint
```

---

## Kill port 5000 (if needed)

```powershell
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```
