"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, ClipboardList, Clock3, ListTodo } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Message } from "@/components/ui/message";
import { StatCard } from "@/components/ui/stat-card";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { Meeting, Notification, Task } from "@/types/api";

export default function DashboardPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setError("");
      setIsLoading(true);

      try {
        const [meetingData, taskData, notificationData] = await Promise.all([
          api.listMeetings(),
          api.listTasks(),
          api.listNotifications()
        ]);
        setMeetings(meetingData);
        setTasks(taskData);
        setNotifications(notificationData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const taskSummary = useMemo(
    () => ({
      todo: tasks.filter((task) => task.status === "TODO").length,
      doing: tasks.filter((task) => task.status === "DOING").length,
      done: tasks.filter((task) => task.status === "DONE").length
    }),
    [tasks]
  );

  const upcomingMeetings = meetings
    .filter((meeting) => meeting.status === "SCHEDULED")
    .sort((first, second) => new Date(first.startTime).getTime() - new Date(second.startTime).getTime())
    .slice(0, 5);

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Meetings, action items, and reminders.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/meetings">
            <Button variant="secondary">
              <CalendarCheck className="h-4 w-4" />
              Meetings
            </Button>
          </Link>
          <Link href="/kanban">
            <Button>
              <ListTodo className="h-4 w-4" />
              Kanban
            </Button>
          </Link>
        </div>
      </div>

      {error ? <Message tone="error">{error}</Message> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Meetings" value={meetings.length} icon={CalendarCheck} note="Visible to your role" />
        <StatCard title="Tasks" value={tasks.length} icon={ClipboardList} note="Assigned or accessible" />
        <StatCard title="In progress" value={taskSummary.doing} icon={Clock3} note="Current delivery work" />
        <StatCard title="Unread" value={notifications.filter((item) => !item.isRead).length} icon={ListTodo} note="Open alerts" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-md border border-border bg-white shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-ink">Upcoming Meetings</h2>
          </div>
          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="px-5 py-6 text-sm text-muted">Loading</div>
            ) : upcomingMeetings.length === 0 ? (
              <div className="px-5 py-6 text-sm text-muted">No scheduled meetings</div>
            ) : (
              upcomingMeetings.map((meeting) => (
                <Link
                  key={meeting.id}
                  href={`/meetings/${meeting.id}`}
                  className="grid gap-3 px-5 py-4 transition hover:bg-background md:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{meeting.title}</p>
                    <p className="mt-1 text-sm text-muted">{formatDateTime(meeting.startTime)}</p>
                  </div>
                  <StatusBadge value={meeting.status} />
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="rounded-md border border-border bg-white shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-ink">Task Flow</h2>
          </div>
          <div className="grid gap-3 p-5">
            {[
              ["To do", taskSummary.todo, "bg-slate-200"],
              ["Doing", taskSummary.doing, "bg-amber-300"],
              ["Done", taskSummary.done, "bg-emerald-300"]
            ].map(([label, value, color]) => (
              <div key={label as string} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">{label}</span>
                  <span className="font-semibold text-muted">{value}</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-background">
                  <div
                    className={`h-2 rounded-full ${color}`}
                    style={{ width: `${tasks.length ? (Number(value) / tasks.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
