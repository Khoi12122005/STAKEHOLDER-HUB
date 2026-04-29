import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { idParamSchema } from "../../utils/validation";
import { notificationController } from "./notification.controller";

export const notificationRoutes = Router();

notificationRoutes.use(authenticate);
notificationRoutes.get("/", asyncHandler(notificationController.listNotifications));
notificationRoutes.patch("/read-all", asyncHandler(notificationController.markAllAsRead));
notificationRoutes.patch(
  "/:id/read",
  validate({ params: idParamSchema }),
  asyncHandler(notificationController.markAsRead)
);
