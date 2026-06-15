# Simplicit — Implementation Status

> Context-handoff document. Captures what has been built, how it works, and what
> still needs doing — so a fresh session can resume without re-deriving everything.
> Last updated: **2026-06-14** (end of Phases E1–P: NVIDIA provider, source/Monaco
> editor, refresh-safety, service-role persistence, entity-reconstruction fixes,
> per-entity modules, entity-fields wizard, Railway settings).

---

## 0. TL;DR / current health

- **Type check:** `npx tsc --noEmit --skipLibCheck` → **0 errors** (also clean on a full
  `npx tsc --noEmit`). This is the gate used all session.
- **Production build (`npm run build`): NOT run recently — by choice.** Running
  `next build` while `npm run dev` is live **corrupts the shared `.next` dir** and
  throws `__webpack_modules__[moduleId] is not a function` in the dev server (this
  happened once and was fixed by deleting `.next` + restarting dev). **Rule: never run
  `npm run build` while the dev server is running.** Verify types with `tsc` only;
  run a production build only with the dev server stopped.
- **Everything in §3–§4 below is uncommitted working-tree state** on top of git base
  `5b7ebc7`. Nothing from this session (E–P) is committed yet.
- **Verification status: compile-clean and logically complete, but the full
  generation flow has NOT been run end-to-end by the assistant** (needs a configured
  Supabase + live LLM keys). Manual end-to-end testing is the user's to do. Where a
  phase's behavior was proven, it was via service-role DB inspection of real persisted
  rows (Phases K/M) — those findings are real.
- Stack: **Next.js 15 (App Router, Webpack)**, TypeScript (strict, no `noUnusedLocals`),
  custom `sf-*` CSS design system, React Query, **Supabase** (auth + Postgres + RLS),
  **NVIDIA NIM (deepseek) and/or Anthropic** for LLM, in-browser **Tree-sitter** for AST,
  **graphology Louvain** for graph analytics, **@monaco-editor/react** for the code editor.

---

## 1. The product in one paragraph

Simplicit turns a frontend codebase (or a prompt) into a generated NestJS + Drizzle
backend. Flow: **ingest** (ZIP / GitHub / context.md / prompt) → **analyze**
(Tree-sitter AST → import graph → entities/roles/APIs) → **architect**
(`DomainIntelligenceEngine` → `BackendBlueprint`) → **wizard** (stack → gap →
**entity-fields** confirmation) → **generate** (deterministic schema/DTO/service/
controller + AI business logic, security scan, stability gate, tests, SDK) →
**persist** to Supabase → **view/edit/deploy** in a VS-Code-style IDE.

---

## 2. End-to-end flow (current)

1. **Workspace** (`workspace/components/workspace-page.tsx`): user uploads a ZIP / imports
   GitHub / writes a prompt. On analysis completion `handleAnalysisCompleteAndNavigate`
   creates the project row (`status:'draft'`), persists `generation_metadata.ingestion`
   (serialized, **drops keyFiles/astGraph**) **and `generation_metadata.source_files`**
   (path→content, from `keyFiles`, Phase E2), stashes the full in-memory `IngestionResult`
   in the module-singleton **flow store** (`generation/state/generation-flow-store.ts`),
   and navigates to `/generations/{id}?flow=new`.
2. **IDE** (`generation/components/generation-ide.tsx`) runs the **wizard overlay** as a
   state machine: `clarifying → stack-selection → gap-resolution → entity-fields`
   (Phase O). On confirm, `handleBlueprintApproved` writes the blueprint/spec into
   `generation_metadata`, sets `status:'building'`, and calls `startGeneration` (SSE).
3. **Pipeline** (`POST /api/generate` → `GenerationPipeline.execute`): Architect (done,
   blueprint already built client-side) → **Generator** (deterministic) → **Security** →
   **Stability** → **Test Writer** → **SDK**, streaming `PipelineEvent`s over SSE.
   Persists final files + status `'deployed'` on success (service-role client), or
   `'paused'` + `lastError` on failure (Phases I/G1).
4. **Editor**: explorer shows **two groups** — "Your Frontend" (`source_files`, read-only)
   and "Generated Backend" (`files`, editable) — in a real **Monaco** editor (Phase G2).
5. **Deploy** (`POST /api/deploy/railway`): GitHub repo → push files → Railway project →
   public domain; streams a final `deploy_update done` event carrying `deployUrl`.

---

## 3. Critical architecture facts a new session MUST know

### 3.1 LLM provider selection (Phases E4, F2)
- **`generation/api/llm-provider.ts`** is the single resolver:
  - `resolveProvider(agent: 'generator'|'security'|'test-writer'): 'anthropic'|'nvidia'`
    — cascade: (1) agent-specific env override (`SERVICE_LOGIC_PROVIDER`,
    `SECURITY_PROVIDER`, `TEST_WRITER_PROVIDER`) **if its key is present**; (2)
    `ANTHROPIC_API_KEY` if present (preferred default — best quality); (3) `NVIDIA_API_KEY`
    if present; (4) throw `KeyMissingError`.
  - `hasAnyProvider()` — true if either key exists; used for the **single pipeline gate**.
- **`anthropic-service.ts`** and **`nvidia-service.ts`** both expose the same static
  `chatComplete(system, user, options?) => Promise<string>` (fence-stripped output, retry
  on 429/5xx, 60s timeout). NVIDIA hits `https://integrate.api.nvidia.com/v1/chat/completions`,
  model `process.env.NVIDIA_MODEL ?? 'deepseek-ai/deepseek-v4-pro'`, params from the
  build.nvidia.com config (top_p 0.95, `chat_template_kwargs:{thinking:false}`, max_tokens 16384).
- All three agents route through `resolveProvider`: **ServiceLogicAIEngine** (`generator`),
  **SecurityAgent** (`security`), **TestWriterAgent** (`test-writer`). `openai.ts` still
  exists (used only by the unused `test-generation-engine.ts`); not on the live path.
- **MVP env today:** `.env.local` has `SERVICE_LOGIC_PROVIDER=nvidia` + `NVIDIA_API_KEY`,
  **no `ANTHROPIC_API_KEY`** → all three agents run on NVIDIA. Adding `ANTHROPIC_API_KEY`
  later auto-upgrades Security/TestWriter (and Generator if `SERVICE_LOGIC_PROVIDER` is unset).

### 3.2 Persistence, service-role, and the status model (Phases H, I, G1, J)
- **ROOT-CAUSE FIX (Phase I):** the server pipeline used a **session-less anon** Supabase
  client; RLS (`auth.uid() = user_id`) silently blocked all its writes → every project
  stuck at `building`. Now `pipeline.ts` `saveToDatabase` **and** `persistFailure` use
  **`createServiceRoleClient()`** (`src/lib/supabase/service-role.ts`), which bypasses RLS.
  - The helper reads `SUPABASE_SERVICE_ROLE_KEY` **or `SUPABASE_SERVICE_KEY`** (the user
    added it under the latter name). **Server-only — never expose with `NEXT_PUBLIC_`.**
  - **Ownership gate** added in `/api/generate` (Phase I): verifies the authenticated
    user owns `projectId` (via the RLS-scoped cookie client) **before** the pipeline runs,
    since service-role writes bypass RLS. → 404 if not owner, 401 if unauthenticated.
- **No `failed` status exists.** DB CHECK constraint is `status IN
  ('deployed','building','draft','paused')`. So: success → `deployed`; running →
  `building`; failure → **`paused` + `generation_metadata.lastError {stage, message,
  timestamp}`** (Phase G1). `saveToDatabase` clears `lastError` (`null`) on success.
- **`/api/projects/[id]/files`** (Phase G2): **PATCH only** (no DELETE/GET/POST). Uses the
  authenticated cookie client + explicit `user_id` ownership check. Saves an edited
  generated file into `generation_metadata.files[path]` (inert — no re-run).
- **Integrity check (Phase J)** in `pipeline.ts` `runIntegrityCheck`: **only missing
  critical files** (`package.json`, `README.md`, `src/db/schema.ts`) hard-fail. Structural
  counts (`<3 files`, no controllers, no services) are **non-fatal warnings** (logged,
  pipeline proceeds). Eliminated the old empty `"Missing critical files: "` bug.

### 3.3 Entity reconstruction (Phases K-audit, L, L2, P) — `domain-intelligence-engine.ts`
- `reconstructEntities` is **two passes**, additive:
  - **Pass 1 (unchanged legacy):** `EntityQualifier.qualify` (score threshold **60**,
    weighted to backend evidence DATABASE/SCHEMA/API; **hard-rejects** types
    `UI_COMPONENT|PAGE|WORKFLOW|COMMAND|UNKNOWN`) + CRUD-cluster promotion.
  - **Pass 2a (L2):** any concept the classifier typed **`ENTITY`** is promoted regardless
    of score (the threshold is backend-biased and wrongly rejects frontend entities).
  - **Pass 2b (L2 + P):** `promoteFrontendClusters` — groups concepts by normalized noun;
    promotes a noun whose cluster has **`ROUTE` + ≥1 of {STATE, API, SOURCE_CODE,
    DEPENDENCY}`** (`FORM` excluded — `groupEvidence` shares it to every concept, so it's
    no signal). **Plus (Phase P):** role/actor nouns (`admin, customer, lead, user, vendor,
    owner, member, client, agent, operator`) are promoted on **`ROUTE` alone**.
  - Shared `buildEntity()` helper; `normalizeNoun()` (lowercase, strip Page/Form/List/…
    suffixes, naive singularize).
- **Why this matters:** the qualifier is fundamentally tuned for *backend* evidence, but
  Simplicit's whole job is *frontend → backend*. Passes 2a/2b/role-actor are mitigations;
  the qualifier itself is unchanged (Phase K audit). A frontend-only source can still
  under-produce entities.

### 3.4 Module synthesis (Phase M-audit, M2) — `synthesizeModules`
- **Contract that MUST hold:** `ServiceGenerator` and `ApiSurfaceCompiler` both tag their
  output `module: "${entity.name}Module"`, and `NestJSGenerator` emits service/controller
  files via `services/apiSurface.filter(x => x.module === mod.name)`. So a `blueprint.module`
  whose `name` ≠ `${entity}Module` → **0 service files emitted**.
- **Fix (M2):** `synthesizeModules` now emits a **per-entity `${entity.name}Module`** (with
  `services:["${entity.name}Service"]`) for every entity not already in a capability module
  (replacing the old single lumped `CoreModule`).
- **⚠️ KNOWN LATENT BUG (Phase M, NOT fixed):** the *capability-derived* module path still
  names modules `${category}Module` and can group multiple entities → same 0-services
  mismatch for **capability-bearing** projects. Most frontend uploads have
  `capabilities.length === 0` (capabilities need WORKFLOW/COMMAND concepts), so the
  per-entity fallback covers the common case. Flag for a scoped fix if a capability project
  surfaces it.

### 3.5 Wizard + EntityFieldsWizard (Phases O, P, N) — `generation-ide.tsx`
- `WizardStage = "clarifying" | "stack-selection" | "gap-resolution" | "entity-fields"`.
- `finalizeWizard` is **split**: builds blueprint+spec, then if
  `blueprint.entities.length > 0` → stash `pendingBlueprint`/`pendingSpec` and go to
  **`entity-fields`**; else → `handleBlueprintApproved(blueprint, spec, prefs)` directly.
  `handleBlueprintApproved` takes **3 args** (blueprint, spec, prefs) — unchanged.
- **`EntityFieldsWizard.tsx`** (Phase O/P): one entity per page (Prev/Next/Confirm), table
  `Field Name | Type | Nullable | Primary`; edit name/type/nullable, add/delete fields
  (PK locked); **"+ Add Entity"** appends a blank user entity (editable name, "Added by you"
  badge). On Confirm, `onComplete(updatedEntities)` → generation-ide slices user-added
  entities at `pendingBlueprint.entities.length` and calls
  **`createModulesForNewEntities`** (`architecture/utils.ts`) to give each a `${Entity}Module`,
  then `handleBlueprintApproved`.
- **The wizard/entity-fields step only runs on a FRESH upload** (`flow.ingestionResult`
  present). A "Retry" reuses the persisted blueprint and goes straight to the pipeline.
- **Phase N:** removed the noisy `feature_areas` clarification question; the seeded
  architect message counts now fall back to the blueprint
  (`metadata.modules?.length ?? bp.modules?.length ?? bp.entities?.length`, etc.) so a
  not-yet-completed run doesn't show "0 modules, 0 tables, 0 routes".

### 3.6 IDE: explorer, editor, refresh-safety, retry (Phases E2, G2, G1)
- **Explorer (E2):** two groups — `TreeGroupLabel "Your Frontend"` from
  `metadata.source_files` (+ in-memory `flow.ingestionResult.keyFiles` backfill, read-only)
  and `"Generated Backend"` from `metadata.files`. `selected` state is group-scoped
  (`{group:'source'|'generated', path}`) so colliding paths resolve correctly. `TreeRow` is
  a **local** component; it has an `onSelect(path)` prop only — **no `onClick`/`onContextMenu`**.
- **Monaco editor (G2):** `CodeEditor.tsx` (dynamic import, `ssr:false`, custom
  `simplicit-dark` theme, Ctrl/Cmd+S save via ref). `readOnly` is a **prop** (parent passes
  `selected.group === 'source'`). Generated files get a Save button → PATCH route (§3.2).
  `mapExtensionToMonacoLanguage` maps extensions to Monaco language ids.
- **Refresh-safety (G1):** with no in-memory flow state, a status-derived effect picks the
  view: `draft` → redirect `/workspace`; `building` → reconnecting view + **6s poll**;
  `paused`+`lastError` → reconstructed failed `PipelineStatusPanel` (rebuilt from
  `lastError` via `translateError`); `deployed`/other → assistant. `liveActive` guards so an
  in-session run owns the view.
- **Retry:** `handleRetry` re-runs the **whole pipeline** (no per-agent retry, **no
  confirmation dialog** — fires immediately): `resetPipeline` → request from
  `pendingGenerationRef` or `reconstructRequestFromMetadata` → set `building`, clear
  `lastError` → `startGeneration`. Wired to `PipelineStatusPanel.onRetry`.
- **No modal/dialog/popup component exists in generation-ide.tsx** — the wizard overlay is a
  hand-rolled `position:fixed` backdrop `<div>` (deliberately not the app's `Dialog`
  primitive). A context menu / modals would be net-new.

### 3.7 Deploy (Railway) — `app/api/deploy/railway/route.ts`
- SSE `deploy_update` events; the **final `done` event carries `deployUrl`**
  (`https://<railway-domain>`). **⚠️ The URL is NOT persisted** to the DB — it lives only in
  the in-session stream/`usePipelineStream.state.deployUrl` → lost on refresh.
- Settings: the **Railway section is wired** (Phase P) to `GET/POST /api/deploy/settings`
  (token field **`api_token`**, provider `"railway"`). GET returns `{railway, render}`
  booleans only; POST upserts the token into `user_deploy_settings`.

### 3.8 Pipeline LLM inputs (security/privacy note)
- **No agent receives the user's raw uploaded source** (`source_files`). ServiceLogic gets a
  **structured** `AIContextBuilder` context (blueprint-derived only); Security/TestWriter
  get the **generated** backend files (the pipeline's own output); the AI-driven fallback
  gets only the prompt text. `source_files` is persisted + shown in the explorer but never
  sent to an LLM, and `GenerationPipeline.execute` doesn't even receive it.
- `nestjs-generator.ts` emits a **HealthController** (`/health`, `/health/version`) + an
  inline `CoreModule`. **There is no `AppController`.** ⚠️ Unverified: that
  `compileAppModule` imports `CoreModule` into `AppModule` (if it doesn't, `/health` won't
  be registered at runtime despite the file existing).

---

## 4. Phase-by-phase changelog (this session)

- **E1** — error icons `✗ → ⚠️` in `PipelineStatusPanel.tsx` (+ aria-label).
- **E2** — source-file explorer ("Your Frontend" group); `source_files` persisted at project
  creation; group-scoped `selected` state.
- **E3** — `PipelineStatusPanel.css` fonts aligned to `--sf-font-mono`/`--sf-font-sans`
  (fallback stacks fixed; the tokens are defined `:root` in globals.css).
- **E4** — `nvidia-service.ts` (NVIDIA NIM, deepseek); `ServiceLogicAIEngine` provider-selectable.
- **F1** — verified generated files populate the explorer post-completion (no change needed;
  `saveToDatabase` merges `...existingMeta, ...metadata` so `source_files` survives).
- **F2** — `llm-provider.ts` cascade; SecurityAgent + TestWriterAgent + Generator route
  through it; pipeline gate → `hasAnyProvider()`; lenient `extractJsonObject` in TestWriter;
  `KeyMissingError` message made provider-neutral.
- **G3** — emit `src/db/schema.ts` into the file map (was generated but never filed →
  Stability failed). `nestFiles["src/db/schema.ts"] = schemaCode.join("\n")`.
- **G1** — refresh-safe IDE (status-derived view, reconnecting poll, reconstructed failed
  state, retry from persisted metadata); pipeline `persistFailure` (paused + lastError).
- **G2** — real Monaco editor (`CodeEditor.tsx`/`.css`); PATCH `/api/projects/[id]/files`.
- **H** — audit: "stuck at building" → diagnosed anon-client RLS write-block (→ Phase I).
- **I** — service-role persistence (`service-role.ts`); `/api/generate` ownership gate.
- **J** — integrity check: only real missing files hard-fail; counts → warnings;
  `GenerationError` message de-presumptuous (dropped "check the wizard").
- **K** — audit: blueprint had 0 entities → qualifier is backend-biased (rejects
  PAGE/UI_COMPONENT, threshold 60 needs backend evidence). graphAnalytics healthy.
- **L / L2** — frontend entity promotion: Pass 2a (classifier ENTITY) + Pass 2b (cluster
  ROUTE + discriminating, FORM excluded). L2 replaced L's over-permissive default.
- **M** — audit: entities exist but 0 services → module-naming mismatch (CoreModule vs
  `${entity}Module`).
- **M2** — `synthesizeModules` emits per-entity `${entity}Module`.
- **N** — removed `feature_areas` question; seeded-message counts fall back to blueprint.
- **O** — `entity-fields` wizard stage + `EntityFieldsWizard` (split `finalizeWizard`,
  `pendingBlueprint`/`pendingSpec`).
- **P** — role/actor noun promotion; "+ Add Entity" in EntityFieldsWizard +
  `createModulesForNewEntities`; Railway settings UI wired to the real API.
- **Infra incident** — `.next` cache corruption from running `npm run build` during
  `npm run dev`; fixed by deleting `.next`. See §0.

---

## 5. Known issues / open items

1. **Capability-module naming mismatch (latent)** — §3.4. Affects projects with
   `capabilities.length > 0`. Not fixed (needs its own scope; touches `getModuleFolder`).
2. **Entity qualifier is backend-biased** — §3.3 (Phase K). Mitigated by Passes 2a/2b +
   role/actor, not cured. Frontend-only sources may still under-detect.
3. **NVIDIA TestWriter JSON reliability** — `TestWriterAgent` uses `max_tokens: 3000`, which
   may truncate two full spec files into invalid JSON (`extractJsonObject` can't repair
   truncation). If `modulesSkipped` is high on a live run, raise the token budget / tune the
   prompt for open-weight strictness (optionally add `NVIDIA_MODEL_TEST_WRITER`).
4. **Deploy URL not persisted** — §3.7. Lost on refresh.
5. **AppController/CoreModule registration unverified** — §3.8.
6. **Full end-to-end generation not run by assistant** — needs configured env + live keys.
   Inspect real rows with a one-off service-role script (Phases K/M pattern; delete after).
7. **Pre-existing/earlier:** `generation-page.tsx` still uses `simplicit_github_pat`
   (separate push/export feature); `graphAnalytics` threaded into the pipeline but not
   consumed; generated NestJS service layer uses placeholder Drizzle repos; in-memory rate
   limiter in `/api/generate`; `graphify-out/` graph is stale.

---

## 6. Environment variables (`.env.local`, gitignored)

| Var | Purpose | Status |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + auth | present |
| `SUPABASE_SERVICE_KEY` | **server-only** service-role; pipeline DB writes (RLS bypass) | present (canonical name is `SUPABASE_SERVICE_ROLE_KEY`; helper accepts both) |
| `SERVICE_LOGIC_PROVIDER=nvidia` | force Agent 2 → NVIDIA | present |
| `NVIDIA_API_KEY` | NVIDIA NIM | present |
| `NVIDIA_MODEL` | override model (default `deepseek-ai/deepseek-v4-pro`) | optional |
| `ANTHROPIC_API_KEY` | preferred provider when present | **absent** (MVP) |
| `SECURITY_PROVIDER` / `TEST_WRITER_PROVIDER` | per-agent override | optional |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `GITHUB_REDIRECT_URI` | GitHub OAuth | present |

Supabase tables/migrations: `projects` (RLS `auth.uid()=user_id`), `user_integrations`
(GitHub), `user_deploy_settings` (Railway/Render tokens). `generation_metadata` is JSONB
(`any`-typed) — `blueprint`, `specification`, `files`, `source_files`, `ingestion`,
`lastError`, `clarification`, `requirements`, `preferences` all live there.

---

## 7. New / key files (this session)

| Area | File |
|---|---|
| LLM provider resolver (NEW) | `src/features/generation/api/llm-provider.ts` |
| NVIDIA client (NEW) | `src/features/generation/api/nvidia-service.ts` |
| Service-role client (NEW) | `src/lib/supabase/service-role.ts` |
| File-save route (NEW) | `src/app/api/projects/[id]/files/route.ts` |
| Monaco editor (NEW) | `src/features/generation/components/CodeEditor.tsx` + `CodeEditor.css` |
| Entity-fields wizard (NEW) | `src/features/generation/components/EntityFieldsWizard.tsx` |
| Pipeline (heavily edited) | `src/features/generation/api/pipeline.ts` |
| Domain engine (entities + modules) | `src/features/architecture/domain-intelligence-engine.ts` |
| Blueprint builder + new-entity modules | `src/features/architecture/utils.ts` |
| Entity qualifier (read for audits) | `src/features/architecture/engines/entity-qualifier.ts` |
| Service/API generators (the `${entity}Module` contract) | `src/features/architecture/engines/service-generator.ts`, `api-surface-compiler.ts` |
| IDE shell (explorer/editor/wizard/refresh) | `src/features/generation/components/generation-ide.tsx` |
| Pipeline status panel | `src/features/generation/components/PipelineStatusPanel.tsx` + `.css` |
| Pipeline stream hook | `src/features/generation/hooks/usePipelineStream.ts` |
| Agents | `src/features/generation/api/{anthropic-service,security-agent,test-writer-agent,sdk-generator}.ts` |
| Error translation | `src/features/generation/utils/error-translator.ts` |
| Settings (Railway wired) | `src/features/settings/components/settings-page.tsx` |
| Deploy route | `src/app/api/deploy/railway/route.ts`, `src/app/api/deploy/settings/route.ts` |
| Generate route (ownership gate) | `src/app/api/generate/route.ts` |
| Workspace (source_files persist) | `src/features/workspace/components/workspace-page.tsx` |

(See the pre-session §3 history below for the ingestion/AST/graph-analytics/GitHub-OAuth work
that this session builds on.)

---

## 8. Build/run gotchas

- `createClient()` from `@/lib/supabase/server` is **async** — `await` it in route handlers.
- Next 15 route handlers: `params` is a **Promise** — `{ params }: { params: Promise<{id}> }`,
  then `const { id } = await params;`.
- **Never run `npm run build` while `npm run dev` is running** (corrupts `.next`). Use
  `npx tsc --noEmit` to verify; if the dev overlay shows `__webpack_modules__... is not a
  function`, stop dev → delete `.next` → restart dev.
- Monaco loads from CDN (jsdelivr) via `@monaco-editor/react`'s default loader.

---

## 9. Verify after pulling

```bash
npx tsc --noEmit --skipLibCheck   # expect 0 errors (the session gate)
# npm run build                   # ONLY with the dev server stopped
```

To inspect real persisted state (Phases K/M pattern), write a throwaway
`scripts/inspect-project.mjs` using `@next/env` (`loadEnvConfig`) + `@supabase/supabase-js`
with `SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_KEY` to read a `projects` row's
`generation_metadata` — then **delete the script** (audit-only; never leave debug scripts).

---

## 10. Pre-session history (baseline, commit 5b7ebc7 + earlier uncommitted D0–D3/A–C)

This session builds on prior work: the **ingestion/analysis pipeline** (`analyzeProject` →
Tree-sitter AST → `importGraph` → `GraphAnalyticsEngine` god-nodes/Louvain communities →
domain inference), the **architect** (`DomainIntelligenceEngine` → `BackendBlueprint`), the
**deterministic generator** (SchemaCompiler/DrizzleGenerator/ApiSurfaceCompiler/DtoGenerator/
ServiceGenerator/NestJSGenerator), **GitHub OAuth import** (`/api/auth/github/*`,
`/api/github/*`, `user_integrations` migration), the **SSE pipeline UI** (Phases A/B/C:
`PipelineStatusPanel`, `usePipelineStream`, `DeployButton`), and the **editor-first flow**
(Phases D0–D3: blueprint built client-side, flow store handoff, wizard in the IDE). Detailed
notes on that work were in the previous version of this file (git history of `5b7ebc7` and the
ingestion/architecture source comments). Key durable facts from it are folded into §2–§3 above.
