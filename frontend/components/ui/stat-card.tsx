import { LucideIcon } from "lucide-react";

export const StatCard = ({
  title,
  value,
  icon: Icon,
  note
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  note?: string;
}) => (
  <section className="rounded-md border border-border bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-muted">{title}</p>
        <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
      </div>
      <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-50 text-brand-700">
        <Icon className="h-5 w-5" />
      </span>
    </div>
    {note ? <p className="mt-3 text-sm text-muted">{note}</p> : null}
  </section>
);
