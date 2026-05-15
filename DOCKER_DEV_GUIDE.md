# Docker Development Guide — Bazaar Hisab

> **শুধুমাত্র Development এর জন্য।** Production setup আলাদাভাবে করা হবে।

---

## ফাইল Structure

```
bazaar-hisab/
├── docker-compose.yml        ← তিনটি service একসাথে চালায়
├── .env.example              ← environment variable এর template
├── .env                      ← তোমার local values (git এ যাবে না)
├── .gitignore                ← root এর .env ignore করে
├── backend/
│   ├── Dockerfile.dev        ← backend এর dev image
│   └── .dockerignore         ← build এ কোন files যাবে না
└── frontend/
    ├── Dockerfile.dev        ← frontend এর dev image
    └── .dockerignore
```

---

## Quick Start

### প্রথমবার

```bash
# ১. .env তৈরি করো
cp .env.example .env
# .env খুলে JWT_SECRET, ADMIN_PASSWORD বদলাও

# ২. চালু করো
docker compose up --build
```

### পরেরবার

```bash
docker compose up
```

### বন্ধ করা

```bash
docker compose down       # বন্ধ করো, data থাকে
docker compose down -v    # বন্ধ করো, সব data মুছে দাও
```

চালু হলে:
- Frontend → http://localhost:3000
- Backend API → http://localhost:4000
- Admin auto-তৈরি হবে (bootstrapAdmin)

---

## docker-compose.yml — Line by Line

### Service ১: Database (PostgreSQL)

```yaml
db:
  image: postgres:16-alpine
```
`image:` মানে নিজে build করছি না, Docker Hub থেকে ready-made image নামাচ্ছি।
`postgres:16-alpine` — PostgreSQL 16, Alpine Linux (ছোট size)।

```yaml
  restart: unless-stopped
```
Container crash করলে Docker auto restart করবে। তুমি নিজে `docker compose down` করলে বন্ধ থাকবে।

```yaml
  environment:
    POSTGRES_DB: ${POSTGRES_DB}
    POSTGRES_USER: ${POSTGRES_USER}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```
Root এর `.env` ফাইল থেকে values আসে। Docker Compose স্বয়ংক্রিয়ভাবে `.env` পড়ে।
`DATABASE_URL` এ এই values ব্যবহার হয়।

```yaml
  volumes:
    - db_data:/var/lib/postgresql/data
```
Database এর data `/var/lib/postgresql/data` এ থাকে। `db_data` নামের volume এ persist করছি।
`docker compose down` করলেও data থাকে। শুধু `docker compose down -v` করলে মুছে যায়।

```yaml
  ports:
    - "5432:5432"
```
`host_port:container_port` — তোমার laptop থেকে `localhost:5432` দিয়ে Prisma Studio বা pgAdmin এ database দেখতে পারবে।

```yaml
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U $POSTGRES_USER"]
    interval: 5s
    timeout: 5s
    retries: 5
```
প্রতি ৫ সেকেন্ডে check করে database ready কিনা।
Backend এ `depends_on: condition: service_healthy` আছে — এই healthcheck pass না করলে backend start হয় না।
এটা না থাকলে backend আগে উঠে যেত, database connect হত না।

---

### Service ২: Backend (Express + Prisma)

```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile.dev
```
`context: ./backend` — `backend/` folder টাকে build এর root ধরবে।
`dockerfile: Dockerfile.dev` — ওই folder এর `Dockerfile.dev` দিয়ে image build করবে।

```yaml
  environment:
    NODE_ENV: development
    DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
```
`NODE_ENV: development` — Express সহ অনেক package এটা দেখে dev/prod behavior ঠিক করে।

`@db:5432` — এখানে `db` হল উপরে define করা service এর নাম।
Docker internal network এ প্রতিটি service কে তার নাম দিয়ে reach করা যায়।
`localhost` লিখলে কাজ করত না — container এর নিজের `localhost` মানে সে নিজেই।

```yaml
    JWT_SECRET: ${JWT_SECRET}
```
`.env` থেকে আসে। সরাসরি লেখা নেই — git এ secret যাবে না।

```yaml
    CHOKIDAR_USEPOLLING: "true"
```
Windows এ Docker এর সাথে nodemon hot reload কাজ না করার সমস্যা আছে।
এই variable দিলে nodemon filesystem poll করে — file change ধরতে পারে।

```yaml
  volumes:
    - ./backend:/app
    - backend_node_modules:/app/node_modules
```
**লাইন ১:** `./backend` folder → container এর `/app`।
তুমি VS Code এ file save করলে container এ সাথে সাথে দেখা যায় — এটাই hot reload এর মূল।

**লাইন ২:** `node_modules` আলাদা named volume এ।
কারণ: লাইন ১ এ পুরো `./backend` mount করলে তোমার local `node_modules` ও container এ ঢুকে যাবে।
Local `node_modules` Windows এ compiled, container Linux — এগুলো compatible নয়।
Named volume টা container এর নিজের `node_modules` রাখে, local এর সাথে মেশে না।

```yaml
  healthcheck:
    test: ["CMD-SHELL", "wget -qO- http://localhost:$PORT/ || exit 1"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 30s
```
প্রতি ১০ সেকেন্ডে check করে backend API ready কিনা।
`start_period: 30s` — migration ও server start এর সময় দেওয়া হচ্ছে।
Frontend এ `depends_on: condition: service_healthy` আছে — এই healthcheck pass না করলে frontend start হয় না।

```yaml
  depends_on:
    db:
      condition: service_healthy
```
`db` service এর healthcheck pass না করা পর্যন্ত backend start হবে না।

---

### Service ৩: Frontend (Next.js)

```yaml
  environment:
    NEXT_PUBLIC_API_URL: http://localhost:${PORT}
    WATCHPACK_POLLING: "true"
```
`NEXT_PUBLIC_API_URL` — browser থেকে API call যায়, তাই `localhost:PORT` (container নাম নয়)।
`WATCHPACK_POLLING` — Windows এ Next.js hot reload এর জন্য, `CHOKIDAR_USEPOLLING` এর মতো একই কারণ।

```yaml
  volumes:
    - ./frontend:/app
    - frontend_node_modules:/app/node_modules
```
Backend এর মতো একই কারণে।

```yaml
  depends_on:
    backend:
      condition: service_healthy
```
Backend এর healthcheck pass না করা পর্যন্ত frontend start হবে না।
এতে service গুলো সঠিক ক্রমে উঠে: `db → backend → frontend`।

---

### Named Volumes

```yaml
volumes:
  db_data:
  backend_node_modules:
  frontend_node_modules:
```
এই তিনটি named volume Docker manage করে।
`docker volume ls` দিয়ে দেখা যাবে।
`docker compose down` করলে থাকে। `-v` flag দিলে মুছে যায়।

**Named volume vs Anonymous volume:**
```yaml
# Anonymous — compose down এ মুছে যায়
- /app/node_modules

# Named (আমরা ব্যবহার করছি) — compose down এ থাকে, পরের up এ reinstall লাগে না
- backend_node_modules:/app/node_modules
```

---

## backend/Dockerfile.dev — Line by Line

```dockerfile
FROM node:20-alpine
```
Base image। Node.js 20, Alpine Linux।
Node 20 কারণ `package.json` এ `@types/node: ^20` আছে — match করা দরকার।

```dockerfile
WORKDIR /app
```
Container এর ভেতরে `/app` folder এ কাজ হবে। এর পরের সব COPY/RUN এই folder এ।

```dockerfile
COPY package*.json ./
RUN npm install
```
**আগে শুধু `package.json` copy করি, source code নয়।**
কারণ: Docker layer cache — `package.json` না বদলালে `npm install` আবার চলবে না, build fast হয়।

`npm install` ব্যবহার করছি কারণ lock file গুলো এখনো নির্ভরযোগ্য নয়।
`npm ci` strict — `package.json` ও `package-lock.json` exact match না হলে error দেয়।

> **`npm ci` তে switch করতে চাইলে:**
> 1. `backend/node_modules` ও `backend/package-lock.json` delete করো
> 2. `frontend/node_modules` ও `frontend/package-lock.json` delete করো
> 3. দুটো directory তে আলাদাভাবে `npm install` চালাও (fresh lock file তৈরি হবে)
> 4. দুটো Dockerfile এ `npm install` → `npm ci` বদলাও
> 5. `docker compose build --no-cache` দিয়ে rebuild করো

```dockerfile
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm run db:generate
```
Prisma schema ও config copy করে client generate করি।
`prisma.config.ts` — Prisma 7.x এর primary config, datasource URL এখানে।
`db:generate` build time এ একবার হয় — container start হওয়ার সময় আবার হয় (schema বদলালেও কাজ করে)।

```dockerfile
EXPOSE 4000
```
Documentation — এই container port 4000 ব্যবহার করবে বলে জানাচ্ছে।
Actual port mapping docker-compose এর `ports:` করে, এই line নয়।

```dockerfile
CMD ["sh", "-c", "npm run db:generate && npm run db:dev -- --name auto && npm run dev"]
```
Container উঠলে তিনটো কাজ:
1. `db:generate` — volume mount এর পর schema থেকে fresh Prisma Client তৈরি করে
2. `db:dev -- --name auto` — migration তৈরি ও database এ apply করে (`--name auto` দিলে interactive prompt আসে না)
3. `dev` — nodemon দিয়ে TypeScript server চালু করে

> **কেন `db:push` নয়?** `prisma db push` migration file তৈরি করে না — শুধু schema apply করে।
> `prisma migrate dev` migration file তৈরি করে git এ track করা যায়, team এ কাজ করা যায়, production এ safely deploy করা যায়।

---

## frontend/Dockerfile.dev — Line by Line

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
```
Backend এর মতো একই কারণে। Lock file sync না থাকায় `npm install` ব্যবহার করছি।

```dockerfile
EXPOSE 3000
```
Next.js dev server port 3000 এ চলে।

```dockerfile
CMD ["node_modules/.bin/next", "dev", "--hostname", "0.0.0.0"]
```
`--hostname 0.0.0.0` — Next.js কে সব network interface এ listen করতে বলছে।
এটা না দিলে Next.js শুধু container এর ভেতরে `127.0.0.1` তে listen করে।
Docker port mapping (`3000:3000`) কাজ করে না, browser এ `localhost:3000` খোলা যায় না।

`npm run dev` ব্যবহার না করে `node_modules/.bin/next` সরাসরি call করছি যাতে `--hostname` flag pass করা যায়।

---

## .dockerignore — কেন দরকার

```
node_modules    ← local node_modules container এ যাবে না
dist            ← compiled output দরকার নেই
.env            ← secrets build context এ যাবে না
.env.local
.git            ← git history দরকার নেই, build slow করে
```

`.dockerignore` না থাকলে `docker compose up --build` এর সময় পুরো folder (সব `node_modules` সহ) Docker daemon এ transfer হয়।
`node_modules` শত শত MB — transfer এ অনেক সময় লাগত।

> **সতর্কতা:** `.dockerignore` এ inline comment কাজ করে না।
> `node_modules  # comment` লিখলে `node_modules` exclude হবে না।
> Comment সবসময় আলাদা line এ `#` দিয়ে শুরু করতে হবে।

---

## Network কিভাবে কাজ করে

```
┌─────────────────────────────────────────────────┐
│           Docker Internal Network               │
│                                                 │
│  db (postgres)      ← backend এখানে connect করে │
│  backend            ← frontend এখানে connect করে│
│  frontend                                       │
│                                                 │
│  প্রতিটি service তার নাম দিয়ে অন্যকে reach করে  │
└─────────────────────────────────────────────────┘
         ↕ ports: mapping
┌─────────────────────────────────────────────────┐
│              তোমার Browser/Laptop               │
│  localhost:3000 → frontend                      │
│  localhost:4000 → backend                       │
│  localhost:5432 → db (Prisma Studio/pgAdmin)    │
└─────────────────────────────────────────────────┘
```

**কেন `DATABASE_URL` এ `db` লেখা হয় `localhost` নয়?**
Container এর নিজের `localhost` মানে সে নিজেই — অন্য container নয়।
Docker network এ `db` লিখলে `db` service এ পৌঁছায়।

**কেন `NEXT_PUBLIC_API_URL` এ `localhost` লেখা হয় `backend` নয়?**
এই variable browser এ ব্যবহার হয়। Browser Docker network এর বাইরে।
Browser `backend:4000` চেনে না, `localhost:4000` চেনে (port mapping এর কারণে)।

---

## Useful Commands

```bash
# চালু করা
docker compose up --build       # প্রথমবার বা Dockerfile বদলালে
docker compose up               # পরেরবার
docker compose up -d            # background এ চালু (terminal block করে না)

# বন্ধ করা
docker compose down             # বন্ধ করো, data থাকে
docker compose down -v          # বন্ধ করো, সব data মুছে দাও

# Logs দেখা
docker compose logs -f          # সব service এর logs
docker compose logs -f backend  # শুধু backend
docker compose logs -f frontend # শুধু frontend

# Container এ ঢোকা (debugging)
docker compose exec backend sh  # backend container এ shell
docker compose exec db psql -U postgres -d bazaar_hisab  # database shell

# Status
docker compose ps               # কোন container চলছে

# Cleanup
docker system prune             # unused images/containers মুছে দাও
```

---

## Common Issues

### "Connection refused" — Backend থেকে Database

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**কারণ:** `DATABASE_URL` এ `localhost` লেখা আছে।
**Fix:** `.env` এ host হিসেবে `db` (service name) ব্যবহার করো — `localhost` নয়:
```
DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
```

---

### Hot reload কাজ করছে না

**কারণ:** Windows এ filesystem events Docker container এ পৌঁছায় না।
**Fix:** docker-compose.yml এ এই variables আছে কিনা check করো:
```yaml
backend:
  environment:
    CHOKIDAR_USEPOLLING: "true"

frontend:
  environment:
    WATCHPACK_POLLING: "true"
```

---

### Port already in use

```
Error: bind: address already in use :::3000
```
**কারণ:** তোমার laptop এ ওই port এ অন্য কিছু চলছে।
**Fix:** local dev server বন্ধ করো অথবা docker-compose এ port বদলাও:
```yaml
ports:
  - "3001:3000"   # laptop এর 3001 → container এর 3000
```

---

### Build cache পুরনো — পরিবর্তন reflect হচ্ছে না

**Fix:** cache ছাড়া fresh build করো:
```bash
docker compose build --no-cache
docker compose up
```
