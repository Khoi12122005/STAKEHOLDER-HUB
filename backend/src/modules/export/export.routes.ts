import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { meetingIdParamSchema } from "../../utils/validation";
import { exportController } from "./export.controller";

export const exportRoutes = Router();

exportRoutes.use(authenticate);
exportRoutes.get(
  "/meetings/:meetingId/pdf",
  validate({ params: meetingIdParamSchema }),
  asyncHandler(exportController.exportMeetingPdf)
);
exportRoutes.get(
  "/meetings/:meetingId/docx",
  validate({ params: meetingIdParamSchema }),
  asyncHandler(exportController.exportMeetingDocx)
);
