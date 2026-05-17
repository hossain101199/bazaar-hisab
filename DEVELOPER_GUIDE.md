# বাজার হিসাব — Developer Guide

## Project Overview

**বাজার হিসাব** (Bazaar Hisab) is a Bengali-language household grocery expense tracker. It lets family members log market (bazaar) purchases, manage products/units, view spending trends, and generate annual reports.

| Layer      | Tech                                                                                 |
| ---------- | ------------------------------------------------------------------------------------ |
| Frontend   | Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui                            |
| State      | Zustand (auth), TanStack React Query v5 (server data), Formik + Yup (forms)          |
| Backend    | Express 4, TypeScript, Prisma ORM (PostgreSQL)                                       |
| Auth       | JWT (15 min access token, in memory) + opaque refresh token (7 day, httpOnly cookie) |
| Validation | Zod (backend), Yup + custom validators (frontend)                                    |

---

## Repository Layout

```
bazaar-hisab/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database models
│   └── src/
│       ├── config/env.ts          # Startup env validation
│       ├── middleware/
│       │   ├── auth.middleware.ts  # JWT bearer verification
│       │   ├── admin.middleware.ts # ADMIN-only guard
│       │   └── error.middleware.ts # Centralised error → JSON
│       ├── modules/
│       │   ├── auth/               # register / login / refresh / logout / me
│       │   ├── units/              # CRUD + unit conversion
│       │   ├── products/           # CRUD + lastPrice lookup
│       │   ├── purchases/          # CRUD + summary report + price trend
│       │   └── admin/              # List users (ADMIN only)
│       ├── prisma.ts              # Prisma client singleton
│       ├── utils/
│       │   ├── AppError.ts        # Typed error with HTTP status
│       │   ├── parseId.ts         # parsePositiveInt helper
│       │   ├── sanitize.ts        # sanitizeSearch helper
│       │   ├── unitConverter.ts   # Unit conversion math
│       │   └── validate.ts        # validateBody(zodSchema) middleware factory
│       └── index.ts               # Express app entry point
└── frontend/
    └── src/
        ├── app/
        │   ├── (app)/             # Protected route group (AppLayout guard)
        │   │   ├── dashboard/     # Home stats + recent purchases
        │   │   ├── purchases/     # List, new, [id] (view/edit/delete)
        │   │   ├── products/      # List, create, edit, delete
        │   │   ├── units/         # List, create, edit, delete
        │   │   ├── report/        # Annual charts + monthly table
        │   │   └── admin/         # User list (ADMIN only)
        │   ├── login/
        │   └── register/
        ├── components/
        │   ├── layout/AppShell.tsx # Sidebar (desktop) + bottom nav (mobile)
        │   ├── purchases/          # PurchaseForm, ProductSelect
        │   ├── products/           # ProductDialog
        │   └── units/              # UnitDialog
        ├── hooks/useDebounce.ts
        ├── lib/
        │   ├── axios.ts           # Axios instance + refresh interceptor
        │   ├── error-handler.ts   # extractErrorMessage()
        │   ├── response-parser.ts # Runtime response validators
        │   ├── utils.ts           # cn(), formatCurrency()
        │   └── validators.ts      # Pure validation helpers
        ├── providers/QueryProvider.tsx
        ├── services/              # Typed API client modules
        ├── store/auth.store.ts    # Zustand auth state
        └── types/index.ts         # Shared TypeScript types
```

---

## Environment Configuration

### Backend — `backend/.env`

| Variable         | Required | Description                                                               |
| ---------------- | -------- | ------------------------------------------------------------------------- |
| `DATABASE_URL`   | Yes      | PostgreSQL connection string (e.g. `postgresql://user:pass@host:5432/db`) |
| `JWT_SECRET`     | Yes      | Minimum 32 chars. Used for access token signing.                          |
| `BCRYPT_ROUNDS`  | No       | Integer 10–15. Defaults to `10`.                                          |
| `CORS_ORIGIN`    | No       | Frontend origin. Defaults to `http://localhost:3000`.                     |
| `PORT`           | No       | Server port. Defaults to `4000`.                                          |
| `NODE_ENV`       | No       | Set to `production` to make refresh cookie `secure`.                      |
| `ADMIN_EMAIL`    | No       | Bootstrap admin email (created once on first start).                      |
| `ADMIN_PASSWORD` | No       | Bootstrap admin password.                                                 |
| `ADMIN_NAME`     | No       | Bootstrap admin display name.                                             |

### Frontend — `frontend/.env.local`

| Variable              | Required | Description                                      |
| --------------------- | -------- | ------------------------------------------------ |
| `NEXT_PUBLIC_API_URL` | Yes      | Backend base URL (e.g. `http://localhost:4000`). |

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- pnpm / npm / yarn

### Steps

```bash
# 1. Clone and install
cd backend && npm install
cd ../frontend && npm install

# 2. Create backend/.env (see table above)
# Minimum viable:
DATABASE_URL="postgresql://postgres:password@localhost:5432/bazaar_hisab"
JWT_SECRET="your-32-char-or-longer-secret-here"

# 3. Create frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:4000

# 4. Run Prisma migrations
cd backend
npx prisma migrate dev --name init

# 5. Start backend (port 4000)
npm run dev

# 6. Start frontend (port 3000)
cd ../frontend
npm run dev
```

Open `http://localhost:3000` — you will be redirected to `/login`.

If `ADMIN_EMAIL/PASSWORD/NAME` are set, the admin account is created automatically on the first backend start.

### Database

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Create a migration during development
npm run db:dev

# Apply pending migrations in production/CI
npm run db:migrate

# Open Prisma Studio (visual DB browser)
npm run db:studio
```

---
