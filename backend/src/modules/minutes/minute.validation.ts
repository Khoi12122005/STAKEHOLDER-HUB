import { z } from "zod";

export const upsertMinuteSchema = z.object({
  objective: z.string().min(1),
  discussion: z.string().min(1),
  decision: z.string().min(1),
  rawNotes: z.string().optional()
});

export type UpsertMinuteInput = z.infer<typeof upsertMinuteSchema>;
