import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "নাম দিন").max(100).trim(),
  email: z.string().trim().email("বৈধ ইমেইল দিন"),
  password: z
    .string()
    .min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে")
    .regex(/[a-zA-Z]/, "পাসওয়ার্ডে কমপক্ষে একটি অক্ষর (a-z) থাকতে হবে")
    .regex(/[0-9]/, "পাসওয়ার্ডে কমপক্ষে একটি সংখ্যা (0-9) থাকতে হবে"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("বৈধ ইমেইল দিন"),
  password: z.string().min(1, "পাসওয়ার্ড দিন"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
