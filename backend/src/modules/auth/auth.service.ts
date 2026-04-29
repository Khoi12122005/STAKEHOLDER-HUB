import bcrypt from "bcryptjs";
import { AuditAction, Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import { signAccessToken } from "../../utils/auth";
import { auditService } from "../audit/audit.service";
import { LoginInput, RegisterInput } from "./auth.validation";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true
};

export const authService = {
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({ where: { email: input.email } });

    if (existingUser) {
      throw new AppError(409, "Email is already registered");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role ?? Role.STAKEHOLDER
      },
      select: userSelect
    });

    await auditService.createLog({
      actorId: user.id,
      action: AuditAction.CREATE,
      entityName: "User",
      entityId: user.id,
      afterData: user
    });

    return {
      user,
      accessToken: signAccessToken({ userId: user.id, role: user.role })
    };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });

    if (!user || !user.isActive) {
      throw new AppError(401, "Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError(401, "Invalid email or password");
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    await auditService.createLog({
      actorId: user.id,
      action: AuditAction.LOGIN,
      entityName: "User",
      entityId: user.id
    });

    return {
      user: safeUser,
      accessToken: signAccessToken({ userId: user.id, role: user.role })
    };
  },

  async getProfile(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    return user;
  }
};
