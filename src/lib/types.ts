export type ProjectStatus = "deployed" | "building" | "draft" | "paused";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceSummary extends Workspace {
  project_count: number;
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  prompt: string;
  stack: string;
  updated: string;
  status: ProjectStatus;
  health: number | null;
  dot: "green" | "amber" | "gray" | "blue" | "purple";
  generation_metadata?: any;
  ingestion_metadata?: any;
  simplicit_context?: any;
}

export interface ModuleSummary {
  id: string;
  name: string;
  desc: string;
  icon: string;
  status: "ready" | "optional";
  files: number;
}

export interface RouteSummary {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  auth: string | null;
  note?: string;
  name?: string;
  group?: string;
  requestPayload?: string;
  responsePayload?: string;
  validationRules?: string[];
}

export interface SchemaColumn {
  name: string;
  type: string;
  pk?: boolean;
  fk?: boolean;
}

export interface SchemaTable {
  name: string;
  x: number;
  y: number;
  accent: "blue" | "purple" | "green" | "amber";
  columns: SchemaColumn[];
}

export interface ArchitectureNode {
  id: string;
  kind: string;
  title: string;
  subtitle: string;
  icon: string;
  accent: "blue" | "purple" | "green" | "amber";
  x: number;
  y: number;
}

export interface FileNode {
  name: string;
  type: "dir" | "file";
  path?: string;
  badge?: string;
  status?: "new";
  children?: FileNode[];
}

