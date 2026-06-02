import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Profile, Workspace } from "@/lib/types";

export function useProfile() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      // If no profile exists, create one (Requirement 1 fallback)
      if (!data) {
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || user.user_metadata?.first_name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
          })
          .select()
          .single();
        
        if (createError) throw createError;
        return newProfile;
      }

      return data;
    }
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (updates: { full_name?: string; avatar_url?: string }): Promise<Profile> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
  });
}

/**
 * Single source of truth for the user's display name across the app.
 * Reuses the cached `profile` query (no extra request).
 */
export function useDisplayName(): string {
  const { data: profile } = useProfile();
  return (
    profile?.full_name?.trim() ||
    profile?.email?.split("@")[0] ||
    "You"
  );
}

export function useWorkspaces() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["workspaces"],
    queryFn: async (): Promise<Workspace[]> => {
      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    }
  });
}

export function useEnsureDefaultWorkspace() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (profile: Profile) => {
      // Check if any workspace exists
      const { data: existing, error: checkError } = await supabase
        .from("workspaces")
        .select("*")
        .limit(1);
      
      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        return existing[0] as Workspace;
      }

      // Create default workspace
      const workspaceName = profile.full_name 
        ? `${profile.full_name.split(' ')[0]}'s Workspace`
        : "My Workspace";
      
      const { data: newWorkspace, error: createError } = await supabase
        .from("workspaces")
        .insert({
          owner_id: profile.id,
          name: workspaceName,
          slug: "default",
        })
        .select()
        .single();
      
      if (createError) throw createError;
      return newWorkspace as Workspace;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    }
  });
}

export function useMigrateLegacyProjects() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ workspaceId, userId }: { workspaceId: string, userId: string }) => {
      const { error } = await supabase
        .from("projects")
        .update({ workspace_id: workspaceId })
        .eq("user_id", userId)
        .is("workspace_id", null);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects", variables.workspaceId] });
    }
  });
}
