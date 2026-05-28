import type { GenerationMetadata } from "./types";
import {
  apiRoutes as examRoutes,
  fileTree as examFileTree,
  modules as examModules,
  routeCode as examRouteCode,
  schemaCode as examSchemaCode,
  schemaTables as examSchemaTables,
  stackSummary as examStackSummary,
  architectureNodes as examArchNodes,
  architectureEdges as examArchEdges
} from "@/lib/demo-data";

export class FallbackGenerator {
  public static generate(prompt: string, stack: string): GenerationMetadata {
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes("market") || lowerPrompt.includes("peer-to-peer")) {
      return this.getMarketplaceMetadata(stack);
    }
    if (lowerPrompt.includes("ai") || lowerPrompt.includes("llm") || lowerPrompt.includes("pinecone")) {
      return this.getAIMetadata(stack);
    }
    if (lowerPrompt.includes("saas") || lowerPrompt.includes("tenant") || lowerPrompt.includes("subscription")) {
      return this.getSaaSMetadata(stack);
    }
    if (lowerPrompt.includes("lms") || lowerPrompt.includes("course") || lowerPrompt.includes("student")) {
      return this.getLMSMetadata(stack);
    }

    // Default fallback: Generic template
    return {
      stackSummary: { ...examStackSummary, framework: stack },
      modules: [...examModules],
      apiRoutes: [...examRoutes],
      schemaTables: [...examSchemaTables],
      architectureNodes: [...examArchNodes],
      architectureEdges: [...examArchEdges],
      fileTree: [...examFileTree],
      routeCode: [...examRouteCode],
      schemaCode: [...examSchemaCode],
      authStrategy: {
        providers: "Email + Magic Link + Google",
        sessions: "Lucia Session · Cookie-based rolling",
        roles: "user · admin",
        mfa: "TOTP (optional)",
        rateLimit: "60 / min / IP",
      },
      authFlowSteps: [
        { n: 1, t: "POST /v1/auth/signup", d: "Register credentials and create user" },
        { n: 2, t: "POST /v1/auth/login", d: "Verify email/password, issue session" },
        { n: 3, t: "GET /v1/me", d: "Fetch session details and role permissions" },
      ],
      envVariables: [
        { k: "DATABASE_URL", v: "postgres://...", kind: "secret", note: "Primary PostgreSQL Database" },
        { k: "REDIS_URL", v: "redis://...", kind: "secret", note: "Queue, sessions and cache" },
        { k: "AUTH_SECRET", v: "••••••••", kind: "secret" },
      ],
    };
  }

  private static getSaaSMetadata(stack: string): GenerationMetadata {
    return {
      stackSummary: {
        runtime: "Node.js 20",
        framework: stack,
        language: "TypeScript",
        database: "PostgreSQL 16",
        orm: "Drizzle",
        auth: "Lucia",
        cache: "Redis",
        storage: "S3 / R2",
        queue: "BullMQ",
        payments: "Stripe",
        deploy: "Railway",
      },
      modules: [
        { id: "auth", name: "Auth Module", desc: "Multi-tenant auth, registration, magic links", icon: "Lock", status: "ready", files: 10 },
        { id: "teams", name: "Teams & Tenants", desc: "Create workspaces, manage memberships and invites", icon: "Users", status: "ready", files: 8 },
        { id: "billing", name: "Subscription Billing", desc: "Stripe portal, tiers, usage webhook tracking", icon: "Wallet", status: "ready", files: 12 },
        { id: "api_keys", name: "API Key Service", desc: "Issue and rotate API keys for external access", icon: "Key", status: "optional", files: 6 },
      ],
      apiRoutes: [
        { method: "POST", path: "/v1/auth/register", auth: null },
        { method: "POST", path: "/v1/auth/login", auth: null },
        { method: "GET", path: "/v1/workspaces", auth: "session" },
        { method: "POST", path: "/v1/workspaces", auth: "session" },
        { method: "POST", path: "/v1/billing/checkout", auth: "session" },
        { method: "POST", path: "/v1/billing/webhook", auth: null, note: "Stripe signed" },
        { method: "POST", path: "/v1/apikeys", auth: "session" },
      ],
      schemaTables: [
        {
          name: "users",
          x: 24,
          y: 24,
          accent: "blue",
          columns: [
            { name: "id", type: "uuid", pk: true },
            { name: "email", type: "text" },
            { name: "name", type: "text" },
            { name: "created_at", type: "timestamptz" },
          ],
        },
        {
          name: "workspaces",
          x: 290,
          y: 24,
          accent: "purple",
          columns: [
            { name: "id", type: "uuid", pk: true },
            { name: "name", type: "text" },
            { name: "slug", type: "text" },
            { name: "owner_id", type: "uuid", fk: true },
          ],
        },
        {
          name: "memberships",
          x: 290,
          y: 208,
          accent: "purple",
          columns: [
            { name: "id", type: "uuid", pk: true },
            { name: "workspace_id", type: "uuid", fk: true },
            { name: "user_id", type: "uuid", fk: true },
            { name: "role", type: "text" },
          ],
        },
        {
          name: "subscriptions",
          x: 556,
          y: 24,
          accent: "amber",
          columns: [
            { name: "id", type: "uuid", pk: true },
            { name: "workspace_id", type: "uuid", fk: true },
            { name: "stripe_id", type: "text" },
            { name: "status", type: "text" },
            { name: "ends_at", type: "timestamptz" },
          ],
        },
      ],
      architectureNodes: [
        { id: "web", kind: "client", title: "SaaS App UI", subtitle: "Next.js App Router", icon: "Globe", accent: "blue", x: 40, y: 60 },
        { id: "api", kind: "service", title: "API Gateway", subtitle: `${stack} backend`, icon: "Server", accent: "purple", x: 400, y: 60 },
        { id: "db", kind: "data", title: "PostgreSQL", subtitle: "Supabase PG", icon: "Database", accent: "green", x: 800, y: 30 },
        { id: "stripe", kind: "service", title: "Stripe API", subtitle: "Subscriptions", icon: "Wallet", accent: "amber", x: 800, y: 150 },
      ],
      architectureEdges: [
        ["web", "api", "HTTPS"],
        ["api", "db", "Drizzle"],
        ["api", "stripe", "REST"],
      ],
      fileTree: [
        {
          name: "src",
          type: "dir",
          children: [
            {
              name: "modules",
              type: "dir",
              children: [
                {
                  name: "workspaces",
                  type: "dir",
                  children: [
                    { name: "routes.ts", type: "file", path: "src/modules/workspaces/routes.ts", status: "new" },
                    { name: "service.ts", type: "file", path: "src/modules/workspaces/service.ts", status: "new" },
                  ],
                },
                {
                  name: "billing",
                  type: "dir",
                  children: [
                    { name: "routes.ts", type: "file", path: "src/modules/billing/routes.ts", status: "new" },
                  ],
                },
              ],
            },
            { name: "db.ts", type: "file", path: "src/db.ts", status: "new" },
          ],
        },
      ],
      routeCode: [
        `// src/modules/workspaces/routes.ts (framework: ${stack})`,
        "import { Hono } from 'hono';",
        "import { requireAuth } from '../../middleware/auth';",
        "",
        "export const workspacesRouter = new Hono();",
        "",
        "workspacesRouter.post('/', requireAuth, async (c) => {",
        "  const body = await c.req.json();",
        "  const newWorkspace = await db.insert(workspaces).values({",
        "    name: body.name,",
        "    ownerId: c.var.userId",
        "  }).returning();",
        "  return c.json({ workspace: newWorkspace[0] }, 201);",
        "});",
      ],
      schemaCode: [
        "// src/db/schema.ts",
        "import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';",
        "",
        "export const users = pgTable('users', {",
        "  id: uuid('id').primaryKey().defaultRandom(),",
        "  email: text('email').notNull().unique(),",
        "  name: text('name'),",
        "  createdAt: timestamp('created_at').defaultNow()",
        "});",
        "",
        "export const workspaces = pgTable('workspaces', {",
        "  id: uuid('id').primaryKey().defaultRandom(),",
        "  name: text('name').notNull(),",
        "  ownerId: uuid('owner_id').references(() => users.id)",
        "});",
      ],
      authStrategy: {
        providers: "Email + password, GitHub, Google",
        sessions: "Lucia session cookie + Redis store",
        roles: "owner · admin · member",
        mfa: "TOTP authenticator",
        rateLimit: "100 / min",
      },
      authFlowSteps: [
        { n: 1, t: "Signup / Login", d: "User authenticates, session created in DB and Redis" },
        { n: 2, t: "Invite Acceptance", d: "Adds user to membership table under workspace ID" },
        { n: 3, t: "RBAC Gating", d: "Middleware checks memberships role field before allowing workspace mutations" },
      ],
      envVariables: [
        { k: "DATABASE_URL", v: "postgres://...", kind: "secret", note: "PostgreSQL database connection string" },
        { k: "STRIPE_SECRET_KEY", v: "sk_test_...", kind: "secret" },
        { k: "AUTH_SECRET", v: "••••••••", kind: "secret" },
      ],
    };
  }

  private static getMarketplaceMetadata(stack: string): GenerationMetadata {
    return {
      stackSummary: {
        runtime: "Node.js 20",
        framework: stack,
        language: "TypeScript",
        database: "PostgreSQL 16",
        orm: "Drizzle",
        auth: "Lucia",
        cache: "Redis",
        storage: "S3 / R2",
        queue: "BullMQ",
        payments: "Stripe Escrow",
        deploy: "Railway",
      },
      modules: [
        { id: "listings", name: "Products & Listings", desc: "List goods with rich search, filters, tags", icon: "FileText", status: "ready", files: 14 },
        { id: "orders", name: "Order Engine", desc: "Escrow handling, payments hold, delivery signals", icon: "Wallet", status: "ready", files: 10 },
        { id: "reviews", name: "Ratings & Reviews", desc: "Verified buyer feedback, rating statistics", icon: "ShieldCheck", status: "ready", files: 6 },
      ],
      apiRoutes: [
        { method: "GET", path: "/v1/listings", auth: null },
        { method: "POST", path: "/v1/listings", auth: "session" },
        { method: "POST", path: "/v1/orders", auth: "session" },
        { method: "POST", path: "/v1/orders/:id/release", auth: "session", note: "Release escrow hold" },
      ],
      schemaTables: [
        {
          name: "listings",
          x: 24,
          y: 24,
          accent: "blue",
          columns: [
            { name: "id", type: "uuid", pk: true },
            { name: "title", type: "text" },
            { name: "price", type: "numeric" },
            { name: "seller_id", type: "uuid", fk: true },
          ],
        },
        {
          name: "orders",
          x: 290,
          y: 24,
          accent: "purple",
          columns: [
            { name: "id", type: "uuid", pk: true },
            { name: "listing_id", type: "uuid", fk: true },
            { name: "buyer_id", type: "uuid", fk: true },
            { name: "status", type: "text" },
          ],
        },
      ],
      architectureNodes: [
        { id: "client", kind: "client", title: "Marketplace UI", subtitle: "React Native / Web", icon: "Globe", accent: "blue", x: 40, y: 60 },
        { id: "api", kind: "service", title: "API", subtitle: stack, icon: "Server", accent: "purple", x: 400, y: 60 },
        { id: "pg", kind: "data", title: "PostgreSQL", subtitle: "Drizzle Store", icon: "Database", accent: "green", x: 800, y: 60 },
      ],
      architectureEdges: [
        ["client", "api", "HTTPS"],
        ["api", "pg", "Pool"],
      ],
      fileTree: [
        {
          name: "src",
          type: "dir",
          children: [
            {
              name: "modules",
              type: "dir",
              children: [
                {
                  name: "listings",
                  type: "dir",
                  children: [
                    { name: "routes.ts", type: "file", path: "src/modules/listings/routes.ts", status: "new" },
                  ],
                },
              ],
            },
          ],
        },
      ],
      routeCode: [
        `// src/modules/listings/routes.ts (framework: ${stack})`,
        "import { Hono } from 'hono';",
        "",
        "export const listingsRouter = new Hono();",
        "listingsRouter.get('/', async (c) => {",
        "  const list = await db.select().from(listings).limit(20);",
        "  return c.json({ listings: list });",
        "});",
      ],
      schemaCode: [
        "// src/db/schema.ts",
        "import { pgTable, uuid, text, numeric } from 'drizzle-orm/pg-core';",
        "",
        "export const listings = pgTable('listings', {",
        "  id: uuid('id').primaryKey().defaultRandom(),",
        "  title: text('title').notNull(),",
        "  price: numeric('price').notNull()",
        "});",
      ],
      authStrategy: {
        providers: "Email, Facebook, Google",
        sessions: "Lucia rolling cookies",
        roles: "buyer · seller · moderator",
        mfa: "None",
        rateLimit: "60/min",
      },
      authFlowSteps: [
        { n: 1, t: "Buyer Auth", d: "Logs in to perform search and place order request" },
        { n: 2, t: "Seller Verify", d: "Requires completed Stripe Connect onboarding before listing items" },
      ],
      envVariables: [
        { k: "DATABASE_URL", v: "postgres://...", kind: "secret" },
        { k: "STRIPE_CONNECT_CLIENT_ID", v: "ca_...", kind: "public" },
      ],
    };
  }

  private static getAIMetadata(stack: string): GenerationMetadata {
    return {
      stackSummary: {
        runtime: "Node.js 20",
        framework: stack,
        language: "TypeScript",
        database: "PostgreSQL + Pinecone",
        orm: "Drizzle",
        auth: "Lucia",
        cache: "Redis",
        storage: "S3",
        queue: "BullMQ",
        payments: "Stripe",
        deploy: "Railway",
      },
      modules: [
        { id: "vectors", name: "Vector Indexing", desc: "Pinecone indexing, document chunking, OpenAI embeddings", icon: "Server", status: "ready", files: 12 },
        { id: "chat", name: "RAG & LLM Completion", desc: "Context injection, prompt safety, streaming response", icon: "Sparkles", status: "ready", files: 8 },
        { id: "files", name: "Document Store", desc: "Upload and extraction queues via BullMQ", icon: "HardDrive", status: "ready", files: 10 },
      ],
      apiRoutes: [
        { method: "POST", path: "/v1/documents/upload", auth: "session" },
        { method: "POST", path: "/v1/chat/completions", auth: "session" },
        { method: "GET", path: "/v1/documents", auth: "session" },
      ],
      schemaTables: [
        {
          name: "documents",
          x: 24,
          y: 24,
          accent: "blue",
          columns: [
            { name: "id", type: "uuid", pk: true },
            { name: "filename", type: "text" },
            { name: "s3_url", type: "text" },
            { name: "owner_id", type: "uuid", fk: true },
          ],
        },
      ],
      architectureNodes: [
        { id: "client", kind: "client", title: "AI Dashboard", subtitle: "Next.js SPA", icon: "Globe", accent: "blue", x: 40, y: 60 },
        { id: "api", kind: "service", title: "API Node", subtitle: stack, icon: "Server", accent: "purple", x: 400, y: 60 },
        { id: "vector", kind: "data", title: "Pinecone DB", subtitle: "Vector store", icon: "Database", accent: "green", x: 800, y: 150 },
      ],
      architectureEdges: [
        ["client", "api", "HTTPS (SSE Stream)"],
        ["api", "vector", "gRPC"],
      ],
      fileTree: [
        {
          name: "src",
          type: "dir",
          children: [
            { name: "openai.ts", type: "file", path: "src/openai.ts", status: "new" },
          ],
        },
      ],
      routeCode: [
        `// src/modules/chat/routes.ts (framework: ${stack})`,
        "import { Hono } from 'hono';",
        "import { OpenAIService } from '../../services/openai';",
        "",
        "export const chatRouter = new Hono();",
        "chatRouter.post('/completions', async (c) => {",
        "  const { message } = await c.req.json();",
        "  const reply = await OpenAIService.complete(message);",
        "  return c.json({ reply });",
        "});",
      ],
      schemaCode: [
        "// src/db/schema.ts",
        "import { pgTable, uuid, text } from 'drizzle-orm/pg-core';",
        "",
        "export const documents = pgTable('documents', {",
        "  id: uuid('id').primaryKey().defaultRandom(),",
        "  filename: text('filename').notNull(),",
        "  s3Url: text('s3_url').notNull()",
        "});",
      ],
      authStrategy: {
        providers: "Email, Google SSO",
        sessions: "Lucia",
        roles: "user · auditor",
        mfa: "None",
        rateLimit: "30 / min",
      },
      authFlowSteps: [
        { n: 1, t: "Session Token", d: "Passed in headers for secure REST API access" },
      ],
      envVariables: [
        { k: "OPENAI_API_KEY", v: "sk_...", kind: "secret" },
        { k: "PINECONE_API_KEY", v: "pc_...", kind: "secret" },
      ],
    };
  }

  private static getLMSMetadata(stack: string): GenerationMetadata {
    return {
      stackSummary: {
        runtime: "Node.js 20",
        framework: stack,
        language: "TypeScript",
        database: "PostgreSQL 16",
        orm: "Drizzle",
        auth: "Lucia",
        cache: "Redis",
        storage: "S3",
        queue: "BullMQ",
        payments: "Stripe",
        deploy: "Railway",
      },
      modules: [
        { id: "courses", name: "Courses Module", desc: "Cohorts, modules, material attachments", icon: "FileText", status: "ready", files: 12 },
        { id: "progress", name: "Progress tracker", desc: "Saves completion marks and quiz results", icon: "ShieldCheck", status: "ready", files: 8 },
      ],
      apiRoutes: [
        { method: "GET", path: "/v1/courses", auth: "session" },
        { method: "POST", path: "/v1/courses", auth: "instructor" },
      ],
      schemaTables: [
        {
          name: "courses",
          x: 24,
          y: 24,
          accent: "blue",
          columns: [
            { name: "id", type: "uuid", pk: true },
            { name: "title", type: "text" },
          ],
        },
      ],
      architectureNodes: [
        { id: "client", kind: "client", title: "LMS Frontend", subtitle: "Vite + React", icon: "Globe", accent: "blue", x: 40, y: 60 },
        { id: "api", kind: "service", title: "API backend", subtitle: stack, icon: "Server", accent: "purple", x: 400, y: 60 },
      ],
      architectureEdges: [
        ["client", "api", "HTTPS"],
      ],
      fileTree: [
        {
          name: "src",
          type: "dir",
          children: [
            { name: "app.ts", type: "file", path: "src/app.ts", status: "new" },
          ],
        },
      ],
      routeCode: [
        `// src/modules/courses/routes.ts (framework: ${stack})`,
        "import { Hono } from 'hono';",
        "",
        "export const coursesRouter = new Hono();",
        "coursesRouter.get('/', async (c) => {",
        "  return c.json({ courses: [] });",
        "});",
      ],
      schemaCode: [
        "// src/db/schema.ts",
        "import { pgTable, uuid, text } from 'drizzle-orm/pg-core';",
        "",
        "export const courses = pgTable('courses', {",
        "  id: uuid('id').primaryKey().defaultRandom(),",
        "  title: text('title').notNull()",
        "});",
      ],
      authStrategy: {
        providers: "Email",
        sessions: "Lucia",
        roles: "student · instructor · admin",
        mfa: "None",
        rateLimit: "100/min",
      },
      authFlowSteps: [
        { n: 1, t: "Session creation", d: "Standard Lucia session" },
      ],
      envVariables: [
        { k: "DATABASE_URL", v: "postgres://...", kind: "secret" },
      ],
    };
  }
}
