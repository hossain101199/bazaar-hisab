# Docker Production Setup

এই file এ **production** Docker setup বোঝানো হয়েছে।
Development এর সাথে তুলনা করতে করতে পড়লে পার্থক্যগুলো বোঝা সহজ হবে।

তিনটা file:
- `backend/Dockerfile` (production)
- `frontend/Dockerfile` (production)
- `docker-compose.prod.yml`

---

## Development vs Production

| বিষয় | Development | Production |
|------|-------------|------------|
| কোড কোথায় থাকে | Host থেকে volume mount | Image এর ভেতরে baked in |
| Hot reload আছে? | হ্যাঁ (nodemon/Next.js watcher) | না |
| Build step আছে? | না (TypeScript সরাসরি চলে) | হ্যাঁ (compile করা হয়) |
| Image size | বড় (devDependencies সহ) | ছোট (multi-stage build) |
| Polling দরকার? | হ্যাঁ (Windows volume issue) | না |
| db port expose? | হ্যাঁ (developer সরাসরি connect করতে পারে) | না |

**Production এর মূলনীতি:**
- কোড বদলালে আবার image build করতে হবে
- Image যতটা সম্ভব ছোট ও নিরাপদ হওয়া চাই
- শুধু চলার জন্য যা দরকার তাই থাকবে, development tool নয়

---

## Multi-Stage Build

Production Dockerfile এ **multi-stage build** ব্যবহার করা হয়েছে।
Development এ এটা ছিল না।

**ধারণাটা:**
```
Stage 1 (builder):  সব কিছু install করো, compile করো
                          ↓
Stage 2 (runner):   শুধু compiled output copy করো, বাকি ফেলে দাও
```

**কেন দরকার:**
TypeScript compile করতে `typescript`, `ts-node`, `@types/*` দরকার।
কিন্তু compiled JavaScript চালাতে এগুলো লাগে না।
এগুলো final image এ রাখলে image বড় হয় এবং attack surface বাড়ে।
Multi-stage build দিয়ে build-time dependency গুলো final image এ আসে না।

---

## backend/Dockerfile (Production)

```dockerfile
# Stage 1: build
FROM node:22-alpine AS builder
WORKDIR /app
```
**`node:22-alpine`:** Production এ Node 22 ব্যবহার করা হয়েছে (dev এ 20 ছিল)।
LTS version, আরো stable এবং security update পাবে।
**`AS builder`:** এই stage এর নাম `builder`। পরে এখান থেকে file copy করতে নাম লাগবে।

---

```dockerfile
COPY package*.json ./
RUN npm install
```
Development এর মতোই। আগে dependencies, cache এর জন্য।
এখানে `npm install` করা হচ্ছে কারণ build করতে devDependencies দরকার (`typescript` compiler)।

---

```dockerfile
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate
```
Prisma client generate। Development এ `npm run db:generate` ছিল।
Production এ সরাসরি `npx prisma generate`, কাজ একই।

---

```dockerfile
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
```
**কী করে:** TypeScript source copy করে `tsc` compiler চালায়।
`npm run build` মানে `tsc`, যেটা `src/` ফোল্ডারের `.ts` files থেকে `dist/` ফোল্ডারে `.js` files তৈরি করে।

**কেন development এ এটা নেই:** Dev এ `nodemon` + `ts-node` সরাসরি TypeScript চালায়।
Production এ runtime এ compile করা ঠিক না। সময় বেশি লাগে, ভুল হওয়ার সম্ভাবনা বেশি।
আগেই compile করা থাকলে production server শুধু plain JavaScript চালায়।

---

```dockerfile
# Stage 2: run
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
```
**নতুন `FROM`:** এখানে একটা পরিষ্কার নতুন image শুরু হলো।
`builder` stage এর সব কিছু এখানে নেই। শুধু যা copy করা হবে তাই আসবে।
**`ENV NODE_ENV=production`:** অনেক library এই variable দেখে behavior বদলায়।
যেমন Express এ error details কম দেখায়, React এ production optimizations চালু হয়।

---

```dockerfile
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
```
**`--from=builder`:** `builder` stage থেকে file নিয়ে আসছে।

**কেন `node_modules` copy করছে, আবার install করছে না:**
`npm install` করলে devDependencies ও আসবে। Production এ দরকার নেই।
Builder এ আগেই install হয়েছে, সেখান থেকে নিয়ে আসা সহজ।

**`prisma.config.ts` কেন:** `prisma migrate deploy` চালাতে লাগবে।

**কী আসেনি:** `src/` (TypeScript source), `tsconfig.json`, devDependencies (`typescript`, `nodemon`, `ts-node`)।
এগুলো production এ দরকার নেই।

---

```dockerfile
EXPOSE 4000

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/index.js"]
```
**`prisma migrate deploy`:** Production migration command।
Dev এ ছিল `prisma migrate dev`, সেটা নতুন migration তৈরিও করতে পারে।
`migrate deploy` শুধু pending migration apply করে, নতুন তৈরি করে না। Production এ এটাই নিরাপদ।

**`node dist/index.js`:** Compiled JavaScript সরাসরি Node.js দিয়ে চালানো।
Dev এ ছিল `nodemon`। এখানে plain `node`।
Hot reload দরকার নেই, শুধু app চলুক।

---

## frontend/Dockerfile (Production)

```dockerfile
# Stage 1: build
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
```
সব file copy করা হচ্ছে। Next.js build করতে পুরো project দরকার।
Dev Dockerfile এ `COPY . .` ছিল না কারণ source code volume mount হতো।

---

```dockerfile
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
```
**`ARG`:** Build-time argument। `docker build --build-arg` দিয়ে pass করা যায়।
**`NEXT_PUBLIC_API_URL` কেন এভাবে:**

`NEXT_PUBLIC_` prefix দেওয়া Next.js variable গুলো browser এ যায়।
Browser code server এ runtime এ চলে না। এগুলো build করার সময় JavaScript bundle এ **bake** হয়ে যায়।
তাই runtime env variable দিয়ে বদলানো যায় না।
Build করার সময় পাঠাতে হয়, তাই `ARG` দরকার।

**মানে:** যদি production server এর URL বদলায়, শুধু `.env` বদলালে হবে না।
আবার `docker compose up --build` করতে হবে।

---

```dockerfile
RUN npm run build
```
`next build` চালায়। Next.js পুরো app optimize করে static/server bundle বানায়।
এই step এ `NEXT_PUBLIC_API_URL` bundle এ embed হয়ে যায়।

---

```dockerfile
# Stage 2: run
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
```
**`HOSTNAME=0.0.0.0`:** Dev এ `CMD` এ `--hostname 0.0.0.0` দেওয়া হয়েছিল।
Production এ Next.js standalone server environment variable থেকে পড়ে।
কারণ একই। Container এর বাইরে থেকে accessible হওয়ার জন্য।

---

```dockerfile
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
```
**`standalone`:** Next.js এর `output: 'standalone'` mode।
`next build` করলে `.next/standalone/` এ একটা minimized server তৈরি হয়।
এতে শুধু দরকারী `node_modules` আসে, পুরো `node_modules` folder না।
তাই final image অনেক ছোট।

**দুটো folder কেন:**
- `standalone/` : server code এবং minimal dependencies
- `.next/static/` : CSS, JS chunks, images (browser এ directly serve হয়)

Static files `standalone/` এর ভেতরে automatically থাকে না, তাই আলাদা copy করতে হয়।

---

```dockerfile
EXPOSE 3000

CMD ["node", "server.js"]
```
**`server.js`:** Next.js standalone build এ root এ একটা `server.js` তৈরি হয়।
এটা plain Node.js দিয়ে চালানো যায়, `next start` দরকার নেই।
Dev এ ছিল `next dev`, এখানে plain `node server.js`।

---

## docker-compose.prod.yml

### db service

```yaml
db:
  image: postgres:16-alpine
  restart: unless-stopped
  environment:
    ...
  volumes:
    - db_data:/var/lib/postgresql/data
  healthcheck:
    ...
```

**যা নেই:** `ports: - "5432:5432"`

**কেন নেই:** Production এ database port host এ expose করা নিরাপদ না।
কেউ সরাসরি database এ connect করতে পারবে না।
Backend container internal network দিয়ে `db:5432` এ পৌঁছাতে পারে, সেটাই যথেষ্ট।

---

### backend service

```yaml
  build:
    context: ./backend
    dockerfile: Dockerfile      # Dockerfile.dev না
  environment:
    NODE_ENV: production         # development না
    ...
    # CHOKIDAR_USEPOLLING নেই
  ports:
    - "${PORT}:${PORT}"
  # volumes নেই
```

**`dockerfile: Dockerfile`:** Production Dockerfile। Multi-stage, compiled।

**`NODE_ENV: production`:** অনেক কিছু বদলায়:
- Express error handler stack trace দেখায় না
- Less verbose logging
- Libraries নিজেই optimize হয়

**`CHOKIDAR_USEPOLLING` নেই:** Hot reload দরকার নেই, তাই file polling দরকার নেই।

**`volumes` নেই:** এটাই সবচেয়ে বড় পার্থক্য।
Production এ code image এর ভেতরে baked। Host folder mount হয় না।
কোড বদলাতে হলে আবার `--build` করতে হবে।

---

### frontend service

```yaml
  build:
    context: ./frontend
    dockerfile: Dockerfile     # Dockerfile.dev না
    args:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
  ports:
    - "3000:3000"
  # volumes নেই
  # environment নেই (WATCHPACK_POLLING নেই)
```

**`args: NEXT_PUBLIC_API_URL`:** Build সময় API URL pass করা হচ্ছে।
Dev এ `environment` এ দেওয়া হয়েছিল, কারণ dev server runtime এ পড়তে পারে।
Production এ build-time `ARG` লাগে, bundle এ bake হওয়ার জন্য।

**`WATCHPACK_POLLING` নেই:** Hot reload নেই, তাই polling নেই।

**`volumes` নেই:** Code image এ baked।

---

## পুরো Production Flow

```
docker compose -f docker-compose.prod.yml up --build
        │
        ├─ backend image build (Dockerfile)
        │    ├─ Stage 1 (builder):
        │    │    ├─ npm install (সব dependencies)
        │    │    ├─ prisma generate
        │    │    └─ tsc → dist/
        │    └─ Stage 2 (runner):
        │         ├─ নতুন clean image
        │         ├─ node_modules copy (builder থেকে)
        │         ├─ dist/ copy
        │         └─ prisma copy
        │
        ├─ frontend image build (Dockerfile)
        │    ├─ Stage 1 (builder):
        │    │    ├─ npm install
        │    │    ├─ NEXT_PUBLIC_API_URL bake করা হলো
        │    │    └─ next build → .next/
        │    └─ Stage 2 (runner):
        │         ├─ নতুন clean image
        │         ├─ .next/standalone copy
        │         └─ .next/static copy
        │
        ├─ db container উঠল, healthcheck pass
        ├─ backend উঠল → prisma migrate deploy → node dist/index.js → healthcheck pass
        └─ frontend উঠল → node server.js
```

---

## কমান্ড

```bash
# প্রথমবার বা code বদলালে
docker compose -f docker-compose.prod.yml up --build

# পরের বার (image আগেই আছে)
docker compose -f docker-compose.prod.yml up

# background এ চালু রাখো
docker compose -f docker-compose.prod.yml up -d

# বন্ধ করো
docker compose -f docker-compose.prod.yml down

# সব data মুছো
docker compose -f docker-compose.prod.yml down -v
```

---

## Quick Reference

| | Development | Production |
|--|-------------|------------|
| **Dockerfile** | `Dockerfile.dev` | `Dockerfile` |
| **Build stages** | একটা stage | দুটো stage (builder + runner) |
| **TypeScript** | Runtime compile (ts-node) | Build-time compile (tsc → dist/) |
| **Hot reload** | হ্যাঁ | না |
| **Volume mount** | হ্যাঁ (code sync) | না (code baked) |
| **node_modules** | Named volume (Windows compat) | Image এ included |
| **Polling** | হ্যাঁ (Windows file events) | না |
| **DB port expose** | হ্যাঁ (developer access) | না (security) |
| **DB migration** | `migrate dev` (নতুন তৈরি করতে পারে) | `migrate deploy` (শুধু apply) |
| **Next.js start** | `next dev` | `node server.js` (standalone) |
| **NEXT_PUBLIC vars** | Runtime env | Build-time ARG |
| **Image size** | বড় | ছোট (multi-stage এর কারণে) |
