import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full border border-border bg-white/5 px-2.5 text-[11px] font-medium text-muted",
        className
      )}
    >
      {children}
    </span>
  );
}
