import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text outline-none transition placeholder:text-dim focus:border-white/20 focus:bg-surface-2",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

