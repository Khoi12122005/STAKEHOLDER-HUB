import { clsx, type ClassValue } from "clsx";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
};

export const formatDateInputValue = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
};

export const roleLabel = (role: string) => {
  const labels: Record<string, string> = {
    BA: "BA",
    STAKEHOLDER: "Stakeholder",
    DEVELOPER: "Developer",
    TESTER: "Tester"
  };

  return labels[role] ?? role;
};

export const statusLabel = (status: string) => {
  const labels: Record<string, string> = {
    SCHEDULED: "Scheduled",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    TODO: "To do",
    DOING: "Doing",
    DONE: "Done"
  };

  return labels[status] ?? status;
};
