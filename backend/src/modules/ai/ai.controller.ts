import { Request, Response } from "express";
import { sendResponse } from "../../utils/response";
import { aiService } from "./ai.service";

export const aiController = {
  async parseNotes(req: Request, res: Response) {
    const result = await aiService.parseNotes(req.body, req.user!);
    sendResponse(res, 200, true, "Meeting notes parsed successfully", result);
  }
};
