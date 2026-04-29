import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { aiController } from "./ai.controller";
import { parseNotesSchema } from "./ai.validation";

export const aiRoutes = Router();

aiRoutes.use(authenticate);
aiRoutes.post("/parse-notes", validate({ body: parseNotesSchema }), asyncHandler(aiController.parseNotes));
