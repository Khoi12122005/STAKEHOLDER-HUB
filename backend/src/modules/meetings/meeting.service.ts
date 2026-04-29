import { AuditAction, NotificationType, Prisma, Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import { auditService } from "../audit/audit.service";
import { emailService } from "../email/email.service";
import { CreateMeetingInput, ListMeetingQuery, ParticipantInput, UpdateMeetingInput } from "./meeting.validation";

type CurrentUser = {
  id: number;
  role: Role;
};

const meetingInclude = {
  createdBy: {
    select: { id: true, name: true, email: true, role: true }
  },
  participants: {
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  },
  minutes: true,
  tasks: true
};

const ensureMeetingManager = (meeting: { createdById: number }, currentUser: CurrentUser) => {
  if (currentUser.role !== Role.BA && meeting.createdById !== currentUser.id) {
    throw new AppError(403, "Only BA or meeting creator can manage this meeting");
  }
};

const getActiveUsersByIds = async (userIds: number[]) => {
  const uniqueIds = [...new Set(userIds)];

  if (uniqueIds.length === 0) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: { id: { in: uniqueIds }, isActive: true },
    select: { id: true, name: true, email: true }
  });

  if (users.length !== uniqueIds.length) {
    throw new AppError(400, "One or more participants are invalid or inactive");
  }

  return users;
};

const notifyMeetingParticipants = async (
  meetingId: number,
  meetingTitle: string,
  startTime: Date,
  users: Array<{ id: number; email: string }>
) => {
  if (users.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      meetingId,
      type: NotificationType.MEETING,
      title: "Meeting reminder",
      message: `You are invited to meeting: ${meetingTitle}`
    }))
  });

  // Email là kênh phụ, lỗi SMTP không làm fail request chính.
  await Promise.allSettled(
    users.map((user) => emailService.sendMeetingReminder(user.email, meetingTitle, startTime))
  );
};

export const meetingService = {
  async listMeetings(currentUser: CurrentUser, query: ListMeetingQuery) {
    const filters: Prisma.MeetingWhereInput[] = [];

    if (query.status) {
      filters.push({ status: query.status });
    }

    if (query.search) {
      filters.push({
        OR: [
          { title: { contains: query.search } },
          { description: { contains: query.search } }
        ]
      });
    }

    if (currentUser.role !== Role.BA) {
      filters.push({
        OR: [
          { createdById: currentUser.id },
          { participants: { some: { userId: currentUser.id } } }
        ]
      });
    }

    return prisma.meeting.findMany({
      where: filters.length > 0 ? { AND: filters } : undefined,
      orderBy: { startTime: "asc" },
      include: meetingInclude
    });
  },

  async getMeetingById(meetingId: number, currentUser: CurrentUser) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: meetingInclude
    });

    if (!meeting) {
      throw new AppError(404, "Meeting not found");
    }

    const canRead =
      currentUser.role === Role.BA ||
      meeting.createdById === currentUser.id ||
      meeting.participants.some((participant) => participant.userId === currentUser.id);

    if (!canRead) {
      throw new AppError(403, "You do not have access to this meeting");
    }

    return meeting;
  },

  async createMeeting(input: CreateMeetingInput, currentUser: CurrentUser) {
    const participantIds = [...new Set([...input.participantIds, currentUser.id])];
    const participants = await getActiveUsersByIds(participantIds);

    const meeting = await prisma.meeting.create({
      data: {
        title: input.title,
        description: input.description,
        location: input.location,
        meetingUrl: input.meetingUrl,
        startTime: input.startTime,
        endTime: input.endTime,
        createdById: currentUser.id,
        participants: {
          create: participantIds.map((userId) => ({ userId }))
        }
      },
      include: meetingInclude
    });

    await notifyMeetingParticipants(
      meeting.id,
      meeting.title,
      meeting.startTime,
      participants.filter((participant) => participant.id !== currentUser.id)
    );

    await auditService.createLog({
      actorId: currentUser.id,
      action: AuditAction.CREATE,
      entityName: "Meeting",
      entityId: meeting.id,
      afterData: meeting
    });

    return meeting;
  },

  async updateMeeting(meetingId: number, input: UpdateMeetingInput, currentUser: CurrentUser) {
    const existingMeeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { participants: true }
    });

    if (!existingMeeting) {
      throw new AppError(404, "Meeting not found");
    }

    ensureMeetingManager(existingMeeting, currentUser);

    const nextStartTime = input.startTime ?? existingMeeting.startTime;
    const nextEndTime = input.endTime ?? existingMeeting.endTime;

    if (nextEndTime <= nextStartTime) {
      throw new AppError(400, "Meeting end time must be after start time");
    }

    const participantIds = input.participantIds
      ? [...new Set([...input.participantIds, existingMeeting.createdById])]
      : null;

    if (participantIds) {
      await getActiveUsersByIds(participantIds);
    }

    const updatedMeeting = await prisma.$transaction(async (tx) => {
      if (participantIds) {
        await tx.meetingParticipant.deleteMany({ where: { meetingId } });
        await tx.meetingParticipant.createMany({
          data: participantIds.map((userId) => ({ meetingId, userId })),
          skipDuplicates: true
        });
      }

      return tx.meeting.update({
        where: { id: meetingId },
        data: {
          title: input.title,
          description: input.description,
          location: input.location,
          meetingUrl: input.meetingUrl,
          status: input.status,
          startTime: input.startTime,
          endTime: input.endTime
        },
        include: meetingInclude
      });
    });

    await auditService.createLog({
      actorId: currentUser.id,
      action: AuditAction.UPDATE,
      entityName: "Meeting",
      entityId: meetingId,
      beforeData: existingMeeting,
      afterData: updatedMeeting
    });

    return updatedMeeting;
  },

  async deleteMeeting(meetingId: number, currentUser: CurrentUser) {
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });

    if (!meeting) {
      throw new AppError(404, "Meeting not found");
    }

    ensureMeetingManager(meeting, currentUser);
    await prisma.meeting.delete({ where: { id: meetingId } });

    await auditService.createLog({
      actorId: currentUser.id,
      action: AuditAction.DELETE,
      entityName: "Meeting",
      entityId: meetingId,
      beforeData: meeting
    });
  },

  async addParticipant(meetingId: number, input: ParticipantInput, currentUser: CurrentUser) {
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });

    if (!meeting) {
      throw new AppError(404, "Meeting not found");
    }

    ensureMeetingManager(meeting, currentUser);
    const [participant] = await getActiveUsersByIds([input.userId]);

    await prisma.meetingParticipant.upsert({
      where: {
        meetingId_userId: {
          meetingId,
          userId: input.userId
        }
      },
      create: { meetingId, userId: input.userId },
      update: {}
    });

    await notifyMeetingParticipants(meetingId, meeting.title, meeting.startTime, [participant]);

    await auditService.createLog({
      actorId: currentUser.id,
      action: AuditAction.UPDATE,
      entityName: "MeetingParticipant",
      entityId: meetingId,
      afterData: { meetingId, userId: input.userId }
    });
  },

  async removeParticipant(meetingId: number, userId: number, currentUser: CurrentUser) {
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });

    if (!meeting) {
      throw new AppError(404, "Meeting not found");
    }

    ensureMeetingManager(meeting, currentUser);

    if (meeting.createdById === userId) {
      throw new AppError(400, "Meeting creator cannot be removed from participants");
    }

    await prisma.meetingParticipant.delete({
      where: {
        meetingId_userId: {
          meetingId,
          userId
        }
      }
    });

    await auditService.createLog({
      actorId: currentUser.id,
      action: AuditAction.DELETE,
      entityName: "MeetingParticipant",
      entityId: meetingId,
      beforeData: { meetingId, userId }
    });
  },

  async sendReminder(meetingId: number, currentUser: CurrentUser) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        participants: {
          include: {
            user: { select: { id: true, email: true } }
          }
        }
      }
    });

    if (!meeting) {
      throw new AppError(404, "Meeting not found");
    }

    ensureMeetingManager(meeting, currentUser);
    const users = meeting.participants.map((participant) => participant.user);

    await notifyMeetingParticipants(meeting.id, meeting.title, meeting.startTime, users);

    await auditService.createLog({
      actorId: currentUser.id,
      action: AuditAction.UPDATE,
      entityName: "Meeting",
      entityId: meeting.id,
      afterData: { reminderSent: true }
    });
  }
};
