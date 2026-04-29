import { AuditAction, Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import { auditService } from "../audit/audit.service";
import { UpsertMinuteInput } from "./minute.validation";

type CurrentUser = {
  id: number;
  role: Role;
};

const getMeetingWithAccess = async (meetingId: number, currentUser: CurrentUser) => {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { participants: true }
  });

  if (!meeting) {
    throw new AppError(404, "Meeting not found");
  }

  const canRead =
    currentUser.role === Role.BA ||
    meeting.createdById === currentUser.id ||
    meeting.participants.some((participant) => participant.userId === currentUser.id);

  if (!canRead) {
    throw new AppError(403, "You do not have access to this meeting minutes");
  }

  return meeting;
};

const ensureMinuteWriter = (meeting: { createdById: number }, currentUser: CurrentUser) => {
  if (currentUser.role !== Role.BA && currentUser.role !== Role.STAKEHOLDER && meeting.createdById !== currentUser.id) {
    throw new AppError(403, "Only BA, stakeholder, or meeting creator can manage minutes");
  }
};

export const minuteService = {
  async getByMeetingId(meetingId: number, currentUser: CurrentUser) {
    await getMeetingWithAccess(meetingId, currentUser);

    const minute = await prisma.meetingMinute.findUnique({
      where: { meetingId }
    });

    if (!minute) {
      throw new AppError(404, "Meeting minutes not found");
    }

    return minute;
  },

  async upsertByMeetingId(meetingId: number, input: UpsertMinuteInput, currentUser: CurrentUser) {
    const meeting = await getMeetingWithAccess(meetingId, currentUser);
    ensureMinuteWriter(meeting, currentUser);

    const existingMinute = await prisma.meetingMinute.findUnique({ where: { meetingId } });
    const minute = await prisma.meetingMinute.upsert({
      where: { meetingId },
      create: {
        meetingId,
        objective: input.objective,
        discussion: input.discussion,
        decision: input.decision,
        rawNotes: input.rawNotes
      },
      update: {
        objective: input.objective,
        discussion: input.discussion,
        decision: input.decision,
        rawNotes: input.rawNotes
      }
    });

    await auditService.createLog({
      actorId: currentUser.id,
      action: existingMinute ? AuditAction.UPDATE : AuditAction.CREATE,
      entityName: "MeetingMinute",
      entityId: minute.id,
      beforeData: existingMinute,
      afterData: minute
    });

    return minute;
  }
};
