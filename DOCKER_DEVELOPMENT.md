# Docker Development Setup

এই file এ project এর **development** Docker setup বোঝানো হয়েছে।
তিনটা file মিলে কাজ করে:
- `backend/Dockerfile.dev`
- `frontend/Dockerfile.dev`
- `docker-compose.yml`

---

## Docker কী এবং কেন দরকার?

Docker একটা tool যেটা app কে একটা **container** এর ভেতর চালায়।
Container মানে একটা isolated box। এর ভেতরে Node.js, PostgreSQL, সব কিছু নিজের মতো থাকে।

**কেন দরকার:**
- machine এ Node 18 থাকলেও container এ Node 20 চলবে, কোনো conflict নেই
- Team এর সবার machine এ একই environment, তাই "আমার PC তে চলছিল" সমস্যা থাকে না
- `docker compose up` একটা command এ database + backend + frontend সব উঠে যায়

---

## backend/Dockerfile.dev

```dockerfile
FROM node:20-alpine
```
**কী করে:** Docker Hub থেকে `node:20-alpine` image নামিয়ে আনে।
**কেন alpine:** Alpine Linux অনেক ছোট (প্রায় 5MB)। Regular Ubuntu-based image হলে 900MB+ হয়।
এটা base image। এর উপর বাকি সব build হবে।

---

```dockerfile
WORKDIR /app
```
**কী করে:** Container এর ভেতরে `/app` folder কে working directory সেট করে।
এর পরের সব command (`COPY`, `RUN`, `CMD`) এই folder এর ভেতর থেকে চলবে।
**কেন /app:** Convention। যেকোনো নাম দেওয়া যেত, কিন্তু `/app` standard।

---

```dockerfile
COPY package.json package-lock.json ./
RUN npm install
```
**কী করে:** আগে শুধু `package.json` আর `package-lock.json` copy করে, তারপর `npm install` চালায়।
**কেন source code আগে copy করে না:** Docker এর **layer cache** system আছে।
প্রতিটা line একটা layer। Layer পরিবর্তন না হলে Docker cache থেকে নেয়।

`src/` এর কোনো file বদলালে Docker দেখবে `package.json` বদলায়নি,
তাই `npm install` আবার করবে না। সরাসরি cache থেকে `node_modules` নেবে।
এতে পরবর্তী build অনেক দ্রুত হয়।

---

```dockerfile
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm run db:generate
```
**কী করে:** Prisma schema copy করে এবং `prisma generate` চালায়।
**কেন:** `prisma generate` schema দেখে TypeScript client তৈরি করে (`@prisma/client`)।
এটা না চললে backend এর database query code কাজ করবে না।

`prisma.config.ts` হলো Prisma 7.x এর primary config file। generate চালানোর আগে এটা থাকা দরকার।

---

```dockerfile
EXPOSE 4000
```
**কী করে:** Container বলছে "আমি 4000 port ব্যবহার করব"।
**কেন:** এটা মূলত documentation। Actual port mapping হয় `docker-compose.yml` এ।
কিন্তু এটা না লিখলে অন্যরা বুঝবে না কোন port এ server চলে।

---

```dockerfile
CMD ["sh", "-c", "npm run db:generate && npm run db:dev -- --name auto && npm run dev"]
```
**কী করে:** Container start হলে এই command চলে।
তিনটা কাজ পর্যায়ক্রমে:

1. `npm run db:generate` : Prisma client আবার generate করে
   (volume mount এর কারণে `src/` পরিবর্তিত হতে পারে, তাই আবার করা নিরাপদ)

2. `npm run db:dev -- --name auto` মানে `prisma migrate dev --name auto`
   নতুন migration থাকলে database এ apply করে।
   `--name auto` মানে migration এর নাম automatically দেবে।

3. `npm run dev` মানে `nodemon` চালু করে।
   `nodemon` `src/` watch করে। কোনো `.ts` file বদলালে server restart করে।

**কেন CMD আর RUN আলাদা:** `RUN` হয় image build করার সময় (একবার)।
`CMD` হয় container start হওয়ার সময় (প্রতিবার)।

---

## frontend/Dockerfile.dev

```dockerfile
FROM node:20-alpine
WORKDIR /app
```
Backend এর মতোই। Node 20 Alpine image, `/app` working directory।

---

```dockerfile
COPY package.json package-lock.json ./
RUN npm install
```
আগে dependency install করা হয়, layer cache এর জন্য। কারণটা backend এ যা বলা হয়েছে সেটাই।

---

```dockerfile
EXPOSE 3000
```
Next.js development server 3000 port এ চলে।

---

```dockerfile
CMD ["node_modules/.bin/next", "dev", "--hostname", "0.0.0.0"]
```
**কী করে:** Next.js development server চালু করে।
**কেন `--hostname 0.0.0.0`:** এটা না দিলে Next.js container এর ভেতরে `127.0.0.1` (localhost) এ bind করে।
Container এর localhost মানে container নিজেই, browser সেখানে পৌঁছাতে পারে না।
`0.0.0.0` মানে সব network interface, তখন host machine থেকে `localhost:3000` এ access হয়।

---

## docker-compose.yml

`docker-compose.yml` সব service কে একসাথে চালায় এবং তাদের মধ্যে internal network তৈরি করে।

### db service

```yaml
db:
  image: postgres:16-alpine
  restart: unless-stopped
```
**কী করে:** PostgreSQL 16 এর Alpine image ব্যবহার করে।
**`restart: unless-stopped`:** Server restart হলে container automatically উঠবে,
কিন্তু নিজে `docker compose down` করলে উঠবে না।

---

```yaml
  environment:
    POSTGRES_DB: ${POSTGRES_DB}
    POSTGRES_USER: ${POSTGRES_USER}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```
**কী করে:** `.env` file থেকে value নিয়ে PostgreSQL এর initial database, user, password সেট করে।
`${POSTGRES_DB}` মানে `.env` file এর `POSTGRES_DB` variable।
**কেন এভাবে:** Credentials সরাসরি file এ লিখলে Git এ চলে যাবে। `.env` `.gitignore` এ থাকে।

---

```yaml
  volumes:
    - db_data:/var/lib/postgresql/data
```
**কী করে:** PostgreSQL তার data রাখে `/var/lib/postgresql/data` তে।
এটা একটা named volume `db_data` তে mount করা।
**কেন:** Volume না থাকলে `docker compose down` করলেই সব data মুছে যাবে।
Volume Docker এর নিজের জায়গায় থাকে, তাই container মুছে গেলেও data বাঁচে।

---

```yaml
  ports:
    - "5432:5432"
```
**কী করে:** Host machine এর 5432 port কে container এর 5432 port এ forward করে।
Format: `"host_port:container_port"`
**কেন:** host থেকে `psql` বা TablePlus দিয়ে database দেখা যায়।

---

```yaml
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U $POSTGRES_USER"]
    interval: 5s
    timeout: 5s
    retries: 5
```
**কী করে:** প্রতি 5 সেকেন্ডে `pg_isready` চালিয়ে PostgreSQL ready কিনা চেক করে।
**কেন:** Backend যদি database ready হওয়ার আগেই connect করার চেষ্টা করে, crash করবে।
`depends_on` + `condition: service_healthy` দিয়ে backend কে বলা হয়েছে
db healthy না হওয়া পর্যন্ত start করবে না।

---

### backend service

```yaml
  build:
    context: ./backend
    dockerfile: Dockerfile.dev
```
**কী করে:** `./backend` folder থেকে `Dockerfile.dev` দিয়ে image build করে।
`context` মানে Dockerfile এর "root"। COPY command এখান থেকে file খোঁজে।

---

```yaml
  environment:
    NODE_ENV: development
    DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
    ...
    CHOKIDAR_USEPOLLING: "true"
```
**`DATABASE_URL` তে `@db`:** `db` হলো docker-compose এর service name।
Docker compose automatically একটা internal network তৈরি করে যেখানে service name দিয়ে
একে অপরকে পাওয়া যায়। তাই `localhost` না লিখে `db` লেখা হয়েছে।

**`CHOKIDAR_USEPOLLING: "true"`:** Windows এ Docker volume mount এ file change event ঠিকমতো
কাজ করে না। Polling মানে nodemon প্রতি কিছুক্ষণ পর পর নিজেই check করে file বদলেছে কিনা।

---

```yaml
  volumes:
    - ./backend:/app
    - backend_node_modules:/app/node_modules
```
**`./backend:/app`:** Host এর `./backend` folder টা container এর `/app` এ mount।
IDE তে file save করলেই container এর ভেতরে সাথে সাথে বদলে যাবে।
nodemon সেটা দেখে server restart করবে।

**`backend_node_modules:/app/node_modules`:** এটা tricky।
`./backend:/app` mount করলে host এর পুরো folder যায়, Windows এর `node_modules` সহ।
Windows এর `node_modules` Linux container এ কাজ করে না (binary incompatibility)।
তাই `node_modules` এর জন্য আলাদা named volume রাখা হয়েছে।
Named volume host এর folder এর উপর **priority** পায়, ফলে container এর নিজস্ব `node_modules` থাকে।

---

```yaml
  ports:
    - "${PORT}:${PORT}"
  depends_on:
    db:
      condition: service_healthy
```
**`depends_on` + `condition: service_healthy`:** db এর healthcheck pass না হওয়া পর্যন্ত
backend start করবে না। শুধু `depends_on: db` দিলে container start হওয়া মাত্রই backend চলত,
কিন্তু PostgreSQL তখনো ready নাও হতে পারে।

---

### frontend service

```yaml
  environment:
    NEXT_PUBLIC_API_URL: http://localhost:${PORT}
    WATCHPACK_POLLING: "true"
```
**`http://localhost:${PORT}`:** Browser থেকে API call হয়।
Browser container এর বাইরে থাকে, তাই `backend` service name চেনে না।
তাই `localhost` লিখতে হয় (host এর port forwarding দিয়ে পৌঁছায়)।

**`WATCHPACK_POLLING: "true"`:** Next.js এর file watcher এর জন্য।
`CHOKIDAR_USEPOLLING` backend nodemon এর জন্য ছিল, এটা Next.js এর জন্য।

---

```yaml
  volumes:
    - ./frontend:/app
    - frontend_node_modules:/app/node_modules
```
Backend এর মতোই। hot reload এর জন্য host folder mount,
আর Windows compatibility এর জন্য `node_modules` আলাদা volume।

---

```yaml
  depends_on:
    backend:
      condition: service_healthy
```
Backend healthy না হলে frontend start করবে না।

---

### volumes (নিচে)

```yaml
volumes:
  db_data:
  backend_node_modules:
  frontend_node_modules:
```
**কী করে:** এখানে named volume গুলো declare করতে হয়।
Docker এই নামে নিজের জায়গায় volume তৈরি করে রাখে।
`docker compose down -v` দিলে এগুলো মুছে যায়।

---

## পুরো flow একসাথে

```
docker compose up --build
        │
        ├─ db container উঠল
        │    └─ healthcheck: pg_isready চেক করছে...
        │         └─ healthy ✓
        │
        ├─ backend container উঠল (db healthy হওয়ার পর)
        │    ├─ Dockerfile.dev থেকে image build
        │    │    ├─ npm install
        │    │    ├─ prisma generate
        │    │    └─ EXPOSE 4000
        │    ├─ CMD চলল:
        │    │    ├─ prisma generate (আবার)
        │    │    ├─ prisma migrate dev (নতুন migration apply)
        │    │    └─ nodemon start (hot reload চালু)
        │    └─ healthcheck: wget localhost:4000 চেক করছে...
        │         └─ healthy ✓
        │
        └─ frontend container উঠল (backend healthy হওয়ার পর)
             ├─ Dockerfile.dev থেকে image build
             │    └─ npm install
             └─ CMD: next dev --hostname 0.0.0.0
```

---

## কমান্ড

```bash
# প্রথমবার অথবা Dockerfile বদলালে
docker compose up --build

# পরের বার (image আগেই আছে)
docker compose up

# বন্ধ করো, data রাখো
docker compose down

# বন্ধ করো, সব data মুছো (fresh start)
docker compose down -v
```
