"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Icons } from "@/components/ui/icons";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextProps {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast: showToast }}>
      {children}
      
      {/* Toast container */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => {
          let dotColor = "var(--sf-text-muted)";
          if (t.type === "success") dotColor = "var(--sf-green)";
          if (t.type === "error") dotColor = "var(--sf-red)";
          if (t.type === "info") dotColor = "var(--sf-blue)";

          return (
            <div
              key={t.id}
              className="sf-card-elev"
              style={{
                pointerEvents: "auto",
                minWidth: 300,
                maxWidth: 420,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                backdropFilter: "blur(12px)",
                background: "rgba(22, 22, 26, 0.85)",
                border: "1px solid var(--sf-border-strong)",
                boxShadow: "var(--sf-shadow-lg)",
                animation: "sf-toast-slide 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              }}
            >
              <span
                className="sf-dot"
                style={{
                  background: dotColor,
                  width: 8,
                  height: 8,
                  boxShadow: t.type !== "error" ? `0 0 6px ${dotColor}` : "none",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 13, color: "var(--sf-text)", flexGrow: 1, lineHeight: 1.4 }}>
                {t.message}
              </span>
              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--sf-text-faint)",
                  cursor: "pointer",
                  padding: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                type="button"
              >
                <Icons.X size={12} />
              </button>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        @keyframes sf-toast-slide {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
