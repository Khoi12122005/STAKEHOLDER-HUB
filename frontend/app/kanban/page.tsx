"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, BellRing, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Message } from "@/components/ui/message";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types/api";

const columns: Array<{ status: TaskStatus; title: string }> = [
  { status: "TODO", title: "To do" },
  { status: "DOING", title: "Doing" },
  { status: "DONE", title: "Done" }
];

const nextStatus: Record<TaskStatus, TaskStatus> = {
  TODO: "DOING",
  DOING: "DONE",
  DONE: "TODO"
};

const toOptionalNumber = (value: string) => {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : undefined;
};

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    meetingId: "",
    assigneeId: ""
  });

  const groupedTasks = useMemo(
    () =>
      columns.reduce<Record<TaskStatus, Task[]>>(
        (result, column) => ({
          ...result,
          [column.status]: tasks.filter((task) => task.status === column.status)
        }),
        { TODO: [], DOING: [], DONE: [] }
      ),
    [tasks]
  );

  const loadTasks = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await api.listTasks();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      await api.createTask({
        title: form.title,
        description: form.description || undefined,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        meetingId: toOptionalNumber(form.meetingId),
        assigneeId: toOptionalNumber(form.assigneeId)
      });
      setSuccess("Task created successfully");
      setForm({ title: "", description: "", dueDate: "", meetingId: "", assigneeId: "" });
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatus = async (task: Task) => {
    setError("");
    setSuccess("");

    try {
      await api.updateTask(task.id, { status: nextStatus[task.status] });
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  const deleteTask = async (taskId: number) => {
    setError("");
    setSuccess("");

    try {
      await api.deleteTask(taskId);
      setSuccess("Task deleted successfully");
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    }
  };

  const sendReminder = async (taskId: number) => {
    setError("");
    setSuccess("");

    try {
      await api.sendTaskReminder(taskId);
      setSuccess("Task reminder sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reminder");
    }
  };

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold text-ink">Kanban Board</h1>
          <p className="mt-1 text-sm text-muted">Track meeting action items by status.</p>
        </div>
      </div>

      {error ? <div className="mb-4"><Message tone="error">{error}</Message></div> : null}
      {success ? <div className="mb-4"><Message tone="success">{success}</Message></div> : null}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-md border border-border bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-ink">Create Task</h2>
          <form className="mt-4 grid gap-4" onSubmit={handleCreateTask}>
            <Field label="Title">
              <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            </Field>
            <Field label="Description">
              <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </Field>
            <Field label="Due Date">
              <Input type="datetime-local" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <Field label="Meeting ID">
                <Input inputMode="numeric" value={form.meetingId} onChange={(event) => setForm({ ...form, meetingId: event.target.value })} />
              </Field>
              <Field label="Assignee ID">
                <Input inputMode="numeric" value={form.assigneeId} onChange={(event) => setForm({ ...form, assigneeId: event.target.value })} />
              </Field>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              <Plus className="h-4 w-4" />
              {isSubmitting ? "Creating" : "Create task"}
            </Button>
          </form>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {columns.map((column) => (
            <div key={column.status} className="min-h-[520px] rounded-md border border-border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold text-ink">{column.title}</h2>
                <span className="rounded-full bg-background px-2 py-1 text-xs font-semibold text-muted">
                  {groupedTasks[column.status].length}
                </span>
              </div>

              <div className="grid gap-3 p-3">
                {isLoading ? (
                  <p className="px-2 py-3 text-sm text-muted">Loading</p>
                ) : groupedTasks[column.status].length === 0 ? (
                  <p className="px-2 py-3 text-sm text-muted">No tasks</p>
                ) : (
                  groupedTasks[column.status].map((task) => (
                    <article key={task.id} className="rounded-md border border-border bg-background p-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-semibold text-ink">{task.title}</h3>
                        <StatusBadge value={task.status} />
                      </div>
                      {task.description ? <p className="mt-2 line-clamp-3 text-sm text-muted">{task.description}</p> : null}
                      <div className="mt-3 grid gap-1 text-xs text-muted">
                        <p>Assignee: {task.assignee?.name ?? "Unassigned"}</p>
                        <p>Due: {formatDateTime(task.dueDate)}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button className="h-8 px-2" variant="secondary" onClick={() => updateStatus(task)} aria-label="Move task">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button className="h-8 px-2" variant="secondary" onClick={() => sendReminder(task.id)} aria-label="Send task reminder">
                          <BellRing className="h-4 w-4" />
                        </Button>
                        <Button className="h-8 px-2 text-red-600" variant="ghost" onClick={() => deleteTask(task.id)} aria-label="Delete task">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
