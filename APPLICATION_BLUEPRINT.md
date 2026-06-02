# APPLICATION BLUEPRINT: Simplicit

## 1. Executive Summary & Context
Simplicit is a high-fidelity code generation and architectural synthesis platform designed to transform high-level codebase context into structured, production-ready backend specifications and source code. Unlike generic AI coding assistants, Simplicit focuses on **Domain-Driven Synthesis**, reconstructing the underlying business domain from existing artifacts (code, documentation, or design files) and generating complete system blueprints.

### What is Built:
*   **Context Ingestion Pipeline:** A multi-stage system that parses source code (GitHub/Zip), extracts semantic intent, and maps the "as-is" state of a project.
*   **Architecture Synthesis Engine:** A suite of specialized engines that "hallucinate" or reconstruct missing backend components (Entities, Workflows, APIs, Infrastructure) based on frontend patterns.
*   **Interactive Architecture Review:** A specialized UI for developers to review, validate, and resolve gaps in the synthesized architecture.
*   **High-Fidelity Code Generator:** A pipeline that converts validated blueprints into specific target stacks (e.g., NestJS, Drizzle, Supabase).

---

## 2. Technical Stack & Infrastructure
*   **Framework:** Next.js 15 (App Router, TypeScript)
*   **Authentication & Database:** Supabase (PostgreSQL, Auth, Storage)
*   **State Management:** React Context (Shell, Auth, Workspace, Toast)
*   **Styling:** Vanilla CSS + Tailwind CSS + Lucide React (Icons)
*   **Data Fetching:** TanStack Query (React Query)
*   **Schema & Validation:** Zod + React Hook Form
*   **Core Libraries:** JSZip (file processing), clsx/tailwind-merge (UI utilities)

---

## 3. Core Architecture & Logic Flow

### A. The Ingestion Workflow (`src/features/ingestion`)
This is the entry point for "Context-Aware" generation.
1.  **Provider Layer:** `github-provider.ts` and `zip-provider.ts` fetch raw files.
2.  **Analysis Stage (`analyzers/index.ts`):** 
    *   `route-extractor.ts`: Maps frontend pages/APIs to understand user entry points.
    *   `framework-detector.ts`: Identifies the tech stack (Next.js, Nuxt, etc.).
    *   `context-parser.ts`: The "Brain" – it parses the `Simplicit Context Specification` (GEMINI.md/AGENTS.md) into structured JSON.
3.  **Inference Stage:**
    *   `entity-inferrer.ts`: Guesses the data models.
    *   `workflow-inferrer.ts`: Guesses business processes (e.g., "Checkout Flow").
    *   `role-inferrer.ts`: Identifies user types (Admin, Guest).

### B. The Architecture Feature (`src/features/architecture`)
This layer takes the "Inferred" data and builds a formal specification.
1.  **Domain Intelligence Engine:** The central coordinator. It uses `EvidenceEngine` to score the confidence of discovered components.
2.  **Specialized Engines:**
    *   `DomainDiscoveryEngine`: Finds the "Golden" entities.
    *   `GapDetector`: Identifies what's missing (e.g., "You have a Login page but no Auth service").
    *   `BusinessCapabilityEngine`: Groups entities into functional domains.
    *   `SynthesisEngine`: Produces the final `BackendBlueprint`.
3.  **Validation:** `BlueprintConsistencyValidator` and `ReadinessValidator` ensure the generated architecture is technically sound before code generation.

### C. The Generation Pipeline (`src/features/generation`)
Translates the `BackendBlueprint` into code.
1.  **Generation Plan:** `generation-plan.ts` orchestrates the tasks.
2.  **Target Generators:** 
    *   `nestjs-generator.ts`: Produces NestJS modules.
    *   `drizzle-generator.ts`: Produces database schemas.
    *   `api-generator.ts`: Produces OpenAPI/Swagger specs.
3.  **Safety:** `generation-guard.ts` and `runtime-validation-engine.ts` check for syntax errors and logic flaws in the generated output.

---

## 4. Implemented Workflows

1.  **Project Onboarding:**
    *   User creates a project -> `useCreateProject` (Supabase).
    *   User uploads code/context -> `IngestionPanel` starts the analysis.
    *   `analyzeProject()` runs the pipeline and returns an `IngestionResult`.

2.  **Architectural Refinement:**
    *   User views the graph in `ArchitecturePage`.
    *   `GapResolutionWizard` asks questions for missing info.
    *   `SynthesisEngine` updates the `BackendBlueprint` in real-time.

3.  **Code Export:**
    *   User selects "Generate Code".
    *   `GenerationPipeline` runs (Context Builder -> AI Generation -> Validation).
    *   `ProjectExporter` packages the code into a downloadable ZIP or pushes to GitHub.

---

## 5. Detailed Code File Map

### Core App & Layout (`src/app`)
*   `layout.tsx`: Root layout with `Providers`.
*   `providers.tsx`: Wraps the app in `QueryClientProvider`, `AuthProvider`, `WorkspaceProvider`, `ToastProvider`, and `ShellProvider`.
*   `(product)/layout.tsx`: Main dashboard shell layout.
*   `api/generate/route.ts`: Proxies code generation requests to LLM providers.

### Architecture Feature (`src/features/architecture`)
*   `domain-intelligence-engine.ts`: Orchestrates the reconstruction of the domain model.
*   `synthesis-engine.ts`: Converts domain models into a `BackendBlueprint`.
*   `engines/gap-detector.ts`: Finds missing pieces in the architecture.
*   `engines/business-capability-engine.ts`: Maps entities to business goals.
*   `components/architecture-graph.tsx`: Interactive D3-like visualization of the synthesized domain.
*   `components/gap-resolution-wizard.tsx`: Multi-step UI for answering architectural questions.

### Ingestion Feature (`src/features/ingestion`)
*   `analyzers/context-parser.ts`: Sophisticated regex-based parser for structured markdown context.
*   `analyzers/route-extractor.ts`: Detects routes for Next.js (Pages/App), Nuxt, Astro, and SvelteKit.
*   `components/ingestion-panel.tsx`: The UI for the file upload and analysis progress.

### Generation Feature (`src/features/generation`)
*   `api/pipeline.ts`: The state machine for the multi-step generation process.
*   `api/nestjs-generator.ts`: Template logic for generating NestJS code.
*   `components/generation-page.tsx`: Full-screen IDE-like view for generated code.

### Core App & Layout (`src/app`)
*   **src/middleware.ts**: Handles global authentication redirects and session refreshes for Supabase.
*   **src/app/layout.tsx**: The root component that sets up the HTML structure and global font styles.
*   **src/app/page.tsx**: The public landing page entry point.
*   **src/app/providers.tsx**: Orchestrates global context providers (React Query, Auth, Workspace, Shell).
*   **src/app/(product)/layout.tsx**: Wraps all product-authenticated routes with the Sidebar and Topbar.
*   **src/app/(product)/architecture/page.tsx**: Entry for the interactive architecture synthesis and review.
*   **src/app/(product)/dashboard/page.tsx**: Overview of all projects and recent generations.
*   **src/app/(product)/deployments/page.tsx**: Lists active and past code generation exports.
*   **src/app/(product)/docs/page.tsx**: Internal documentation viewer for the Simplicit platform.
*   **src/app/(product)/generations/page.tsx**: List view for all code generation jobs.
*   **src/app/(product)/generations/[id]/page.tsx**: Detailed IDE view for a specific generated code output.
*   **src/app/(product)/settings/page.tsx**: User profile and API key configuration (Supabase, OpenAI, etc.).
*   **src/app/(product)/templates/page.tsx**: Browsing pre-defined architectural templates.
*   **src/app/(product)/workspace/page.tsx**: The central "Work" area for ingesting code and refining project context.
*   **src/app/api/generate/route.ts**: Backend endpoint for LLM-powered code generation.
*   **src/app/api/prompts/route.ts**: Serves system prompts and templates to the frontend.
*   **src/app/auth/callback/route.ts**: Handles Supabase Auth redirect and session exchange.
*   **src/app/forgot-password/page.tsx**: UI for requesting password reset emails.
*   **src/app/sign-in/page.tsx**: Main login UI.
*   **src/app/sign-up/page.tsx**: New user registration UI.

### Architecture Engines (`src/features/architecture`)
*   **src/features/architecture/domain-intelligence-engine.ts**: The master coordinator that reconstructs a logical domain from fragmented evidence (code, docs).
*   **src/features/architecture/domain-discovery-engine.ts**: Specifically focuses on identifying "Golden Entities" (core data models).
*   **src/features/architecture/evidence-engine.ts**: Gathers and scores "signals" from the codebase to confirm architectural assumptions.
*   **src/features/architecture/synthesis-engine.ts**: Compiles all intelligence into a valid `BackendBlueprint` JSON.
*   **src/features/architecture/engines/gap-detector.ts**: Analyzes the blueprint against frontend routes to find missing logic (e.g., missing CRUD for a visible table).
*   **src/features/architecture/engines/gap-resolution-engine.ts**: Logic for applying user answers back into the domain graph.
*   **src/features/architecture/engines/api-surface-compiler.ts**: Generates endpoint definitions based on architectural needs.
*   **src/features/architecture/engines/schema-compiler.ts**: Translates entities into database-agnostic schema definitions.
*   **src/features/architecture/engines/semantic-classifier.ts**: Uses NLP-style matching to categorize code artifacts (e.g., identifying a "Profile" component as a "User" domain).
*   **src/features/architecture/engines/business-capability-engine.ts**: Groups low-level entities into high-level business functions.
*   **src/features/architecture/engines/pattern-engine.ts**: Identifies recurring architectural patterns (e.g., Auth, Payments, File Storage).
*   **src/features/architecture/engines/readiness-validator.ts**: Final check to ensure the architecture is "generate-ready."

### Ingestion Pipeline (`src/features/ingestion`)
*   **src/features/ingestion/analyzers/index.ts**: Orchestrates the multi-stage project analysis.
*   **src/features/ingestion/analyzers/context-parser.ts**: Deep-parses `GEMINI.md`/`AGENTS.md` to extract explicit developer intent.
*   **src/features/ingestion/analyzers/route-extractor.ts**: Analyzes the filesystem to map the project's URL structure.
*   **src/features/ingestion/analyzers/framework-detector.ts**: Heuristic engine to identify React/Next/Nuxt stacks.
*   **src/features/ingestion/analyzers/entity-inferrer.ts**: Scans components and API calls to deduce data models.
*   **src/features/ingestion/analyzers/workflow-inferrer.ts**: Links routes and buttons to logical business flows.
*   **src/features/ingestion/analyzers/complexity-analyzer.ts**: Calculates project scale and technical debt scores.
*   **src/features/ingestion/providers/github-provider.ts**: Logic for fetching and recursing through GitHub repositories.
*   **src/features/ingestion/providers/zip-provider.ts**: Processes local ZIP uploads for analysis.

### Generation Pipeline (`src/features/generation`)
*   **src/features/generation/api/pipeline.ts**: The main state machine managing the Generate -> Validate -> Export cycle.
*   **src/features/generation/api/nestjs-generator.ts**: Compiles blueprints into NestJS Controllers, Services, and Modules.
*   **src/features/generation/api/drizzle-generator.ts**: Generates Drizzle ORM schema and migration files.
*   **src/features/generation/api/project-exporter.ts**: Bundles all generated files into a standardized project structure.
*   **src/features/generation/api/generation-guard.ts**: Prevents illegal or broken code from being finalized.
*   **src/features/generation/api/openai.ts**: The wrapper for interacting with OpenAI (or compatible) LLMs.
*   **src/features/generation/api/runtime-validation-engine.ts**: Compiles generated code in a sandbox to verify syntax correctness.

### State & Logic (`src/lib`, `src/features/*/context`)
*   **src/lib/supabase/client.ts**: Standard client for frontend Supabase interactions.
*   **src/lib/utils.ts**: Shared UI utilities (cn, formatting).
*   **src/features/auth/context/auth-context.tsx**: Manages user session state and profile data.
*   **src/features/workspace/context/workspace-context.tsx**: Tracks the active Project and Workspace selected by the user.
*   **src/features/shell/context/shell-context.tsx**: Controls sidebar visibility and global command palette state.

### Marketing & Landing (`src/features/marketing`)
*   **src/features/marketing/components/landing-page.tsx**: The primary conversion page featuring hero sections, feature grids, and pricing. Uses `AuthShell` for consistent branding.

### Templates & Blueprints (`src/features/templates`)
*   **src/features/templates/components/templates-page.tsx**: Allows users to start with pre-baked architectures (e.g., "SaaS Starter", "E-commerce Backend").
*   **src/lib/demo-data.ts**: Provides mock data for templates and initial project views.

### Documentation Feature (`src/features/docs`)
*   **src/features/docs/components/docs-page.tsx**: A specialized viewer for internal markdown guides and API references.


---

## 6. UI-Backend Connection (The "Glue")
The application uses **Custom Hooks as Controllers** to bridge the engines and the UI:

*   **`useAuth`**: Connects `SignInPage` to Supabase Auth.
*   **`useWorkspace`**: Connects `WorkspacePage` to the currently active workspace/project state.
*   **`useProjects`**: Connects `DashboardPage` to project CRUD operations.
*   **`analyzeProject()`**: The bridge between `IngestionPanel` (UI) and the `ContextParser` (Backend Logic).
*   **`generateArchitectureReview()`**: Bridges the `ArchitecturePage` to the `GapDetector`.
*   **`GenerationPipeline`**: Bridges the `GenerationPage` UI to the LLM generation logic.

---

## 7. Context Specification Connection
The application is designed to be **"Agent-Driven"**. It specifically looks for files like `GEMINI.md` or `AGENTS.md` to feed the `ContextParser`. This allows the AI to understand the "Human Intent" that raw code might miss (e.g., naming conventions, business rules, security preferences).
