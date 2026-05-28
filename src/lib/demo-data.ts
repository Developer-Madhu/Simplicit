import type {
  ArchitectureNode,
  FileNode,
  ModuleSummary,
  Project,
  RouteSummary,
  SchemaTable
} from "@/lib/types";

export const heroPrompt =
  "Build backend for an online exam platform with student auth, instructor dashboard, analytics, payments, and test management.";

export const stackSummary = {
  runtime: "Node.js 20",
  framework: "Hono",
  language: "TypeScript",
  database: "PostgreSQL 16",
  orm: "Drizzle",
  auth: "Lucia",
  cache: "Redis",
  storage: "S3 / R2",
  queue: "BullMQ",
  payments: "Stripe",
  deploy: "Railway"
} as const;

export const projects: Project[] = [
  {
    id: "p1",
    workspace_id: "w1",
    name: "Examly API",
    stack: "Hono · PG · Redis",
    updated: "12 min ago",
    status: "deployed",
    health: 99.9,
    dot: "green",
    prompt: "Online exam platform with proctoring"
  },
  {
    id: "p2",
    workspace_id: "w1",
    name: "Loop Marketplace",
    stack: "Fastify · PG · S3",
    updated: "2 h ago",
    status: "building",
    health: 100,
    dot: "amber",
    prompt: "P2P rental marketplace with escrow"
  },
  {
    id: "p3",
    workspace_id: "w1",
    name: "Nova LMS",
    stack: "Hono · PG · Mux",
    updated: "5 h ago",
    status: "deployed",
    health: 100,
    dot: "green",
    prompt: "LMS with cohort-based courses"
  },
  {
    id: "p4",
    workspace_id: "w1",
    name: "Brief AI",
    stack: "Hono · PG · Pinecone",
    updated: "yesterday",
    status: "draft",
    health: null,
    dot: "gray",
    prompt: "AI document workspace"
  },
  {
    id: "p5",
    workspace_id: "w1",
    name: "Tessera Billing",
    stack: "Express · PG · Stripe",
    updated: "2 days ago",
    status: "deployed",
    health: 99.4,
    dot: "green",
    prompt: "Usage-based billing engine"
  },
  {
    id: "p6",
    workspace_id: "w1",
    name: "Pulse Analytics",
    stack: "Hono · ClickHouse",
    updated: "4 days ago",
    status: "paused",
    health: null,
    dot: "gray",
    prompt: "Product analytics ingestion API"
  }
];

export const modules: ModuleSummary[] = [
  {
    id: "auth",
    name: "Auth",
    desc: "Email + magic link, OAuth, session and role-gated access.",
    icon: "Lock",
    status: "ready",
    files: 14
  },
  {
    id: "students",
    name: "Students",
    desc: "Enrollment, profiles, cohort management.",
    icon: "Users",
    status: "ready",
    files: 9
  },
  {
    id: "tests",
    name: "Test Engine",
    desc: "Question bank, sessions, timers, autograding.",
    icon: "FileText",
    status: "ready",
    files: 22
  },
  {
    id: "proctor",
    name: "Proctoring",
    desc: "Snapshot intervals, tab integrity signals, review reports.",
    icon: "ShieldCheck",
    status: "ready",
    files: 11
  },
  {
    id: "analytics",
    name: "Analytics",
    desc: "Cohort, item, and outcome analytics with materialized views.",
    icon: "BarChart3",
    status: "ready",
    files: 8
  },
  {
    id: "payments",
    name: "Payments",
    desc: "Checkout, signed webhooks, invoices, and seat management.",
    icon: "Wallet",
    status: "ready",
    files: 12
  },
  {
    id: "notify",
    name: "Notifications",
    desc: "Queued email delivery and in-app system notices.",
    icon: "Bell",
    status: "optional",
    files: 7
  },
  {
    id: "admin",
    name: "Admin API",
    desc: "Instructor dashboards, audit logs, and exports.",
    icon: "Settings2",
    status: "ready",
    files: 10
  }
];

export const apiRoutes: RouteSummary[] = [
  { method: "POST", path: "/v1/auth/signup", auth: null },
  { method: "POST", path: "/v1/auth/login", auth: null },
  { method: "POST", path: "/v1/auth/oauth/:provider", auth: null },
  { method: "POST", path: "/v1/auth/logout", auth: "session" },
  { method: "GET", path: "/v1/me", auth: "session" },
  { method: "GET", path: "/v1/courses", auth: "session" },
  { method: "POST", path: "/v1/courses", auth: "instructor" },
  { method: "PATCH", path: "/v1/courses/:id", auth: "instructor" },
  { method: "GET", path: "/v1/courses/:id/exams", auth: "session" },
  { method: "POST", path: "/v1/exams", auth: "instructor" },
  { method: "GET", path: "/v1/exams/:id", auth: "session" },
  { method: "POST", path: "/v1/exams/:id/attempts", auth: "student" },
  { method: "PATCH", path: "/v1/attempts/:id", auth: "student" },
  { method: "POST", path: "/v1/attempts/:id/submit", auth: "student" },
  { method: "GET", path: "/v1/analytics/cohorts/:id", auth: "instructor" },
  { method: "POST", path: "/v1/payments/checkout", auth: "session" },
  { method: "POST", path: "/v1/payments/webhook", auth: null, note: "Stripe signed" },
  { method: "DELETE", path: "/v1/admin/users/:id", auth: "admin" }
];

export const schemaTables: SchemaTable[] = [
  {
    name: "users",
    x: 24,
    y: 24,
    accent: "blue",
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "email", type: "citext" },
      { name: "name", type: "text" },
      { name: "role", type: "enum" },
      { name: "created_at", type: "timestamptz" }
    ]
  },
  {
    name: "sessions",
    x: 24,
    y: 208,
    accent: "blue",
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "user_id", type: "uuid", fk: true },
      { name: "ip", type: "inet" },
      { name: "expires_at", type: "timestamptz" }
    ]
  },
  {
    name: "courses",
    x: 290,
    y: 24,
    accent: "purple",
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "instructor_id", type: "uuid", fk: true },
      { name: "title", type: "text" },
      { name: "slug", type: "text" },
      { name: "published_at", type: "timestamptz" }
    ]
  },
  {
    name: "exams",
    x: 290,
    y: 210,
    accent: "purple",
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "course_id", type: "uuid", fk: true },
      { name: "title", type: "text" },
      { name: "duration_min", type: "int" },
      { name: "opens_at", type: "timestamptz" },
      { name: "closes_at", type: "timestamptz" }
    ]
  },
  {
    name: "questions",
    x: 556,
    y: 24,
    accent: "green",
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "exam_id", type: "uuid", fk: true },
      { name: "kind", type: "enum" },
      { name: "body", type: "jsonb" },
      { name: "points", type: "int" }
    ]
  },
  {
    name: "attempts",
    x: 556,
    y: 224,
    accent: "green",
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "exam_id", type: "uuid", fk: true },
      { name: "student_id", type: "uuid", fk: true },
      { name: "started_at", type: "timestamptz" },
      { name: "submitted_at", type: "timestamptz" },
      { name: "score", type: "numeric" }
    ]
  },
  {
    name: "payments",
    x: 822,
    y: 24,
    accent: "amber",
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "user_id", type: "uuid", fk: true },
      { name: "stripe_id", type: "text" },
      { name: "amount", type: "int" },
      { name: "status", type: "enum" }
    ]
  }
];

export const architectureNodes: ArchitectureNode[] = [
  {
    id: "web",
    kind: "client",
    title: "Web Client",
    subtitle: "Next.js · iOS",
    icon: "Globe",
    accent: "blue",
    x: 40,
    y: 60
  },
  {
    id: "edge",
    kind: "edge",
    title: "Edge / CDN",
    subtitle: "Cloudflare",
    icon: "Cloud",
    accent: "blue",
    x: 250,
    y: 60
  },
  {
    id: "api",
    kind: "service",
    title: "API Gateway",
    subtitle: "Hono · /v1",
    icon: "Server",
    accent: "purple",
    x: 470,
    y: 60
  },
  {
    id: "auth",
    kind: "service",
    title: "Auth Service",
    subtitle: "Lucia",
    icon: "Lock",
    accent: "purple",
    x: 700,
    y: 0
  },
  {
    id: "exam",
    kind: "service",
    title: "Exam Service",
    subtitle: "sessions",
    icon: "FileText",
    accent: "purple",
    x: 700,
    y: 80
  },
  {
    id: "pay",
    kind: "service",
    title: "Payments",
    subtitle: "Stripe",
    icon: "Wallet",
    accent: "amber",
    x: 700,
    y: 160
  },
  {
    id: "queue",
    kind: "queue",
    title: "Job Queue",
    subtitle: "BullMQ",
    icon: "Layers3",
    accent: "blue",
    x: 700,
    y: 240
  },
  {
    id: "pg",
    kind: "data",
    title: "PostgreSQL",
    subtitle: "primary",
    icon: "Database",
    accent: "green",
    x: 930,
    y: 40
  },
  {
    id: "redis",
    kind: "data",
    title: "Redis",
    subtitle: "cache · sessions",
    icon: "Cylinder",
    accent: "green",
    x: 930,
    y: 130
  },
  {
    id: "s3",
    kind: "data",
    title: "Object Storage",
    subtitle: "S3 / R2",
    icon: "HardDrive",
    accent: "green",
    x: 930,
    y: 220
  }
];

export const architectureEdges: Array<[string, string, string]> = [
  ["web", "edge", "HTTPS"],
  ["edge", "api", "REST"],
  ["api", "auth", "RPC"],
  ["api", "exam", "RPC"],
  ["api", "pay", "RPC"],
  ["api", "queue", "enqueue"],
  ["auth", "pg", ""],
  ["auth", "redis", ""],
  ["exam", "pg", ""],
  ["exam", "queue", ""],
  ["pay", "pg", ""],
  ["queue", "pg", ""],
  ["queue", "s3", ""]
];

export const fileTree: FileNode[] = [
  {
    name: "apps",
    type: "dir",
    children: [
      {
        name: "api",
        type: "dir",
        children: [
          {
            name: "src",
            type: "dir",
            children: [
              { name: "index.ts", type: "file", path: "apps/api/src/index.ts", status: "new" },
              { name: "app.ts", type: "file", path: "apps/api/src/app.ts", status: "new" },
              {
                name: "modules",
                type: "dir",
                children: [
                  {
                    name: "auth",
                    type: "dir",
                    children: [
                      { name: "routes.ts", type: "file", path: "apps/api/src/modules/auth/routes.ts", status: "new" },
                      { name: "service.ts", type: "file", path: "apps/api/src/modules/auth/service.ts", status: "new" }
                    ]
                  },
                  {
                    name: "exams",
                    type: "dir",
                    children: [
                      { name: "routes.ts", type: "file", path: "apps/api/src/modules/exams/routes.ts", status: "new" },
                      { name: "service.ts", type: "file", path: "apps/api/src/modules/exams/service.ts", status: "new" },
                      { name: "autograde.ts", type: "file", path: "apps/api/src/modules/exams/autograde.ts", status: "new" }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    name: "packages",
    type: "dir",
    children: [
      {
        name: "db",
        type: "dir",
        children: [
          { name: "schema.ts", type: "file", path: "packages/db/schema.ts", status: "new" },
          {
            name: "migrations",
            type: "dir",
            children: [{ name: "0001_init.sql", type: "file", path: "packages/db/migrations/0001_init.sql", status: "new" }]
          }
        ]
      }
    ]
  },
  { name: "docker-compose.yml", type: "file", path: "docker-compose.yml", status: "new" },
  { name: "railway.json", type: "file", path: "railway.json", status: "new" },
  { name: ".env.example", type: "file", path: ".env.example", status: "new" }
];

export const routeCode = [
  "// apps/api/src/modules/exams/routes.ts",
  "import { Hono } from 'hono'",
  "import { z } from 'zod'",
  "import { requireAuth } from '@/middleware/auth'",
  "import { examService } from './service'",
  "",
  "export const router = new Hono()",
  "",
  "router.post('/', requireAuth('instructor'), async (c) => {",
  "  const body = await c.req.json()",
  "  const parsed = CreateExam.parse(body)",
  "  const exam = await examService.create(parsed)",
  "  return c.json({ exam }, 201)",
  "})",
  "",
  "router.post('/:id/attempts', requireAuth('student'), async (c) => {",
  "  const attempt = await examService.startAttempt(c.req.param('id'), c.var.userId)",
  "  return c.json({ attempt })",
  "})"
];

export const schemaCode = [
  "// packages/db/schema.ts",
  "import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core'",
  "",
  "export const users = pgTable('users', {",
  "  id: uuid().primaryKey().defaultRandom(),",
  "  email: text().notNull().unique(),",
  "  name: text(),",
  "  role: text().$type<'student' | 'instructor' | 'admin'>(),",
  "  createdAt: timestamp({ withTimezone: true }).defaultNow(),",
  "})",
  "",
  "export const exams = pgTable('exams', {",
  "  id: uuid().primaryKey().defaultRandom(),",
  "  courseId: uuid().references(() => courses.id),",
  "  title: text().notNull(),",
  "  durationMin: integer().notNull(),",
  "  opensAt: timestamp({ withTimezone: true }),",
  "  closesAt: timestamp({ withTimezone: true }),",
  "})"
];
