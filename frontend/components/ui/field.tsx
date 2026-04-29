import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const fieldClassName =
  "min-h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink shadow-sm transition placeholder:text-muted/70 focus:border-brand-500";

export const Field = ({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <label className="grid gap-1.5 text-sm font-medium text-ink">
    <span>{label}</span>
    {children}
  </label>
);

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn(fieldClassName, className)} {...props} />
);

export const Textarea = ({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cn(fieldClassName, "min-h-28 resize-y", className)} {...props} />
);

export const Select = ({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={cn(fieldClassName, className)} {...props} />
);
