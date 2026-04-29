import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import PDFDocument from "pdfkit";
import { Role } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import { auditService } from "../audit/audit.service";
import { AuditAction } from "@prisma/client";

type CurrentUser = {
  id: number;
  role: Role;
};

const getMeetingForExport = async (meetingId: number, currentUser: CurrentUser) => {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      createdBy: { select: { id: true, name: true, email: true, role: true } },
      participants: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } }
      },
      minutes: true,
      tasks: {
        include: { assignee: { select: { id: true, name: true, email: true } } }
      }
    }
  });

  if (!meeting) {
    throw new AppError(404, "Meeting not found");
  }

  const canExport =
    currentUser.role === Role.BA ||
    meeting.createdById === currentUser.id ||
    meeting.participants.some((participant) => participant.userId === currentUser.id);

  if (!canExport) {
    throw new AppError(403, "You do not have access to export this meeting");
  }

  return meeting;
};

const buildPdfBuffer = async (meeting: Awaited<ReturnType<typeof getMeetingForExport>>) => {
  return new Promise<Buffer>((resolve) => {
    const doc = new PDFDocument({ margin: 48 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.fontSize(20).text(meeting.title);
    doc.moveDown();
    doc.fontSize(11).text(`Status: ${meeting.status}`);
    doc.text(`Start: ${meeting.startTime.toISOString()}`);
    doc.text(`End: ${meeting.endTime.toISOString()}`);
    doc.text(`Created by: ${meeting.createdBy.name}`);
    doc.moveDown();

    doc.fontSize(14).text("Participants");
    meeting.participants.forEach((participant) => {
      doc.fontSize(11).text(`- ${participant.user.name} (${participant.user.role})`);
    });
    doc.moveDown();

    doc.fontSize(14).text("Minutes");
    doc.fontSize(11).text(`Objective: ${meeting.minutes?.objective ?? "N/A"}`);
    doc.text(`Discussion: ${meeting.minutes?.discussion ?? "N/A"}`);
    doc.text(`Decision: ${meeting.minutes?.decision ?? "N/A"}`);
    doc.moveDown();

    doc.fontSize(14).text("Tasks");
    meeting.tasks.forEach((task) => {
      doc.fontSize(11).text(`- [${task.status}] ${task.title} - ${task.assignee?.name ?? "Unassigned"}`);
    });

    doc.end();
  });
};

const paragraph = (text: string) => new Paragraph({ children: [new TextRun(text)] });

const buildDocxBuffer = async (meeting: Awaited<ReturnType<typeof getMeetingForExport>>) => {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: meeting.title, heading: HeadingLevel.TITLE }),
          paragraph(`Status: ${meeting.status}`),
          paragraph(`Start: ${meeting.startTime.toISOString()}`),
          paragraph(`End: ${meeting.endTime.toISOString()}`),
          paragraph(`Created by: ${meeting.createdBy.name}`),
          new Paragraph({ text: "Participants", heading: HeadingLevel.HEADING_1 }),
          ...meeting.participants.map((participant) =>
            paragraph(`${participant.user.name} (${participant.user.role})`)
          ),
          new Paragraph({ text: "Minutes", heading: HeadingLevel.HEADING_1 }),
          paragraph(`Objective: ${meeting.minutes?.objective ?? "N/A"}`),
          paragraph(`Discussion: ${meeting.minutes?.discussion ?? "N/A"}`),
          paragraph(`Decision: ${meeting.minutes?.decision ?? "N/A"}`),
          new Paragraph({ text: "Tasks", heading: HeadingLevel.HEADING_1 }),
          ...meeting.tasks.map((task) =>
            paragraph(`[${task.status}] ${task.title} - ${task.assignee?.name ?? "Unassigned"}`)
          )
        ]
      }
    ]
  });

  return Packer.toBuffer(doc);
};

export const exportService = {
  async exportMeetingPdf(meetingId: number, currentUser: CurrentUser) {
    const meeting = await getMeetingForExport(meetingId, currentUser);
    const buffer = await buildPdfBuffer(meeting);

    await auditService.createLog({
      actorId: currentUser.id,
      action: AuditAction.EXPORT,
      entityName: "Meeting",
      entityId: meetingId,
      afterData: { format: "PDF" }
    });

    return buffer;
  },

  async exportMeetingDocx(meetingId: number, currentUser: CurrentUser) {
    const meeting = await getMeetingForExport(meetingId, currentUser);
    const buffer = await buildDocxBuffer(meeting);

    await auditService.createLog({
      actorId: currentUser.id,
      action: AuditAction.EXPORT,
      entityName: "Meeting",
      entityId: meetingId,
      afterData: { format: "DOCX" }
    });

    return buffer;
  }
};
