import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: Role;
}

interface JwtPayload {
  userId: number;
  role: string;
}

function isJwtPayload(payload: unknown): payload is JwtPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "userId" in payload &&
    typeof (payload as JwtPayload).userId === "number"
  );
}

const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32) {
  throw new Error("JWT_SECRET অবশ্যই কমপক্ষে ৩২ character হতে হবে");
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }
  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, secret!);
    if (!isJwtPayload(payload)) {
      res
        .status(401)
        .json({ success: false, message: "Token invalid or expired" });
      return;
    }
    req.userId = payload.userId;
    req.userRole = payload.role === Role.ADMIN ? Role.ADMIN : Role.USER;
    next();
  } catch {
    res
      .status(401)
      .json({ success: false, message: "Token invalid or expired" });
  }
}
