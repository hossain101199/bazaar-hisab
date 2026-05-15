import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
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
if (!secret) {
  throw new Error("JWT_SECRET missing");
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
    req.userRole = payload.role ?? "USER";
    next();
  } catch {
    res
      .status(401)
      .json({ success: false, message: "Token invalid or expired" });
  }
}
