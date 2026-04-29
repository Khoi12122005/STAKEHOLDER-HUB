import { Request, Response } from "express";
import { sendResponse } from "../../utils/response";
import { notificationService } from "./notification.service";

export const notificationController = {
  async listNotifications(req: Request, res: Response) {
    const notifications = await notificationService.listByUser(req.user!.id);
    sendResponse(res, 200, true, "Notifications fetched successfully", notifications);
  },

  async markAsRead(req: Request, res: Response) {
    const notification = await notificationService.markAsRead(Number(req.params.id), req.user!.id);
    sendResponse(res, 200, true, "Notification marked as read", notification);
  },

  async markAllAsRead(req: Request, res: Response) {
    await notificationService.markAllAsRead(req.user!.id);
    sendResponse(res, 200, true, "All notifications marked as read");
  }
};
