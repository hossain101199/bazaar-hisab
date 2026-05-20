# Developer Guide

এই document এ codebase এর structure, conventions, এবং নতুন feature যোগ করার পদ্ধতি বোঝানো হয়েছে।

---

## Local Development Setup

### Docker দিয়ে (recommended)

```bash
cp .env.example .env
docker compose up --build
```

### Docker ছাড়া

**Prerequisites:** Node.js 20+, PostgreSQL 16+

```bash
# Backend
cd backend
cp .env.example .env        # DATABASE_URL, JWT_SECRET ইত্যাদি সেট করুন
npm install
npm run db:generate
npm run db:dev -- --name init
npm run dev

# Frontend (আলাদা terminal এ)
cd frontend
cp .env.example .env        # NEXT_PUBLIC_API_URL সেট করুন
npm install
npm run dev
```

---

## Project Structure

### Backend

```
backend/src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts    # Request/response handling
│   │   ├── auth.service.ts       # Business logic
│   │   ├── auth.routes.ts        # Express routes + middleware wiring
│   │   └── auth.schema.ts        # Zod validation schemas
│   ├── products/
│   ├── purchases/
│   ├── shops/
│   ├── units/
│   └── admin/
├── middleware/
│   ├── auth.middleware.ts         # JWT verification, req.user সেট করে
│   └── admin.middleware.ts        # ADMIN role check
├── config/
│   └── env.ts                     # Env variable validation (startup এ crash করে যদি missing হয়)
└── utils/
    ├── AppError.ts                # Custom error class (statusCode সহ)
    ├── validate.ts                # Zod schema দিয়ে request validate করার helper
    └── parseId.ts                 # URL param থেকে integer id parse করা
```

**প্রতিটা module এর pattern:**
- `*.routes.ts` - route define করে, middleware লাগায়, controller call করে
- `*.controller.ts` - request parse করে, service call করে, response পাঠায়
- `*.service.ts` - business logic এবং database query
- `*.schema.ts` - Zod validation schema

### Frontend

```
frontend/src/
├── app/
│   ├── (app)/                     # Authenticated routes (layout এ auth guard আছে)
│   │   ├── dashboard/
│   │   ├── purchases/
│   │   ├── products/
│   │   ├── shops/
│   │   ├── units/
│   │   ├── analysis/
│   │   ├── report/
│   │   └── admin/
│   ├── login/
│   └── register/
├── components/
│   ├── ui/                        # Reusable base components (Button, Input, Dialog, ...)
│   ├── purchases/                 # Purchase-specific components
│   ├── products/
│   └── ...
├── services/                      # API call functions (axios)
│   ├── auth.service.ts
│   ├── purchases.service.ts
│   └── ...
├── stores/                        # Zustand global state
└── hooks/                         # Custom React hooks
```

---

## Backend: নতুন Module যোগ করা

ধরুন `categories` নামে একটা নতুন module যোগ করতে হবে।

### 1. Prisma Schema

`backend/prisma/schema.prisma` এ model যোগ করুন:

```prisma
model Category {
  id     Int    @id @default(autoincrement())
  name   String @unique
  userId Int?
  user   User?  @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Migration চালান:

```bash
npm run db:dev -- --name add-categories
```

### 2. Zod Schema

`backend/src/modules/categories/categories.schema.ts`:

```ts
import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
});

export const updateCategorySchema = createCategorySchema.partial();
```

### 3. Service

`backend/src/modules/categories/categories.service.ts`:

```ts
import { prisma } from "../../prisma";

export async function getCategories(userId: number) {
  return prisma.category.findMany({ where: { userId } });
}

export async function createCategory(userId: number, name: string) {
  return prisma.category.create({ data: { name, userId } });
}
```

### 4. Controller

`backend/src/modules/categories/categories.controller.ts`:

```ts
import { Request, Response, NextFunction } from "express";
import * as service from "./categories.service";
import { validate } from "../../utils/validate";
import { createCategorySchema } from "./categories.schema";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await service.getCategories(req.user!.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const body = validate(createCategorySchema, req.body);
    const data = await service.createCategory(req.user!.id, body.name);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}
```

### 5. Routes

`backend/src/modules/categories/categories.routes.ts`:

```ts
import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import * as controller from "./categories.controller";

const router = Router();

router.use(authenticate);

router.get("/", controller.list);
router.post("/", controller.create);

export default router;
```

### 6. Main App এ Register

`backend/src/index.ts` (বা app.ts) এ:

```ts
import categoriesRouter from "./modules/categories/categories.routes";
app.use("/api/categories", categoriesRouter);
```

---

## Frontend: নতুন Page যোগ করা

### 1. Service Function

`frontend/src/services/categories.service.ts`:

```ts
import api from "@/lib/api";

export async function getCategories() {
  const res = await api.get("/categories");
  return res.data;
}

export async function createCategory(name: string) {
  const res = await api.post("/categories", { name });
  return res.data;
}
```

### 2. Page

`frontend/src/app/(app)/categories/page.tsx`:

```tsx
"use client";
import { useQuery } from "@tanstack/react-query";
import { getCategories } from "@/services/categories.service";

export default function CategoriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.map((c: any) => <div key={c.id}>{c.name}</div>)}
    </div>
  );
}
```

---

## Database Migrations

```bash
# নতুন migration তৈরি (schema বদলানোর পরে)
cd backend
npm run db:dev -- --name <migration-name>

# Migration এর নাম কী হবে (উদাহরণ):
# add-categories
# add-familyId-to-refresh-token
# make-shop-address-nullable
```

**Production এ migration apply:**
```bash
# docker এ আপনাআপনি হয় CMD এ। manually করতে:
docker compose -f docker-compose.prod.yml exec backend node_modules/.bin/prisma migrate deploy
```

---

## Auth Flow

Backend এ দুই ধরনের middleware আছে:

```
authenticate       - JWT access token verify করে, req.user সেট করে
requireAdmin       - authenticate এর পরে ADMIN role check করে
```

Route এ ব্যবহার:

```ts
// যেকোনো logged-in user
router.get("/", authenticate, controller.list);

// শুধু admin
router.post("/system", authenticate, requireAdmin, controller.createSystem);
```

---

## Error Handling

Backend এ `AppError` ব্যবহার করুন:

```ts
import { AppError } from "../../utils/AppError";

// 404
throw new AppError("Category not found", 404);

// 403
throw new AppError("Access denied", 403);
```

`error.middleware.ts` automatically এটা catch করে সঠিক status code সহ response পাঠায়।

---

## Data Model Overview

```
User
├── products[]        (USER-owned বা SYSTEM)
├── units[]           (USER-owned বা SYSTEM)
├── shops[]           (সবসময় USER-owned)
├── purchases[]
└── refreshTokens[]

Purchase
├── items[]           (PurchaseItem)
│   └── product
└── shop?

EntityType (enum)
├── SYSTEM            userId = null, সব user দেখতে পায়, মুছতে পারে না
└── USER              userId = owner, শুধু owner দেখতে এবং মুছতে পারে
```

---

## Conventions

- Backend response সবসময় JSON
- Error response format: `{ message: string }`
- Frontend API call সব `services/` folder এ
- Database query সব `*.service.ts` এ, controller এ সরাসরি Prisma call করা হয় না
- Zod validation সব request এ, `validate()` helper দিয়ে
- Sensitive data (password, token) কখনো response এ পাঠানো হয় না

---

## Useful Commands

```bash
# Database GUI (browser এ খুলবে)
cd backend && npm run db:studio

# Type check
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# Docker logs দেখা
docker compose logs backend
docker compose logs frontend
docker compose logs db

# Container এর ভেতরে ঢোকা
docker compose exec backend sh
docker compose exec db psql -U postgres -d bazaar_hisab
```
