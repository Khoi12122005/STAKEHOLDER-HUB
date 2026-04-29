import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClassName: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-100",
  secondary: "border border-border bg-white text-ink hover:bg-background disabled:text-muted",
  ghost: "text-muted hover:bg-background hover:text-ink disabled:text-muted",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-100"
};

export const Button = ({ className, variant = "primary", type = "button", ...props }: ButtonProps) => (
  <button
    type={type}
    className={cn(
      "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70",
      variantClassName[variant],
      className
    )}
    {...props}
  />
);
