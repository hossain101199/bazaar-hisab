import { z } from "zod";

const itemSchema = z.object({
  productId: z.number().int().positive("বৈধ productId দিন"),
  quantity: z.number().positive("quantity > 0 হতে হবে"),
  totalPrice: z.number().positive("totalPrice > 0 হতে হবে"),
});

const dateField = z
  .string()
  .refine((d) => !isNaN(new Date(d).getTime()), "বৈধ date দিন (ISO 8601)")
  .refine((d) => new Date(d) <= new Date(), "ভবিষ্যতের তারিখ দেওয়া যাবে না");

export const createPurchaseSchema = z.object({
  date: dateField,
  note: z.string().max(500, "নোট সর্বোচ্চ ৫০০ অক্ষর হতে পারে").optional(),
  shopId: z.number().int().positive().optional(),
  items: z.array(itemSchema).min(1, "কমপক্ষে একটি পণ্য যোগ করুন"),
});

export const updatePurchaseSchema = z.object({
  date: dateField.optional(),
  note: z.string().max(500, "নোট সর্বোচ্চ ৫০০ অক্ষর হতে পারে").nullable().optional(),
  shopId: z.number().int().positive().nullable().optional(),
  items: z.array(itemSchema).min(1, "কমপক্ষে একটি পণ্য যোগ করুন").optional(),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>;
