-- Phase Z3 — user-supplied AI provider keys (BYOK), storage only.
-- SECURITY: api_key is write-only. It is NEVER returned in any API response —
-- the column is protected by the API route never SELECTing api_key. (RLS gates
-- row access, not column access, so no policy can enforce column-hiding; that is
-- the route's job.) Safe to run multiple times (idempotent).

CREATE TABLE IF NOT EXISTS public.user_ai_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('anthropic', 'nvidia')),
  api_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

ALTER TABLE public.user_ai_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own AI keys" ON public.user_ai_keys;
CREATE POLICY "Users manage own AI keys"
  ON public.user_ai_keys
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
