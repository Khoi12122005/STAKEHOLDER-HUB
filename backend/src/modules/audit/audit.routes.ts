import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { auditController } from "./audit.controller";

export const auditRoutes = Router();

auditRoutes.use(authenticate);
auditRoutes.get("/", authorizeRoles(Role.BA), asyncHandler(auditController.listLogs));
