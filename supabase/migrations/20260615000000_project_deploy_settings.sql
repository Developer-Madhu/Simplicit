-- Phase Z3 — per-project Railway credentials (schema only).
-- Adds an optional project_id to user_deploy_settings so a token can be scoped
-- to a single project; a NULL project_id remains the user-level fallback.
-- Safe to run multiple times (idempotent).

ALTER TABLE public.user_deploy_settings
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

-- Replace the old plain UNIQUE(user_id, provider) with two partial unique
-- indexes. A plain UNIQUE(user_id, provider, project_id) would NOT enforce a
-- single user-level row, because Postgres treats NULLs as distinct — so a user
-- could end up with duplicate (user, provider, NULL) rows. Partial indexes fix
-- this: exactly one user-level row per (user, provider) when project_id IS NULL,
-- and one row per (user, provider, project) otherwise.
ALTER TABLE public.user_deploy_settings
  DROP CONSTRAINT IF EXISTS user_deploy_settings_user_id_provider_key;

CREATE UNIQUE INDEX IF NOT EXISTS user_deploy_settings_user_provider_null_idx
  ON public.user_deploy_settings (user_id, provider)
  WHERE project_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS user_deploy_settings_user_provider_project_idx
  ON public.user_deploy_settings (user_id, provider, project_id)
  WHERE project_id IS NOT NULL;
