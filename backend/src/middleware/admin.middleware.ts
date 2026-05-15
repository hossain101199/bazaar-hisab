import { NextFunction, Response } from "express";
import { AuthRequest } from "./auth.middleware";

export function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  if (req.userRole !== "ADMIN") {
    res.status(403).json({
      success: false,
      message: "শুধুমাত্র Admin এই কাজ করতে পারবেন",
    });
    return;
  }
  next();
}
