import nodemailer from "nodemailer";
import { env } from "../../config/env";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

const createTransporter = () => {
  if (!env.smtpHost) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth:
      env.smtpUser && env.smtpPass
        ? {
            user: env.smtpUser,
            pass: env.smtpPass
          }
        : undefined
  });
};

export const emailService = {
  async sendEmail(input: SendEmailInput) {
    const transporter = createTransporter();

    if (!transporter) {
      // Dev local chưa cấu hình SMTP vẫn chạy API bình thường.
      return;
    }

    await transporter.sendMail({
      from: env.smtpFrom,
      to: input.to,
      subject: input.subject,
      html: input.html
    });
  },

  async sendMeetingReminder(to: string, meetingTitle: string, startTime: Date) {
    await this.sendEmail({
      to,
      subject: `Meeting reminder: ${meetingTitle}`,
      html: `<p>You have a meeting: <strong>${meetingTitle}</strong></p><p>Start time: ${startTime.toISOString()}</p>`
    });
  },

  async sendTaskReminder(to: string, taskTitle: string) {
    await this.sendEmail({
      to,
      subject: `Task reminder: ${taskTitle}`,
      html: `<p>You have a task assigned: <strong>${taskTitle}</strong></p>`
    });
  }
};
