import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition placeholder:text-dim focus:border-white/20 focus:bg-surface-2",
        className
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

