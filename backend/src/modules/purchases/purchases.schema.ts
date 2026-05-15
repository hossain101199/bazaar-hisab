import { z } from "zod";

const itemSchema = z.object({
  productId: z.number().int().positive("বৈধ productId দিন"),
  quantity: z.number().positive("quantity > 0 হতে হবে"),
  totalPrice: z.number().positive("totalPrice > 0 হতে হবে"),
});

export const createPurchaseSchema = z.object({
  date: z
    .string()
    .refine((d) => !isNaN(new Date(d).getTime()), "বৈধ date দিন (ISO 8601)"),
  note: z.string().optional(),
  items: z.array(itemSchema).min(1, "কমপক্ষে একটি পণ্য যোগ করুন"),
});

export const updatePurchaseSchema = z.object({
  date: z
    .string()
    .refine((d) => !isNaN(new Date(d).getTime()), "বৈধ date দিন (ISO 8601)")
    .optional(),
  note: z.string().optional(),
  items: z.array(itemSchema).min(1, "কমপক্ষে একটি পণ্য যোগ করুন").optional(),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>;
