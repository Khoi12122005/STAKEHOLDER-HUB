import { Request, Response } from "express";
import { meetingService } from "./meeting.service";
import { sendResponse } from "../../utils/response";

export const meetingController = {
  async listMeetings(req: Request, res: Response) {
    const meetings = await meetingService.listMeetings(req.user!, req.query as never);
    sendResponse(res, 200, true, "Meetings fetched successfully", meetings);
  },

  async getMeeting(req: Request, res: Response) {
    const meeting = await meetingService.getMeetingById(Number(req.params.id), req.user!);
    sendResponse(res, 200, true, "Meeting fetched successfully", meeting);
  },

  async createMeeting(req: Request, res: Response) {
    const meeting = await meetingService.createMeeting(req.body, req.user!);
    sendResponse(res, 201, true, "Meeting created successfully", meeting);
  },

  async updateMeeting(req: Request, res: Response) {
    const meeting = await meetingService.updateMeeting(Number(req.params.id), req.body, req.user!);
    sendResponse(res, 200, true, "Meeting updated successfully", meeting);
  },

  async deleteMeeting(req: Request, res: Response) {
    await meetingService.deleteMeeting(Number(req.params.id), req.user!);
    sendResponse(res, 200, true, "Meeting deleted successfully");
  },

  async addParticipant(req: Request, res: Response) {
    await meetingService.addParticipant(Number(req.params.id), req.body, req.user!);
    sendResponse(res, 200, true, "Participant added successfully");
  },

  async removeParticipant(req: Request, res: Response) {
    await meetingService.removeParticipant(Number(req.params.id), Number(req.params.userId), req.user!);
    sendResponse(res, 200, true, "Participant removed successfully");
  },

  async sendReminder(req: Request, res: Response) {
    await meetingService.sendReminder(Number(req.params.id), req.user!);
    sendResponse(res, 200, true, "Meeting reminder sent successfully");
  }
};
