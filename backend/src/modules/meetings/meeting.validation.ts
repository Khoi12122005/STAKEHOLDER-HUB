import { MeetingStatus } from "@prisma/client";
import { z } from "zod";

export const createMeetingSchema = z
  .object({
    title: z.string().min(3).max(180),
    description: z.string().max(5000).optional(),
    location: z.string().max(180).optional(),
    meetingUrl: z.string().url().max(255).optional(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    participantIds: z.array(z.number().int().positive()).default([])
  })
  .refine((value) => value.endTime > value.startTime, {
    message: "Meeting end time must be after start time",
    path: ["endTime"]
  });

export const updateMeetingSchema = z
  .object({
    title: z.string().min(3).max(180).optional(),
    description: z.string().max(5000).nullable().optional(),
    location: z.string().max(180).nullable().optional(),
    meetingUrl: z.string().url().max(255).nullable().optional(),
    status: z.nativeEnum(MeetingStatus).optional(),
    startTime: z.coerce.date().optional(),
    endTime: z.coerce.date().optional(),
    participantIds: z.array(z.number().int().positive()).optional()
  })
  .refine((value) => !value.startTime || !value.endTime || value.endTime > value.startTime, {
    message: "Meeting end time must be after start time",
    path: ["endTime"]
  });

export const participantSchema = z.object({
  userId: z.number().int().positive()
});

export const listMeetingQuerySchema = z.object({
  status: z.nativeEnum(MeetingStatus).optional(),
  search: z.string().max(120).optional()
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
export type ParticipantInput = z.infer<typeof participantSchema>;
export type ListMeetingQuery = z.infer<typeof listMeetingQuerySchema>;
