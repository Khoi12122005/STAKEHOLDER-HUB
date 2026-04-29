import { MeetingStatus, Role, TaskStatus } from "@/types/api";
import { cn, roleLabel, statusLabel } from "@/lib/utils";

const statusClassName: Record<string, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700 ring-blue-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200",
  TODO: "bg-slate-100 text-slate-700 ring-slate-200",
  DOING: "bg-amber-50 text-amber-700 ring-amber-200",
  DONE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  BA: "bg-brand-50 text-brand-700 ring-brand-100",
  STAKEHOLDER: "bg-sky-50 text-sky-700 ring-sky-200",
  DEVELOPER: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  TESTER: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200"
};

export const StatusBadge = ({ value }: { value: MeetingStatus | TaskStatus }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
      statusClassName[value]
    )}
  >
    {statusLabel(value)}
  </span>
);

export const RoleBadge = ({ value }: { value: Role }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
      statusClassName[value]
    )}
  >
    {roleLabel(value)}
  </span>
);
