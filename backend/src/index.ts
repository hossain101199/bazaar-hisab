import { Role } from "@prisma/client";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import "./config/env";
import { errorMiddleware } from "./middleware/error.middleware";
import adminRoutes from "./modules/admin/admin.routes";
import authRoutes from "./modules/auth/auth.routes";
import productRoutes from "./modules/products/products.routes";
import purchaseRoutes from "./modules/purchases/purchases.routes";
import shopRoutes from "./modules/shops/shops.routes";
import unitRoutes from "./modules/units/units.routes";
import prisma from "./prisma";

const app = express();
const PORT = process.env.PORT || 4000;

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 10 : 100,
  message: {
    success: false,
    message: "অনেক বার চেষ্টা করা হয়েছে, ১৫ মিনিট পর আবার চেষ্টা করুন",
  },
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 30 : 200,
  message: {
    success: false,
    message: "অনেক বার চেষ্টা করা হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন",
  },
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
      },
    },
  }),
);
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(globalLimiter);

app.get("/api", (_, res) => {
  res.json({
    success: true,
    message: "Bazaar Hisab API running",
  });
});

const API_PREFIX = "/api";

app.use(`${API_PREFIX}/auth/login`, authLimiter);
app.use(`${API_PREFIX}/auth/register`, authLimiter);
app.use(`${API_PREFIX}/auth/refresh`, refreshLimiter);
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/units`, unitRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/purchases`, purchaseRoutes);
app.use(`${API_PREFIX}/shops`, shopRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);

app.use(errorMiddleware);

async function bootstrapAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME;
  if (!email || !password || !name) return;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  const rounds = parseInt(process.env.BCRYPT_ROUNDS || "10");
  const hashed = await bcrypt.hash(password, rounds);
  const admin = await prisma.user.create({
    data: { name, email, password: hashed, role: Role.ADMIN },
  });
  console.log(`✓ Admin তৈরি হয়েছে — id: ${admin.id}, email: ${admin.email}`);
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function cleanupExpiredTokens() {
  const result = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  if (result.count > 0) {
    console.log(
      `✓ ${result.count} টি মেয়াদোত্তীর্ণ RefreshToken মুছে ফেলা হয়েছে`,
    );
  }
}

async function start() {
  await bootstrapAdmin();
  await cleanupExpiredTokens();
  setInterval(cleanupExpiredTokens, ONE_DAY_MS);
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();

export default app;
