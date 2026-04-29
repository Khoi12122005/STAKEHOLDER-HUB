import { AuditAction, TaskStatus } from "@prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import { auditService } from "../audit/audit.service";
import { ParseNotesInput } from "./ai.validation";

type TaskDraft = {
  title: string;
  description?: string;
  status: TaskStatus;
};

type CurrentUser = {
  id: number;
};

const normalizeTaskDrafts = (value: unknown): TaskDraft[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const drafts: TaskDraft[] = [];

  value.forEach((item) => {
    if (!item || typeof item !== "object") {
      return;
    }

    const record = item as Record<string, unknown>;
    const title = typeof record.title === "string" ? record.title.trim() : "";

    if (!title) {
      return;
    }

    drafts.push({
      title: title.slice(0, 220),
      description: typeof record.description === "string" ? record.description : undefined,
      status: TaskStatus.TODO
    });
  });

  return drafts;
};

const parseJsonArray = (content: string): TaskDraft[] => {
  const cleanContent = content.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleanContent);
  return normalizeTaskDrafts(parsed);
};

const parseNotesLocally = (notes: string): TaskDraft[] => {
  const lines = notes
    .split(/\r?\n|[.;]/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);

  const candidateLines = lines.filter((line) =>
    /(todo|task|action|assign|follow|fix|review|prepare|update|test|implement|confirm|send)/i.test(line)
  );

  const sourceLines = candidateLines.length > 0 ? candidateLines : lines.slice(0, 3);

  if (sourceLines.length === 0) {
    return [
      {
        title: "Review meeting notes and define next actions",
        description: notes.slice(0, 500),
        status: TaskStatus.TODO
      }
    ];
  }

  return sourceLines.slice(0, 8).map((line) => ({
    title: line.slice(0, 220),
    description: `Generated from meeting note: ${line}`,
    status: TaskStatus.TODO
  }));
};

const parseNotesWithOpenAi = async (notes: string): Promise<TaskDraft[]> => {
  if (!env.openaiApiKey) {
    return parseNotesLocally(notes);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.openaiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: env.openaiModel,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "Extract actionable tasks from meeting notes. Return only a JSON array. Each item must have title and optional description."
          },
          {
            role: "user",
            content: notes
          }
        ]
      })
    });

    if (!response.ok) {
      return parseNotesLocally(notes);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return parseNotesLocally(notes);
    }

    const parsedTasks = parseJsonArray(content);
    return parsedTasks.length > 0 ? parsedTasks : parseNotesLocally(notes);
  } catch {
    return parseNotesLocally(notes);
  }
};

export const aiService = {
  async parseNotes(input: ParseNotesInput, currentUser: CurrentUser) {
    if (input.meetingId) {
      const meeting = await prisma.meeting.findUnique({ where: { id: input.meetingId } });

      if (!meeting) {
        throw new AppError(400, "Meeting does not exist");
      }
    }

    const drafts = await parseNotesWithOpenAi(input.notes);

    if (!input.createTasks) {
      return { drafts, createdTasks: [] };
    }

    const createdTasks = await prisma.$transaction(
      drafts.map((draft) =>
        prisma.task.create({
          data: {
            title: draft.title,
            description: draft.description,
            status: draft.status,
            meetingId: input.meetingId,
            createdById: currentUser.id
          }
        })
      )
    );

    await auditService.createLog({
      actorId: currentUser.id,
      action: AuditAction.CREATE,
      entityName: "Task",
      afterData: { source: "AI_PARSE_NOTES", taskIds: createdTasks.map((task) => task.id) }
    });

    return { drafts, createdTasks };
  }
};
