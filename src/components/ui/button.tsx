import { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type ButtonVariant = "primary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const baseClasses =
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-slate-900";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-slate-900 text-slate-50 hover:bg-slate-800",
  outline:
    "border border-slate-700 bg-transparent hover:bg-slate-900 hover:text-slate-50",
  ghost: "bg-transparent hover:bg-slate-800 hover:text-slate-50",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3",
  md: "h-9 px-4",
  lg: "h-10 px-6",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}

