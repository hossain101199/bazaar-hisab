# Bazaar Hisab — Production Deployment Guide

> Stack: Next.js 14 (frontend) + Express/TypeScript (backend) + PostgreSQL  
> Method: Full Bare Metal — PM2 + Nginx + System PostgreSQL  
> Prepared for: IP-only deployment (no domain required initially)

---

## বড় ছবি — কীভাবে সব কিছু সংযুক্ত

```
Browser (তোমার বা user এর)
        │
        │  http://YOUR_VPS_IP
        ▼
     Nginx  ← একমাত্র এটাই বাইরে থেকে দেখা যায় (port 80)
        │
        ├── /api/*  ──→  Backend : port 4000  (বাইরে থেকে বন্ধ)
        │                    │
        │               PostgreSQL : port 5432  (বাইরে থেকে বন্ধ)
        │
        └── /*      ──→  Frontend : port 3000  (বাইরে থেকে বন্ধ)
```

- **Nginx** = দারোয়ান। সব traffic এর মধ্য দিয়ে ঢোকে।
- **PM2** = supervisor। backend আর frontend কে চালু রাখে, crash করলে restart করে।
- **PostgreSQL** = database। সরাসরি বাইরে থেকে access করা যায় না।

---

## VPS Requirements

- OS: **Ubuntu 22.04 LTS**
- RAM: **minimum 2GB** (Next.js build এ ~1.5GB লাগে)
- Storage: minimum 20GB

---

## Phase 1 — VPS এ ঢোকো এবং সুরক্ষিত করো

### SSH দিয়ে connect করো

```bash
ssh root@YOUR_VPS_IP
```

### নতুন user বানাও (root দিয়ে সব করা বিপজ্জনক)

```bash
adduser deploy
usermod -aG sudo deploy   # sudo permission দাও
su - deploy               # এখন থেকে এই user দিয়ে কাজ করো
```

**কেন?** Root দিয়ে কাজ করলে ভুলে গুরুত্বপূর্ণ কিছু মুছে ফেলার risk থাকে।
`sudo` দিয়ে কাজ করলে সচেতনভাবে permission নিতে হয়।

---

## Phase 2 — Firewall (UFW)

```bash
sudo ufw default deny incoming    # সব port বন্ধ করো
sudo ufw default allow outgoing   # বের হওয়া allow
sudo ufw allow 22/tcp             # SSH — এটা না দিলে নিজেই আটকে যাবে!
sudo ufw allow 80/tcp             # HTTP
sudo ufw enable
sudo ufw status
```

**কেন port 4000 আর 5432 খুলছি না?**
Backend (4000) আর PostgreSQL (5432) শুধু ভেতরে ভেতরে কথা বলবে।
বাইরে থেকে সরাসরি access করার দরকার নেই — এটাই security।

---

## Phase 3 — Node.js Install (NVM দিয়ে)

```bash
# NVM install করো
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# Terminal reload করো
source ~/.bashrc

# Node.js 20 install করো
nvm install 20
nvm use 20
nvm alias default 20

# Verify করো
node --version   # v20.x.x দেখাবে
npm --version
```

**কেন NVM?** `apt` এ পুরনো Node.js থাকে। NVM দিয়ে সঠিক version রাখা যায়।

---

## Phase 4 — PostgreSQL Install

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# চলছে কিনা দেখো
sudo systemctl status postgresql
```

### Database এবং User বানাও

```bash
# PostgreSQL এর system user এ ঢোকো
sudo -u postgres psql
```

PostgreSQL prompt এ (`postgres=#`):

```sql
CREATE USER bazaar_user WITH PASSWORD 'তোমার_strong_password_এখানে';
CREATE DATABASE bazaar_hisab OWNER bazaar_user;
\q
```

**কেন আলাদা user?** `postgres` (superuser) দিয়ে app চালানো বিপজ্জনক।
`bazaar_user` শুধু `bazaar_hisab` database এ কাজ করতে পারবে।

---

## Phase 5 — PM2 Install

```bash
npm install -g pm2
```

**PM2 কী করে?**
- App crash করলে automatic restart
- Server reboot হলে app আবার চালু
- Logs সংরক্ষণ করে

---

## Phase 6 — Nginx Install

```bash
sudo apt install -y nginx
sudo systemctl status nginx   # active দেখালে সফল
```

Browser এ `http://YOUR_VPS_IP` দিলে Nginx default page দেখাবে।

---

## Phase 7 — Code VPS এ আনো

```bash
sudo apt install -y git
git clone https://github.com/hossain101199/bazaar-hisab.git
cd bazaar-hisab
```

---

## Phase 8 — Backend Deploy করো

```bash
cd backend
npm ci                    # package-lock.json অনুযায়ী exact install
npx prisma generate       # Prisma client বানাও
npm run build             # TypeScript → JavaScript (src/ → dist/)
```

### .env file বানাও

```bash
nano .env
```

এই content দাও:

```env
NODE_ENV=production
DATABASE_URL=postgresql://bazaar_user:তোমার_password@localhost:5432/bazaar_hisab
JWT_SECRET=এখানে_minimum_64_character_random_string_দাও
CORS_ORIGIN=http://YOUR_VPS_IP
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=StrongPassword123!
ADMIN_NAME=সিস্টেম অ্যাডমিন
BCRYPT_ROUNDS=12
PORT=4000
COOKIE_SECURE=false
```

> `COOKIE_SECURE=false` — HTTP (IP only) তে cookie কাজ করার জন্য।
> পরে domain + SSL নিলে এটা `true` করতে হবে।

### Migration চালাও

```bash
npx prisma migrate deploy
```

**`migrate deploy` vs `migrate dev` — পার্থক্য:**
- `migrate dev` → নতুন migration file বানায়, development এর জন্য
- `migrate deploy` → শুধু pending migration apply করে, production এর জন্য, data নষ্ট করে না

### Test করো

```bash
npm start
# "Server running on port 4000" দেখালে সফল
# Ctrl+C দিয়ে বন্ধ করো
```

---

## Phase 9 — Frontend Deploy করো

```bash
cd ../frontend
npm ci
```

### .env.local বানাও

```bash
nano .env.local
```

```env
NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP
```

**কেন `NEXT_PUBLIC_API_URL`?**
এই variable browser এ run হওয়া JavaScript এ বাকে যায় (baked in)।
Build time এ এই value fix হয়ে যায়।
তাই VPS এর IP দিতে হবে।

```bash
npm run build   # Next.js production build (একটু সময় নেয়)
```

### Test করো

```bash
npm start
# "Ready on http://localhost:3000" দেখালে সফল
# Ctrl+C দিয়ে বন্ধ করো
```

---

## Phase 10 — PM2 দিয়ে চালু রাখো

```bash
cd ~/bazaar-hisab

# Backend চালু করো
pm2 start backend/dist/index.js --name "bazaar-backend"

# Frontend চালু করো
pm2 start "npm start" --name "bazaar-frontend" --cwd ./frontend

# Status দেখো
pm2 status
```

এরকম দেখাবে:
```
┌──────────────────┬────────┐
│ name             │ status │
├──────────────────┼────────┤
│ bazaar-backend   │ online │
│ bazaar-frontend  │ online │
└──────────────────┴────────┘
```

### Server reboot এর পরেও auto-start করার জন্য

```bash
pm2 startup
# যে command দেখাবে সেটা copy করে run করো
pm2 save
```

---

## Phase 11 — Nginx Configure করো

```bash
sudo nano /etc/nginx/sites-available/bazaar-hisab
```

এই content দাও:

```nginx
server {
    listen 80;
    server_name _;

    # /api/ দিয়ে শুরু সব request → Backend (port 4000)
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # বাকি সব request → Frontend (port 3000)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**`server_name _;`** = domain নেই, যেকোনো IP accept করো।

**`location /api/`** = backend এর সব route `/api/` দিয়ে শুরু (যেমন `/api/auth/login`),
তাই এই pattern দিয়ে আলাদা করা হয়েছে।

```bash
# Config activate করো
sudo ln -s /etc/nginx/sites-available/bazaar-hisab /etc/nginx/sites-enabled/

# Default config সরাও
sudo rm /etc/nginx/sites-enabled/default

# Config এ ভুল আছে কিনা চেক করো
sudo nginx -t

# Nginx reload করো
sudo systemctl reload nginx
```

এখন `http://YOUR_VPS_IP` তে app চলবে।

---

## Final Verification

```bash
pm2 status                         # দুটো process online?
sudo systemctl status nginx        # nginx active?
sudo systemctl status postgresql   # postgres active?
curl http://YOUR_VPS_IP/api/       # {"success":true,"message":"Bazaar Hisab API running"} আসে?
```

---

## Code Update করার নিয়ম (নতুন feature deploy করতে)

### Step 1 — আগে backup নাও (সবসময়!)

```bash
pg_dump -U bazaar_user bazaar_hisab > ~/backup_$(date +%Y%m%d_%H%M).sql
```

### Step 2 — Code pull করো

```bash
cd ~/bazaar-hisab
git pull
```

### Step 3 — Backend update

```bash
cd backend
npm ci
npm run build
npx prisma migrate deploy   # নতুন migration থাকলে apply হবে, data নষ্ট হবে না
pm2 restart bazaar-backend
```

### Step 4 — Frontend update

```bash
cd ../frontend
npm ci
npm run build
pm2 restart bazaar-frontend
```

---

## Backup Restore করার নিয়ম (যদি কিছু ভুল হয়)

```bash
psql -U bazaar_user bazaar_hisab < ~/backup_20260517_1430.sql
```

---

## Useful PM2 Commands

```bash
pm2 status                        # সব process এর অবস্থা
pm2 logs bazaar-backend           # backend এর live log
pm2 logs bazaar-frontend          # frontend এর live log
pm2 restart bazaar-backend        # backend restart
pm2 restart bazaar-frontend       # frontend restart
pm2 restart all                   # সব restart
```

---

## ভবিষ্যতে Domain + SSL নিলে যা বদলাবে

1. **`backend/.env`** → `CORS_ORIGIN=https://yourdomain.com` এবং `COOKIE_SECURE=true`
2. **`frontend/.env.local`** → `NEXT_PUBLIC_API_URL=https://yourdomain.com`
3. **Frontend rebuild** → `npm run build && pm2 restart bazaar-frontend`
4. **Nginx config** → `server_name yourdomain.com;` এবং SSL certificate যোগ করো
5. **Certbot** → `sudo certbot --nginx -d yourdomain.com`

---

## Code এ যে Change করা হয়েছে (Deployment এর জন্য)

### `backend/src/modules/auth/auth.controller.ts` — Line 8

**আগে:**
```javascript
secure: process.env.NODE_ENV === "production",
```

**পরে:**
```javascript
secure: process.env.COOKIE_SECURE === "true",
```

**কেন?**
`NODE_ENV=production` সেট করলে cookie তে `secure: true` হয়ে যেত।
`secure: true` মানে browser এই cookie শুধু HTTPS connection এ পাঠাবে।
আমরা HTTP (IP) তে deploy করছি, তাই cookie কাজ করতো না — login করলেও logout হয়ে যেত।

সমাধান: `COOKIE_SECURE` নামের আলাদা env variable। এখন:
- HTTP deploy → `.env` তে `COOKIE_SECURE=false`
- HTTPS deploy → `.env` তে `COOKIE_SECURE=true`

এতে `NODE_ENV=production` রাখা যাচ্ছে (rate limiting সহ অন্য production behavior ঠিক থাকছে),
শুধু cookie এর secure flag আলাদাভাবে control করা যাচ্ছে।
