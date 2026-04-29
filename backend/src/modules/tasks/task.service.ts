import { AuditAction, NotificationType, Prisma, Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import { auditService } from "../audit/audit.service";
import { emailService } from "../email/email.service";
import { getIO } from "@/utils/io";
import { CreateTaskInput, ListTaskQuery, UpdateTaskInput } from "./task.validation";

type CurrentUser = {
  id: number;
  role: Role;
};

const taskInclude = {
  meeting: true,
  assignee: {
    select: { id: true, name: true, email: true, role: true }
  },
  createdBy: {
    select: { id: true, name: true, email: true, role: true }
  }
};

const notifyTaskAssignee = async (
  taskId: number,
  title: string,
  assignee: { id: number; email: string } | null
) => {
  if (!assignee) return;

  const notification = await prisma.notification.create({
    data: {
      userId: assignee.id,
      taskId,
      type: NotificationType.TASK,
      title: "Task assigned",
      message: `You have a task assigned: ${title}`
    }
  });

  const io = getIO();
  io.to(`user-${assignee.id}`).emit("task_assigned", notification);

  await emailService.sendTaskReminder(assignee.email, title);
};

const ensureAssigneeExists = async (assigneeId?: number | null) => {
  if (!assigneeId) return null;

  const assignee = await prisma.user.findFirst({
    where: { id: assigneeId, isActive: true },
    select: { id: true, email: true }
  });

  if (!assignee) {
    throw new AppError(400, "Assignee is invalid or inactive");
  }

  return assignee;
};

const ensureMeetingExists = async (meetingId?: number | null) => {
  if (!meetingId) return;

  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });

  if (!meeting) {
    throw new AppError(400, "Meeting does not exist");
  }
};

const hasTaskAccess = (
  task: {
    assigneeId: number | null;
    createdById: number;
  },
  currentUser: CurrentUser
) => {
  return currentUser.role === Role.BA || task.assigneeId === currentUser.id;
};

export const taskService = {
  async listTasks(currentUser: CurrentUser, query: ListTaskQuery) {
    const filters: Prisma.TaskWhereInput[] = [];

    if (query.status) filters.push({ status: query.status });
    if (query.assigneeId) filters.push({ assigneeId: query.assigneeId });
    if (query.meetingId) filters.push({ meetingId: query.meetingId });

    if (currentUser.role !== Role.BA) {
      filters.push({
        assigneeId: currentUser.id
      });
    }

    return prisma.task.findMany({
      where: filters.length ? { AND: filters } : undefined,
      include: taskInclude,
      orderBy: { updatedAt: "desc" }
    });
  },

  async getTaskById(taskId: number, currentUser: CurrentUser) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: taskInclude
    });

    if (!task) throw new AppError(404, "Task not found");

    if (!hasTaskAccess(task, currentUser)) {
      throw new AppError(403, "You do not have access to this task");
    }

    return task;
  },

  async createTask(input: CreateTaskInput, currentUser: CurrentUser) {
    await ensureMeetingExists(input.meetingId);
    const assignee = await ensureAssigneeExists(input.assigneeId);

    const task = await prisma.task.create({
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        dueDate: input.dueDate,
        meetingId: input.meetingId,
        assigneeId: input.assigneeId,
        createdById: currentUser.id
      },
      include: taskInclude
    });

    await notifyTaskAssignee(task.id, task.title, assignee);

    await auditService.createLog({
      actorId: currentUser.id,
      action: AuditAction.CREATE,
      entityName: "Task",
      entityId: task.id,
      afterData: task
    });

    return task;
  },

  async updateTask(taskId: number, input: UpdateTaskInput, currentUser: CurrentUser) {
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!existingTask) throw new AppError(404, "Task not found");

    if (!hasTaskAccess(existingTask, currentUser)) {
      throw new AppError(403, "You do not have access to this task");
    }

    const canManage =
      currentUser.role === Role.BA || existingTask.createdById === currentUser.id;

    if (!canManage && Object.keys(input).some((k) => k !== "status")) {
      throw new AppError(403, "Assignee can only update task status");
    }

    await ensureMeetingExists(input.meetingId);
    const assignee = await ensureAssigneeExists(input.assigneeId);

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        dueDate: input.dueDate,
        meetingId: input.meetingId,
        assigneeId: input.assigneeId
      },
      include: taskInclude
    });

    if (assignee && assignee.id !== existingTask.assigneeId) {
      await notifyTaskAssignee(task.id, task.title, assignee);
    }

    await auditService.createLog({
      actorId: currentUser.id,
      action: AuditAction.UPDATE,
      entityName: "Task",
      entityId: taskId,
      beforeData: existingTask,
      afterData: task
    });

    return task;
  },

  async deleteTask(taskId: number, currentUser: CurrentUser) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });

    if (!task) throw new AppError(404, "Task not found");

    if (currentUser.role !== Role.BA && task.createdById !== currentUser.id) {
      throw new AppError(403, "Only BA or creator can delete");
    }

    await prisma.task.delete({ where: { id: taskId } });

    await auditService.createLog({
      actorId: currentUser.id,
      action: AuditAction.DELETE,
      entityName: "Task",
      entityId: taskId,
      beforeData: task
    });
  },

  async sendReminder(taskId: number, currentUser: CurrentUser) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: { select: { id: true, email: true } }
      }
    });

    if (!task) throw new AppError(404, "Task not found");

    if (!hasTaskAccess(task, currentUser)) {
      throw new AppError(403, "You do not have access to this task");
    }

    await notifyTaskAssignee(task.id, task.title, task.assignee);

    await auditService.createLog({
      actorId: currentUser.id,
      action: AuditAction.UPDATE,
      entityName: "Task",
      entityId: task.id,
      afterData: { reminderSent: true }
    });
  }
};