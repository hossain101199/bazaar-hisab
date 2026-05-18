import { z } from "zod";

export const createShopSchema = z.object({
  name: z.string().min(1, "নাম দিন"),
  address: z.string().optional(),
  type: z.enum(["SYSTEM", "USER"]).optional(),
});

export const updateShopSchema = z.object({
  name: z.string().min(1, "নাম দিন").optional(),
  address: z.string().optional(),
});

export type CreateShopInput = z.infer<typeof createShopSchema>;
export type UpdateShopInput = z.infer<typeof updateShopSchema>;
