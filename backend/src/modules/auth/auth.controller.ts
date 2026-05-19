import { NextFunction, Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { getMe, loginUser, registerUser, rotateRefreshToken, revokeRefreshToken } from "./auth.service";
import type { LoginInput, RegisterInput } from "./auth.schema";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password } = req.body as RegisterInput;
    const user = await registerUser(name, email, password);
    res.status(201).json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as LoginInput;
    const { accessToken, refreshToken, user } = await loginUser(email, password);
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
    res.cookie("role", user.role, COOKIE_OPTIONS);
    res.json({ success: true, accessToken, user });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken as string | undefined;
    if (!token) {
      res.status(401).json({ success: false, message: "রিফ্রেশ টোকেন নেই" });
      return;
    }
    const { accessToken, refreshToken, user } = await rotateRefreshToken(token);
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
    res.cookie("role", user.role, COOKIE_OPTIONS);
    res.json({ success: true, accessToken, user });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken as string | undefined;
    if (token) await revokeRefreshToken(token);
    const clearOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };
    res.clearCookie("refreshToken", clearOptions);
    res.clearCookie("role", clearOptions);
    res.json({ success: true, message: "লগআউট সফল" });
  } catch (err) {
    next(err);
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await getMe(req.userId!);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}
