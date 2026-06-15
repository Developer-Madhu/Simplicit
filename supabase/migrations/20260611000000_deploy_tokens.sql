-- Stores per-user deploy credentials (Railway, Render, etc.)
-- Separate from user_integrations (which is for code/repo providers).
-- Safe to run multiple times (idempotent).
CREATE TABLE IF NOT EXISTS public.user_deploy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,  -- 'railway' | 'render'
  api_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.user_deploy_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own deploy settings" ON public.user_deploy_settings;
CREATE POLICY "Users manage their own deploy settings"
  ON public.user_deploy_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
