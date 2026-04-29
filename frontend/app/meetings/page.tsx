"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CalendarPlus, Search, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Message } from "@/components/ui/message";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { Meeting, MeetingStatus } from "@/types/api";

const meetingStatuses: MeetingStatus[] = ["SCHEDULED", "COMPLETED", "CANCELLED"];

const parseIds = (value: string) =>
  value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item > 0);

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MeetingStatus | "">("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    meetingUrl: "",
    startTime: "",
    endTime: "",
    participantIds: ""
  });

  const loadMeetings = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await api.listMeetings({
        status: status || undefined,
        search: search || undefined
      });
      setMeetings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load meetings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, [status]);

  const handleCreateMeeting = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      await api.createMeeting({
        title: form.title,
        description: form.description || undefined,
        location: form.location || undefined,
        meetingUrl: form.meetingUrl || undefined,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        participantIds: parseIds(form.participantIds)
      });
      setSuccess("Meeting created successfully");
      setForm({
        title: "",
        description: "",
        location: "",
        meetingUrl: "",
        startTime: "",
        endTime: "",
        participantIds: ""
      });
      await loadMeetings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create meeting");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setError("");
    setSuccess("");

    try {
      await api.deleteMeeting(id);
      setSuccess("Meeting deleted successfully");
      await loadMeetings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete meeting");
    }
  };

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold text-ink">Meetings</h1>
          <p className="mt-1 text-sm text-muted">Schedule, track minutes, and manage participants.</p>
        </div>
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); loadMeetings(); }}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <Input
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search meetings"
            />
          </div>
          <Select value={status} onChange={(event) => setStatus(event.target.value as MeetingStatus | "")}>
            <option value="">All status</option>
            {meetingStatuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-md border border-border bg-white shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-ink">Meeting List</h2>
          </div>
          {error ? <div className="p-5"><Message tone="error">{error}</Message></div> : null}
          {success ? <div className="p-5"><Message tone="success">{success}</Message></div> : null}

          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="px-5 py-6 text-sm text-muted">Loading</div>
            ) : meetings.length === 0 ? (
              <div className="px-5 py-6 text-sm text-muted">No meetings found</div>
            ) : (
              meetings.map((meeting) => (
                <div key={meeting.id} className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_auto]">
                  <Link href={`/meetings/${meeting.id}`} className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-ink">{meeting.title}</h3>
                      <StatusBadge value={meeting.status} />
                    </div>
                    <p className="mt-2 text-sm text-muted">{formatDateTime(meeting.startTime)}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{meeting.description || "No description"}</p>
                  </Link>
                  <Button variant="ghost" className="h-10 px-3 text-red-600" onClick={() => handleDelete(meeting.id)} aria-label="Delete meeting">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-md border border-border bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-ink">Create Meeting</h2>
          <form className="mt-4 grid gap-4" onSubmit={handleCreateMeeting}>
            <Field label="Title">
              <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            </Field>
            <Field label="Description">
              <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start">
                <Input type="datetime-local" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} required />
              </Field>
              <Field label="End">
                <Input type="datetime-local" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} required />
              </Field>
            </div>
            <Field label="Location">
              <Input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
            </Field>
            <Field label="Meeting URL">
              <Input type="url" value={form.meetingUrl} onChange={(event) => setForm({ ...form, meetingUrl: event.target.value })} />
            </Field>
            <Field label="Participant IDs">
              <Input value={form.participantIds} onChange={(event) => setForm({ ...form, participantIds: event.target.value })} placeholder="2, 3, 4" />
            </Field>
            <Button type="submit" disabled={isSubmitting}>
              <CalendarPlus className="h-4 w-4" />
              {isSubmitting ? "Creating" : "Create meeting"}
            </Button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
