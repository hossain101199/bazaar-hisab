import { z } from "zod";

export const createShopSchema = z.object({
  name: z.string().min(1, "নাম দিন").max(100, "নাম সর্বোচ্চ ১০০ অক্ষর হতে পারে"),
  address: z.string().max(300, "ঠিকানা সর্বোচ্চ ৩০০ অক্ষর হতে পারে").optional(),
});

export const updateShopSchema = z.object({
  name: z.string().min(1, "নাম দিন").max(100, "নাম সর্বোচ্চ ১০০ অক্ষর হতে পারে").optional(),
  address: z.string().max(300, "ঠিকানা সর্বোচ্চ ৩০০ অক্ষর হতে পারে").nullable().optional(),
});

export type CreateShopInput = z.infer<typeof createShopSchema>;
export type UpdateShopInput = z.infer<typeof updateShopSchema>;
