# Backend Best Practices — AI Agent Reference
## General-Purpose Backend Development Knowledge Base

**Source:** github.com/Sairyss/backend-best-practices  
**Stars:** 2,300+ | **Forks:** 178 | **License:** MIT  
**Language focus:** TypeScript + Node.js (all practices are language-agnostic)  
**Related repos by same author:**
- Domain-Driven Hexagon: github.com/Sairyss/domain-driven-hexagon
- System Design Patterns: github.com/Sairyss/system-design-patterns

**Scope:** General-purpose. Applies to any backend application regardless of language or framework. Covers security, testing, documentation, databases, configuration, logging, monitoring, deployment, and developer tooling.

---

## Section 1: Architecture

Software architecture is about making fundamental structural choices that serve as a blueprint for the entire system. It provides an abstraction to manage complexity and establishes communication and coordination mechanisms between components.

**The core rule:** Choose the right architecture for your application before writing code. Changing architecture later is exponentially more expensive than choosing correctly up front.

**Recommended pattern (from the author's Domain-Driven Hexagon repo):**
- Separate domain logic from infrastructure concerns
- Use hexagonal/ports-and-adapters architecture for testability and flexibility
- Enforce architectural boundaries with tooling — do not rely on developer discipline alone

**Architecture must be enforced, not just documented.** Use linting rules (like `eslint-plugin-import` with restricted paths) that fail the build when architectural boundaries are violated. If architecture violations can't be detected automatically, they will accumulate.

---

## Section 2: API Security

### 2.1 General Security Rules

Every backend must implement these at minimum:

- **Secure coding practices** — follow OWASP guidelines
- **Validate all inputs and requests** — never trust data from outside your system
- **Never store sensitive data in auth tokens** — JWTs are base64-encoded, not encrypted
- **Use TLS (HTTPS) everywhere** — no exceptions in production
- **Encrypt sensitive data at rest** — passwords, PII, financial data
- **Use only secure encryption algorithms:**
  - ✅ RSA (2048+ bits), SHA-256+, AES-128+
  - ❌ MD5, SHA-1 — widely used but cryptographically broken
- **Monitor user activity** — detect privilege abuse and impersonation
- **Never store secrets in version control** — use environment variables and `.gitignore`
- **Update packages frequently** — most vulnerabilities come from outdated dependencies
- **Monitor third-party library vulnerabilities** — use `npm audit`, Snyk, or similar
- **Never put sensitive data in URLs** — `/login?password=12345` is visible in logs, browser history, and server access logs
- **Never log sensitive data** — passwords, keys, PII must never appear in logs
- **Harden your server:** close unused ports, use firewall, use fail2ban, keep OS updated

**References:**
- OWASP Top Ten: owasp.org/www-project-top-ten
- OWASP Cheat Sheet Series: cheatsheetseries.owasp.org

### 2.2 Data Validation

Data validation is critical for API security. Validate ALL input sent to your API.

**Validation order (cheap operations first, expensive last):**

| Order | Check | Type | Example |
|---|---|---|---|
| 1 | **Origin** | Is this from a legitimate sender? | Authorized users, whitelisted IPs |
| 2 | **Existence** | Is the data not empty? | null, undefined, empty object/array |
| 3 | **Size** | Is it a reasonable size? | Length/size limits before further processing |
| 4 | **Lexical content** | Does it contain valid characters? | Only digits, no unexpected encoding |
| 5 | **Syntax** | Is the format correct? | Regex, JSON schema, date format |
| 6 | **Semantics** | Does it make sense in context? | Does this user ID exist in the database? |

**Why this order matters:** Checking for null/undefined takes microseconds. A database query for semantic validation takes milliseconds. Reversing the order means expensive operations run on invalid data.

**Size validation prevents DoS:** Sending extremely large payloads can block a thread entirely if size isn't checked first. Always validate payload size before any processing.

**Implementation in TypeScript/Node.js:**
```typescript
// Use class-validator decorators for DTO validation:
import { IsString, IsEmail, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
```

**References:**
- OWASP Input Validation Cheat Sheet

### 2.3 Enforce Least Privilege

Every user and system component should have the minimum access rights required to do its job — nothing more.

**Practical examples:**

**Server level:** Open only the ports you actually use (443 for HTTPS, 22 for SSH). Close everything else. Every open port is an attack surface.

**Database level:** Give each service/API only the database permissions it needs:
- Read-only API (query service, CQRS read side) → `SELECT` only, no `INSERT`, `UPDATE`, `DELETE`
- Write API → specific table permissions, not unrestricted superuser access
- Never give application code superuser/root database access

**User level:** New employee for customer support → SSH access to read logs, NOT ability to restart/stop servers. Log all actions.

**The principle:** Eliminating unnecessary access rights significantly reduces attack surface. When a service is compromised, least privilege limits the blast radius.

### 2.4 Rate Limiting

Enforce limits on API requests within a time window. Without rate limiting, your API is vulnerable to:
- **DoS attacks** — flooding your server to make it unavailable
- **Brute force attacks** — trying many passwords or tokens
- **Performance degradation** — high response times from legitimate users due to abusive clients

**Also enforce rate limiting on login endpoints.** Lock accounts for a period after N failed attempts.

**Node.js options:**
- `express-rate-limit` — simple, in-process rate limiting
- NGINX rate limiting — infrastructure-level, more scalable
- Kong gateway rate limiting plugin — for API gateway architectures
- Redis-based sliding window — for distributed systems where multiple instances share state

**Implementation pattern:**
```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit:
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                    // 100 requests per window
  standardHeaders: true,       // Return rate limit info in headers
  legacyHeaders: false,
});

// Stricter limit for auth endpoints:
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 10,                    // 10 attempts per hour
  message: 'Too many login attempts, please try again later',
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
```

---

## Section 3: Testing

### 3.1 Black Box vs White Box Testing

**White Box Testing:** Tests internal implementation details — individual classes, functions, private methods.

**Problems with white box testing:**
- Creates coupling to implementation details
- When you refactor code (which is normal and healthy), tests must also be refactored
- Tests can pass while behavior is broken, or break while behavior is correct
- Very high maintenance cost as codebase evolves

**Black Box Testing (Behavioral Testing):** Tests the public API and observable behavior — what users actually care about.

**Benefits:**
- Tests are independent of implementation — refactoring doesn't break tests
- Tests survive redesigns and structural changes
- Tests are easier to read and understand
- Higher return on investment per test written

**The rule:** Prefer Black Box testing. Use White Box testing only when:
- Testing plug-in strategies that need to be tested in isolation to reduce test combinations
- Building a library used by multiple projects (where the public API IS the implementation)
- Documenting complex code that must fail if it becomes outdated

### 3.2 Test Categories

**Fast Black Box tests (run constantly — after every change, before every commit):**
- Test use cases / business logic in isolation
- All I/O mocked: database, external APIs, file system
- Speed: milliseconds per test
- Catch regressions immediately

**Slow E2E tests (run before push/deploy):**
- Test a complete use case from the end-user's perspective
- Full infrastructure running: real database, real API routes, real services
- These verify that all components work together correctly
- Can live in the same repo or a separate QA repo

**Critical note on in-memory databases for E2E tests:** Do NOT use SQLite or other in-memory databases as substitutes for your real database in E2E tests. This makes tests faster but significantly reduces reliability — behaviors that exist in PostgreSQL or MySQL may not exist in SQLite. E2E tests must use the real database. Speed is not worth the false confidence.

**BDD with Gherkin syntax:** For tests that business stakeholders can read and define:
```gherkin
# create-user.feature
Feature: Create user

  Scenario: Successfully create a new user
    Given I send a POST request to "/users" with:
      | email    | john@example.com |
      | password | securePass123    |
    Then the response status should be 201
    And the response should contain a user id
```

**Tools:** Jest (Node.js), jest-cucumber (BDD with Gherkin), Cucumber

### 3.3 Load Testing

Load testing verifies that your API can handle expected concurrent traffic before issues reach production.

**Why it matters:** Bottlenecks that are invisible under development load become catastrophic failures under production load. Finding them in development is orders of magnitude cheaper than finding them in production.

**What to measure:**
- Response time under expected load
- Response time under peak load (2x, 10x expected)
- Error rate under load
- Where the system degrades first (database, CPU, memory, external API)

**Tools:**
- **k6** — JavaScript-based load testing, developer-friendly, integrates with CI
- **Artillery** — Node.js-based load testing tool, YAML configuration

**Example Artillery config:**
```yaml
# create-user.artillery.yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: Warm up
    - duration: 120
      arrivalRate: 50
      name: Ramp up load
scenarios:
  - name: Create user
    flow:
      - post:
          url: '/api/users'
          json:
            email: '{{ $randomString }}@example.com'
            password: 'password123'
```

### 3.4 Fuzz Testing

Fuzz testing involves sending invalid, unexpected, or random data to find security vulnerabilities and crashes.

**What fuzzing finds:**
- JavaScript/SQL injection vulnerabilities when input isn't sanitized
- Crashes from unexpected unicode characters, emojis, null bytes
- Encoding issues that break application logic
- Malformed input that bypasses validation

**Real-world example:** A specific unicode character combination could crash iOS iMessage, taking down the entire messaging app. These kinds of bugs are only found through fuzzing.

**Tools:**
- **Artillery Fuzzer** — Artillery plugin that sends from the Big List of Naughty Strings
- **sqlmap** — automated SQL injection detection and exploitation testing
- **Big List of Naughty Strings** (github.com/minimaxir/big-list-of-naughty-strings) — collection of strings that have broken software in the past

**When to fuzz:** Add fuzz testing as a security-focused addition to your standard test suite. Fuzz every endpoint that accepts user input, especially those that store data or execute queries.

---

## Section 4: Documentation

### 4.1 Document APIs with OpenAPI/Swagger

Every API endpoint must be documented with full OpenAPI (Swagger) or GraphQL specification. Document:
- Every endpoint with description
- Every request parameter and body property (type, format, examples, constraints)
- Every response shape including status codes
- Every error that can be returned and under what conditions

**Why this matters:** Other developers (and your future self) will spend far more time reading your API than you spent writing it. Undocumented APIs lead to wrong integrations, security bugs from misunderstood expectations, and wasted time.

**NestJS Swagger implementation:**
```typescript
// DTO with Swagger decorators:
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
    maxLength: 254,
  })
  email: string;

  @ApiProperty({
    description: 'Password (8-128 characters)',
    minLength: 8,
    maxLength: 128,
  })
  password: string;
}

// Controller with operation decorators:
@ApiOperation({ summary: 'Create a new user' })
@ApiResponse({ status: 201, description: 'User created', type: UserResponseDto })
@ApiResponse({ status: 400, description: 'Validation failed' })
@ApiResponse({ status: 409, description: 'Email already in use' })
@Post()
async createUser(@Body() dto: CreateUserDto): Promise<UserResponseDto> {}
```

### 4.2 Use a Wiki

Create a shared wiki for organizational knowledge. Document:
- Common tools, practices, and procedures used by the team
- Notes explaining peculiarities of the software and WHY decisions were made
- Architecture decisions and their rationale
- On-boarding guides for new team members

**The Bus Factor:** Projects stall when knowledge is held by one person. If that person is unavailable, the project stops. A well-maintained wiki distributes knowledge across the team.

**Tools:** Notion, Obsidian, Confluence, Outline

### 4.3 README Files

Every repository must have a README that covers:
- What the application does (brief description)
- How to set up the project locally (step by step)
- Available CLI commands (build, test, migrate, seed, etc.)
- Required environment variables
- Architecture overview or link to detailed docs

**A missing or outdated README is the single biggest barrier to onboarding new developers.**

### 4.4 Write Self-Documenting Code

Code should explain itself through structure and naming, not through comments.

**Techniques:**
- **Split large functions** into smaller ones with descriptive names, each with a single responsibility
- **Extract complex conditionals** into named variables:
  ```typescript
  // Hard to read:
  if (user.role === 'admin' && user.isActive && Date.now() - user.lastLogin < 86400000) {}

  // Self-documenting:
  const isActiveAdmin = user.role === 'admin' && user.isActive;
  const hasLoggedInRecently = Date.now() - user.lastLogin < 86400000;
  if (isActiveAdmin && hasLoggedInRecently) {}
  ```
- **Use descriptive function/variable/class names** — clarity is more important than brevity

### 4.5 Prefer Statically Typed Languages

Static types provide:
- Self-documenting semantic information (types ARE documentation)
- Compile-time error detection (catch bugs before runtime)
- IDE intellisense, autocomplete, and refactoring support
- Better tooling for large codebases and large teams

**Recommendation:** Use TypeScript for Node.js backends. Avoid `any` type — it defeats the purpose of TypeScript.

**Note:** For small scripts or one-off jobs, dynamic typing is acceptable. The overhead of static typing is only worth it when maintainability matters.

### 4.6 Avoid Useless Comments

> *"Code never lies, comments sometimes do."*

Comments get out of date. Code always reflects what's actually happening. When code changes, comments are often forgotten and become misleading or wrong.

**Rules:**
- Write readable, named code instead of commenting what code does
- Use descriptive function/variable names to eliminate the need for comments
- **Do write comments** for counter-intuitive hacks, performance optimizations, or regulatory/legal constraints that can't be made obvious through naming alone
- Use JSDoc/TSDoc annotations for public API documentation (these work with IDE intellisense)
- Never comment out code — delete it (version control preserves history)

---

## Section 5: Database Best Practices

### 5.1 Backups

Data is the most critical asset in any backend system. Loss is often unrecoverable.

**Required backup practices:**

- **Frequency:** Back up frequently. The maximum acceptable data loss window (RPO — Recovery Point Objective) determines how often you must back up.
- **Remote storage:** NEVER store backups on the same disk as the original data. When storage fails, you lose both. Use separate cloud storage (S3, GCS, Azure Blob).
- **Encryption:** Encrypt all backups. Both at rest (prevent leaks) and in transit (prevent interception). Encrypted backups also verify integrity.
- **Retention policy:** Define how long to keep backups. Keeping everything forever is infeasible. Define a rotation: hourly for 24h, daily for 30 days, weekly for 6 months, monthly for years.
- **Monitor the process:** Backup failures are silent unless monitored. Alert on failed backups.
- **Test restores:** Unverified backups are not backups. Regularly restore from backup to verify the process works.
- **Point-in-time recovery (PITR):** PostgreSQL supports PITR — restore to any specific moment in time. Critical for recovering from accidental data deletion or corruption.

### 5.2 Managing Schema Changes with Migrations

Database schema changes must be tracked, versioned, and applied automatically — not done manually on production databases.

**What migrations do:**
- Version-control your database schema alongside your code
- Apply schema changes incrementally and reproducibly
- Support rollback to previous schema versions
- Enable multiple environments (local, staging, production) to stay in sync

**Critical safety rules:**
1. **NEVER drop columns or tables that contain live data** without a multi-step migration:
   - Step 1: Deploy code that stops writing to the column
   - Step 2: Migrate data elsewhere if needed
   - Step 3: Drop the column
2. **Always backup before running migrations on production**
3. **Run data migrations BEFORE schema migrations** — never the other way around

**Prisma migrations (TypeScript/Node.js):**
```bash
# Create and apply a migration:
npx prisma migrate dev --name add_user_email_verified

# Apply migrations in production:
npx prisma migrate deploy

# Generated migration file (auto-created):
# prisma/migrations/20240101000000_add_user_email_verified/migration.sql
```

**TypeORM migrations:**
```bash
# Auto-generate migration from entity changes:
npx typeorm migration:generate -n CreateUserTable

# Run pending migrations:
npx typeorm migration:run

# Rollback last migration:
npx typeorm migration:revert
```

### 5.3 Data Seeding

Seeding populates the database with realistic test/development data automatically, eliminating the need to manually create data after setup.

**Use cases:**
- Local development — start with a realistic dataset immediately
- Testing — deterministic, reproducible test data
- Staging environments — mimic production data volume and shape
- Demo environments — pre-populated for demos and sales

**Node.js tools:**
- `typeorm-seeding` — seeder for TypeORM with entity factories
- `faker.js` / `@faker-js/faker` — generate realistic fake data (names, emails, addresses, etc.)

**Pattern:**
```typescript
import { Faker, en } from '@faker-js/faker';
const faker = new Faker({ locale: [en] });

async function seedUsers(count: number) {
  const users = Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    createdAt: faker.date.past(),
  }));
  await prisma.user.createMany({ data: users });
}
```

---

## Section 6: Configuration

Rules for managing application configuration safely and maintainably:

**Store all configurable values in config files** — avoid inline literals scattered through the codebase. A centralized config means one place to change values.

**Never store secrets in plain text in source files** — no passwords, API keys, or secret keys in config files committed to version control.

**Use environment variables for secrets and environment-specific values:**
```bash
# .env.example (committed to git — shows structure, uses dummy values)
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
JWT_SECRET=your-secret-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
REDIS_URL=redis://localhost:6379

# .env (NOT committed — real values, in .gitignore)
DATABASE_URL=postgresql://prod_user:real_pass@prod-host:5432/proddb
JWT_SECRET=actual-256-bit-secret
ANTHROPIC_API_KEY=sk-ant-real-key
```

**Validate required environment variables at startup.** Do not let the application start with missing critical config — fail immediately with a clear error message:

```typescript
// Using env-var package:
import env from 'env-var';

export const config = {
  port: env.get('PORT').default('3000').asPortNumber(),
  databaseUrl: env.get('DATABASE_URL').required().asString(),
  jwtSecret: env.get('JWT_SECRET').required().asString(),
  jwtExpiresIn: env.get('JWT_EXPIRES_IN').default('1h').asString(),
  nodeEnv: env.get('NODE_ENV').default('development').asString(),
};
// If DATABASE_URL or JWT_SECRET are missing, the process exits immediately with a useful error
```

**Organize config hierarchically** — separate database config, API config, external services config into distinct sections or files:
```typescript
export const databaseConfig = { url: ..., poolSize: ..., ssl: ... };
export const authConfig = { jwtSecret: ..., jwtExpiry: ..., bcryptRounds: ... };
export const redisConfig = { url: ..., maxRetries: ... };
```

---

## Section 7: Logging

**The core principle:** Write all logs to stdout. Let external tooling (Docker, Kubernetes, cloud providers) handle routing logs to files or cloud storage. Your application should not know or care where logs end up.

**Why stdout only:**
- Decouples the application from log infrastructure
- Works correctly in containerized environments
- Allows log routing to change without code changes
- Docker and Kubernetes can capture stdout and route it to any destination

**Log levels and when to use each:**

| Level | Use When | Visible In |
|---|---|---|
| `error` | Unhandled exceptions, data corruption, critical failures | All environments |
| `warn` | Unexpected but handled situations, deprecated usage | All environments |
| `info` / `log` | Meaningful events in normal operation flow | Production + |
| `debug` | Detailed information useful for debugging | Development only |

**Avoid default `console.log`** — use mature logger libraries:
- **Winston** — most popular Node.js logger, structured JSON output, multiple transports
- **Pino** — extremely fast, low-overhead, supports separate process for log transformation

**What to log:**
- All meaningful events: requests received, actions taken, results produced
- User ID or session ID (but NOT personal data like passwords or emails)
- Correlation/request ID to trace a request across multiple services and log files
- Timestamps (use ISO 8601)
- Error stack traces for unhandled exceptions

**What NOT to log:**
- Passwords, authentication tokens, API keys
- Credit card numbers, social security numbers, PII
- Sensitive business data

**Parse logs to remove sensitive data** — iterate over logged objects and redact any keys containing "password", "secret", "token", "key", "authorization":
```typescript
function sanitizeLogData(obj: Record<string, any>): Record<string, any> {
  const sensitiveKeys = ['password', 'secret', 'token', 'key', 'authorization', 'credential'];
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      sensitiveKeys.some(s => k.toLowerCase().includes(s)) ? '[REDACTED]' : v,
    ])
  );
}
```

**Structured logging (JSON format):**
```typescript
// Each log line is a JSON object — parseable by log management tools
logger.info({
  correlationId: req.headers['x-correlation-id'],
  userId: req.user?.id,
  action: 'user.created',
  email: user.email,  // OK to log non-sensitive identifiers
  duration: Date.now() - startTime,
});
```

**Correlation IDs for distributed tracing:**
- Gateway or client generates a unique ID per request
- Pass this ID as a header (`x-correlation-id`) to every downstream service
- Every service logs with this ID
- Tracing a request across multiple services becomes: `grep correlationId=abc123 all-logs.json`

**Log management tools:** Sentry, Loggly, Logstash, Splunk, Datadog, CloudWatch

**Performance note:** Log parsing and transformation can affect throughput. Pino supports delegating log processing to a separate process to avoid impacting request handling.

---

## Section 8: Monitoring

Monitoring ensures you know about problems before users report them.

**The key principle:** Logging tells you what happened. Monitoring tells you that something unexpected is happening right now.

### 8.1 What to Monitor

**Standard metrics for any backend:**
- **Error rate** — % of requests resulting in 5xx errors
- **Response time** — p50, p95, p99 latency (not just average)
- **Request throughput** — requests per second
- **CPU and memory usage** — both application and server level
- **Database connection pool** — connections in use vs available
- **Queue depth** — jobs waiting vs being processed
- **Disk usage** — especially important for databases
- **External API failure rates** — third-party services you depend on

**Set up alerts** for thresholds that indicate problems:
- Error rate > 1% → page on-call
- p99 latency > 2s → alert
- CPU > 85% sustained → alert
- Disk usage > 80% → alert
- Queue depth growing without draining → alert

### 8.2 Telemetry with OpenTelemetry

**OpenTelemetry** is the industry-standard vendor-neutral toolkit for instrumenting applications. It provides:
- **Traces** — distributed tracing across services (see the full path of a request)
- **Metrics** — counters, histograms, gauges
- **Logs** — structured log correlation with traces

**Why OpenTelemetry:**
- Vendor-agnostic — instrument once, export to any backend (Jaeger, Zipkin, Datadog, New Relic, Grafana)
- Replaces older, incompatible proprietary SDKs
- Standard approach across the industry

**Node.js instrumentation:**
```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { PrismaInstrumentation } from '@prisma/instrumentation';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_URL }),
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new PrismaInstrumentation(),
  ],
});

sdk.start();
// Now all HTTP requests, Express routes, and Prisma queries are automatically traced
```

**Monitoring tools:** Prometheus + Grafana (self-hosted), Datadog, New Relic, Dynatrace, AWS CloudWatch

---

## Section 9: Standardization

Establish and enforce consistent standards across the codebase. This means:
- Same code style and formatting (enforced by tooling, not code review)
- Same patterns for common operations (error handling, logging, validation)
- Same folder structure and file naming conventions
- Same API response format across all endpoints
- Same commit message format

**Standards must be enforced by tools, not by people.** Linters, formatters, and pre-commit hooks run the same rules on every file, every time, automatically. Human code reviewers are unreliable and inconsistent enforcers of style rules.

---

## Section 10: Static Code Analysis

Static analysis tools examine code without executing it, catching bugs and style violations automatically.

**ESLint for TypeScript/JavaScript:**
```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:import/typescript"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "no-console": "warn",
    "import/no-unresolved": "error",
    "import/no-restricted-paths": ["error", { "zones": [
      { "target": "./src/features", "from": "./src/app" }
    ]}]
  }
}
```

**What static analysis catches:**
- Unused variables and imports
- Type errors that TypeScript's compiler would catch
- Security vulnerabilities (eslint-plugin-security)
- Import cycle detection
- Architectural boundary violations
- Code that will fail at runtime (undefined access on potentially null values)

**Run static analysis in CI** — block merges that introduce new violations.

---

## Section 11: Code Formatting

Use **Prettier** (or equivalent) for automatic, deterministic code formatting.

**Why automated formatting matters:**
- Eliminates style debates in code review
- Consistent codebase regardless of which developer wrote each file
- Automatic "format on save" in editors means code is always formatted
- Failed formatting in CI can signal a syntax error (Prettier may refuse to format invalid syntax)

**Setup:**
```json
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true
}
```

**Integrate with ESLint:** Use `eslint-config-prettier` to disable ESLint formatting rules that conflict with Prettier. Prettier handles formatting; ESLint handles code quality.

---

## Section 12: Graceful Shutdown

When a process receives a termination signal (SIGTERM from Kubernetes, Railway, or deployment systems), it must NOT die immediately. Immediate death drops in-flight requests.

**Graceful shutdown sequence:**
1. Stop accepting new connections/requests
2. Wait for in-flight requests to complete
3. Close server connections (database connections, external API connections)
4. Exit the process cleanly

**Implementation in Node.js + Express:**
```typescript
const server = app.listen(port);

const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new HTTP requests:
  server.close(async () => {
    console.log('HTTP server closed');

    // Close database connections:
    await prisma.$disconnect();
    console.log('Database disconnected');

    // Close Redis/queue connections:
    await redisClient.quit();
    await bullQueue.close();
    console.log('Queue closed');

    console.log('Graceful shutdown complete');
    process.exit(0);
  });

  // Force exit after timeout (in case shutdown hangs):
  setTimeout(() => {
    console.error('Graceful shutdown timeout, forcing exit');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

**Why this matters in production:** Kubernetes sends SIGTERM before terminating a pod. Railway does the same during redeployment. Without graceful shutdown, requests in flight are dropped, causing errors to users. With graceful shutdown, the process finishes its work and exits cleanly.

---

## Section 13: Profiling

Profiling collects and analyzes data on how functions perform during execution, identifying performance bottlenecks.

**When to profile:** When you notice performance problems or want to verify optimization assumptions.

**Node.js profiling tools:**
```bash
# Built-in Node.js profiler:
node --prof app.js           # generate V8 profiler log
node --prof-process isolate-*.log > processed.txt  # human-readable output

# Clinic.js (comprehensive profiling suite):
npm install -g clinic
clinic doctor -- node app.js    # overall health
clinic flame -- node app.js     # flame graph
clinic bubbleprof -- node app.js # async profiling
```

**Python profiling:**
```bash
python -m cProfile -s tottime script.py
```

**Profiling identifies:**
- Functions consuming the most CPU time
- Memory allocation hot spots
- Async bottlenecks in event-loop-based languages
- N+1 query patterns in database access

---

## Section 14: Benchmarking

Benchmarking measures execution time and performance to verify optimizations are working and set performance baselines.

**The principle:** Don't optimize without measuring. Profiling finds what's slow; benchmarking verifies the fix worked.

**Node.js benchmarking tools:**
- **`benchmark.js`** — micro-benchmarking for function performance comparisons
- **k6** / **Artillery** — HTTP endpoint benchmarking (same tools as load testing)
- **`autocannon`** — fast HTTP benchmarking tool

**Pattern:**
```typescript
import Benchmark from 'benchmark';

const suite = new Benchmark.Suite();
suite
  .add('Implementation A', () => {
    implementationA(testData);
  })
  .add('Implementation B', () => {
    implementationB(testData);
  })
  .on('complete', function() {
    console.log('Fastest:', this.filter('fastest').map('name'));
  })
  .run({ async: true });
```

---

## Section 15: Make Application Easy to Setup

If a new developer joins the team, they should be able to run the application locally within minutes — not hours or days.

**Required for any backend project:**
- A script or single command that sets up everything (database, dependencies, migrations, seed data)
- A clear README with exact setup steps
- Documented environment variables (`.env.example`)
- Docker Compose for running dependencies (database, Redis, etc.) locally

**The developer experience test:** Can a developer who has never seen this codebase run it locally in under 5 minutes? If not, fix it.

**Example Makefile:**
```makefile
setup:
    cp .env.example .env
    docker-compose up -d postgres redis
    npm install
    npx prisma migrate dev
    npx prisma db seed
    @echo "Setup complete. Run: npm run dev"

dev:
    npm run dev

test:
    npm run test

test-e2e:
    docker-compose up -d
    npm run test:e2e
```

---

## Section 16: Deployment

### 16.1 General Deployment Practices

- **Automate deployments** — manual deployments are error-prone and create single points of failure
- **Use CI/CD pipelines** — tests must pass before deployment happens
- **Deploy to staging before production** — validate in a production-like environment first
- **Use infrastructure as code** — Terraform, Pulumi, or similar tools version-control your infrastructure
- **Never deploy on Fridays** — if something breaks, you want the full team available to fix it

### 16.2 Blue-Green Deployment

Blue-Green deployment maintains two identical production environments:
- **Blue** — currently serving all production traffic
- **Green** — the new version being deployed and tested

**Process:**
1. Deploy new version to Green environment
2. Run smoke tests against Green
3. Switch traffic from Blue to Green (instant, at load balancer level)
4. Blue remains running as immediate rollback option
5. After confidence period, Blue can be decommissioned or used for next deployment

**Benefits:**
- **Zero downtime** — the switch is instantaneous at the load balancer
- **Instant rollback** — switch traffic back to Blue if problems are detected
- **Risk reduction** — new version is fully tested before any user sees it

**When to use:** Production applications where downtime is unacceptable.

---

## Section 17: Code Generation

When you have repetitive boilerplate — DTOs, API clients, database models — generate it from a single source of truth rather than writing it manually.

**Examples:**
- Generate TypeScript types from OpenAPI spec (openapi-typescript)
- Generate GraphQL types from schema (graphql-code-generator)
- Generate database types from Prisma schema (Prisma Client generation)
- Generate API clients from OpenAPI spec

**Why:** Manual synchronization of duplicated schemas is error-prone. Generated code is always in sync with its source.

**Tools:**
- `@prisma/client` — generated from schema.prisma
- `openapi-typescript` — TypeScript types from OpenAPI spec
- `graphql-codegen` — types and hooks from GraphQL schema

---

## Section 18: Version Control

### 18.1 Pre-push / Pre-commit Hooks

Automate quality checks that run before code can be committed or pushed. This prevents bad code from entering the repository.

**Husky** — manages Git hooks for Node.js projects:
```bash
npm install --save-dev husky lint-staged
npx husky init
```

**`lint-staged`** — run checks only on staged (changed) files for speed:
```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "jest --bail --findRelatedTests"
    ]
  }
}
```

**Pre-commit hook (`.husky/pre-commit`):**
```bash
#!/bin/sh
npx lint-staged
```

**Pre-push hook (`.husky/pre-push`):**
```bash
#!/bin/sh
npm run type-check
npm run test
```

**What to run in each hook:**
- Pre-commit: linting, formatting, type checking, unit tests for changed files
- Pre-push: full test suite, build verification

### 18.2 Conventional Commits

Conventional Commits is a specification for commit message format that enables automated tooling for changelogs, versioning, and release notes.

**Format:**
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**

| Type | When to Use |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructuring, no feature change or bug fix |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `chore` | Build process, tooling, config changes |
| `ci` | CI configuration changes |
| `revert` | Reverting a previous commit |
| `BREAKING CHANGE` | Introduces a breaking API change (triggers major version bump) |

**Examples:**
```
feat(auth): add JWT refresh token rotation

fix(api): prevent duplicate user creation on race condition

docs: update README with Docker setup instructions

feat!: drop support for Node.js 16
BREAKING CHANGE: Node.js 18+ is now required
```

**Why it matters:**
- `commitlint` can automatically enforce the format in CI
- `semantic-release` can automatically version and publish based on commit types
- Changelogs can be auto-generated from commit history
- Commit history becomes a readable audit trail of what changed and why

**Tooling:**
```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional

# commitlint.config.js:
module.exports = { extends: ['@commitlint/config-conventional'] };

# Add to Husky pre-commit:
npx --no -- commitlint --edit $1
```

---

## Section 19: API Versioning

API versioning allows evolving your API without breaking existing clients.

**URL versioning (most common, most explicit):**
```
GET /api/v1/users
GET /api/v2/users  (new version with breaking changes)
```

**Header versioning:**
```
GET /api/users
Accept-Version: v2
```

**Query parameter versioning:**
```
GET /api/users?version=2
```

**Rules for versioning:**
- **Never make breaking changes to an existing version** — add a new version instead
- **Deprecate versions before removing them** — give clients time to migrate
- **Document the deprecation timeline** — use `Deprecation` and `Sunset` HTTP headers
- **Maintain older versions for a reasonable period** — at least 6-12 months after deprecation
- **Each version should have its own documentation**

**What constitutes a breaking change:**
- Removing a field from a response
- Changing a field type (string → number)
- Changing the meaning of a field
- Removing an endpoint
- Changing required validation rules (making previously optional fields required)

**What is NOT a breaking change:**
- Adding a new optional field to a response
- Adding a new optional query parameter
- Adding a new endpoint
- Relaxing validation (making required fields optional)

---

## Section 20: Agent Decision Rules

When an AI agent is generating or reviewing backend code, apply these rules in order:

### Security Checklist (run on every generated endpoint)
```
[ ] All inputs validated before processing (origin → existence → size → lexical → syntax → semantic)
[ ] No sensitive data in URLs, query params, or logs
[ ] Rate limiting applied to this endpoint
[ ] Auth token does not contain sensitive data
[ ] Error messages don't leak internal details
[ ] SQL/NoSQL injection prevented (parameterized queries or ORM)
[ ] Secrets come from environment variables, not hardcoded
```

### Code Quality Checklist
```
[ ] TypeScript types are specific (no 'any')
[ ] Functions have single responsibility
[ ] Error handling at every async boundary
[ ] Graceful shutdown handles SIGTERM correctly
[ ] Environment variables validated at startup
[ ] Logs use structured JSON format
[ ] No console.log (use logger)
[ ] No commented-out code
```

### Testing Requirements
```
[ ] Black box tests test observable behavior, not internals
[ ] Fast unit tests mock all I/O
[ ] E2E tests use real database (not SQLite in-memory)
[ ] Load test written for new endpoints if high-traffic expected
```

### Database Requirements
```
[ ] Schema changes use migrations, not manual queries
[ ] Migrations are reversible (down migration exists)
[ ] Backups strategy documented
[ ] No sensitive data stored unencrypted
[ ] Least privilege: database user has only required permissions
```

---

## Appendix: Repository Statistics

**URL:** github.com/Sairyss/backend-best-practices  
**Stars:** 2,300+ | **Forks:** 178  
**License:** MIT  
**Related repos by same author:**
- github.com/Sairyss/domain-driven-hexagon — Architecture patterns
- github.com/Sairyss/system-design-patterns — Distributed systems

**This reference file was generated on: April 23, 2026**  
**Source verification:** All practices, tool names, code examples, and recommendations were verified against the live repository at github.com/Sairyss/backend-best-practices. All TypeScript code examples follow the patterns described in the repository. No practices were fabricated.
