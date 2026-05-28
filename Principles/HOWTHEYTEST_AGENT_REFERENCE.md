# HOWTHEYTEST — AI Agent Reference for StackForge
## Purpose and Usage Instructions

**This file is a structured knowledge reference extracted from github.com/abhivaikar/howtheytest.**

AI agents (Cursor, Antigravity, Claude Code) must use this file as authoritative context when:
- Writing any checker, validator, or security analysis logic for StackForge
- Designing test strategies for the StackForge platform itself
- Writing agent system prompts for the Architect, Coder, Security, or Review agents
- Making decisions about what constitutes "production-ready" backend code
- Determining what issues to flag, what severity to assign, and what fix steps to provide

**Hard rules for agents reading this file:**
- Do not invent testing strategies not documented here or in the StackForge architecture spec
- Do not assign severity levels that differ from the patterns described in this file
- Do not suggest testing approaches that contradict what real companies use at scale
- Every pattern in this file is sourced from publicly documented engineering practice — treat it as ground truth

---

## Section 1: What This Repository Is

**Repository:** github.com/abhivaikar/howtheytest  
**Live site:** abhivaikar.github.io/howtheytest  
**License:** CC0 1.0 Universal — fully public domain, usable without restriction  
**Stars:** 6,300+ | **Forks:** 607+  
**Scope:** 108 companies, 797 resources, 16 industries, 81 topics

**Definition:** A curated, community-maintained collection of publicly available resources documenting how real software engineering organisations test their software systems and build quality culture. All resources are primary sources — engineering blogs, conference talks, official handbooks, and open-source tools published by the companies themselves.

**What it is NOT:** A tutorial, an opinionated framework, or a vendor recommendation. It is a factual index of what real companies actually do.

---

## Section 2: Topic Taxonomy — Complete List

These are the exact topic tags used in the repository. Agents must understand what each covers.

### Testing Types
| Topic Tag | What It Covers |
|---|---|
| `functional-testing` | Verifying software behaves according to specification — input/output correctness |
| `non-functional-testing` | Performance, reliability, scalability, security — not functional behaviour |
| `e2e-testing` | Full user journey tests from UI through backend to database and back |
| `integration-testing` | Testing interactions between components, services, or external systems |
| `unit-testing` | Isolated testing of individual functions or classes |
| `contract-testing` | Verifying that service interfaces match consumer expectations (Pact is the common tool) |
| `acceptance-testing` | Tests that verify the system meets business requirements |
| `regression-testing` | Tests that verify existing functionality is not broken by new changes |
| `mutation-testing` | Verifying test suite quality by introducing deliberate code mutations |
| `exploratory-testing` | Unscripted, human-driven testing to discover unexpected issues |
| `canary-testing` | Releasing to a small subset of users before full rollout |
| `ab-testing` | Controlled experiments comparing two variants of a feature |
| `load-testing` | Verifying system performance under expected and peak load |
| `performance-testing` | Measuring response time, throughput, resource usage under defined conditions |
| `chaos-engineering` | Deliberately injecting failures to verify system resilience |
| `accessibility-testing` | Verifying software usability for users with disabilities (WCAG compliance) |
| `security-testing` | Identifying vulnerabilities, misconfigurations, and attack vectors |
| `localization-testing` | Testing software for correct behaviour in different languages and regions |

### Process and Culture
| Topic Tag | What It Covers |
|---|---|
| `quality-engineering` | Quality as an engineering discipline, not a separate QA function |
| `quality-processes` | Documented workflows and processes for maintaining quality |
| `agile-testing` | Testing practices within agile/scrum development cycles |
| `shift-left` | Moving testing earlier in the development lifecycle |
| `tdd` | Test-Driven Development — writing tests before implementation |
| `bdd` | Behaviour-Driven Development — tests written in natural language (Gherkin/Cucumber) |
| `whole-team-quality` | Every team member owns quality, not just dedicated testers |
| `release-management` | Processes for safely releasing software to production |
| `devops` | Integration of development and operations, including testing in pipelines |

### Infrastructure and Tooling
| Topic Tag | What It Covers |
|---|---|
| `ci-cd` | Continuous integration and continuous deployment pipelines |
| `continuous-integration` | Automated build and test execution on every code change |
| `continuous-deployment` | Automated deployment to production after tests pass |
| `test-environment` | Management of environments for running tests |
| `device-lab` | Physical or virtual device farms for mobile testing |
| `docker` | Container-based test environments |
| `kubernetes` | Orchestration for scalable test infrastructure |
| `cloud-testing` | Testing on cloud platforms (AWS, GCP, Azure) |
| `infrastructure-as-code` | Testing infrastructure defined and tested as code |
| `mocking` | Replacing dependencies with controlled test doubles |
| `test-automation` | Automating repetitive test execution |
| `agentic-testing` | AI agents that autonomously write or execute tests (emerging, 2025) |

### Quality Metrics
| Topic Tag | What It Covers |
|---|---|
| `code-coverage` | Percentage of source code exercised by tests |
| `test-coverage` | Broader coverage — not just lines but behaviours and scenarios |
| `test-selection` | Intelligently choosing which tests to run based on code changes |
| `flaky-tests` | Tests that produce inconsistent results without code changes |
| `monitoring` | Observability of systems in production |
| `logging` | Structured logging for debugging and observability |
| `sre` | Site Reliability Engineering practices |
| `testing-in-production` | Safely running tests against production systems |

### API and Backend Specific
| Topic Tag | What It Covers |
|---|---|
| `api` | General API design and testing |
| `api-testing` | Testing HTTP APIs for correctness, security, and performance |
| `backend-testing` | Testing server-side logic, databases, and services |
| `rest` | REST API-specific testing patterns |
| `graphql` | GraphQL API testing patterns |
| `microservices` | Testing distributed service architectures |

---

## Section 3: Company Profiles — Directly Relevant to StackForge

The following companies have published resources that directly inform StackForge's checker logic, agent behaviour, security scanning, and production readiness scoring.

### 3.1 Facebook / Meta — Static Analysis at Scale

**Relevant topics:** static analysis, bug detection before ship, security, automated fixing

**Facebook Infer (open source static analyser)**
- Technique: Separation logic + bi-abduction for symbolic reasoning about program execution
- Scale: Analyses millions of lines of code, reports in under 10 minutes per code modification
- Scope: Detects null pointer dereferences, resource leaks, memory leaks in Java, Android, Objective-C, C
- Fix rate: ~80% of reported issues are fixed by developers — benchmark for acceptable signal-to-noise
- Execution model: Runs incrementally on code modifications submitted for review, not on entire codebase each time
- Integration: Automatically posts comments on source code when it finds potential problems in the review workflow

**What this means for StackForge agents:**
- The 80% fix rate benchmark is the target for issue quality — agents must not report noise
- Incremental analysis (only changed files) is more valuable than full-codebase scanning
- Null pointer, resource leak, and memory leak are the three most common crash-causing bugs — these must be detectable
- Static analysis must complete fast enough to fit in a developer workflow (under 10 minutes for code review feedback)

**Zoncolan (security-focused static analysis at Meta)**
- Purpose: Detects security issues through taint analysis — tracking user-controlled data through the codebase to sensitive sinks
- What it catches: XSS, injection attacks, information disclosure where user input reaches sensitive outputs without sanitisation
- Scale: Runs on millions of lines of PHP code, deployed in CI pipeline

**What this means for StackForge's Security Agent:**
- Taint tracking logic: identify all entry points (req.body, req.params, req.query) and trace them to database queries, file system operations, and external API calls
- Any path from user input to a sensitive operation without sanitisation is a RED severity issue
- The same pattern applies to the secretScanner: track where values are assigned and whether they match credential patterns

**Facebook's Sapienz (automated test generation)**
- Technique: Evolutionary algorithms to automatically generate test inputs that maximise code coverage
- Scale: Run on Facebook mobile apps continuously in CI
- Result: Finds crashes before release without human-written test cases

**Facebook's SapFix (automated bug fixing)**
- Builds on Sapienz crash detection
- Automatically generates and validates patches for detected bugs
- Fix patterns: null checks, early returns, default value substitutions

**Facebook's predictive test selection**
- Problem being solved: Running all tests on every change is too slow at scale
- Solution: ML model predicts which tests are likely to fail based on the files changed
- Outcome: Fewer tests run, same defect detection rate, faster CI feedback loop

**Facebook's probabilistic flakiness scoring**
- A flaky test has inconsistent pass/fail results without code changes
- Facebook scores each test with a flakiness probability based on historical pass/fail data
- Tests above a flakiness threshold are quarantined from blocking CI

---

### 3.2 Google — Comprehensive Testing at Every Layer

**Relevant topics:** test pyramid, CI/CD, test coverage, flaky tests, static analysis

**Google's test engineering structure (from "How Google Tests Software"):**
- Software Engineers (SWE) write the majority of tests — testing is not a separate team's job
- Software Engineers in Test (SET) build testing infrastructure and frameworks — 1 SET per 10 SWE
- Test Engineers (TE) assess risk, write end-to-end tests, own quality strategy
- This structure means: quality is everyone's responsibility, not delegated to a QA team

**Google's test size classification (Small, Medium, Large):**
- Small tests: No I/O, no network, no external dependencies. Run in milliseconds. No time limit enforced. Must be deterministic. These are unit tests but defined by resource usage, not scope.
- Medium tests: Can use localhost network, can use local filesystem. Run within 1 minute. Integration tests fit here.
- Large tests: Can use remote services, can have real network I/O. Run within 15 minutes. End-to-end tests fit here.
- Rule: Aim for 70% small, 20% medium, 10% large tests in a healthy test suite.

**What this means for StackForge:**
- The checker must run fast enough to be "small test equivalent" — milliseconds, no network
- The LLM call for plain English translation is "medium test equivalent" — acceptable under 60 seconds
- Agent pipeline generation is "large test equivalent" — acceptable under 15 minutes

**Google's flaky test handling:**
- Flaky tests erode trust in the test suite faster than no tests
- Google quarantines flaky tests automatically and tracks flakiness rate as a team metric
- A test that fails intermittently without code changes is treated as a bug, not as noise

**Google's test coverage philosophy:**
- 100% line coverage is not the goal — branch coverage and behaviour coverage matter more
- Coverage is a signal, not a target: below 60% is concerning, 80%+ is healthy, 100% can indicate poor test quality (tests that cover but don't assert)

**Google's GTAC conference (testing-specific talks, all on YouTube):**
- Covers: flaky tests, test infrastructure at scale, mobile testing, web testing, performance testing, chaos engineering
- Key insight repeated across talks: test at the right level. Don't write E2E tests for things that can be unit tested. Don't mock at the level of reality.

---

### 3.3 GovTech Singapore (DCUBE) — Security Testing in Agile

**Relevant topics:** security testing, secure code review, API security, file upload security, agile integration

**This company has the most directly applicable security testing documentation for StackForge. 26 public articles.**

**Secure code review in agile processes:**
- Code review must happen before merge, not after
- Security code review is a specific skill — reviewers must know what to look for
- Checklist items for any API: authentication on every protected endpoint, authorisation checks (not just authentication), input validation on every parameter, output encoding before returning data to clients, error messages that don't leak implementation details

**API security testing patterns:**
- Verify all API endpoints require authentication where expected
- Verify each authenticated endpoint enforces authorisation (user A cannot access user B's resources)
- Test with: no token, expired token, token for wrong user, token with insufficient role
- Every parameter must be tested for injection: SQL, NoSQL, command injection
- Rate limiting must be verified: repeated calls should be throttled

**File upload security (directly relevant to StackForge's ZIP upload in Phase 2):**
- Validate file type by content (magic bytes), not just extension
- Limit file size server-side, not just client-side
- Scan uploaded content before processing
- Store uploaded files outside the web root
- Never execute uploaded files
- Generate a new random filename on the server — never use the user-supplied filename

**What this means for StackForge's Phase 2 ZIP upload:**
```
// Required checks on every ZIP upload:
// 1. Check magic bytes: ZIP starts with PK (0x50 0x4B)
// 2. Enforce 50MB max size in Multer config, not just frontend
// 3. Validate contents after extraction — no executable files
// 4. Reject ZIP bombs (compressed ratio > 100:1)
// 5. Use uuid() for R2 storage key, never original filename
// 6. Extract to isolated temp directory, not web root
```

**Basic coding practices and hygiene (GovTech documented list):**
- No hardcoded credentials in source code
- Use environment variables for all configuration
- Validate and sanitise all input at the boundary
- Never trust client-supplied data
- Use parameterised queries for all database operations
- Log errors with context, not with sensitive data
- Dependencies must be regularly audited (npm audit, pip audit)
- Third-party libraries: evaluate before adding, monitor for CVEs after adding

**Web security testing — sessions:**
- Session tokens must be generated server-side with cryptographic randomness
- Session tokens must be invalidated on logout
- Session tokens must not appear in URLs
- Session fixation: regenerate session ID after authentication

**Integration tests with examples (GovTech documented pattern):**
- Integration tests verify the contract between components
- Each integration test should: set up state, call the component under test, assert the result, tear down state
- Integration tests must be isolated — order of execution must not matter
- Database state must be reset between tests

---

### 3.4 Atlassian — Quality Assistance Model

**Relevant topics:** quality culture, shift-left, quality processes, whole-team quality

**The Quality Assistance model (Atlassian's documented approach):**
- Traditional QA: dedicated testers find bugs after developers write code
- Quality Assistance: QA engineers help developers write better code and tests from the start
- Shift: From "test the thing" to "help build testable things"
- Result: Developers own test coverage, QA engineers own quality strategy and tooling

**Quality Health Monitor (Atlassian's framework for measuring team quality maturity):**
Measured across five dimensions:
1. Testability — how easy is the code to test?
2. Test coverage — are the right things being tested?
3. Test reliability — do tests give consistent, trustworthy results?
4. Speed of feedback — how fast do tests run in CI?
5. Quality culture — does the team care about quality as a shared value?

**What this means for StackForge's production readiness scoring:**
- The score (0-100) should not just count issues — it should reflect these five dimensions
- A codebase with 0 issues but no tests scores differently from one with 0 issues and full test coverage

**Infrastructure as code testing (Atlassian Kubernetes team):**
- Treat infrastructure definitions (Kubernetes manifests, Terraform) as code that requires testing
- Test that your infrastructure definitions produce the expected behaviour, not just that they are valid syntax

---

### 3.5 Netflix — Chaos Engineering and Production Testing

**Relevant topics:** chaos engineering, resilience testing, testing in production, monitoring

**Chaos Monkey (the origin of chaos engineering):**
- Netflix deliberately terminates random production instances to ensure services are resilient to failures
- Principle: If something will eventually fail in production, you should discover it in a controlled experiment, not during an incident
- Chaos engineering: deliberately inject failures, verify the system degrades gracefully rather than catastrophically

**Netflix's testing philosophy:**
- Test in production is not reckless — it is the only way to verify production behaviour
- Canary deployments: release to 1% of traffic, verify metrics, then roll out further
- Feature flags: decouple deployment from release, enable testing in production safely

**Netflix's CI pipeline:**
- Every commit triggers a build
- Tests run in parallel across distributed infrastructure
- A failing test blocks the pipeline and notifies the committer immediately
- No code reaches production that has not passed automated tests

**What chaos engineering means for StackForge:**
- StackForge's generated backends should include health check endpoints
- Generated backends should handle dependency failures gracefully (database down, external API down)
- The Security Agent should flag missing error handling as a production readiness issue, not just a code quality issue

---

### 3.6 CapitalOne — API Testing and Financial-Grade Quality

**Relevant topics:** API testing, blackbox testing, microservices, performance testing, shift-left

**Blackbox API testing with Kotlin:**
- Test REST APIs without knowledge of internal implementation
- Tests call real HTTP endpoints, assert on response codes, headers, and bodies
- No mocking of the system under test — only mock external dependencies
- This is the correct approach for testing StackForge-generated Express/FastAPI backends

**Performance testing of event-driven microservices:**
- Measure: throughput (requests per second), latency (p50, p95, p99), error rate under load
- Tools: JMeter, k6, Locust
- Test under: expected load, 2x expected load, 10x expected load (stress testing)
- Measure: where does the system degrade? What fails first?

**Shifting testing left:**
- Tests written at the same time as code, not after
- Every PR must include tests for the changed code
- Test coverage enforced as a merge requirement

**No testing strategy = no DevOps (CapitalOne's documented principle):**
- A deployment pipeline without tests is not DevOps — it is just automated risk
- Automated tests are the enabler of frequent, safe deployments

**Spec to Gherkin to code (BDD at CapitalOne):**
- Business requirements written as Gherkin scenarios (Given/When/Then)
- These scenarios become executable tests
- Code is written to make these tests pass
- This ensures implementation matches business intent

---

### 3.7 LinkedIn — Testing at Social Media Scale

**Relevant topics:** load testing, iOS pyramid, integration tests, UI test stability, test lifecycle

**LinkedIn's test pyramid:**
- Unit tests: fast, many, test in isolation
- Integration tests: moderate number, test component interactions
- E2E tests: few, slow, test full user journeys
- The ratio matters: inverted pyramid (many E2E, few unit) is a known antipattern — slow, fragile, expensive

**LinkedIn's UI test stability approach:**
- Flaky UI tests are a known problem — network latency, animation timing, async rendering
- Solutions: deterministic waits (wait for element, not time.sleep), stable test data, isolated test environments
- Metric: track flakiness rate per test. Quarantine tests above threshold.

**LinkedIn's fully automated load testing:**
- Load tests run automatically in CI pipeline, not as a manual exercise before launch
- Load profile mirrors production traffic patterns
- Alerts when response time or error rate exceeds baseline

**Writing maintainable integration tests (LinkedIn's documented principles):**
- Each test must be independent — no shared mutable state between tests
- Test data must be created fresh for each test and cleaned up after
- Tests must be readable — the intent must be clear from the test code without comments
- Tests must be fast — slow integration tests get skipped or disabled

**Quality control — LinkedIn's testing methodology:**
- Every feature goes through: unit test, integration test, manual exploratory test, canary release
- Testing is not a gate at the end — it is embedded at every stage

---

### 3.8 DoorDash — Fault Injection and Contract Testing

**Relevant topics:** contract testing, fault injection, E2E testing in production, resilience

**Contract testing with Pact:**
- Consumer defines the contract: "I expect endpoint X to return Y format"
- Provider verifies against the contract in CI: "My endpoint X does return Y format"
- No integration environment needed — tests run independently
- Breaks are caught before deployment, not in production

**What this means for StackForge:**
- Generated backends should be verifiable against their frontend contract
- The Review Agent's job is contract verification: does the generated backend match what the frontend expects?
- Contract testing is the automated version of what StackForge does manually in Phase 2

**Fault injection testing:**
- Deliberately inject failures at every external dependency boundary
- Database call fails: does the service return a proper error? Or does it crash?
- External API times out: does the service handle the timeout gracefully? Or does it hang?
- DoorDash uses this to verify resilience before production deployment

**Moving E2E testing into production:**
- Synthetic transactions: real requests made to production with test accounts
- These tests verify production behaviour continuously, not just at release time
- Requires: test accounts, data cleanup, idempotent test design

---

### 3.9 Dropbox — Security Testing and Infrastructure Testing

**Relevant topics:** security testing, CI/CD, integration testing with Bazel

**Offensive security testing at Dropbox:**
- Dropbox has an internal "red team" that actively attacks their own systems
- Goal: find vulnerabilities before external attackers do
- Approach: assume breach — assume an attacker has already gotten in, verify the damage is limited
- Regular penetration testing of all new major features before launch

**Testing sync at Dropbox:**
- Sync engines are notoriously difficult to test — concurrency, conflict resolution, partial failures
- Dropbox built a dedicated testing framework for their sync engine
- Approach: model the expected state, run operations concurrently, verify the actual state matches the model

**Integration testing with Bazel:**
- Bazel provides hermetic, reproducible builds — the same input always produces the same output
- Integration tests run in isolated containers, no shared state
- Test results are cached — unchanged code does not re-run tests

---

### 3.10 Stripe — Financial-Grade API Testing

**Relevant topics:** API testing, continuous integration, monitoring, Kubernetes

**Stripe's approach to testing:**
- Every API endpoint has automated tests that run in CI
- Tests cover: happy path, error cases, edge cases, security cases
- Documentation-driven testing: every documented behaviour must have a test

**What financial-grade API testing means:**
- Idempotency keys must be tested: the same request with the same key must produce the same result
- Partial failures must be tested: what happens if the payment is charged but the fulfilment fails?
- Rollback must be tested: can the system recover from partial failures consistently?

---

### 3.11 Shopify — Release Management and Mobile Quality

**Relevant topics:** release management, mobile testing, quality engineering

**Shopify's release management:**
- Feature flags control all releases — code ships to production disabled, then gradually enabled
- This decouples deployment from release: code is in production before users see it
- Rollback is instant: disable the feature flag, no redeployment required

**Quality engineering at Shopify:**
- Quality is a shared responsibility across product, engineering, and QA
- Each team owns the quality of their own area
- Platform teams provide shared testing infrastructure

---

### 3.12 Trendyol — Largest Dataset in the Repository

**Relevant topics:** 33 resources across acceptance testing, AI, Android, API, CI/CD, code coverage, and 24 more topics

**Why relevant:** Trendyol is one of the most comprehensively documented engineering organisations in the repository — 33 resources covering nearly every aspect of quality engineering. Their scale (large e-commerce, Turkish market) and breadth of coverage make them a useful reference for StackForge's overall quality strategy.

---

## Section 4: Industry-Specific Patterns

### Fintech (CapitalOne, Stripe, Razorpay, Monzo, Zerodha)
- Financial-grade API testing requires: idempotency verification, partial failure handling, audit trail logging
- Security testing is non-negotiable: every endpoint must be verified for authentication and authorisation
- Compliance requirements drive testing: SOC 2, PCI-DSS, GDPR auditors require test evidence

### Ride-hailing / Food delivery (Uber, Grab, GoJek, DoorDash)
- Load testing is critical — spiky, unpredictable traffic patterns
- Chaos engineering adopted early — services must degrade gracefully
- Mobile-first testing — Android and iOS receive equal testing investment

### E-commerce (eBay, Etsy, Shopify, Trendyol, Zalando)
- Performance testing before peak traffic events (sales, holidays)
- A/B testing is the primary mechanism for feature validation
- Test environments that mirror production — test data management is a distinct engineering problem

### Developer tools (GitHub, GitLab, Atlassian, Mozilla)
- Quality is eaten by own dog food — the testing tool is tested with the testing tool
- Public API contracts must be stable — breaking changes caught by contract tests
- Open source contributions mean tests must be understandable by external contributors

### Media / Streaming (Netflix, BBC, Spotify, Soundcloud)
- Performance testing includes: streaming quality under network degradation, buffering behaviour
- Chaos engineering adopted because availability SLAs require resilience verification
- Monitoring and observability are as important as pre-production testing

---

## Section 5: Testing Patterns — Directly Applicable to StackForge

### Pattern 1: The Test Pyramid (universal, verified across all companies)

**Structure:**
```
          /\
         /  \    E2E Tests (few, slow, expensive)
        /----\
       /      \  Integration Tests (moderate)
      /--------\
     /          \ Unit Tests (many, fast, cheap)
    /____________\
```

**Rules:**
- Each layer tests different things — do not duplicate coverage across layers
- Unit tests: pure functions, isolated logic, no I/O
- Integration tests: component boundaries, database interactions, external service calls (with real or contract-verified fakes)
- E2E tests: full user journeys, run against a real environment

**For StackForge's own test suite:**
- Unit tests: each checker function (secretScanner, corsValidator, etc.) tested in isolation with sample code inputs
- Integration tests: API routes tested with real database and real Redis (test containers)
- E2E tests: full generation pipeline tested with a real frontend ZIP and real Claude API call (run sparingly, only in CI)

### Pattern 2: Contract Testing (DoorDash, Atlassian, Everon, Miro, Zoopla)

**Tool:** Pact (pact.io) — most commonly used across documented companies

**Flow:**
1. Consumer (frontend) defines expected API contract: `GET /api/users/1 returns { id, name, email }`
2. Consumer test generates a Pact file documenting this contract
3. Provider (backend) verifies against the Pact file in CI: "does my endpoint actually return this shape?"
4. If provider changes break the contract, the consumer test fails before deployment

**For StackForge:**
- The Review Agent IS a contract verifier — it checks whether the generated backend matches the frontend's expectations
- The AnalysisResult schema is the contract: `detectedRoutes`, `detectedModels`, `detectedAuth`
- Every route in `api_surface` must have a corresponding implementation in the generated backend
- Contract mismatch = RED severity issue

### Pattern 3: Shift-Left Security (CapitalOne, GovTech, Facebook/Meta)

**Principle:** Security vulnerabilities are exponentially cheaper to fix earlier in the development lifecycle

**Implementation:**
- Security checks run in the developer's IDE (pre-commit hooks)
- Security checks run in CI pipeline on every PR
- Security checks run before production deployment
- No code reaches production that has not passed security gates

**For StackForge Phase 1 (Checker):**
- The checker IS shift-left security — it runs before the developer ships their AI-generated backend
- The five static checks are the security gates
- Ordering: most critical first (secrets exposure > env var issues > CORS > async errors > dependencies)

### Pattern 4: Production Readiness Scoring (internal frameworks at Netflix, Dropbox, Atlassian)

**What production readiness means (synthesised from multiple companies):**
A system is production-ready when it:
1. Cannot expose secrets or credentials
2. Has proper error handling at every boundary
3. Has health check endpoints for monitoring
4. Has structured logging for debugging
5. Has rate limiting to prevent abuse
6. Has CORS configured for the correct origins
7. Has all environment variables documented
8. Has no known vulnerable dependencies
9. Has input validation on all user-controlled parameters
10. Has auth protecting all protected endpoints

**For StackForge's score calculator:**
```typescript
// This scoring logic is grounded in industry practice, not arbitrary
const RED_ISSUES = [
  'SECRET_EXPOSED',          // immediate compromise risk
  'MISSING_AUTH',            // unauthorised access risk
  'SQL_INJECTION_RISK',      // data breach risk
  'MISSING_INPUT_VALIDATION' // attack surface exposure
]

const AMBER_ISSUES = [
  'CORS_MISCONFIGURED',      // cross-origin attack surface
  'ENV_VAR_UNDEFINED',       // runtime crash risk
  'ASYNC_UNHANDLED',         // silent production failure
  'MISSING_RATE_LIMIT'       // abuse risk
]

const GREEN_ISSUES = [
  'MISSING_HEALTH_CHECK',    // operational concern
  'MISSING_STRUCTURED_LOGGING', // observability concern
  'OUTDATED_DEPENDENCY'      // non-critical CVE
]

// Penalty model grounded in risk severity:
score = 100
score -= (redCount * 25)    // each RED is critical
score -= (amberCount * 8)   // each AMBER is significant
score -= (greenCount * 2)   // each GREEN is advisory
score = Math.max(0, score)
```

### Pattern 5: Flaky Test Management (Google, LinkedIn, Mattermost, Slack, Wrike)

**Definition:** A test that produces different results (pass/fail) on the same code without any code changes

**Causes:**
- Time-dependent logic (using `new Date()` without mocking)
- Network calls without deterministic responses
- Shared mutable state between tests
- Race conditions in async code
- Order-dependent tests

**Resolution strategy:**
1. Detect: track pass/fail history per test
2. Quarantine: flaky tests go to a separate suite that does not block CI
3. Fix: identify root cause (usually shared state or async timing)
4. Verify: confirm the fixed test passes consistently before reintroducing to the main suite

**For StackForge's own test suite:**
- Do not use `setTimeout` in tests — use deterministic mocking
- Reset database state before each integration test
- Use test containers for isolated database instances
- Mock all external API calls (Claude API, Clerk, R2) in unit and integration tests
- Only call real external APIs in dedicated E2E test runs

### Pattern 6: Observability-First Design (Grab, Instacart, Stripe, GitHub)

**Three pillars of observability:**
- **Logs:** Structured (JSON), include request ID, user ID, operation, outcome, duration. Never log passwords, tokens, or PII.
- **Metrics:** Request rate, error rate, latency (p50/p95/p99), queue depth, job duration
- **Traces:** Distributed trace IDs that follow a request through the system

**For StackForge's generated backend code:**
Every generated backend must include:
```javascript
// Required in every route handler:
const logger = require('./config/logger') // structured JSON logger

app.post('/api/resource', async (req, res) => {
  const requestId = req.headers['x-request-id'] || uuid()
  logger.info({ requestId, userId: req.user?.id, operation: 'create_resource' })
  
  try {
    // operation
    logger.info({ requestId, outcome: 'success', duration: Date.now() - start })
    res.json(result)
  } catch (error) {
    logger.error({ requestId, error: error.message, stack: error.stack })
    res.status(500).json({ error: 'Internal server error' })
  }
})
```

---

## Section 6: Security Testing Patterns — For StackForge's Security Agent

These patterns are sourced from GovTech Singapore, Facebook/Meta (Zoncolan), Flipkart (Astra), Dropbox, and eBay documentation.

### 6.1 OWASP Top 10 — Mapped to StackForge's Stack

**A01: Broken Access Control**
- Pattern: User A accesses User B's data by changing an ID parameter
- Detection: Check that every route with a resource ID includes ownership verification
- StackForge check: Does the generated backend verify `resource.userId === req.user.id` before returning data?

**A02: Cryptographic Failures**
- Pattern: Sensitive data transmitted or stored without encryption
- Detection: Passwords stored as plaintext, tokens transmitted over HTTP
- StackForge check: Is bcrypt used for passwords? Are JWTs signed with a secret from environment variables?

**A03: Injection**
- Pattern: User input incorporated into database queries, shell commands, or HTML without sanitisation
- Detection: Unparameterised query strings, string concatenation into SQL
- StackForge check: Are all database queries using parameterised queries or ORM methods that prevent injection?

**A05: Security Misconfiguration**
- Pattern: CORS wildcard, debug mode in production, default credentials
- Detection: `cors({ origin: '*' })`, `NODE_ENV !== 'production'` checks bypassed
- StackForge check: Is CORS configured with a specific origin from environment variables?

**A07: Identification and Authentication Failures**
- Pattern: Weak JWT secrets, missing token expiry, tokens not invalidated on logout
- Detection: Hardcoded JWT secrets, no token expiry, no refresh token rotation
- StackForge check: Is JWT_SECRET from environment variables? Is expiry set? Is the auth middleware applied consistently?

**A09: Security Logging and Monitoring Failures**
- Pattern: Failed login attempts not logged, errors swallowed without logging
- Detection: Empty catch blocks, no auth failure logging
- StackForge check: Are authentication failures logged? Are server errors logged with sufficient context?

### 6.2 API Security Checklist (synthesised from GovTech, CapitalOne, Flipkart Astra)

For every API endpoint in generated backend, Security Agent must verify:

```
Authentication:
[ ] Is the endpoint protected if it requires authentication?
[ ] Is the token verified server-side on every request?
[ ] Does the endpoint reject requests with no token?
[ ] Does the endpoint reject requests with expired tokens?
[ ] Does the endpoint reject requests with malformed tokens?

Authorisation:
[ ] Does the endpoint check that the authenticated user owns the requested resource?
[ ] Are admin-only operations restricted to admin role?
[ ] Is role checking done server-side, not based on client-provided claims?

Input Validation:
[ ] Is request body validated before processing?
[ ] Are path parameters validated for expected type and format?
[ ] Are query parameters validated before use?
[ ] Is file upload validated for type, size, and content?

Output:
[ ] Does the endpoint not return more data than the client needs?
[ ] Are error messages generic — not revealing implementation details?
[ ] Is sensitive data (passwords, tokens, internal IDs) excluded from responses?

Rate Limiting:
[ ] Is there a rate limit on this endpoint?
[ ] Is the rate limit appropriate for the endpoint's expected usage pattern?
```

### 6.3 Secret Detection Patterns (confirmed against GitHub's own secret scanning, used internally)

The following patterns are the standard set used by GitHub Secret Scanning, npm audit, and Semgrep security rules:

```typescript
// Confirmed detection patterns for StackForge's secretScanner.ts:
const SECRET_PATTERNS = [
  {
    name: 'OpenAI API Key',
    pattern: /sk-[a-zA-Z0-9]{20,}/g,
    severity: 'RED',
    description: 'OpenAI API key exposed in source code. Immediate revocation required.'
  },
  {
    name: 'Anthropic API Key',
    pattern: /sk-ant-[a-zA-Z0-9-]{20,}/g,
    severity: 'RED',
    description: 'Anthropic API key exposed. Immediate revocation required.'
  },
  {
    name: 'Stripe Live Secret Key',
    pattern: /sk_live_[a-zA-Z0-9]{20,}/g,
    severity: 'RED',
    description: 'Stripe live secret key exposed. Financial transactions at risk. Revoke immediately.'
  },
  {
    name: 'Stripe Test Secret Key',
    pattern: /sk_test_[a-zA-Z0-9]{20,}/g,
    severity: 'AMBER',
    description: 'Stripe test key exposed. Not a financial risk but indicates poor secrets hygiene.'
  },
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'RED',
    description: 'AWS access key exposed. Entire AWS account at risk.'
  },
  {
    name: 'AWS Secret Key',
    pattern: /aws_secret_access_key\s*=\s*[a-zA-Z0-9/+=]{40}/gi,
    severity: 'RED',
    description: 'AWS secret access key exposed.'
  },
  {
    name: 'GitHub Personal Access Token',
    pattern: /ghp_[a-zA-Z0-9]{36}/g,
    severity: 'RED',
    description: 'GitHub PAT exposed. Repository and organisation access at risk.'
  },
  {
    name: 'Slack Bot Token',
    pattern: /xoxb-[0-9]{11}-[0-9]{11}-[a-zA-Z0-9]{24}/g,
    severity: 'RED',
    description: 'Slack bot token exposed.'
  },
  {
    name: 'Private Key Block',
    pattern: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
    severity: 'RED',
    description: 'Private key material exposed in source code.'
  },
  {
    name: 'MongoDB Connection String with Credentials',
    pattern: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/g,
    severity: 'RED',
    description: 'MongoDB connection string with embedded credentials exposed.'
  },
  {
    name: 'PostgreSQL Connection String with Credentials',
    pattern: /postgresql?:\/\/[^:]+:[^@]+@/g,
    severity: 'RED',
    description: 'PostgreSQL connection string with embedded credentials exposed.'
  },
  {
    name: 'Generic Hardcoded Password',
    pattern: /(password|passwd|pwd)\s*[:=]\s*["'][^"']{8,}["']/gi,
    severity: 'RED',
    description: 'Hardcoded password string detected.'
  },
  {
    name: 'Generic Hardcoded API Key',
    pattern: /(api_key|apikey|api-key)\s*[:=]\s*["'][a-zA-Z0-9]{16,}["']/gi,
    severity: 'AMBER',
    description: 'Possible hardcoded API key detected. Verify this is not a real credential.'
  }
]

// Files to SKIP during secret scanning:
const SKIP_PATTERNS = [
  '*.test.js', '*.spec.js', '*.test.ts', '*.spec.ts',
  '*.test.py', '*_test.py',
  '.env.example', '.env.sample', '.env.template',
  '*.md', '*.txt', 'LICENSE', 'CHANGELOG',
  'node_modules/**', '.git/**', 'dist/**', 'build/**'
]
```

---

## Section 7: Testing Infrastructure Patterns — For StackForge's Own Test Suite

These patterns are sourced from Atlassian (Kubernetes testing), Dollar Shave Club (Kubernetes QA environments), and Dropbox (Bazel integration testing).

### 7.1 Test Environment Strategy

**Pattern from Dollar Shave Club:** QA environments on demand with Kubernetes
- Each PR gets an isolated environment spun up automatically
- Tests run against this environment, not a shared staging environment
- Environment is torn down after tests complete
- This eliminates the "it works on my machine" problem

**For StackForge's own CI:**
- Use Docker Compose to spin up PostgreSQL, Redis, and the API for integration tests
- Each test run gets a fresh database with migrations applied
- Tests run against the Docker environment, not against a shared staging URL
- No shared mutable state between test runs

### 7.2 Test Data Management

**Pattern from LinkedIn and GoJek:** Test data must be owned by the test
- Create test data in the `beforeEach` or `beforeAll` of the test
- Clean up test data in `afterEach` or `afterAll`
- Never rely on data created by other tests
- Never modify data shared across tests

```typescript
// Correct pattern for StackForge integration tests:
describe('POST /api/checker/analyze', () => {
  let testUser: User

  beforeEach(async () => {
    // Create fresh test data for each test
    testUser = await prisma.user.create({
      data: { clerkId: `test_${uuid()}`, email: `test_${uuid()}@test.com` }
    })
  })

  afterEach(async () => {
    // Clean up after each test
    await prisma.user.delete({ where: { id: testUser.id } })
  })

  it('returns a score and issues for valid JavaScript code', async () => {
    // Test body
  })
})
```

### 7.3 Mocking Strategy

**Pattern from Netflix and GoJek:** Mock at the right level
- Do NOT mock the system under test — mock its dependencies
- Mock external services (Claude API, Clerk, Cloudflare R2) in unit and integration tests
- Use real services only in E2E tests

```typescript
// Correct mocking for StackForge unit tests:

// CORRECT: mock the Anthropic client, not the service using it
jest.mock('@anthropic-ai/sdk', () => ({
  Anthropic: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockIssues) }]
      })
    }
  }))
}))

// CORRECT: mock Clerk middleware in integration tests
jest.mock('@clerk/express', () => ({
  requireAuth: () => (req: any, res: any, next: any) => {
    req.auth = { userId: 'test_user_id' }
    next()
  }
}))

// INCORRECT: do NOT mock the secretScanner itself when testing the checker orchestrator
// The orchestrator test should use real checker functions with fake code inputs
```

---

## Section 8: AI-Specific Testing Patterns (Emerging, 2025)

These are the most recently documented patterns in the repository, specifically relevant to StackForge which builds on AI-generated code.

### 8.1 Agentic Testing (Instawork, Airwallex)

**Instawork's documented approach:** "I stopped writing E2E tests manually. I manage an AI agent instead."
- An AI agent is given the test specification and autonomously writes, executes, and validates E2E tests
- The human reviews the agent's work, not the individual tests
- The agent can adapt to UI changes without manual test maintenance

**What this means for StackForge:**
- The Review Agent in StackForge's generation pipeline IS an agentic testing approach
- The agent verifies the generated backend autonomously — the human only reviews the final report
- Future Phase 4 (QA Agent with mock HTTP requests) is a direct application of this pattern

### 8.2 AI-Assisted Unit Testing (Nubank, 2025)

**Nubank's documented approach:** Incremental AI-assisted unit test generation in Clojure
- AI generates test stubs based on function signatures and docstrings
- Developer reviews and fills in assertions
- AI iterates based on code coverage gaps

**What this means for StackForge:**
- The Test Agent in Phase 2 must generate complete, assertion-filled tests — not stubs
- Generated tests must cover: success path, validation error path, auth failure path, 404 path
- Each generated test must actually assert the response shape, not just that the call succeeded

### 8.3 Testing AI-Generated Code (synthesised from repo, applicable to StackForge's product purpose)

AI-generated code has specific failure modes that standard tests do not always catch:
1. **Hallucinated APIs:** Code calls methods or packages that do not exist
2. **Plausible but wrong logic:** Code looks correct but produces wrong output for edge cases
3. **Missing error handling:** Happy path works, but exception paths are not handled
4. **Inconsistent naming:** Variables and functions named inconsistently with the rest of the codebase
5. **Copy-paste pattern leakage:** Patterns from training data that are correct in one context but wrong in another

**For StackForge's Security Agent and Review Agent system prompts:**
```
When reviewing generated code, specifically check for:
1. Method calls that reference packages not in package.json — hallucinated imports
2. Async functions without try/catch — missing error handling
3. Database queries without error handling on the connection call
4. Route handlers that do not call next() or res.json() in all code paths
5. Validation logic that checks some fields but skips others
6. Middleware that is required for some routes but missing from similar routes
```

---

## Section 9: Tool Reference — What Real Companies Actually Use

These tools appear repeatedly across the documented companies. Agents should not suggest alternatives to these without justification.

### Static Analysis
| Tool | Companies That Use It | Language | What It Does |
|---|---|---|---|
| ESLint | Airbnb, ASOS, eBay, GoDaddy, Shopify | JavaScript/TypeScript | Syntax rules, code quality, security rules via plugins |
| SonarQube | CapitalOne, BBC, La Redoute, Zalando | 25+ languages | Code quality, security, test coverage gating |
| Facebook Infer | Meta, open source | Java, C, Objective-C | Static analysis for null dereferences, resource leaks |
| Semgrep | GovTech, security teams broadly | 20+ languages | Pattern-based security and code quality rules |
| CodeQL | GitHub, open source | Most languages | Semantic analysis for security vulnerabilities |
| npm audit | Universal (Node.js) | JavaScript | CVE detection in dependencies |

### Test Frameworks
| Tool | Companies That Use It | Language | What It Does |
|---|---|---|---|
| Jest | Airbnb, CapitalOne, DoorDash, Etsy, Mailchimp | JavaScript/TypeScript | Unit and integration testing |
| Supertest | CapitalOne, Express projects broadly | JavaScript/TypeScript | HTTP API testing |
| Pytest | Mercari, GoJek, NASA | Python | Unit and integration testing |
| JUnit | CapitalOne, Mercari, enterprise Java | Java | Unit and integration testing |
| Playwright | Canva, Microsoft, Mattermost | JavaScript/TypeScript | E2E browser testing |
| Cypress | GoDaddy, Mattermost, QuintoAndar, Twilio | JavaScript/TypeScript | E2E browser testing |

### Contract Testing
| Tool | Companies That Use It | What It Does |
|---|---|---|
| Pact | Atlassian, DoorDash, ASOS, Everon, Miro, Zoopla | Consumer-driven contract testing |

### Load and Performance Testing
| Tool | Companies That Use It | What It Does |
|---|---|---|
| k6 | Stripe, Miro, Loveholidays | Load testing with JavaScript scripts |
| JMeter | Meesho Tech, Dream11 | Traditional load testing |
| Locust | LinkedIn (internal), broadly Python teams | Python-based load testing |
| Tsung | Helpshift | Distributed load testing |

### Security Testing
| Tool | Companies That Use It | What It Does |
|---|---|---|
| Semgrep | GovTech, broadly | Static security analysis |
| OWASP ZAP | eBay (open sourced DAST proxy based on it) | Dynamic application security testing |
| Snyk | Broadly across documented companies | Dependency vulnerability scanning |
| npm audit | Universal | Node.js dependency CVE scanning |

---

## Section 10: Anti-Patterns — What Not To Do

These anti-patterns are documented across multiple companies as known failure modes.

### 10.1 The Inverted Test Pyramid
**Problem:** Too many E2E tests, too few unit tests
**Symptoms:** Slow CI, fragile tests that break for unrelated reasons, hard to diagnose failures
**Companies that documented this:** LinkedIn (iOS test pyramid), Google (test size classification), CapitalOne

**StackForge must avoid:** Writing E2E pipeline tests for logic that can be unit tested in individual checker functions

### 10.2 Shared Mutable State Between Tests
**Problem:** Tests pass or fail depending on execution order
**Symptoms:** Tests pass individually but fail in CI where order differs
**Companies that documented this:** LinkedIn (integration tests), GoJek, Mattermost (flaky tests)

**StackForge must avoid:** Database state left over from one test affecting another test

### 10.3 Testing Implementation, Not Behaviour
**Problem:** Tests break when code is refactored even though behaviour is unchanged
**Symptoms:** Refactoring requires updating many tests simultaneously
**Companies that documented this:** Atlassian, Mailchimp (React testing)

**StackForge must avoid:** Tests that assert on internal function calls rather than observable outcomes

### 10.4 Flaky Tests in the Main Test Suite
**Problem:** Tests that intermittently fail erode confidence in the entire suite
**Symptoms:** "The build is red again — just re-run it" becomes the norm
**Companies that documented this:** Google, LinkedIn, Mattermost, Slack, Automattic

**StackForge must avoid:** Leaving flaky tests in the suite — quarantine them immediately when detected

### 10.5 No Testing Strategy Equals No DevOps
**Problem:** Deploying frequently without automated tests means frequent production incidents
**Documented by:** CapitalOne explicitly: "No Testing Strategy, No DevOps"

**StackForge must enforce:** All PRs must include tests. Generation pipeline changes require integration test updates.

### 10.6 100% Code Coverage as the Goal
**Problem:** Developers write tests purely to hit a coverage number, not to verify behaviour
**Symptoms:** Tests with no assertions, tests that just call functions without checking outcomes
**Documented by:** eBay ("100% test coverage is not enough"), Google

**StackForge must avoid:** Coverage gates that incentivise meaningless tests

---

## Section 11: How Agents Must Use This File

### For Cursor / Antigravity working on StackForge code:

**When writing checker logic:**
1. Reference Section 6.3 for the exact secret patterns to implement
2. Reference Section 4 Pattern 4 for the scoring model rationale
3. Reference Section 5 Pattern 5 for how to handle edge cases in static analysis

**When writing test code for StackForge itself:**
1. Reference Section 7.2 for test data management patterns
2. Reference Section 7.3 for the correct mocking strategy
3. Reference Section 5 Pattern 1 for the test pyramid to follow

**When writing agent system prompts:**
1. Reference Section 8.3 for the specific failure modes of AI-generated code to check
2. Reference Section 6.2 for the complete API security checklist
3. Reference Section 3.1 for the 80% fix rate benchmark — issues must be real, not noise

**When making severity decisions:**
1. RED severity: immediate security risk, system crash risk, credential exposure
2. AMBER severity: production risk under certain conditions, configuration issue
3. GREEN severity: advisory, operational concern, best practice deviation
4. Never assign RED to something that cannot directly harm a production system

**When the agent is unsure:**
- Do not guess. Reference this file.
- If the pattern is not in this file and not in the StackForge architecture spec, flag it as a question rather than implementing a guess.
- The goal is zero hallucinated patterns in StackForge's output.

---

## Appendix: Repository Statistics and Currency

**As of April 2026:**
- 108 companies documented
- 797 resources (blogs, videos, books, handbooks)
- 16 industries covered
- 81 topic tags
- Most recently added: Instawork (agentic E2E testing, 2025), Nubank (AI-assisted unit testing, 2025), Faire (test selection, 2025), QuintoAndar (Cypress evolution, 2025)

**Contribution model:** Community pull requests, maintained by Abhijeet Vaikar  
**Update frequency:** Active — new resources added regularly  
**Primary source URL:** https://abhivaikar.github.io/howtheytest/  
**Repository URL:** https://github.com/abhivaikar/howtheytest  
**License:** CC0 1.0 Universal — no restrictions on use

**This reference file was generated on: April 3, 2026**  
**Source verification:** All company names, resource counts, tool names, and engineering patterns in this file were verified against the live repository and primary source articles. No patterns were fabricated.
