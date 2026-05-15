import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

/** Validates req.body against a Zod schema, replaces body with parsed/coerced data on success. */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "অবৈধ ইনপুট";
      res.status(400).json({ success: false, message });
      return;
    }
    req.body = result.data;
    next();
  };
}
