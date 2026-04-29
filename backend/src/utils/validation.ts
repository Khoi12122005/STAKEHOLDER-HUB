import { z } from "zod";

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const meetingIdParamSchema = z.object({
  meetingId: z.coerce.number().int().positive()
});

export const taskIdParamSchema = z.object({
  taskId: z.coerce.number().int().positive()
});

export const userIdParamSchema = z.object({
  userId: z.coerce.number().int().positive()
});
