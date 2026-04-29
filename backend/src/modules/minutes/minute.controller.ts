import { Request, Response } from "express";
import { sendResponse } from "../../utils/response";
import { minuteService } from "./minute.service";

export const minuteController = {
  async getByMeeting(req: Request, res: Response) {
    const minute = await minuteService.getByMeetingId(Number(req.params.meetingId), req.user!);
    sendResponse(res, 200, true, "Meeting minutes fetched successfully", minute);
  },

  async upsertByMeeting(req: Request, res: Response) {
    const minute = await minuteService.upsertByMeetingId(Number(req.params.meetingId), req.body, req.user!);
    sendResponse(res, 200, true, "Meeting minutes saved successfully", minute);
  }
};
