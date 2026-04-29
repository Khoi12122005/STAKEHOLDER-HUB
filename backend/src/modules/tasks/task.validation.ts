import { TaskStatus } from "@prisma/client";
import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(3).max(220),
  description: z.string().max(5000).optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  dueDate: z.coerce.date().optional(),
  meetingId: z.number().int().positive().optional(),
  assigneeId: z.number().int().positive().optional()
});

export const updateTaskSchema = z.object({
  title: z.string().min(3).max(220).optional(),
  description: z.string().max(5000).nullable().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  dueDate: z.coerce.date().nullable().optional(),
  meetingId: z.number().int().positive().nullable().optional(),
  assigneeId: z.number().int().positive().nullable().optional()
});

export const listTaskQuerySchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  assigneeId: z.coerce.number().int().positive().optional(),
  meetingId: z.coerce.number().int().positive().optional()
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTaskQuery = z.infer<typeof listTaskQuerySchema>;
