import { AuditAction, Prisma } from "@prisma/client";
import { Request } from "express";
import { prisma } from "../../config/prisma";

type CreateAuditLogInput = {
  actorId?: number | null;
  action: AuditAction;
  entityName: string;
  entityId?: number | null;
  beforeData?: unknown;
  afterData?: unknown;
  req?: Request;
};

export const auditService = {
  async createLog(input: CreateAuditLogInput) {
    try {
      const userAgent = input.req?.headers["user-agent"];

      await prisma.auditLog.create({
        data: {
          actorId: input.actorId ?? null,
          action: input.action,
          entityName: input.entityName,
          entityId: input.entityId ?? null,
          beforeData: input.beforeData as Prisma.InputJsonValue | undefined,
          afterData: input.afterData as Prisma.InputJsonValue | undefined,
          ipAddress: input.req?.ip,
          userAgent: Array.isArray(userAgent) ? userAgent.join(", ") : userAgent
        }
      });
    } catch (error) {
      // Ghi audit không được làm hỏng luồng nghiệp vụ chính.
      console.error("Failed to write audit log", error);
    }
  },

  async listLogs() {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      take: 100
    });
  }
};
