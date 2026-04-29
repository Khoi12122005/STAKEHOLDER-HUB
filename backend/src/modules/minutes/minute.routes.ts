import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { meetingIdParamSchema } from "../../utils/validation";
import { minuteController } from "./minute.controller";
import { upsertMinuteSchema } from "./minute.validation";

export const minuteRoutes = Router();

minuteRoutes.use(authenticate);
minuteRoutes.get(
  "/meeting/:meetingId",
  validate({ params: meetingIdParamSchema }),
  asyncHandler(minuteController.getByMeeting)
);
minuteRoutes.put(
  "/meeting/:meetingId",
  validate({ params: meetingIdParamSchema, body: upsertMinuteSchema }),
  asyncHandler(minuteController.upsertByMeeting)
);
