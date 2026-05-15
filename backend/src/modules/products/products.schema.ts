import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "পণ্যের নাম দিন").max(200).trim(),
  unitId: z.coerce.number().int().positive("বৈধ unitId দিন"),
  type: z.enum(["USER", "SYSTEM"]).optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, "পণ্যের নাম দিন").max(200).trim().optional(),
  unitId: z.coerce.number().int().positive("বৈধ unitId দিন").optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
