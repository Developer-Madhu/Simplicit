"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import { useShell } from "../context/shell-context";
import { useAuth } from "@/features/auth/context/auth-context";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  action: () => void;
  category: "Navigation" | "System Commands";
}

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen, toggleSidebar } = useShell();
  const { signOut } = useAuth();
  
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Global Ctrl/Cmd + K keydown listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  // Focus input when palette opens
  useEffect(() => {
    if (commandPaletteOpen) {
      setSearch("");
      setActiveIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [commandPaletteOpen]);

  // Commands definition
  const commands = useMemo<CommandItem[]>(() => {
    const navigateTo = (path: string) => {
      setCommandPaletteOpen(false);
      router.push(path);
    };

    return [
      {
        id: "nav-workspace",
        title: "Go to Workspace",
        subtitle: "Navigate to prompt architect workspace",
        icon: "Sparkle",
        action: () => navigateTo("/workspace"),
        category: "Navigation"
      },
      {
        id: "nav-projects",
        title: "Go to Projects",
        subtitle: "View your generated backend projects list",
        icon: "Folder",
        action: () => navigateTo("/dashboard"),
        category: "Navigation"
      },
      {
        id: "nav-generations",
        title: "Go to Generations",
        subtitle: "View latest schema generations and code trees",
        icon: "Layers",
        action: () => navigateTo("/generations/demo"),
        category: "Navigation"
      },
      {
        id: "nav-templates",
        title: "Go to Templates",
        subtitle: "Explore starter project templates",
        icon: "Cube",
        action: () => navigateTo("/templates"),
        category: "Navigation"
      },
      {
        id: "nav-deployments",
        title: "Go to Deployments",
        subtitle: "Check build logs and service deployments",
        icon: "Rocket",
        action: () => navigateTo("/deployments"),
        category: "Navigation"
      },
      {
        id: "nav-docs",
        title: "Go to Documentation",
        subtitle: "View Simplicit guides and API references",
        icon: "File",
        action: () => navigateTo("/docs"),
        category: "Navigation"
      },
      {
        id: "nav-settings",
        title: "Go to Settings",
        subtitle: "Configure workspace settings and API keys",
        icon: "Settings",
        action: () => navigateTo("/settings"),
        category: "Navigation"
      },
      {
        id: "cmd-sidebar",
        title: "Toggle Sidebar",
        subtitle: "Collapse or expand side navigation",
        icon: "List",
        action: () => {
          setCommandPaletteOpen(false);
          toggleSidebar();
        },
        category: "System Commands"
      },
      {
        id: "cmd-signout",
        title: "Sign out",
        subtitle: "Log out of your Simplicit account",
        icon: "Power",
        action: async () => {
          setCommandPaletteOpen(false);
          await signOut();
          router.push("/sign-in");
          router.refresh();
        },
        category: "System Commands"
      }
    ];
  }, [router, setCommandPaletteOpen, toggleSidebar, signOut]);

  // Filter commands by search query
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;
    const query = search.toLowerCase();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(query))
    );
  }, [search, commands]);

  // Reset active index if list size changes
  useEffect(() => {
    setActiveIndex(0);
  }, [filteredCommands.length]);

  // Keyboard navigation inside open palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setCommandPaletteOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + (filteredCommands.length || 1)) % (filteredCommands.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredCommands[activeIndex];
      if (selected) {
        selected.action();
      }
    }
  };

  if (!commandPaletteOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "12vh",
        background: "var(--sf-overlay)",
        backdropFilter: "blur(4px)"
      }}
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        ref={containerRef}
        className="sf-card-elev sf-col"
        style={{
          width: "100%",
          maxWidth: 580,
          background: "var(--sf-surface-2)",
          border: "1px solid var(--sf-border-strong)",
          boxShadow: "var(--sf-shadow-lg)",
          borderRadius: "var(--sf-r-xl)",
          overflow: "hidden",
          animation: "sf-palette-slide 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards"
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input bar */}
        <div 
          className="sf-row" 
          style={{ 
            padding: "12px 16px", 
            borderBottom: "1px solid var(--sf-border)",
            gap: 10,
            alignItems: "center"
          }}
        >
          <Icons.Search size={16} className="sf-muted" />
          <input
            ref={inputRef}
            type="text"
            className="sf-grow"
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--sf-text)",
              fontSize: 14,
              fontFamily: "inherit"
            }}
            placeholder="Type a command or search pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="sf-kbd">ESC</span>
        </div>

        {/* Results List */}
        <div 
          className="sf-scroll"
          style={{ 
            maxHeight: 330, 
            overflowY: "auto", 
            padding: 6 
          }}
        >
          {filteredCommands.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 13 }} className="sf-faint">
              No results found for &ldquo;{search}&rdquo;
            </div>
          ) : (
            <div>
              {/* Group items by category */}
              {["Navigation", "System Commands"].map((cat) => {
                const items = filteredCommands.filter((c) => c.category === cat);
                if (items.length === 0) return null;

                return (
                  <div key={cat}>
                    <div 
                      className="mono" 
                      style={{ 
                        fontSize: 10, 
                        fontWeight: 600, 
                        letterSpacing: "0.06em",
                        color: "var(--sf-text-faint)",
                        padding: "8px 10px 4px",
                        textTransform: "uppercase"
                      }}
                    >
                      {cat}
                    </div>
                    {items.map((c) => {
                      // Find true index in the flattened filteredCommands array
                      const flatIndex = filteredCommands.findIndex((fc) => fc.id === c.id);
                      const isHighlighted = flatIndex === activeIndex;
                      const Icon = Icons[c.icon as keyof typeof Icons] || Icons.List;

                      return (
                        <div
                          key={c.id}
                          className="sf-row"
                          onClick={() => c.action()}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 8,
                            gap: 12,
                            cursor: "pointer",
                            background: isHighlighted ? "rgba(255,255,255,0.05)" : "transparent",
                            transition: "background 0.1s"
                          }}
                          onMouseEnter={() => setActiveIndex(flatIndex)}
                        >
                          <div 
                            style={{ 
                              width: 24, 
                              height: 24, 
                              borderRadius: 6, 
                              background: isHighlighted ? "var(--sf-elevated)" : "var(--sf-surface)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: isHighlighted ? "var(--sf-text)" : "var(--sf-text-muted)"
                            }}
                          >
                            <Icon size={13} />
                          </div>
                          <div className="sf-grow">
                            <div style={{ fontSize: 13, color: isHighlighted ? "var(--sf-text)" : "var(--sf-text-muted)", fontWeight: 500 }}>
                              {c.title}
                            </div>
                            {c.subtitle && (
                              <div style={{ fontSize: 11, color: "var(--sf-text-dim)", marginTop: 1 }}>
                                {c.subtitle}
                              </div>
                            )}
                          </div>
                          {isHighlighted && (
                            <span style={{ fontSize: 11, color: "var(--sf-text-faint)" }} className="mono">
                              ↵ Enter
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes sf-palette-slide {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
