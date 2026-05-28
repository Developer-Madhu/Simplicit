import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-zinc-100 text-zinc-950 shadow-soft hover:bg-white",
  secondary:
    "border-border bg-surface text-text hover:border-border-strong hover:bg-white/5",
  ghost: "border-transparent bg-transparent text-muted hover:bg-white/5 hover:text-text",
  outline: "border-border bg-transparent text-text hover:border-border-strong hover:bg-white/5"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 rounded-md px-3 text-xs",
  md: "h-10 rounded-md px-4 text-sm",
  lg: "h-11 rounded-lg px-5 text-sm"
};

export function buttonStyles({
  variant = "secondary",
  size = "md",
  className
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 border font-medium tracking-[-0.01em] transition disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", ...props }, ref) => {
    return <button ref={ref} className={buttonStyles({ variant, size, className })} {...props} />;
  }
);

Button.displayName = "Button";
