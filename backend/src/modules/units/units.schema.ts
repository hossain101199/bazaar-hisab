import { z } from "zod";

const groupKeySchema = z.enum(["weight", "volume", "count"]).nullable().optional();

export const createUnitSchema = z.object({
  name: z.string().min(1, "এককের নাম দিন").max(100).trim(),
  groupKey: groupKeySchema,
  baseRatio: z.number().positive("baseRatio অবশ্যই ধনাত্মক হতে হবে").nullable().optional(),
});

export const updateUnitSchema = z.object({
  name: z.string().min(1, "এককের নাম দিন").max(100).trim().optional(),
  groupKey: groupKeySchema,
  baseRatio: z.number().positive().nullable().optional(),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
