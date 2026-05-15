import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const { code } = err as Prisma.PrismaClientKnownRequestError;
    let message = "Database error";
    if (code === "P2002") message = "এই ডেটা ইতিমধ্যে বিদ্যমান";
    else if (code === "P2025") message = "অনুরোধকৃত ডেটা পাওয়া যায়নি";
    else if (code === "P2003") message = "বৈধ সম্পর্ক না থাকার কারণে অপারেশন ব্যর্থ";
    return res.status(400).json({ success: false, message });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ success: false, message: "Invalid data provided" });
  }

  if (err instanceof Error && err.name === "JsonWebTokenError") {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  if (err instanceof AppError) {
    if (err.status >= 500) {
      console.error(`[ERROR] ${_req.method} ${_req.path}`, {
        status: err.status,
        message: err.message,
        stack: err.stack,
      });
    }
    return res.status(err.status).json({ success: false, message: err.message });
  }

  const message = err instanceof Error ? err.message : "Internal Server Error";
  console.error(`[ERROR] ${_req.method} ${_req.path}`, {
    status: 500,
    message,
    stack: err instanceof Error ? err.stack : undefined,
  });
  res.status(500).json({ success: false, message });
}
