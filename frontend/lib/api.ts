import type {
  ApiResponse,
  LoginResult,
  Meeting,
  MeetingMinute,
  MeetingStatus,
  Notification,
  ParseNotesResult,
  Role,
  Task,
  TaskStatus,
  User
} from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const TOKEN_KEY = "scmh_token";
const USER_KEY = "scmh_user";

type RequestOptions = RequestInit & {
  auth?: boolean;
};

const isBrowser = () => typeof window !== "undefined";

export const getToken = () => {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
};

export const getStoredUser = (): User | null => {
  if (!isBrowser()) {
    return null;
  }

  const value = window.localStorage.getItem(USER_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as User;
  } catch {
    return null;
  }
};

export const setSession = (result: LoginResult) => {
  window.localStorage.setItem(TOKEN_KEY, result.accessToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(result.user));
};

export const clearSession = () => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
};

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (options.auth !== false) {
    const token = getToken();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message ?? "Request failed");
  }

  return payload.data;
};

const download = async (path: string) => {
  const headers = new Headers();
  const token = getToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, { headers });

  if (!response.ok) {
    throw new Error("Export failed");
  }

  return response.blob();
};

export const api = {
  login: (input: { email: string; password: string }) =>
    request<LoginResult>("/api/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify(input)
    }),

  register: (input: { name: string; email: string; password: string; role: Role }) =>
    request<LoginResult>("/api/auth/register", {
      method: "POST",
      auth: false,
      body: JSON.stringify(input)
    }),

  me: () => request<User>("/api/auth/me"),

  listMeetings: (query?: { status?: MeetingStatus; search?: string }) => {
    const params = new URLSearchParams();

    if (query?.status) {
      params.set("status", query.status);
    }

    if (query?.search) {
      params.set("search", query.search);
    }

    const suffix = params.toString() ? `?${params.toString()}` : "";
    return request<Meeting[]>(`/api/meetings${suffix}`);
  },

  getMeeting: (id: number) => request<Meeting>(`/api/meetings/${id}`),

  createMeeting: (input: {
    title: string;
    description?: string;
    location?: string;
    meetingUrl?: string;
    startTime: string;
    endTime: string;
    participantIds: number[];
  }) =>
    request<Meeting>("/api/meetings", {
      method: "POST",
      body: JSON.stringify(input)
    }),

  updateMeeting: (id: number, input: Partial<Meeting> & { participantIds?: number[] }) =>
    request<Meeting>(`/api/meetings/${id}`, {
      method: "PUT",
      body: JSON.stringify(input)
    }),

  deleteMeeting: (id: number) =>
    request<null>(`/api/meetings/${id}`, {
      method: "DELETE"
    }),

  sendMeetingReminder: (id: number) =>
    request<null>(`/api/meetings/${id}/reminders`, {
      method: "POST"
    }),

  getMinutes: (meetingId: number) => request<MeetingMinute>(`/api/minutes/meeting/${meetingId}`),

  saveMinutes: (
    meetingId: number,
    input: { objective: string; discussion: string; decision: string; rawNotes?: string }
  ) =>
    request<MeetingMinute>(`/api/minutes/meeting/${meetingId}`, {
      method: "PUT",
      body: JSON.stringify(input)
    }),

  listTasks: (query?: { status?: TaskStatus; assigneeId?: number; meetingId?: number }) => {
    const params = new URLSearchParams();

    if (query?.status) {
      params.set("status", query.status);
    }

    if (query?.assigneeId) {
      params.set("assigneeId", String(query.assigneeId));
    }

    if (query?.meetingId) {
      params.set("meetingId", String(query.meetingId));
    }

    const suffix = params.toString() ? `?${params.toString()}` : "";
    return request<Task[]>(`/api/tasks${suffix}`);
  },

  createTask: (input: {
    title: string;
    description?: string;
    dueDate?: string;
    meetingId?: number;
    assigneeId?: number;
  }) =>
    request<Task>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(input)
    }),

  updateTask: (id: number, input: Partial<Task>) =>
    request<Task>(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(input)
    }),

  deleteTask: (id: number) =>
    request<null>(`/api/tasks/${id}`, {
      method: "DELETE"
    }),

  sendTaskReminder: (id: number) =>
    request<null>(`/api/tasks/${id}/reminders`, {
      method: "POST"
    }),

  parseNotes: (input: { notes: string; meetingId?: number; createTasks: boolean }) =>
    request<ParseNotesResult>("/api/ai/parse-notes", {
      method: "POST",
      body: JSON.stringify(input)
    }),

  listNotifications: () => request<Notification[]>("/api/notifications"),

  markNotificationRead: (id: number) =>
    request<Notification>(`/api/notifications/${id}/read`, {
      method: "PATCH"
    }),

  markAllNotificationsRead: () =>
    request<null>("/api/notifications/read-all", {
      method: "PATCH"
    }),

  exportMeetingPdf: (meetingId: number) => download(`/api/export/meetings/${meetingId}/pdf`),

  exportMeetingDocx: (meetingId: number) => download(`/api/export/meetings/${meetingId}/docx`)
};
