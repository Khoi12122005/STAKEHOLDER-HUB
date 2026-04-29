import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";

export const notificationService = {
  async listByUser(userId: number) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        meeting: true,
        task: true
      }
    });
  },

  async markAsRead(notificationId: number, userId: number) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      throw new AppError(404, "Notification not found");
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
  },

  async markAllAsRead(userId: number) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }
};
