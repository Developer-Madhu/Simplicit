"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, Minus, RotateCcw } from "lucide-react";

interface InteractiveViewportProps {
  children: React.ReactNode;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export function InteractiveViewport({
  children,
  height = 520,
  className = "",
  style = {}
}: InteractiveViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ x: 10, y: 10, scale: 0.9 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const currentPan = useRef({ x: 10, y: 10 });

  useEffect(() => {
    currentPan.current = { x: viewport.x, y: viewport.y };
  }, [viewport.x, viewport.y]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only drag when left clicking on background, or on non-interactive components
    const target = e.target as HTMLElement;
    const isInteractive =
      target.closest("button") ||
      target.closest("a") ||
      target.closest("input") ||
      target.closest(".sf-card"); // Don't drag when interacting with cards

    if (isInteractive) return;

    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - viewport.x, y: e.clientY - viewport.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    setViewport((v) => ({ ...v, x: newX, y: newY }));
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate new scale factor
    const zoomFactor = 0.08;
    const direction = e.deltaY < 0 ? 1 : -1;
    const newScale = Math.min(
      Math.max(viewport.scale + direction * zoomFactor * viewport.scale, 0.35),
      2.5
    );

    const scaleRatio = newScale / viewport.scale;
    const newX = mouseX - (mouseX - viewport.x) * scaleRatio;
    const newY = mouseY - (mouseY - viewport.y) * scaleRatio;

    setViewport({
      x: newX,
      y: newY,
      scale: newScale
    });
  };

  const zoomIn = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    const newScale = Math.min(viewport.scale + 0.15, 2.5);

    const scaleRatio = newScale / viewport.scale;
    setViewport({
      x: midX - (midX - viewport.x) * scaleRatio,
      y: midY - (midY - viewport.y) * scaleRatio,
      scale: newScale
    });
  };

  const zoomOut = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    const newScale = Math.max(viewport.scale - 0.15, 0.35);

    const scaleRatio = newScale / viewport.scale;
    setViewport({
      x: midX - (midX - viewport.x) * scaleRatio,
      y: midY - (midY - viewport.y) * scaleRatio,
      scale: newScale
    });
  };

  const resetViewport = () => {
    setViewport({ x: 20, y: 20, scale: 0.92 });
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      onWheel={handleWheel}
      className={`sf-card sf-linegrid ${className}`}
      style={{
        height,
        position: "relative",
        overflow: "hidden",
        background: "var(--sf-bg)",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        ...style
      }}
    >
      {/* Transformation wrapper */}
      <div
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
          transformOrigin: "0 0",
          width: "1240px",
          height: "600px",
          position: "absolute",
          willChange: "transform"
        }}
      >
        {children}
      </div>

      {/* Floating Canvas Controls */}
      <div
        className="sf-row"
        style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          background: "var(--sf-surface)",
          border: "1px solid var(--sf-border)",
          borderRadius: 8,
          padding: 4,
          gap: 2,
          zIndex: 10,
          boxShadow: "0 4px 12px rgba(0,0,0,0.25)"
        }}
      >
        <button
          onClick={zoomOut}
          className="sf-btn sf-btn--ghost sf-btn--sm"
          style={{ width: 28, height: 28, padding: 0, justifyContent: "center", minWidth: "auto" }}
          title="Zoom Out"
          type="button"
        >
          <Minus size={13} style={{ color: "var(--sf-text-muted)" }} />
        </button>
        <span
          className="mono text-muted"
          style={{
            fontSize: 10.5,
            padding: "0 8px",
            minWidth: 42,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--sf-text-muted)"
          }}
        >
          {Math.round(viewport.scale * 100)}%
        </span>
        <button
          onClick={zoomIn}
          className="sf-btn sf-btn--ghost sf-btn--sm"
          style={{ width: 28, height: 28, padding: 0, justifyContent: "center", minWidth: "auto" }}
          title="Zoom In"
          type="button"
        >
          <Plus size={13} style={{ color: "var(--sf-text-muted)" }} />
        </button>
        <div style={{ width: 1, height: 16, background: "var(--sf-border)", margin: "0 4px" }} />
        <button
          onClick={resetViewport}
          className="sf-btn sf-btn--ghost sf-btn--sm"
          style={{ width: 28, height: 28, padding: 0, justifyContent: "center", minWidth: "auto" }}
          title="Reset View"
          type="button"
        >
          <RotateCcw size={12} style={{ color: "var(--sf-text-muted)" }} />
        </button>
      </div>
    </div>
  );
}
