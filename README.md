# বাজার হিসাব

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

বাড়ির বাজার খরচ ট্র্যাক করার web application। কোন দোকান থেকে কী কিনলেন, কত খরচ হলো, সময়ের সাথে কীভাবে পরিবর্তিত হচ্ছে তার হিসাব রাখে।

---

## Tech Stack

| স্তর | Technology |
|------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, TanStack Query |
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Database | PostgreSQL |
| Auth | JWT (access token + refresh token rotation) |
| Container | Docker, Docker Compose |

---

## Features

- Purchase entry: তারিখ, দোকান, পণ্য, পরিমাণ, দাম
- Product management: system-wide এবং user-specific পণ্য
- Unit management: ওজন, আয়তন, সংখ্যা ভিত্তিক একক
- Shop tracking: দোকানভিত্তিক খরচ বিশ্লেষণ
- Analysis page: top products, shop-wise report
- Role-based access: USER এবং ADMIN
- JWT auth: access token + refresh token rotation, secure HTTP-only cookie

---

## Prerequisites

- [Docker](https://www.docker.com/get-started) এবং Docker Compose

Docker ছাড়া চালাতে হলে:
- Node.js 20+
- PostgreSQL 16+

---

## Quick Start (Docker)

**1. Repository clone করুন**

```bash
git clone <repo-url>
cd bazaar-hisab
```

**2. Environment file তৈরি করুন**

```bash
cp .env.example .env
```

`.env` file খুলে values পরিবর্তন করুন (অন্তত `JWT_SECRET` বদলান)।

**3. Development server চালু করুন**

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Database: `localhost:5432`

প্রথমবার চালু হলে admin account automatically তৈরি হবে `.env` এর `ADMIN_EMAIL` / `ADMIN_PASSWORD` দিয়ে।

---

## Environment Variables

`.env.example` দেখুন। প্রয়োজনীয় variables:

| Variable | বিবরণ |
|----------|-------|
| `POSTGRES_DB` | Database নাম |
| `POSTGRES_USER` | Database user |
| `POSTGRES_PASSWORD` | Database password |
| `JWT_SECRET` | JWT signing secret (minimum 32 character) |
| `CORS_ORIGIN` | Frontend URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_API_URL` | Backend API URL (e.g. `http://localhost:4000`) |
| `ADMIN_EMAIL` | Initial admin account email |
| `ADMIN_PASSWORD` | Initial admin account password |
| `BCRYPT_ROUNDS` | Password hashing rounds (default: 10) |
| `PORT` | Backend server port (default: 4000) |

**Production এ অবশ্যই বদলাতে হবে:**
- `JWT_SECRET`: random 64-character string
- `ADMIN_PASSWORD`: strong password
- `CORS_ORIGIN`: production frontend URL
- `NEXT_PUBLIC_API_URL`: production backend URL

---

## Project Structure

```
bazaar-hisab/
├── backend/
│   ├── src/
│   │   ├── modules/          # Feature modules (auth, products, purchases, ...)
│   │   ├── middleware/        # Express middleware
│   │   ├── config/            # Env config, app setup
│   │   └── utils/             # Shared utilities
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── migrations/        # Migration files
│   ├── Dockerfile             # Production
│   └── Dockerfile.dev         # Development
│
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js App Router pages
│   │   ├── components/        # React components
│   │   ├── services/          # API call functions
│   │   ├── stores/            # Zustand state
│   │   └── hooks/             # Custom React hooks
│   ├── Dockerfile             # Production
│   └── Dockerfile.dev         # Development
│
├── docker-compose.yml         # Development compose
├── docker-compose.prod.yml    # Production compose
└── .env.example               # Environment template
```

---

## Production Deploy

বিস্তারিত [DOCKER_PRODUCTION.md](DOCKER_PRODUCTION.md) এ আছে।

```bash
cp .env.example .env
# .env এ production values দিন

docker compose -f docker-compose.prod.yml up --build -d
```

---

## Developer Guide

নতুন feature যোগ করা বা codebase বোঝার জন্য [CONTRIBUTING.md](CONTRIBUTING.md) দেখুন।
