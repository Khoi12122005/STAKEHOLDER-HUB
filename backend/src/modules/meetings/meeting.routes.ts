import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { idParamSchema, userIdParamSchema } from "../../utils/validation";
import { meetingController } from "./meeting.controller";
import {
  createMeetingSchema,
  listMeetingQuerySchema,
  participantSchema,
  updateMeetingSchema
} from "./meeting.validation";

export const meetingRoutes = Router();

meetingRoutes.use(authenticate);

meetingRoutes.get("/", validate({ query: listMeetingQuerySchema }), asyncHandler(meetingController.listMeetings));
meetingRoutes.post(
  "/",
  authorizeRoles(Role.BA),
  validate({ body: createMeetingSchema }),
  asyncHandler(meetingController.createMeeting)
);
meetingRoutes.get("/:id", validate({ params: idParamSchema }), asyncHandler(meetingController.getMeeting));
meetingRoutes.put(
  "/:id",
  authorizeRoles(Role.BA),
  validate({ params: idParamSchema, body: updateMeetingSchema }),
  asyncHandler(meetingController.updateMeeting)
);
meetingRoutes.delete(
  "/:id",
  authorizeRoles(Role.BA),
  validate({ params: idParamSchema }),
  asyncHandler(meetingController.deleteMeeting)
);
meetingRoutes.post(
  "/:id/participants",
  authorizeRoles(Role.BA),
  validate({ params: idParamSchema, body: participantSchema }),
  asyncHandler(meetingController.addParticipant)
);
meetingRoutes.delete(
  "/:id/participants/:userId",
  authorizeRoles(Role.BA),
  validate({ params: idParamSchema.merge(userIdParamSchema) }),
  asyncHandler(meetingController.removeParticipant)
);
meetingRoutes.post(
  "/:id/reminders",
  authorizeRoles(Role.BA),
  validate({ params: idParamSchema }),
  asyncHandler(meetingController.sendReminder)
);
