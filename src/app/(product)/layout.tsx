"use client";

import type { ReactNode } from "react";
import { ShellProvider, useShell } from "@/features/shell/context/shell-context";
import { AppSidebar, CommandPalette } from "@/features/shell";
import { Icons } from "@/components/ui/icons";

function ProductLayoutContent({ children }: { children: ReactNode }) {
  const { sidebarCollapsed, mobileOpen, setMobileOpen } = useShell();

  return (
    <div className="flex min-h-screen bg-bg text-text">
      {/* Desktop Sidebar Wrapper */}
      <div 
        className="hidden lg:flex flex-col flex-shrink-0" 
        style={{ 
          width: sidebarCollapsed ? 56 : 240, 
          transition: "width .2s ease-in-out",
          overflow: "hidden"
        }}
      >
        <AppSidebar />
      </div>

      {/* Mobile Sidebar Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" aria-modal="true" role="dialog">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            style={{
              transition: "opacity 0.2s ease-out",
            }}
          />
          {/* Sidebar Drawer container */}
          <div
            className="relative flex w-[240px] flex-col bg-bg-2 h-full z-10"
            style={{
              borderRight: "1px solid var(--sf-border)",
              animation: "sf-slide-right 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          >
            {/* Mobile close button inside sidebar container */}
            <div style={{ position: "absolute", top: 12, right: 10, zIndex: 60 }}>
              <button
                className="sf-btn sf-btn--ghost sf-btn--sm"
                style={{ padding: "0 6px" }}
                onClick={() => setMobileOpen(false)}
                type="button"
                aria-label="Close"
              >
                <Icons.X size={14} />
              </button>
            </div>
            {/* Force expanded sidebar for mobile */}
            <AppSidebar forceExpanded />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="min-w-0 flex-1 flex flex-col min-h-screen">
        {/* Mobile Topbar - Visible only on mobile/tablet */}
        <header
          className="flex lg:hidden items-center justify-between px-4 border-b border-border bg-bg-2"
          style={{ height: 48, flexShrink: 0, borderBottom: "1px solid var(--sf-border)" }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="sf-btn sf-btn--ghost sf-btn--sm"
            style={{ padding: "0 6px" }}
            aria-label="Menu"
            type="button"
          >
            <Icons.List size={18} />
          </button>
          
          <div className="sf-row" style={{ gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <defs>
                <linearGradient id="sf-mg-mob" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#fff" stopOpacity={1} />
                  <stop offset="1" stopColor="#fff" stopOpacity="0.55" />
                </linearGradient>
              </defs>
              <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="#16161A" stroke="rgba(255,255,255,0.12)" />
              <path d="M7 8.5 12 6l5 2.5L12 11 7 8.5Z" fill="url(#sf-mg-mob)" />
              <path d="M7 12 12 14.5 17 12" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
              <path d="M7 15.5 12 18 17 15.5" stroke="rgba(255,255,255,0.32)" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
            </svg>
            <span style={{ fontWeight: 600, letterSpacing: "-0.02em", fontSize: 13.5 }}>
              Simplicit
            </span>
          </div>
          <div style={{ width: 28 }} />
        </header>

        {/* Inner page content */}
        <div className="flex-1 flex flex-col min-w-0" style={{ position: "relative" }}>
          {children}
        </div>
      </div>

      <CommandPalette />

      <style jsx global>{`
        @keyframes sf-slide-right {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

export default function ProductLayout({ children }: { children: ReactNode }) {
  return (
    <ShellProvider>
      <ProductLayoutContent>{children}</ProductLayoutContent>
    </ShellProvider>
  );
}
