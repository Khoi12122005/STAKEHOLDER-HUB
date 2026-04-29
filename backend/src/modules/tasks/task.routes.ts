import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { idParamSchema } from "../../utils/validation";
import { taskController } from "./task.controller";
import { createTaskSchema, listTaskQuerySchema, updateTaskSchema } from "./task.validation";

export const taskRoutes = Router();

taskRoutes.use(authenticate);
taskRoutes.get("/", validate({ query: listTaskQuerySchema }), asyncHandler(taskController.listTasks));
taskRoutes.post(
  "/",
  authorizeRoles(Role.BA, Role.DEVELOPER, Role.TESTER),
  validate({ body: createTaskSchema }),
  asyncHandler(taskController.createTask)
);
taskRoutes.get("/:id", validate({ params: idParamSchema }), asyncHandler(taskController.getTask));
taskRoutes.put(
  "/:id",
  validate({ params: idParamSchema, body: updateTaskSchema }),
  asyncHandler(taskController.updateTask)
);
taskRoutes.delete(
  "/:id",
  authorizeRoles(Role.BA, Role.DEVELOPER, Role.TESTER),
  validate({ params: idParamSchema }),
  asyncHandler(taskController.deleteTask)
);
taskRoutes.post(
  "/:id/reminders",
  validate({ params: idParamSchema }),
  asyncHandler(taskController.sendReminder)
);
