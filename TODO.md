# বাজার হিসাব — ভবিষ্যৎ কাজের তালিকা

এই document এ সেই কাজগুলো লেখা আছে যা এখনো করা হয়নি।
Security audit (2026-05-19) এর পরে যা সম্পন্ন হয়েছে তার উপর ভিত্তি করে তৈরি।

---

## Authentication — Long Term

### 1. Refresh Token Reuse Detection (Token Family)

**সমস্যা:** কেউ refresh token চুরি করে reuse করলে শুধু 401 দেখায়। বৈধ user এর অন্য sessions বন্ধ হয় না।

**করণীয়:**

- `RefreshToken` table এ `familyId` field যোগ করো (UUID)
- Login এ নতুন family তৈরি হবে, rotation এ একই family থাকবে
- কেউ already-used token দিলে ওই family এর সব token delete করো (সব device logout)

```prisma
model RefreshToken {
  familyId  String   // login এ crypto.randomUUID()
  // বাকি fields একই থাকবে
}
```

---

### 2. `/api/auth/sessions` — Device Management

**সমস্যা:** User নিজে দেখতে পারে না কোন কোন device এ login আছে।

**করণীয়:**

- Login এর সময় device info save করো (user agent, IP)
- `GET /api/auth/sessions` — active sessions list
- `DELETE /api/auth/sessions/:id` — নির্দিষ্ট device logout
- `DELETE /api/auth/sessions` — সব device logout (current ছাড়া)

```prisma
model RefreshToken {
  userAgent String?
  ipAddress String?
  // বাকি fields একই থাকবে
}
```

---

### 3. Audit Log

**সমস্যা:** কে কখন login/logout করেছে তার কোনো record নেই।

**করণীয়:**

- `AuditLog` table তৈরি করো
- Login, logout, failed login attempt log করো
- IP address এবং user agent save করো

```prisma
model AuditLog {
  id        Int      @id @default(autoincrement())
  userId    Int?
  action    String   // LOGIN | LOGOUT | LOGIN_FAILED
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
}
```

---

### 4. Redis Session Store

**প্রয়োজন কখন:** একাধিক backend instance চালালে (horizontal scaling)।

**এখন:** PostgreSQL এ refresh token store হচ্ছে — single server এ ঠিকঠাক।

**করণীয় (ভবিষ্যতে):**

- Redis যোগ করো
- Refresh token Redis এ রাখো TTL সহ (7 days)
- PostgreSQL থেকে `RefreshToken` table সরিয়ে দাও

---

## Feature — যা চাইলে যোগ করা যায়

### Email Verification

- Registration এর পরে email verify করা
- Unverified account login করতে পারবে না

### Password Reset

- "পাসওয়ার্ড ভুলে গেছি" flow
- Email এ time-limited reset link

### Account Settings

- নাম পরিবর্তন
- পাসওয়ার্ড পরিবর্তন (current password confirm করে)

### Admin — User Role Management

**সমস্যা:** Admin user list দেখতে পারেন, কিন্তু কোনো user কে ADMIN বানাতে বা সরাতে পারেন না।

**করণীয়:**
- `PATCH /api/admin/users/:id/role` — role পরিবর্তন endpoint
- Admin panel এ role toggle বা dropdown যোগ করো
- নিজের role পরিবর্তন করা যাবে না (safety guard)

### Shop Address Clearing (UI)

**সমস্যা:** Backend এ `address: null` পাঠালে ঠিকানা মুছে যায় (schema এ `.nullable()` আছে), কিন্তু `ShopDialog` empty string কে `undefined` হিসেবে পাঠায় — ফলে ঠিকানা একবার সেট করলে UI থেকে মুছানো যায় না।

**করণীয়:**
- `ShopDialog.tsx` এ onSubmit এ `address: values.address || null` পাঠাও (`undefined` নয়)
- `shopsService.update()` এর type `address?: string | null` করো

### Analysis Page Cache Invalidation

**সমস্যা:** Analysis পেজের `['top-products']` এবং `['shop-report']` query, purchase তৈরি/সম্পাদনা/মুছে ফেলার পরে invalidate হয় না — window focus বা cache expiry পর্যন্ত stale থাকে।

**করণীয়:**
- `PurchaseForm.tsx` এ create/edit এর পরে এবং `[id]/page.tsx` এ delete এর পরে:
  ```ts
  queryClient.invalidateQueries({ queryKey: ['top-products'] })
  queryClient.invalidateQueries({ queryKey: ['shop-report'] })
  ```
- অথবা TanStack Query এর `broadcastQueryClient` বা tag-based invalidation ব্যবহার করো

---

## Infrastructure

### Production Deploy এর আগে

- [ ] `.env` এ `JWT_SECRET` random 64-char string দাও (এখন placeholder আছে)
- [ ] `ADMIN_PASSWORD` strong password দাও
- [ ] `CORS_ORIGIN` production URL দাও
- [ ] `NODE_ENV=production` set করো
- [ ] HTTPS setup করো (Nginx/Caddy)
- [ ] Database backup strategy ঠিক করো

### Docker Production Config

- [ ] `Dockerfile.dev` আলাদা `Dockerfile.prod` তৈরি করো
- [ ] Multi-stage build use করো (smaller image)
- [ ] Health check timeout adjust করো

---

## Notes

- Long term auth items (1-4) শুধু দরকার হবে যদি app public করা হয় বা multiple user থাকে
- Single user / small team এর জন্য current implementation production-ready
