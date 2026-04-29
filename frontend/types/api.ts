export type Role = "BA" | "STAKEHOLDER" | "DEVELOPER" | "TESTER";

export type MeetingStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export type TaskStatus = "TODO" | "DOING" | "DONE";

export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type MeetingParticipant = {
  id: number;
  meetingId: number;
  userId: number;
  joinedAt: string;
  user: User;
};

export type MeetingMinute = {
  id: number;
  meetingId: number;
  objective: string;
  discussion: string;
  decision: string;
  rawNotes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Meeting = {
  id: number;
  title: string;
  description?: string | null;
  location?: string | null;
  meetingUrl?: string | null;
  startTime: string;
  endTime: string;
  status: MeetingStatus;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: User;
  participants?: MeetingParticipant[];
  minutes?: MeetingMinute | null;
  tasks?: Task[];
};

export type Task = {
  id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueDate?: string | null;
  meetingId?: number | null;
  assigneeId?: number | null;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  assignee?: User | null;
  createdBy?: User;
  meeting?: Meeting | null;
};

export type Notification = {
  id: number;
  userId: number;
  meetingId?: number | null;
  taskId?: number | null;
  type: "MEETING" | "TASK" | "SYSTEM";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  meeting?: Meeting | null;
  task?: Task | null;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type LoginResult = {
  user: User;
  accessToken: string;
};

export type TaskDraft = {
  title: string;
  description?: string;
  status: TaskStatus;
};

export type ParseNotesResult = {
  drafts: TaskDraft[];
  createdTasks: Task[];
};
