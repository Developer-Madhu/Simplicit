import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Project, ProjectStatus } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

export interface DBProject {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  description: string | null;
  prompt: string;
  stack: string;
  status: ProjectStatus;
  health: number | null;
  dot: "green" | "amber" | "gray" | "blue" | "purple";
  generation_metadata: any;
  simplicit_context: any;
  created_at: string;
  updated_at: string;
}

export function mapDBProjectToProject(dbProj: DBProject): Project {
  return {
    id: dbProj.id,
    workspace_id: dbProj.workspace_id,
    name: dbProj.name,
    prompt: dbProj.prompt,
    stack: dbProj.stack,
    updated: formatRelativeTime(dbProj.updated_at),
    status: dbProj.status,
    health: dbProj.health,
    dot: dbProj.dot,
    generation_metadata: dbProj.generation_metadata,
    simplicit_context: dbProj.simplicit_context
  };
}

async function seedDefaultProjects(userId: string) {
  const supabase = createClient();
  const demoProjects = [
    {
      name: "Examly API",
      stack: "Hono · PG · Redis",
      status: "deployed" as ProjectStatus,
      health: 99.9,
      dot: "green" as const,
      prompt: "Online exam platform with proctoring"
    },
    {
      name: "Loop Marketplace",
      stack: "Fastify · PG · S3",
      status: "building" as ProjectStatus,
      health: 100,
      dot: "amber" as const,
      prompt: "P2P rental marketplace with escrow"
    },
    {
      name: "Nova LMS",
      stack: "Hono · PG · Mux",
      status: "deployed" as ProjectStatus,
      health: 100,
      dot: "green" as const,
      prompt: "LMS with cohort-based courses"
    },
    {
      name: "Brief AI",
      stack: "Hono · PG · Pinecone",
      status: "draft" as ProjectStatus,
      health: null,
      dot: "gray" as const,
      prompt: "AI document workspace"
    },
    {
      name: "Tessera Billing",
      stack: "Express · PG · Stripe",
      status: "deployed" as ProjectStatus,
      health: 99.4,
      dot: "green" as const,
      prompt: "Usage-based billing engine"
    },
    {
      name: "Pulse Analytics",
      stack: "Hono · ClickHouse",
      status: "paused" as ProjectStatus,
      health: null,
      dot: "gray" as const,
      prompt: "Product analytics ingestion API"
    }
  ];

  const dbRows = demoProjects.map(p => ({
    user_id: userId,
    name: p.name,
    prompt: p.prompt,
    stack: p.stack,
    status: p.status,
    health: p.health,
    dot: p.dot,
    generation_metadata: {}
  }));

  const { error } = await supabase.from("projects").insert(dbRows);
  if (error) {
    throw error;
  }
}

export function useProjects(workspaceId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: async (): Promise<Project[]> => {
      let query = supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });

      if (workspaceId) {
        query = query.eq("workspace_id", workspaceId);
      }

      const { data, error } = await query;

      if (error) {
        // If 400 happens, it might be because the column doesn't exist yet
        // Fallback to global projects if workspace_id column is missing
        if (error.code === "PGRST204" || error.message.includes("workspace_id")) {
           const { data: fallbackData, error: fallbackError } = await supabase
            .from("projects")
            .select("*")
            .order("updated_at", { ascending: false });
           
           if (fallbackError) throw fallbackError;
           return (fallbackData || []).map(mapDBProjectToProject);
        }
        throw error;
      }

      return (data || []).map(mapDBProjectToProject);
    }
  });
}

export function useProject(id: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["project", id],
    queryFn: async (): Promise<Project | null> => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return mapDBProjectToProject(data);
    },
    enabled: !!id
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (newProject: {
      name: string;
      description?: string;
      prompt: string;
      stack: string;
      workspace_id: string;
      status?: ProjectStatus;
      health?: number | null;
      dot?: "green" | "amber" | "gray" | "blue" | "purple";
      generation_metadata?: any;
      simplicit_context?: any;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("projects")
        .insert({
          name: newProject.name,
          description: newProject.description || null,
          prompt: newProject.prompt,
          stack: newProject.stack,
          workspace_id: newProject.workspace_id,
          status: newProject.status || "draft",
          health: newProject.health ?? null,
          dot: newProject.dot || "gray",
          user_id: user.id,
          generation_metadata: newProject.generation_metadata || {},
          simplicit_context: newProject.simplicit_context || null
        })
        .select()
        .single();

      if (error) throw error;
      return mapDBProjectToProject(data);
    },
    onMutate: async (newProject) => {
      await queryClient.cancelQueries({ queryKey: ["projects", newProject.workspace_id] });
      const previousProjects = queryClient.getQueryData<Project[]>(["projects", newProject.workspace_id]);

      const optimisticProject: Project = {
        id: "temp-" + Math.random().toString(36).substring(2, 9),
        workspace_id: newProject.workspace_id,
        name: newProject.name,
        prompt: newProject.prompt,
        stack: newProject.stack,
        updated: "just now",
        status: newProject.status || "draft",
        health: newProject.health ?? null,
        dot: newProject.dot || "gray",
      };

      queryClient.setQueryData<Project[]>(["projects", newProject.workspace_id], (old) => {
        return [optimisticProject, ...(old || [])];
      });

      return { previousProjects };
    },
    onError: (err, newProject, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(["projects", newProject.workspace_id], context.previousProjects);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects", variables.workspace_id] });
    }
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DBProject> & { id: string }) => {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapDBProjectToProject(data);
    },
    onMutate: async (updatedProject) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      await queryClient.cancelQueries({ queryKey: ["project", updatedProject.id] });

      const previousProjects = queryClient.getQueryData<Project[]>(["projects"]);
      const previousProject = queryClient.getQueryData<Project>(["project", updatedProject.id]);

      queryClient.setQueryData<Project[]>(["projects"], (old) => {
        return (old || []).map((p) =>
          p.id === updatedProject.id
            ? {
                ...p,
                ...(updatedProject.name !== undefined && { name: updatedProject.name }),
                ...(updatedProject.prompt !== undefined && { prompt: updatedProject.prompt }),
                ...(updatedProject.stack !== undefined && { stack: updatedProject.stack }),
                ...(updatedProject.status !== undefined && { status: updatedProject.status }),
                ...(updatedProject.health !== undefined && { health: updatedProject.health }),
                ...(updatedProject.dot !== undefined && { dot: updatedProject.dot }),
                updated: "just now"
              }
            : p
        );
      });

      if (previousProject) {
        queryClient.setQueryData<Project>(["project", updatedProject.id], (old) => {
          if (!old) return old;
          return {
            ...old,
            ...(updatedProject.name !== undefined && { name: updatedProject.name }),
            ...(updatedProject.prompt !== undefined && { prompt: updatedProject.prompt }),
            ...(updatedProject.stack !== undefined && { stack: updatedProject.stack }),
            ...(updatedProject.status !== undefined && { status: updatedProject.status }),
            ...(updatedProject.health !== undefined && { health: updatedProject.health }),
            ...(updatedProject.dot !== undefined && { dot: updatedProject.dot }),
            updated: "just now"
          };
        });
      }

      return { previousProjects, previousProject };
    },
    onError: (err, updatedProject, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(["projects"], context.previousProjects);
      }
      if (context?.previousProject) {
        queryClient.setQueryData(["project", updatedProject.id], context.previousProject);
      }
    },
    onSettled: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["project", data.id] });
      }
    }
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      const previousProjects = queryClient.getQueryData<Project[]>(["projects"]);

      queryClient.setQueryData<Project[]>(["projects"], (old) => {
        return (old || []).filter((p) => p.id !== id);
      });

      return { previousProjects };
    },
    onError: (err, id, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(["projects"], context.previousProjects);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });
}
