import { z } from "zod";

export const parseNotesSchema = z.object({
  notes: z.string().min(5),
  meetingId: z.number().int().positive().optional(),
  createTasks: z.boolean().default(false)
});

export type ParseNotesInput = z.infer<typeof parseNotesSchema>;
