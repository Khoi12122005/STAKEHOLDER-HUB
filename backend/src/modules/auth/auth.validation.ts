import { Role } from "@prisma/client";
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(191),
  password: z.string().min(8).max(72),
  role: z.nativeEnum(Role).optional()
});

export const loginSchema = z.object({
  email: z.string().email().max(191),
  password: z.string().min(1)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
