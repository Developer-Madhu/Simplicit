import React, { useState, useEffect } from "react";
import { ChevronRight, PanelRightClose, PanelRightOpen, PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface CollapsiblePanelProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  width?: number | string;
  minWidth?: number | string;
  className?: string;
  style?: React.CSSProperties;
  side?: "left" | "right";
  border?: boolean;
}

export function CollapsiblePanel({
  children,
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onOpenChange,
  width = 460,
  minWidth = 0,
  className = "",
  style,
  side = "right",
  border = true,
}: CollapsiblePanelProps) {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(defaultOpen);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : uncontrolledIsOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (controlledIsOpen === undefined) {
      setUncontrolledIsOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  // Keyboard accessibility (Cmd+B to toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        handleOpenChange(!isOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleOpenChange]);

  const borderStyle = border
    ? side === "right"
      ? { borderLeft: isOpen ? "1px solid var(--sf-border)" : "none" }
      : { borderRight: isOpen ? "1px solid var(--sf-border)" : "none" }
    : {};

  return (
    <div
      className={`sf-panel-container ${className}`}
      style={{
        width: isOpen ? width : minWidth,
        opacity: isOpen ? 1 : 0,
        flex: "0 0 auto",
        overflow: "hidden",
        background: "var(--sf-bg-2)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s ease, border-left-width 0.3s ease, border-right-width 0.3s ease",
        ...borderStyle,
        ...style,
      }}
    >
      <div style={{ width, display: "flex", flexDirection: "column", height: "100%" }}>
        {children}
      </div>
    </div>
  );
}

export function PanelToggleButton({
  isOpen,
  onClick,
  side = "right",
}: {
  isOpen: boolean;
  onClick: () => void;
  side?: "left" | "right";
}) {
  return (
    <button
      onClick={onClick}
      className="sf-btn sf-btn--ghost sf-btn--sm"
      style={{ padding: "0 8px" }}
      type="button"
      title="Toggle Side Panel (⌘B)"
    >
      {side === "right" ? (
        isOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />
      ) : (
        isOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />
      )}
    </button>
  );
}
