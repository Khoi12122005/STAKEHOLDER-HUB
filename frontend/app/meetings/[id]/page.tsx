"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Bot, Download, FileText, Mail, Save } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { RoleBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Message } from "@/components/ui/message";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { Meeting, MeetingStatus, TaskDraft } from "@/types/api";

const meetingStatuses: MeetingStatus[] = ["SCHEDULED", "COMPLETED", "CANCELLED"];

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

export default function MeetingDetailPage() {
  const params = useParams<{ id: string }>();
  const meetingId = Number(params.id);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingMinutes, setIsSavingMinutes] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [status, setStatus] = useState<MeetingStatus>("SCHEDULED");
  const [minutesForm, setMinutesForm] = useState({
    objective: "",
    discussion: "",
    decision: "",
    rawNotes: ""
  });
  const [aiNotes, setAiNotes] = useState("");
  const [drafts, setDrafts] = useState<TaskDraft[]>([]);

  const tasks = useMemo(() => meeting?.tasks ?? [], [meeting]);

  const loadMeeting = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await api.getMeeting(meetingId);
      setMeeting(data);
      setStatus(data.status);
      setMinutesForm({
        objective: data.minutes?.objective ?? "",
        discussion: data.minutes?.discussion ?? "",
        decision: data.minutes?.decision ?? "",
        rawNotes: data.minutes?.rawNotes ?? ""
      });
      setAiNotes(data.minutes?.rawNotes ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load meeting");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (Number.isInteger(meetingId)) {
      loadMeeting();
    }
  }, [meetingId]);

  const handleSaveMinutes = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSavingMinutes(true);

    try {
      await api.saveMinutes(meetingId, minutesForm);
      setSuccess("Meeting minutes saved successfully");
      await loadMeeting();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save minutes");
    } finally {
      setIsSavingMinutes(false);
    }
  };

  const handleParseNotes = async (createTasks: boolean) => {
    setError("");
    setSuccess("");
    setIsParsing(true);

    try {
      const result = await api.parseNotes({
        notes: aiNotes,
        meetingId,
        createTasks
      });
      setDrafts(result.drafts);

      if (createTasks) {
        setSuccess(`${result.createdTasks.length} tasks created from notes`);
        await loadMeeting();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse notes");
    } finally {
      setIsParsing(false);
    }
  };

  const handleStatusChange = async (nextStatus: MeetingStatus) => {
    setStatus(nextStatus);
    setError("");
    setSuccess("");

    try {
      await api.updateMeeting(meetingId, { status: nextStatus });
      setSuccess("Meeting status updated");
      await loadMeeting();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleExport = async (format: "pdf" | "docx") => {
    setError("");

    try {
      const blob = format === "pdf" ? await api.exportMeetingPdf(meetingId) : await api.exportMeetingDocx(meetingId);
      downloadBlob(blob, `meeting-${meetingId}.${format}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  };

  const handleReminder = async () => {
    setError("");
    setSuccess("");

    try {
      await api.sendMeetingReminder(meetingId);
      setSuccess("Meeting reminder sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reminder");
    }
  };

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div className="min-w-0">
          <Link className="text-sm font-medium text-brand-700 hover:underline" href="/meetings">
            Meetings
          </Link>
          <h1 className="mt-2 truncate text-2xl font-bold text-ink">{meeting?.title ?? "Meeting detail"}</h1>
          {meeting ? (
            <p className="mt-1 text-sm text-muted">
              {formatDateTime(meeting.startTime)} - {formatDateTime(meeting.endTime)}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleReminder}>
            <Mail className="h-4 w-4" />
            Reminder
          </Button>
          <Button variant="secondary" onClick={() => handleExport("pdf")}>
            <Download className="h-4 w-4" />
            PDF
          </Button>
          <Button variant="secondary" onClick={() => handleExport("docx")}>
            <FileText className="h-4 w-4" />
            DOCX
          </Button>
        </div>
      </div>

      {error ? <div className="mb-4"><Message tone="error">{error}</Message></div> : null}
      {success ? <div className="mb-4"><Message tone="success">{success}</Message></div> : null}

      {isLoading ? (
        <section className="rounded-md border border-border bg-white p-6 text-sm text-muted shadow-sm">Loading</section>
      ) : !meeting ? (
        <section className="rounded-md border border-border bg-white p-6 text-sm text-muted shadow-sm">Meeting not found</section>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="grid gap-6">
            <section className="rounded-md border border-border bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <h2 className="text-base font-semibold text-ink">Overview</h2>
                  <p className="mt-2 max-w-3xl text-sm text-muted">{meeting.description || "No description"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={meeting.status} />
                  <Select value={status} onChange={(event) => handleStatusChange(event.target.value as MeetingStatus)}>
                    {meetingStatuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-border bg-background p-3">
                  <p className="text-xs font-semibold uppercase text-muted">Location</p>
                  <p className="mt-1 text-sm text-ink">{meeting.location || "N/A"}</p>
                </div>
                <div className="rounded-md border border-border bg-background p-3">
                  <p className="text-xs font-semibold uppercase text-muted">Meeting URL</p>
                  <p className="mt-1 truncate text-sm text-ink">{meeting.meetingUrl || "N/A"}</p>
                </div>
              </div>
            </section>

            <section className="rounded-md border border-border bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-ink">Meeting Minutes</h2>
              <form className="mt-4 grid gap-4" onSubmit={handleSaveMinutes}>
                <Field label="Objective">
                  <Textarea
                    value={minutesForm.objective}
                    onChange={(event) => setMinutesForm({ ...minutesForm, objective: event.target.value })}
                    required
                  />
                </Field>
                <Field label="Discussion">
                  <Textarea
                    value={minutesForm.discussion}
                    onChange={(event) => setMinutesForm({ ...minutesForm, discussion: event.target.value })}
                    required
                  />
                </Field>
                <Field label="Decision">
                  <Textarea
                    value={minutesForm.decision}
                    onChange={(event) => setMinutesForm({ ...minutesForm, decision: event.target.value })}
                    required
                  />
                </Field>
                <Field label="Raw Notes">
                  <Textarea
                    value={minutesForm.rawNotes}
                    onChange={(event) => {
                      setMinutesForm({ ...minutesForm, rawNotes: event.target.value });
                      setAiNotes(event.target.value);
                    }}
                  />
                </Field>
                <Button type="submit" disabled={isSavingMinutes}>
                  <Save className="h-4 w-4" />
                  {isSavingMinutes ? "Saving" : "Save minutes"}
                </Button>
              </form>
            </section>

            <section className="rounded-md border border-border bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-ink">AI Task Extraction</h2>
              <div className="mt-4 grid gap-4">
                <Field label="Notes">
                  <Textarea value={aiNotes} onChange={(event) => setAiNotes(event.target.value)} />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => handleParseNotes(false)} disabled={isParsing || aiNotes.length < 5}>
                    <Bot className="h-4 w-4" />
                    Preview tasks
                  </Button>
                  <Button onClick={() => handleParseNotes(true)} disabled={isParsing || aiNotes.length < 5}>
                    <Bot className="h-4 w-4" />
                    Create tasks
                  </Button>
                </div>
                {drafts.length > 0 ? (
                  <div className="grid gap-2">
                    {drafts.map((draft, index) => (
                      <div key={`${draft.title}-${index}`} className="rounded-md border border-border bg-background p-3">
                        <p className="text-sm font-semibold text-ink">{draft.title}</p>
                        {draft.description ? <p className="mt-1 text-sm text-muted">{draft.description}</p> : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          <aside className="grid gap-6">
            <section className="rounded-md border border-border bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-ink">Participants</h2>
              <div className="mt-4 grid gap-3">
                {(meeting.participants ?? []).length === 0 ? (
                  <p className="text-sm text-muted">No participants</p>
                ) : (
                  meeting.participants?.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{participant.user.name}</p>
                        <p className="truncate text-xs text-muted">{participant.user.email}</p>
                      </div>
                      <RoleBadge value={participant.user.role} />
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-md border border-border bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-ink">Tasks</h2>
              <div className="mt-4 grid gap-3">
                {tasks.length === 0 ? (
                  <p className="text-sm text-muted">No tasks</p>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="rounded-md border border-border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-ink">{task.title}</p>
                        <StatusBadge value={task.status} />
                      </div>
                      <p className="mt-2 text-xs text-muted">{task.assignee?.name ?? "Unassigned"}</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>
      )}
    </AppShell>
  );
}
