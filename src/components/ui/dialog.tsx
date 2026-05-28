import type { ReactNode } from "react";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ElevatedCard } from "@/components/ui/card";

interface DialogProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

export function Dialog({ open, title, description, onClose, children }: DialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <ElevatedCard className="w-full max-w-xl border-white/10 bg-[#0f1012]">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em]">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-muted">{description}</p>
            ) : null}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close dialog">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </ElevatedCard>
    </div>
  );
}

