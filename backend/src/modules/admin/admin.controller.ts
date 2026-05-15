import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { listUsers } from "./admin.service";

export async function getUsers(
  _req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const users = await listUsers();
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
}
