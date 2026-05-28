"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Profile, Workspace } from "@/lib/types";
import { useAuth } from "@/features/auth/context/auth-context";
import { useProfile, useWorkspaces, useEnsureDefaultWorkspace, useMigrateLegacyProjects } from "../api/workspaces";

interface WorkspaceContextProps {
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  profile: Profile | null;
  loading: boolean;
  setActiveWorkspace: (workspace: Workspace) => void;
}

const WorkspaceContext = createContext<WorkspaceContextProps | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: workspaces = [], isLoading: workspacesLoading } = useWorkspaces();
  const ensureDefaultWorkspace = useEnsureDefaultWorkspace();
  const migrateLegacyProjects = useMigrateLegacyProjects();
  
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);

  // Auto-initialize workspace
  useEffect(() => {
    if (!authLoading && user && profile && !workspacesLoading) {
      if (workspaces.length === 0 && !ensureDefaultWorkspace.isPending) {
        ensureDefaultWorkspace.mutate(profile);
      } else if (workspaces.length > 0 && !activeWorkspace) {
        // Default to the first workspace (usually the one created first)
        const savedWorkspaceId = localStorage.getItem("simplicit_active_workspace_id");
        const workspace = workspaces.find(w => w.id === savedWorkspaceId) || workspaces[0];
        setActiveWorkspaceState(workspace);
        
        // Ensure localStorage is in sync if we had to fallback
        if (workspace.id !== savedWorkspaceId) {
          localStorage.setItem("simplicit_active_workspace_id", workspace.id);
        }
        
        // Trigger migration if we just found/created a workspace
        migrateLegacyProjects.mutate({ workspaceId: workspace.id, userId: user.id });
      }
    }
  }, [user, profile, workspaces, authLoading, workspacesLoading, activeWorkspace, ensureDefaultWorkspace, migrateLegacyProjects]);

  const setActiveWorkspace = (workspace: Workspace) => {
    setActiveWorkspaceState(workspace);
    localStorage.setItem("simplicit_active_workspace_id", workspace.id);
  };

  const loading = authLoading || profileLoading || workspacesLoading || ensureDefaultWorkspace.isPending;

  return (
    <WorkspaceContext.Provider value={{ 
      activeWorkspace, 
      workspaces, 
      profile: profile || null, 
      loading,
      setActiveWorkspace
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
