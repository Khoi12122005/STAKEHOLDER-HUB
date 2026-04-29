import { cn } from "@/lib/utils";

export const Message = ({
  tone,
  children
}: {
  tone: "error" | "success" | "info";
  children: React.ReactNode;
}) => {
  const className = {
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    info: "border-blue-200 bg-blue-50 text-blue-700"
  }[tone];

  return <div className={cn("rounded-md border px-3 py-2 text-sm", className)}>{children}</div>;
};
