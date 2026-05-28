// Fixture data shared across StackForge screens.
// All screens reference the same fictional "online exam platform" backend.

const SF_PROMPT = "Build backend for an online exam platform with student auth, instructor dashboard, analytics, payments, and test management.";

const SF_STACK = {
  runtime: 'Node.js 20',
  framework: 'Hono',
  language: 'TypeScript',
  database: 'PostgreSQL 16',
  orm: 'Drizzle',
  auth: 'Lucia',
  cache: 'Redis',
  storage: 'S3 / R2',
  queue: 'BullMQ',
  payments: 'Stripe',
  deploy: 'Railway',
};

const SF_MODULES = [
  { id: 'auth',       name: 'Auth',          desc: 'Email + magic link, OAuth (Google, GitHub), role-based access.', icon: 'Lock',     status: 'ready',     files: 14 },
  { id: 'students',   name: 'Students',      desc: 'Enrollment, profiles, cohort management.',                       icon: 'User',     status: 'ready',     files: 9 },
  { id: 'tests',      name: 'Test Engine',   desc: 'Question bank, sessions, timers, autograding.',                  icon: 'File',     status: 'ready',     files: 22 },
  { id: 'proctor',    name: 'Proctoring',    desc: 'Tab focus, snapshot intervals, integrity reports.',              icon: 'Eye',      status: 'ready',     files: 11 },
  { id: 'analytics',  name: 'Analytics',     desc: 'Cohort, item, and outcome analytics with materialized views.',   icon: 'Layers',   status: 'ready',     files: 8 },
  { id: 'payments',   name: 'Payments',      desc: 'Stripe checkout + webhooks, license seats, invoicing.',          icon: 'Zap',      status: 'ready',     files: 12 },
  { id: 'notify',     name: 'Notifications', desc: 'Email (Resend), in-app inbox, queued delivery.',                 icon: 'Bell',     status: 'optional',  files: 7 },
  { id: 'admin',      name: 'Admin API',     desc: 'Instructor dashboards, audit log, exports.',                     icon: 'Settings', status: 'ready',     files: 10 },
];

const SF_SCHEMA = [
  { name: 'users',         x: 24,  y: 24,  accent: 'blue', columns: [
    { name: 'id', type: 'uuid', pk: true },
    { name: 'email', type: 'citext' },
    { name: 'name', type: 'text' },
    { name: 'role', type: 'enum' },
    { name: 'created_at', type: 'timestamptz' },
  ]},
  { name: 'sessions',      x: 24,  y: 200, accent: 'blue', columns: [
    { name: 'id', type: 'uuid', pk: true },
    { name: 'user_id', type: 'uuid', fk: true },
    { name: 'ip', type: 'inet' },
    { name: 'expires_at', type: 'timestamptz' },
  ]},
  { name: 'courses',       x: 290, y: 24,  accent: 'purple', columns: [
    { name: 'id', type: 'uuid', pk: true },
    { name: 'instructor_id', type: 'uuid', fk: true },
    { name: 'title', type: 'text' },
    { name: 'slug', type: 'text' },
    { name: 'published_at', type: 'timestamptz' },
  ]},
  { name: 'exams',         x: 290, y: 210, accent: 'purple', columns: [
    { name: 'id', type: 'uuid', pk: true },
    { name: 'course_id', type: 'uuid', fk: true },
    { name: 'title', type: 'text' },
    { name: 'duration_min', type: 'int' },
    { name: 'opens_at', type: 'timestamptz' },
    { name: 'closes_at', type: 'timestamptz' },
  ]},
  { name: 'questions',     x: 556, y: 24,  accent: 'green', columns: [
    { name: 'id', type: 'uuid', pk: true },
    { name: 'exam_id', type: 'uuid', fk: true },
    { name: 'kind', type: 'enum' },
    { name: 'body', type: 'jsonb' },
    { name: 'points', type: 'int' },
  ]},
  { name: 'attempts',      x: 556, y: 224, accent: 'green', columns: [
    { name: 'id', type: 'uuid', pk: true },
    { name: 'exam_id', type: 'uuid', fk: true },
    { name: 'student_id', type: 'uuid', fk: true },
    { name: 'started_at', type: 'timestamptz' },
    { name: 'submitted_at', type: 'timestamptz' },
    { name: 'score', type: 'numeric' },
  ]},
  { name: 'payments',      x: 822, y: 24, accent: 'amber', columns: [
    { name: 'id', type: 'uuid', pk: true },
    { name: 'user_id', type: 'uuid', fk: true },
    { name: 'stripe_id', type: 'text' },
    { name: 'amount', type: 'int' },
    { name: 'status', type: 'enum' },
  ]},
];

const SF_ROUTES = [
  { method: 'POST',   path: '/v1/auth/signup',                           auth: null },
  { method: 'POST',   path: '/v1/auth/login',                            auth: null },
  { method: 'POST',   path: '/v1/auth/oauth/:provider',                  auth: null },
  { method: 'POST',   path: '/v1/auth/logout',                           auth: 'session' },
  { method: 'GET',    path: '/v1/me',                                    auth: 'session' },
  { method: 'GET',    path: '/v1/courses',                               auth: 'session' },
  { method: 'POST',   path: '/v1/courses',                               auth: 'instructor' },
  { method: 'PATCH',  path: '/v1/courses/:id',                           auth: 'instructor' },
  { method: 'GET',    path: '/v1/courses/:id/exams',                     auth: 'session' },
  { method: 'POST',   path: '/v1/exams',                                 auth: 'instructor' },
  { method: 'GET',    path: '/v1/exams/:id',                             auth: 'session' },
  { method: 'POST',   path: '/v1/exams/:id/attempts',                    auth: 'student' },
  { method: 'PATCH',  path: '/v1/attempts/:id',                          auth: 'student' },
  { method: 'POST',   path: '/v1/attempts/:id/submit',                   auth: 'student' },
  { method: 'GET',    path: '/v1/analytics/cohorts/:id',                 auth: 'instructor' },
  { method: 'POST',   path: '/v1/payments/checkout',                     auth: 'session' },
  { method: 'POST',   path: '/v1/payments/webhook',                      auth: null,        note: 'Stripe signed' },
  { method: 'DELETE', path: '/v1/admin/users/:id',                       auth: 'admin' },
];

const SF_FILE_TREE = [
  { name: 'apps', type: 'dir', children: [
    { name: 'api', type: 'dir', children: [
      { name: 'src', type: 'dir', children: [
        { name: 'index.ts', type: 'file', status: 'new', lang: 'ts' },
        { name: 'app.ts',   type: 'file', status: 'new' },
        { name: 'env.ts',   type: 'file', status: 'new' },
        { name: 'modules',  type: 'dir', children: [
          { name: 'auth', type: 'dir', children: [
            { name: 'routes.ts',   type: 'file', status: 'new' },
            { name: 'service.ts',  type: 'file', status: 'new' },
            { name: 'schema.ts',   type: 'file', status: 'new' },
            { name: 'magic-link.ts', type: 'file', status: 'new' },
          ]},
          { name: 'courses', type: 'dir', children: [
            { name: 'routes.ts',   type: 'file', status: 'new' },
            { name: 'service.ts',  type: 'file', status: 'new' },
          ]},
          { name: 'exams', type: 'dir', children: [
            { name: 'routes.ts',   type: 'file', status: 'new' },
            { name: 'service.ts',  type: 'file', status: 'new' },
            { name: 'autograde.ts',type: 'file', status: 'new' },
          ]},
          { name: 'proctor', type: 'dir', children: [
            { name: 'routes.ts',   type: 'file', status: 'new' },
            { name: 'snapshot.ts', type: 'file', status: 'new' },
          ]},
          { name: 'analytics', type: 'dir', children: [
            { name: 'routes.ts',   type: 'file', status: 'new' },
            { name: 'views.sql',   type: 'file', status: 'new' },
          ]},
          { name: 'payments', type: 'dir', children: [
            { name: 'routes.ts',   type: 'file', status: 'new' },
            { name: 'webhook.ts',  type: 'file', status: 'new' },
          ]},
        ]},
        { name: 'middleware', type: 'dir', children: [
          { name: 'auth.ts',     type: 'file', status: 'new' },
          { name: 'rate-limit.ts', type: 'file', status: 'new' },
          { name: 'cors.ts',     type: 'file', status: 'new' },
        ]},
        { name: 'lib', type: 'dir', children: [
          { name: 'db.ts',     type: 'file', status: 'new' },
          { name: 'redis.ts',  type: 'file', status: 'new' },
          { name: 'mail.ts',   type: 'file', status: 'new' },
          { name: 'storage.ts', type: 'file', status: 'new' },
        ]},
      ]},
      { name: 'package.json', type: 'file' },
      { name: 'tsconfig.json', type: 'file' },
    ]},
    { name: 'worker', type: 'dir', children: [
      { name: 'src', type: 'dir', children: [
        { name: 'index.ts', type: 'file', status: 'new' },
        { name: 'jobs', type: 'dir', children: [
          { name: 'email.ts', type: 'file', status: 'new' },
          { name: 'autograde.ts', type: 'file', status: 'new' },
          { name: 'analytics-roll.ts', type: 'file', status: 'new' },
        ]},
      ]},
    ]},
  ]},
  { name: 'packages', type: 'dir', children: [
    { name: 'db', type: 'dir', children: [
      { name: 'schema.ts', type: 'file', status: 'new' },
      { name: 'migrations', type: 'dir', children: [
        { name: '0001_init.sql', type: 'file', status: 'new' },
      ]},
    ]},
    { name: 'sdk', type: 'dir', children: [
      { name: 'client.ts', type: 'file', status: 'new', badge: 'gen' },
    ]},
  ]},
  { name: 'docker-compose.yml', type: 'file', status: 'new' },
  { name: 'railway.json', type: 'file', status: 'new' },
  { name: '.env.example', type: 'file', status: 'new' },
  { name: 'README.md', type: 'file', status: 'new' },
];

// Code samples used in result view + landing
const SF_CODE_ROUTES = [
  `${window.T.cmt('// apps/api/src/modules/exams/routes.ts')}`,
  `${window.T.kw('import')} { ${window.T.fn('Hono')} } ${window.T.kw('from')} ${window.T.str("'hono'")}`,
  `${window.T.kw('import')} { ${window.T.fn('z')} } ${window.T.kw('from')} ${window.T.str("'zod'")}`,
  `${window.T.kw('import')} { ${window.T.fn('requireAuth')} } ${window.T.kw('from')} ${window.T.str("'@/middleware/auth'")}`,
  `${window.T.kw('import')} { examService } ${window.T.kw('from')} ${window.T.str("'./service'")}`,
  ``,
  `${window.T.kw('export const')} ${window.T.prop('router')} = ${window.T.kw('new')} ${window.T.fn('Hono')}()`,
  ``,
  `${window.T.prop('router')}.${window.T.fn('post')}(${window.T.str("'/'")}, ${window.T.fn('requireAuth')}(${window.T.str("'instructor'")}), ${window.T.kw('async')} (c) => {`,
  `  ${window.T.kw('const')} ${window.T.prop('body')} = ${window.T.kw('await')} c.${window.T.fn('req')}.${window.T.fn('json')}()`,
  `  ${window.T.kw('const')} ${window.T.prop('parsed')} = ${window.T.prop('CreateExam')}.${window.T.fn('parse')}(${window.T.prop('body')})`,
  `  ${window.T.kw('const')} ${window.T.prop('exam')} = ${window.T.kw('await')} examService.${window.T.fn('create')}(${window.T.prop('parsed')})`,
  `  ${window.T.kw('return')} c.${window.T.fn('json')}({ ${window.T.prop('exam')} }, ${window.T.num('201')})`,
  `})`,
  ``,
  `${window.T.prop('router')}.${window.T.fn('post')}(${window.T.str("'/:id/attempts'")}, ${window.T.fn('requireAuth')}(${window.T.str("'student'")}), ${window.T.kw('async')} (c) => {`,
  `  ${window.T.kw('const')} ${window.T.prop('attempt')} = ${window.T.kw('await')} examService.${window.T.fn('startAttempt')}(`,
  `    c.${window.T.fn('req')}.${window.T.fn('param')}(${window.T.str("'id'")}),`,
  `    c.${window.T.prop('var')}.${window.T.prop('userId')}`,
  `  )`,
  `  ${window.T.kw('return')} c.${window.T.fn('json')}({ ${window.T.prop('attempt')} })`,
  `})`,
];

const SF_CODE_SCHEMA = [
  `${window.T.cmt('// packages/db/schema.ts')}`,
  `${window.T.kw('import')} { ${window.T.fn('pgTable')}, ${window.T.fn('uuid')}, ${window.T.fn('text')}, ${window.T.fn('timestamp')}, ${window.T.fn('integer')} } ${window.T.kw('from')} ${window.T.str("'drizzle-orm/pg-core'")}`,
  ``,
  `${window.T.kw('export const')} ${window.T.prop('users')} = ${window.T.fn('pgTable')}(${window.T.str("'users'")}, {`,
  `  ${window.T.prop('id')}:        ${window.T.fn('uuid')}().${window.T.fn('primaryKey')}().${window.T.fn('defaultRandom')}(),`,
  `  ${window.T.prop('email')}:     ${window.T.fn('text')}().${window.T.fn('notNull')}().${window.T.fn('unique')}(),`,
  `  ${window.T.prop('name')}:      ${window.T.fn('text')}(),`,
  `  ${window.T.prop('role')}:      ${window.T.fn('text')}().$type<${window.T.type("'student' | 'instructor' | 'admin'")}>(),`,
  `  ${window.T.prop('createdAt')}: ${window.T.fn('timestamp')}({ ${window.T.prop('withTimezone')}: ${window.T.kw('true')} }).${window.T.fn('defaultNow')}(),`,
  `})`,
  ``,
  `${window.T.kw('export const')} ${window.T.prop('exams')} = ${window.T.fn('pgTable')}(${window.T.str("'exams'")}, {`,
  `  ${window.T.prop('id')}:          ${window.T.fn('uuid')}().${window.T.fn('primaryKey')}().${window.T.fn('defaultRandom')}(),`,
  `  ${window.T.prop('courseId')}:    ${window.T.fn('uuid')}().${window.T.fn('references')}(() => ${window.T.prop('courses')}.${window.T.prop('id')}),`,
  `  ${window.T.prop('title')}:       ${window.T.fn('text')}().${window.T.fn('notNull')}(),`,
  `  ${window.T.prop('durationMin')}: ${window.T.fn('integer')}().${window.T.fn('notNull')}(),`,
  `  ${window.T.prop('opensAt')}:     ${window.T.fn('timestamp')}({ ${window.T.prop('withTimezone')}: ${window.T.kw('true')} }),`,
  `  ${window.T.prop('closesAt')}:    ${window.T.fn('timestamp')}({ ${window.T.prop('withTimezone')}: ${window.T.kw('true')} }),`,
  `})`,
];

const SF_PROJECTS = [
  { id: 'p1', name: 'Examly API',        stack: 'Hono · PG · Redis',   updated: '12 min ago',  status: 'deployed',  health: 99.9, dot: 'green',  prompt: 'Online exam platform with proctoring' },
  { id: 'p2', name: 'Loop Marketplace',  stack: 'Fastify · PG · S3',   updated: '2 h ago',     status: 'building',  health: 100,  dot: 'amber',  prompt: 'P2P rental marketplace with escrow' },
  { id: 'p3', name: 'Nova LMS',          stack: 'Hono · PG · Mux',     updated: '5 h ago',     status: 'deployed',  health: 100,  dot: 'green',  prompt: 'LMS with cohort-based courses' },
  { id: 'p4', name: 'Brief AI',          stack: 'Hono · PG · Pinecone',updated: 'yesterday',   status: 'draft',     health: null, dot: 'gray',   prompt: 'AI document workspace' },
  { id: 'p5', name: 'Tessera Billing',   stack: 'Express · PG · Stripe',updated: '2 days ago', status: 'deployed',  health: 99.4, dot: 'green',  prompt: 'Usage-based billing engine' },
  { id: 'p6', name: 'Pulse Analytics',   stack: 'Hono · ClickHouse',   updated: '4 days ago',  status: 'paused',    health: null, dot: 'gray',   prompt: 'Product analytics ingestion API' },
];

const SF_TEMPLATES = [
  { id: 't1', name: 'SaaS Backend',        desc: 'Multi-tenant API, billing, RBAC, admin.',         icon: 'Cube',     uses: 1284 },
  { id: 't2', name: 'Marketplace',         desc: 'Two-sided listings, payments, escrow, search.',   icon: 'Globe',    uses: 612 },
  { id: 't3', name: 'AI Product',          desc: 'Vector store, prompt logs, usage metering.',      icon: 'Sparkle',  uses: 901 },
  { id: 't4', name: 'LMS',                 desc: 'Courses, lessons, video, quizzes, certificates.', icon: 'File',     uses: 305 },
  { id: 't5', name: 'Exam System',         desc: 'Tests, proctoring, autograding, analytics.',      icon: 'Layers',   uses: 207 },
  { id: 't6', name: 'Internal Tools API',  desc: 'Admin panels, audit logs, exports.',              icon: 'Server',   uses: 488 },
];

// Architecture diagram layout used in the right preview / arch page
const SF_ARCH = {
  nodes: [
    { id: 'web',     kind: 'client',  title: 'Web Client',          subtitle: 'Next.js · iOS',   icon: 'Globe',    accent: 'blue',   x: 40,   y: 60 },
    { id: 'edge',    kind: 'edge',    title: 'Edge / CDN',          subtitle: 'Cloudflare',      icon: 'Cloud',    accent: 'blue',   x: 250,  y: 60 },
    { id: 'api',     kind: 'service', title: 'API Gateway',         subtitle: 'Hono · /v1',      icon: 'Server',   accent: 'purple', x: 470,  y: 60 },
    { id: 'auth',    kind: 'service', title: 'Auth Service',        subtitle: 'Lucia',           icon: 'Lock',     accent: 'purple', x: 700,  y: 0 },
    { id: 'exam',    kind: 'service', title: 'Exam Service',        subtitle: 'sessions',        icon: 'File',     accent: 'purple', x: 700,  y: 80 },
    { id: 'pay',     kind: 'service', title: 'Payments',            subtitle: 'Stripe',          icon: 'Zap',      accent: 'amber',  x: 700,  y: 160 },
    { id: 'queue',   kind: 'queue',   title: 'Job Queue',           subtitle: 'BullMQ',          icon: 'Layers',   accent: 'blue',   x: 700,  y: 240 },
    { id: 'pg',      kind: 'data',    title: 'PostgreSQL',          subtitle: 'primary',         icon: 'Database', accent: 'green',  x: 930,  y: 40 },
    { id: 'redis',   kind: 'data',    title: 'Redis',               subtitle: 'cache · sessions',icon: 'Database', accent: 'green',  x: 930,  y: 130 },
    { id: 's3',      kind: 'data',    title: 'Object Storage',      subtitle: 'S3 / R2',         icon: 'Cloud',    accent: 'green',  x: 930,  y: 220 },
  ],
  edges: [
    ['web','edge','HTTPS'], ['edge','api','REST'],
    ['api','auth','RPC'], ['api','exam','RPC'], ['api','pay','RPC'], ['api','queue','enqueue'],
    ['auth','pg',''], ['auth','redis',''],
    ['exam','pg',''], ['exam','queue',''],
    ['pay','pg',''],
    ['queue','pg',''], ['queue','s3',''],
  ],
};

Object.assign(window, {
  SF_PROMPT, SF_STACK, SF_MODULES, SF_SCHEMA, SF_ROUTES,
  SF_FILE_TREE, SF_CODE_ROUTES, SF_CODE_SCHEMA, SF_PROJECTS,
  SF_TEMPLATES, SF_ARCH,
});
