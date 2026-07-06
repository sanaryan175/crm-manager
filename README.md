<div align="center">
  <h1>🚀 CRM Manager</h1>
  <p>A production-grade, multi-tenant SaaS CRM built with Next.js 16, Express, PostgreSQL, and Prisma.</p>
</div>

---

## ✨ Features

- **🏢 Multi-Tenant Architecture**: Every organization is completely isolated. All data is scoped by `organizationId`.
- **🔐 Enterprise RBAC**: Granular role-based access control with 6 default roles (Owner, Admin, Sales Manager, Sales Rep, Marketing, Support) and 22 specific permissions.
- **📇 CRM Core**: Manage Contacts, Deals, and Activities with ease.
- **📊 Interactive Kanban**: Pipeline board with 7 customizable stages and drag-and-drop tracking.
- **🌍 Multi-Currency & Regional Support**: Support for INR, USD, EUR, GBP, and more, complete with locale-aware formatting.
- **✉️ Team Invitations**: Secure, time-limited team member invites via email.
- **📜 Audit Logs**: Comprehensive history for every significant action (`login`, `create`, `update`, `delete`, etc.).

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router), React 19
- **Language**: TypeScript
- **Styling & Animation**: Tailwind CSS v4, Framer Motion, tw-animate-css
- **Components**: Base UI, Shadcn, @dnd-kit (Drag and Drop)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Forms & Validation**: React Hook Form, Zod

### Backend
- **Framework**: Express.js, Node.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma v5
- **Auth & Security**: JWT (jsonwebtoken), bcryptjs, CORS
- **Validation**: Zod
- **Testing**: Jest, Supertest

---

## 📂 Project Structure

```text
crm-manager/
├── backend/                        # Express API
│   ├── prisma/                     # Database schema & seeders
│   └── src/                        
│       ├── controllers/            # Request handlers
│       ├── middleware/             # Auth, Validation & Error handling
│       ├── rbac/                   # Roles & Permissions definitions
│       ├── routes/                 # Express route definitions
│       ├── scripts/                # Utility scripts
│       ├── services/               # Core business logic
│       └── validations/            # Zod validation schemas
│
└── frontend/                       # Next.js App
    ├── app/                        # Next.js App Router (Pages & Layouts)
    ├── components/                 # Reusable UI & Feature components
    │   ├── dashboard/              # Analytics & metrics
    │   ├── deals/                  # Kanban board
    │   ├── ui/                     # Shared base components
    │   └── ...                     
    └── lib/                        # Utilities, Hooks, Contexts & Types
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+ (v24 recommended for frontend)
- **Database**: PostgreSQL 14+
- **PNPM/NPM**: Ensure your package manager is ready.

Create the database locally:
```sql
CREATE DATABASE crm_manager;
```

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

Run migrations and seed the database with demo data:
```bash
npm run prisma:migrate
npm run prisma:seed
```

Start the backend server:
```bash
npm run dev
```
*API runs on http://localhost:5000*

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Configure `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start the frontend development server:
```bash
npm run dev
```
*App runs on http://localhost:3000*

---

## 🔑 Demo Accounts

Use these pre-seeded accounts to explore the app (Password for all: `password123`):

| Email | Role |
| :--- | :--- |
| `sarah@company.com` | **Owner** (Full access) |
| `marcus@company.com` | **Admin** |
| `emily@company.com` | **Sales Manager** |
| `david@company.com` | **Sales Rep** |

---

## 📚 API Reference (Highlights)

All endpoints are prefixed with `/api`.

- **Auth**: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`
- **Contacts**: `/api/contacts` (GET, POST, PUT, DELETE, BULK)
- **Deals**: `/api/deals` (GET, POST, PUT, DELETE, STAGE UPDATE)
- **Activities**: `/api/activities` (GET, POST, PUT, DELETE)
- **Organization**: `/api/organization`, `/api/organization/roles`, `/api/organization/audit`
- **Users & Invites**: `/api/users`, `/api/invitations`

---

## 🏗️ Database Schema Overview

- **`organizations`**: Company settings, region, currency.
- **`roles` / `permissions`**: RBAC configurations mapping.
- **`users`**: Organization members.
- **`invitations`**: Secure invite tokens.
- **`contacts`**: Customer database (scoped to org).
- **`deals`**: Sales pipeline (scoped to org).
- **`activities`**: Calls, emails, meetings, etc.
- **`audit_logs`**: History tracking.

---

## 💡 Pro Tips
- If port `5000` gets stuck on Windows, run this in PowerShell to free it:
  ```powershell
  Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
  ```
