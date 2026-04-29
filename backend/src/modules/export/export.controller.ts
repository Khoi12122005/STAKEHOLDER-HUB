import { Request, Response } from "express";
import { exportService } from "./export.service";

export const exportController = {
  async exportMeetingPdf(req: Request, res: Response) {
    const meetingId = Number(req.params.meetingId);
    const buffer = await exportService.exportMeetingPdf(meetingId, req.user!);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="meeting-${meetingId}.pdf"`);
    res.send(buffer);
  },

  async exportMeetingDocx(req: Request, res: Response) {
    const meetingId = Number(req.params.meetingId);
    const buffer = await exportService.exportMeetingDocx(meetingId, req.user!);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="meeting-${meetingId}.docx"`);
    res.send(buffer);
  }
};
