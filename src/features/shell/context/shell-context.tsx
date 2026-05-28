"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ShellContextProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  toggleMobile: () => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  userDropdownOpen: boolean;
  setUserDropdownOpen: (open: boolean) => void;
  toggleUserDropdown: () => void;
}

const ShellContext = createContext<ShellContextProps | undefined>(undefined);

export function ShellProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Load user collapse setting from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sf_sidebar_collapsed");
      if (stored !== null) {
        setSidebarCollapsedState(stored === "true");
      }
    } catch {
      // Ignore localStorage errors in SSR/strict sandboxes
    }
  }, []);

  const setSidebarCollapsed = (val: boolean) => {
    setSidebarCollapsedState(val);
    try {
      localStorage.setItem("sf_sidebar_collapsed", String(val));
    } catch {
      // Ignore
    }
  };

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const toggleMobile = () => setMobileOpen((prev) => !prev);
  const toggleCommandPalette = () => setCommandPaletteOpen((prev) => !prev);
  const toggleUserDropdown = () => setUserDropdownOpen((prev) => !prev);

  // Auto-close overlay panels on window clicks (handled inside individual components or here)
  return (
    <ShellContext.Provider
      value={{
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebar,
        mobileOpen,
        setMobileOpen,
        toggleMobile,
        commandPaletteOpen,
        setCommandPaletteOpen,
        toggleCommandPalette,
        userDropdownOpen,
        setUserDropdownOpen,
        toggleUserDropdown,
      }}
    >
      {children}
    </ShellContext.Provider>
  );
}

export function useShell() {
  const context = useContext(ShellContext);
  if (!context) {
    throw new Error("useShell must be used within a ShellProvider");
  }
  return context;
}
