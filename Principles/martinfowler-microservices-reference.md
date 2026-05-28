# Microservices — Complete AI Agent Reference File
> Source: martinfowler.com/articles/microservices.html  
> Authors: James Lewis (Principal Consultant, Thoughtworks) + Martin Fowler  
> Published: 25 March 2014 — The canonical definition document for the Microservices architectural style  
> Purpose: Authoritative, hallucination-free reference for AI agents (Cursor, Antigravity, Claude Code)  
> Covers: All 9 characteristics, Monolith comparison, SOA comparison, all 7 sidebars, trade-offs, when NOT to use microservices

---

## DOCUMENT CONTEXT

This is the **original definitional article** for the microservices architectural style. It is the most-cited piece on microservices. Every concept here comes directly from this article. Agents must not invent microservices definitions beyond what this document states.

**One-sentence definition (exact from article):**
> "The microservice architectural style is an approach to developing a single application as a suite of small services, each running in its own process and communicating with lightweight mechanisms, often an HTTP resource API."

**Key additions to the one-sentence definition:**
- Services built around **business capabilities**
- **Independently deployable** via fully automated deployment machinery
- **Bare minimum of centralized management**
- May be written in **different programming languages**
- May use **different data storage technologies**

---

## PART 1: THE MONOLITH — BASELINE COMPARISON

Understanding microservices requires understanding what they replace.

### What is a Monolith?

A traditional enterprise application has three parts:
1. **Client-side UI** — HTML pages + JavaScript in browser
2. **Database** — Many tables in a common (usually relational) DBMS
3. **Server-side application** — Handles HTTP requests, executes domain logic, retrieves/updates data, populates HTML views

The server-side application is the **monolith** — a single logical executable. ALL logic for handling a request runs in a single process.

### Monolith Advantages (the article honestly acknowledges these)
- Natural way to build a system
- Can divide into classes, functions, namespaces within one process
- Can run and test on a developer's laptop
- Use a deployment pipeline for proper testing and deployment
- Horizontally scale by running many instances behind a load-balancer

### Monolith Pain Points (why microservices emerged)
- **Tied change cycles** — A change to any small part requires rebuilding and deploying the ENTIRE application
- **Hard to maintain modular structure over time** — changes intended for one module leak into others
- **Scaling requires scaling everything** — cannot scale only the components that need more resources
- **Increasingly frustrating as cloud adoption grows** — cloud amplifies these problems

---

## PART 2: MICROSERVICES vs MONOLITH — EXACT DEFINITIONS

### Critical Terminology (Fowler's exact definitions — agents must use these)

| Term | Fowler's Exact Definition |
|------|--------------------------|
| **Component** | A unit of software that is independently replaceable and upgradeable |
| **Library** | A component linked into a program, called using in-memory function calls |
| **Service** | An out-of-process component communicating via web service request or remote procedure call |
| **Microservice** | A small service, running in its own process, independently deployable, organized around a business capability |
| **Application** | A social construction that binds together a code base, group of functionality, and body of funding |

### Services vs Libraries

| Aspect | Library | Service |
|--------|---------|---------|
| Communication | In-process (in-memory function calls) | Out-of-process (HTTP, RPC, message bus) |
| Deployment | Requires redeploying the host application | Independently deployable |
| Interface | Usually implicit (no formal Published Interface) | Explicit remote call mechanism |
| Failure mode | Method call failure | Network failure, timeout, cascading failure |
| Performance | Fast (in-memory) | Slower (network latency) |
| API granularity | Fine-grained | Coarser-grained required |

**NOTE for agents:** "Service" in this article does NOT mean "service object" in Domain-Driven Design. DDD service objects are in-process. Microservice "services" are out-of-process. These are different concepts — never conflate them.

---

## PART 3: THE 9 CHARACTERISTICS OF MICROSERVICE ARCHITECTURE

**Critical agent rule:** Not ALL microservice architectures have ALL 9 characteristics. Most have MOST of them. These are observed characteristics, not mandatory requirements.

---

### CHARACTERISTIC 1: Componentization via Services

**Core idea:** Primary componentization strategy is breaking into services — not libraries.

**Why services over libraries:**
1. **Independent deployability** — Change one service → redeploy only that service. With libraries in one process, any change → redeploy the entire application.
2. **Explicit interfaces** — Services enforce interface contracts via remote call mechanisms. Libraries rely only on documentation and discipline. Services make encapsulation violations harder by design.

**Acknowledged downsides of service components:**
- Remote calls are MORE EXPENSIVE than in-process calls
- Remote APIs must be **coarser-grained** (fewer, chunkier calls) — awkward compared to fine-grained in-process APIs
- Moving behavior across service boundaries (refactoring responsibilities) is HARDER than within a process

**Nuance about service = process:**
A service is NOT always a single process. A service may consist of an application process AND a database (used only by that service) that are developed and deployed together as one unit.

---

### CHARACTERISTIC 2: Organized around Business Capabilities

**Conway's Law (quoted directly in the article):**
> "Any organization that designs a system (defined broadly) will produce a design whose structure is a copy of the organization's communication structure." — Melvin Conway, 1968

**The technology-layer anti-pattern (traditional approach):**
- UI team handles all UI; logic team handles all logic; database team handles all databases
- Result: Simple changes require cross-team coordination and budget approval
- Teams optimize by forcing logic wherever they have access → "Logic everywhere"
- Conway's Law produces a system shaped like the org — layered teams produce layered (siloed) systems

**The microservices approach:**
Services organized around **business capability**, not technology layer. Each service takes a **broad-stack (full-stack) implementation** for its business area, including:
- Its piece of the user interface
- Its persistent storage
- Its external collaborations

**Consequence:** Teams are **cross-functional** containing user-experience designers, database specialists, and project management — all inside one team, owning one service.

**Service size guidance ("How big is a microservice?" sidebar):**

The article deliberately avoids a precise line, but gives two reference points:
- **Largest:** Amazon's Two Pizza Team — no more than ~12 people
- **Smallest:** Half-dozen people supporting half-dozen services (roughly 1 service per person)

Both are valid microservice architectures. Focus on the business boundary, not the size number.

**Why NOT align around technology layers:**
- Simple changes require cross-team projects
- Modular boundaries in monoliths are hard to enforce
- Service boundaries make team boundaries naturally explicit

---

### CHARACTERISTIC 3: Products not Projects

**The Project Model (what microservices reject):**
- Team delivers software → considered "complete"
- Handed to maintenance organization
- Project team disbanded
- No ongoing ownership

**The Product Model (what microservices favor):**
- A team **owns a product over its full lifetime**
- Inspired by Amazon's "**you build, you run it**" — dev team takes full responsibility for software in production
- Developers are in day-to-day contact with how their software behaves in production
- Developers interact with users (taking on some support burden)
- The question changes from "what features remain?" to "how can this software help users enhance the business capability?"

**Why this matters for microservices:**
- Product mentality directly ties development to business outcomes
- Smaller service granularity makes personal relationships between developers and users easier
- Feedback loops are shorter and more direct
- Teams have skin in the game for production reliability

---

### CHARACTERISTIC 4: Smart Endpoints and Dumb Pipes

**The ESB anti-pattern (what microservices explicitly reject):**
Enterprise Service Bus (ESB) puts intelligence IN the communication mechanism:
- Message routing decisions
- Choreography logic
- Data transformation
- Business rules applied in the pipe

ESB = "Erroneous Spaghetti Box" (Jim Webber quote, cited in article)

**Microservices vs SOA — the critical distinction:**

| Aspect | SOA (as commonly implemented) | Microservices |
|--------|------------------------------|---------------|
| Integration method | ESBs to integrate monoliths | Simple HTTP/messaging between services |
| Intelligence location | In the bus/middleware | In the endpoints (services) |
| Standards approach | Central governance, heavy WS-* specs | Tolerant Reader, Consumer-Driven Contracts |
| Historical outcome | Often failed, expensive, multi-year initiatives | Positive results reported |
| Governance | Centralized, inhibits change | Decentralized, enables change |

Microservices = "service orientation done right" (some advocates' view — referenced in article)

**The Microservices Alternative: Smart Endpoints, Dumb Pipes**

Services are as decoupled and as cohesive as possible:
- Own their own domain logic
- Act as **filters in the Unix sense**: receive request → apply logic → produce response
- Choreographed via simple RESTish protocols (not WS-Choreography, BPEL, or central orchestration tool)

**Two communication protocols used in microservices:**

**Protocol 1: HTTP request-response with resource APIs (REST)**
- "Be of the web, not behind the web" — Ian Robinson (referenced)
- Use standard web principles: resources, HTTP verbs, standard status codes
- Resources can be cached with minimal developer/ops effort
- Transparent and human-readable

**Protocol 2: Lightweight message bus**
- Infrastructure is DUMB — acts only as message router (RabbitMQ, ZeroMQ)
- RabbitMQ and ZeroMQ "don't do much more than provide a reliable asynchronous fabric"
- ALL smarts (business logic) live in the endpoints — the services producing and consuming messages
- Not the bus

**Binary protocols note:** At extreme scale, teams sometimes use protobufs for performance. This still upholds smart endpoints/dumb pipes — it trades transparency for scale. Most enterprises don't need this.

**Critical migration warning (exact from article):**
> "A naive conversion from in-memory method calls to RPC leads to chatty communications which don't perform well. Instead you need to replace the fine-grained communication with a coarser-grained approach."

When migrating monolith → microservices:
- Never map each in-process method call 1:1 to a remote call
- Redesign the API to be coarser-grained (batch what was previously multiple calls)

---

### CHARACTERISTIC 5: Decentralized Governance

**The centralized governance problem:**
Forces a single technology platform for everything. One-size-fits-all. "Not every problem is a nail; not every solution a hammer."

**What decentralized governance enables:**
- Node.js for a simple reporting page
- C++ for a near-real-time component
- Cassandra for one service, PostgreSQL for another, Redis for another
- Each service picks the right tool for its specific problem

**How microservice teams handle standards:**
Instead of standards written on paper → produce **useful tools** that other developers can use. Tools are:
- "Harvested from implementations" — extracted from real working code
- Shared across the organization (often as internal open source)
- Netflix model: share battle-tested libraries for data storage, inter-process communication, infrastructure automation

**Consumer-Driven Contracts (referenced):**
Consumers define the contract they require from a service. The provider must satisfy that contract. Contracts are executed as part of the CI build → fast feedback, high confidence services are compatible.

**Tolerant Reader (referenced):**
Consumers only read the fields they need from a response; unknown fields are ignored. This allows service providers to add new fields without breaking existing consumers. Enables independent evolution.

---

### CHARACTERISTIC 6: Decentralized Data Management

**Bounded Context (Domain-Driven Design reference):**
Each microservice owns its domain model within a Bounded Context — a boundary within which a particular domain model applies. Different services may have different models of the same real-world concept (e.g., "Customer" means different things to Sales service vs. Support service).

**Key principle:** Each microservice manages its OWN database.

**Polyglot Persistence:**
Different services can use entirely different database technologies, each chosen for its access patterns:
- Service A: PostgreSQL (relational — complex queries, ACID)
- Service B: MongoDB (document — flexible schema)
- Service C: Redis (key-value — caching, sessions)
- Service D: Elasticsearch (search — full-text search)
- Service E: Cassandra (column-family — time-series, high write throughput)

**Why decentralized data matters:**
- Eliminates cross-service schema coupling
- Allows optimal database choice per service
- Integration Database (shared DB across services) is explicitly avoided — it creates tight coupling

**The Distributed Transactions Problem:**
Distributed ACID transactions across services are notoriously difficult. Microservices architecture handles this with:
- **Transactionless coordination between services**
- **Eventual consistency** — accepting that consistency may only be eventual
- **Compensating operations** — if a step fails, execute compensating actions to undo completed steps

**Eventual Consistency trade-off (exact from article):**
> "Choosing to manage inconsistencies in this way is a new challenge for many development teams, but it is one that often matches business practice."

Businesses already handle inconsistencies in real life. Software can too.

---

### CHARACTERISTIC 7: Infrastructure Automation

**Why it's essential for microservices:**
More services = more deployments. Manual deployment doesn't scale. Every service must be independently, automatically deployable on demand.

**What infrastructure automation means:**
- Extensive automated testing at every level (unit, integration, contract, end-to-end)
- Automated deployment to each environment (dev → staging → production)
- Continuous Delivery pipelines per service
- Infrastructure provisioned via code (Infrastructure as Code)

**Build pipeline pattern:**
```
Code commit
  → Automated unit tests
  → Automated integration tests
  → Automated contract tests (Consumer-Driven Contracts)
  → Deploy to staging environment
  → Automated smoke tests in staging
  → Deploy to production
```

**Infrastructure as Code:**
Computing and network infrastructure defined through source code:
- Version controlled (auditable)
- Testable
- Reproducible builds
- Full discipline of Continuous Delivery applied to infrastructure
- Foundation for cloud computing management

---

### CHARACTERISTIC 8: Design for Failure

**Core principle:** Services WILL fail. Design assuming they will.

**Why this differs from monoliths:**
- In-process calls: if part fails, process fails — but it fails cleanly
- Remote calls: can fail OR hang (waiting for timeout) OR trigger cascading failures

**The Cascading Failure Problem (exact from article):**
> "If you have many callers on an unresponsive supplier, then you can run out of critical resources leading to cascading failures across multiple systems."

One slow/down service can take down your entire architecture if unhandled.

---

#### The Circuit Breaker Pattern (sidebar: critical production pattern)

Source: Michael Nygard's "Release It!" — referenced in the article.

**Purpose:** Prevent cascading failures from unresponsive remote services.

**Exact mechanism:**
Wrap a protected function call in a circuit breaker object that monitors for failures.

**Three states:**

**CLOSED (normal operation):**
- All calls pass through to the real service
- Monitor failure rate continuously
- When failure rate exceeds threshold → trip to OPEN

**OPEN (tripped):**
- ALL further calls immediately return error — WITHOUT making the actual call
- No waiting, no timeouts, instant fail
- Prevents resource exhaustion from piling up callers
- Alert fires to notify team
- After predetermined timeout → move to HALF-OPEN

**HALF-OPEN (recovery probe):**
- Allow a limited number of probe calls through to the real service
- If probes SUCCEED → return to CLOSED (service has recovered)
- If probes FAIL → return to OPEN (service still down)

**State machine diagram:**
```
CLOSED ──[failure rate > threshold]──────────────► OPEN
  ▲                                                   │
  │                                           [after timeout]
  │                                                   │
  │                                                   ▼
  │                                            HALF-OPEN
  │                                           /         \
  └──[probes succeed]──────────────────────────         └──[probes fail]──► OPEN
```

**Related patterns from "Release It!" (all referenced):**
- **Bulkhead** — Isolate resource pools per consumer (like watertight compartments on a ship). One consumer can't exhaust ALL resources.
- **Timeout** — Never wait forever for a remote call response. ALWAYS set explicit timeouts.

**Monitoring requirements (mandated by Design for Failure):**

Since services can fail at any time, must detect and restore quickly.

Microservice apps emphasize **real-time monitoring** of TWO types:

1. **Architectural metrics:**
   - Requests per second per service
   - Database queries per second
   - Response latency percentiles (p50, p95, p99)
   - Error rates and types
   - Circuit breaker state changes

2. **Business metrics:**
   - Orders per minute
   - Transactions completed
   - Payments processed
   - Business KPIs in real-time

**Automated testing in production:**
The article mentions that microservice teams practice automated testing of services in production (beyond staging). Netflix exemplifies this. This type of testing is described as enough to give traditional ops teams "the kind of shivers usually preceding a week off work" — but it's essential for microservices at scale.

---

#### "Synchronous calls considered harmful" sidebar

Synchronous call chains create temporal coupling:
```
Client → Service A (sync) → Service B (sync) → Service C (sync)
```
If Service C is slow: B waits → A waits → Client waits → cascading slowdown.

Solutions in order of preference:
1. **Prefer asynchronous messaging** — Services communicate via events/messages without waiting
2. **Circuit Breakers** on all synchronous calls
3. **Explicit timeouts** on all outbound calls
4. **Bulkheads** to isolate resource pools per upstream service
5. **Compensating operations** for failures, not distributed transactions

---

### CHARACTERISTIC 9: Evolutionary Design

**Core idea:** Getting service boundaries right is HARD. Design must accommodate change, not assume perfection.

**The key component property (restatement):**
Independent replacement and upgradeability — design each service so it can be **rewritten without affecting its collaborators**.

**Microservice practitioners' mindset:**
> "Many microservice groups take this further by explicitly expecting many services to be scrapped rather than evolved in the longer term."

Discarding a service is success, not failure. It means the service was small enough to throw away.

**The evolutionary design danger unique to microservices:**

In in-process libraries: refactoring boundaries is relatively straightforward.
In services: changing service boundaries is EXPENSIVE because:
- Code movement crosses process boundaries
- Interface changes must be coordinated between all participants
- Backward compatibility layers must be added and maintained
- Testing becomes more complicated across service boundaries

**Implication for agents:** Initial service decomposition matters MORE in microservices than in monoliths. Wrong boundaries are much harder to fix later.

**Strangler Fig Pattern (referenced for evolutionary migration):**

Named after strangler fig trees that grow around a host tree until the host dies.

Steps for migrating a monolith to microservices:
1. Identify a seam in the monolith — a capability that can be extracted
2. Build the new microservice alongside the existing monolith
3. Route traffic for that capability to the new service (via proxy/API gateway)
4. The monolith still handles everything else
5. Gradually extract more capabilities as microservices
6. The monolith shrinks as microservices grow
7. When all capabilities migrated, decommission the monolith

**Anti-Corruption Layer in Strangler Fig:**
When the monolith calls a capability that's been extracted to a microservice, an Anti-Corruption Layer (ACL) translates between old and new interfaces. Prevents monolith from being polluted with new service interfaces.

---

## PART 4: ARE MICROSERVICES THE FUTURE?

**Fowler's honest assessment:**

Arguments FOR expecting microservices to be challenging:
1. Success depends on how well software fits into components
2. **It's hard to figure out exactly where component boundaries should lie**
3. When components are services with remote communications, refactoring is much harder than with libraries
4. Moving code across service boundaries is difficult
5. Interface changes require coordination between participants
6. Backward compatibility layers must be added
7. Testing becomes more complicated

**Fowler's later position (beyond the 2014 article, referenced in Resource Guide):**

> "Almost all the successful microservice stories have started with a monolith that got too big and was broken up. Almost all the cases where I've heard of a system that was built as a microservice system from scratch, it has ended up in serious trouble."

**Simon Brown (referenced):**
> "If you can't build a well-structured monolith, what makes you think you can build a well-structured set of microservices?"

**Recommended path:**
1. Build a well-structured monolith first
2. Identify capabilities that change at different rates, scale differently, or need different tech
3. Extract those capabilities incrementally as microservices (Strangler Fig pattern)
4. Maintain CI/CD and monitoring throughout the migration

---

## PART 5: MICROSERVICES TRADE-OFFS MASTER TABLE

### Advantages (when microservices are right)

| Advantage | Explanation |
|-----------|-------------|
| **Strong Module Boundaries** | Reinforces modular structure — particularly important for larger teams |
| **Independent Deployment** | Simple services easier to deploy; autonomous, less likely to cause system-wide failures when they go wrong |
| **Technology Diversity** | Mix languages, frameworks, and data-storage technologies per service |
| **Granular Scaling** | Scale only the services that need it, not the whole application |
| **Team Autonomy** | Teams own their service end-to-end ("you build, you run it") |
| **Smaller Codebase per Service** | Each service is easier to understand and reason about |
| **Replaceability** | Services can be rewritten or replaced without affecting the whole system |
| **Business Alignment** | Service = business capability = team = product |

### Costs (when microservices cause problems)

| Cost | Explanation |
|------|-------------|
| **Distribution** | Distributed systems are harder to program; remote calls are slow and always at risk of failure |
| **Eventual Consistency** | Strong consistency is extremely difficult for a distributed system; teams must manage eventual consistency |
| **Operational Complexity** | Need a mature operations team to manage many services being redeployed regularly |
| **Network Latency** | Remote calls add latency not present in in-process calls |
| **Distributed Tracing Complexity** | Debugging across service boundaries requires sophisticated tooling |
| **Service Contract Management** | Many service contracts to manage and version |
| **Testing Complexity** | Integration testing across services is more complex |
| **Data Management** | No shared transactions; compensating operations required; eventual consistency management |

---

## PART 6: PATTERNS AND CONCEPTS REFERENCED IN THE ARTICLE

| Pattern | Source | Purpose in Microservices Context |
|---------|--------|----------------------------------|
| **Circuit Breaker** | Michael Nygard, "Release It!" | Prevent cascading failures from unresponsive services |
| **Bulkhead** | Michael Nygard, "Release It!" | Isolate resource pools per consumer — one consumer can't exhaust all |
| **Timeout** | Michael Nygard, "Release It!" | Never wait forever for remote calls |
| **Tolerant Reader** | martinfowler.com/bliki/TolerantReader | Consumers ignore unknown response fields; allows independent evolution |
| **Consumer-Driven Contracts** | martinfowler.com/articles/consumerDrivenContracts | Consumer defines required contract; provider satisfies and verifies in CI |
| **Strangler Fig** | Fowler (2004), bliki/StranglerFigApplication | Gradually extract features from monolith into microservices |
| **Compensating Operations** | Distributed systems pattern | Undo completed steps when a later step fails; replaces rollback |
| **Bounded Context** | Domain-Driven Design (Eric Evans) | Each service owns its domain model within a defined boundary |
| **Two Pizza Team** | Amazon | Team size rule: ~12 people maximum per team |
| **Conway's Law** | Melvin Conway, 1968 | System design mirrors org communication structure |
| **Infrastructure as Code** | DevOps practice | Infrastructure defined in code; version controlled, testable |
| **Anti-Corruption Layer** | DDD (Evans) | Adapter/facade between old and new interfaces during migration |

---

## PART 7: ARCHITECTURE DECISION GUIDE FOR AI AGENTS

### Should I use Microservices?

```
DECISION START
│
├── Is this a new/greenfield project with an uncertain domain model?
│   └── YES → START WITH A MONOLITH. Extract services as domain becomes clear.
│
├── Is the team small (<8 people total)?
│   └── YES → Monolith first. Microservices operational overhead will dominate.
│
├── Does the team lack CI/CD, automated testing, container orchestration?
│   └── YES → Build those capabilities first. Without them, microservices = chaos.
│
├── Is the existing monolith getting too big and slow to change?
│   └── YES → Consider incremental extraction via Strangler Fig pattern.
│
├── Are different parts deployed by different autonomous teams?
│   └── YES → Microservices align with Conway's Law — good fit.
│
├── Do different parts need vastly different scaling characteristics?
│   └── YES → Microservices enable granular scaling — strong argument.
│
└── Does the team have mature operations, monitoring, and on-call capability?
    ├── YES → Prerequisites met. Microservices are viable.
    └── NO → Get those capabilities first.
```

### How to Split Services (Decomposition Strategy)

**WRONG — Split by technology layer:**
```
❌ frontend-service / backend-service / database-service
   (recreates UI team / logic team / DB team anti-pattern)
```

**RIGHT — Split by business capability:**
```
✅ customer-service / order-service / payment-service / inventory-service / notification-service
   (each owns UI piece + data + logic for its capability)
```

**Service boundary signals — when to extract a service:**
1. A capability changes at a different rate than the rest of the system
2. A capability needs to scale differently
3. A team wants autonomous ownership of a specific capability
4. A capability can be independently replaced without affecting others
5. A capability has clearly different data access patterns (justifies different DB)

### Communication Between Services

```
Is an immediate response required?
│
├── YES → HTTP request-response (REST)
│   ├── Design resource-based APIs (not RPC-style method calls)
│   ├── Use HTTP verbs correctly: GET, POST, PUT, PATCH, DELETE
│   ├── Use HTTP status codes correctly: 200, 201, 400, 404, 422, 500, 503
│   ├── APIs MUST be coarser-grained (not 1:1 mapping from in-process methods)
│   └── ALWAYS wrap calls in: Circuit Breaker + Timeout + Retry (with backoff)
│
└── NO → Asynchronous messaging (preferred for loose coupling)
    ├── Use a message broker (RabbitMQ, Kafka, etc.)
    ├── Broker is DUMB — routing only; no business logic in broker
    ├── ALL business logic in services (producers and consumers)
    └── Enables failure isolation and loose coupling
```

**NEVER build chatty synchronous call chains:**
```
❌ ServiceA → ServiceB → ServiceC → ServiceD (all synchronous)
   Problem: D slow → C waits → B waits → A waits → cascading timeout

✅ ServiceA publishes event → ServiceB, C, D react independently
   OR: ServiceA calls ServiceB with Circuit Breaker; CB wraps the risk
```

### Database Strategy per Service

**Rule (from article):** Each service manages its own database. No cross-service DB access.

**Options (most to least isolated):**
1. **Separate DB server per service** — strongest isolation, highest operational cost
2. **Separate schema per service on shared server** — medium isolation, lower cost (still some coupling at infrastructure level)
3. **Different DB technology per service (Polyglot Persistence)** — maximum flexibility for data model

**Always avoid:**
- Integration Database (shared DB with direct cross-service SQL access)
- Shared ORM models across services
- Cross-service foreign keys in the database
- One service calling another service's stored procedures

**Data consistency strategy:**
```
Traditional ACID across services → NOT available

Instead:
1. Design service boundaries to minimize cross-service transactions
2. For operations spanning services → Saga pattern:
   - Step 1 (ServiceA) → Step 2 (ServiceB) → Step 3 (ServiceC)
   - Each step has a compensating step
   - If Step 3 fails → run compensate-2, compensate-1
3. Accept eventual consistency explicitly
4. Use domain events to propagate state changes asynchronously
```

---

## PART 8: SERVICE DESIGN RULES — AGENT OPERATING INSTRUCTIONS

### Rules from the Article (non-negotiable)

1. **One business capability per service.** Not one layer. Not one technology. One business capability.

2. **Services must be independently deployable.** If deploying Service A requires touching Service B, there is coupling that violates the principle.

3. **Services own their data.** No service reads directly from another service's database. Data access goes through the owning service's API.

4. **APIs must be coarser-grained.** A service API call should do meaningful work. Do not map fine-grained internal method calls 1:1 to remote calls.

5. **Pipes are dumb.** Message brokers route only. Never put business logic in middleware, API gateways, or message brokers.

6. **Design for failure from day one.** Wrap ALL outbound service calls in Circuit Breakers. Set explicit timeouts. Plan compensating operations.

7. **Monitor business metrics, not just technical metrics.** Orders per minute, transactions completed, feature usage — alongside server health metrics.

8. **Teams are cross-functional.** A service team has frontend, backend, database, and ops skills. No handoffs between functional teams for one service.

9. **"You build, you run it."** The team that builds a service operates it in production, including on-call rotations.

10. **Evolutionary design means services will be replaced.** Plan for replacement, not eternal maintenance of the current design.

### Service Anti-Patterns (what the article explicitly warns against)

| Anti-Pattern | Why It's Wrong | Fix |
|-------------|----------------|-----|
| Shared database across services | Couples services at the data layer | Each service gets its own database |
| Chatty synchronous call chains | Cascading failures, high latency | Async messaging or redesigned coarser-grained APIs |
| Smart pipes / ESB | Business logic in middleware violates smart endpoints | Move logic into the services |
| Technology-layer boundaries (UI/logic/data services) | Violates Conway's Law alignment; recreates silos | Business capability boundaries |
| Distributed monolith | Services that must always deploy together | Redesign boundaries to eliminate coupling |
| Fine-grained RPC mapping | Chatty performance, high latency | Redesign as coarser-grained API |
| Starting microservices from scratch on a new project | High historical failure rate | Monolith first, then extract |
| No infrastructure automation | Manual deployment doesn't scale with many services | CI/CD pipelines required per service |
| Centralized governance/standards body | Inhibits change, one-size-fits-all tech | Decentralized governance, Tolerant Reader, Consumer-Driven Contracts |

---

## PART 9: VOCABULARY GLOSSARY

| Term | Definition (from article) |
|------|--------------------------|
| **Microservice** | Small service running in its own process, communicating with lightweight mechanisms, independently deployable, organized around a business capability |
| **Component** | A unit of software that is independently replaceable and upgradeable |
| **Library** | Component linked into a program, called via in-memory function calls |
| **Service (microservices context)** | Out-of-process component communicating via web service request or RPC |
| **Smart endpoints** | Services own their domain logic; intelligence lives in the service, not the infrastructure |
| **Dumb pipes** | Message infrastructure that only routes messages; no business logic in the pipe |
| **Polyglot Persistence** | Each service uses the database technology best suited to its needs |
| **Eventual Consistency** | Consistency achieved over time through compensating operations; not atomic distributed transactions |
| **Compensating Operations** | Operations that undo a completed step when a later step fails |
| **Bounded Context** | (DDD) Boundary within which a particular domain model applies; each service owns its context |
| **Consumer-Driven Contracts** | Consumers define required contract; providers satisfy it; contracts executed in CI |
| **Tolerant Reader** | Consumers only read needed fields; ignore unknown fields; enables independent evolution |
| **Circuit Breaker** | Wraps a remote call; trips when failure threshold reached; prevents cascading failure |
| **Strangler Fig** | Migration pattern; gradually extract monolith features into microservices |
| **Two Pizza Team** | Amazon's team size rule: no more than ~12 people |
| **Conway's Law** | System design mirrors organization's communication structure |
| **Infrastructure as Code** | Infrastructure defined in source code; version-controlled, testable, auditable |
| **Integration Database** | Shared database accessed directly by multiple services — an anti-pattern in microservices |
| **Anti-Corruption Layer** | Adapter/facade that translates between old and new interfaces during migration |

---

## PART 10: IMPLEMENTATION PREREQUISITES CHECKLIST

Before putting any microservice system into production, the following must be in place (referenced in article and Fowler's Resource Guide):

```
Infrastructure
□ Rapid provisioning — New servers/containers in minutes
□ Infrastructure as Code — All infrastructure defined in code, version controlled
□ Container orchestration — Kubernetes or equivalent
□ Service discovery — Services find each other dynamically (not hardcoded IPs)
□ API gateway or load balancing — Route external requests to appropriate services

CI/CD
□ CI/CD pipeline per service — Automated build, test, deploy for every service
□ Automated unit tests — Fast, in-process tests
□ Automated integration tests — Cross-service tests
□ Automated contract tests — Consumer-Driven Contracts in CI
□ One-click deployment to any environment

Monitoring and Observability
□ Distributed tracing — Trace requests across service boundaries (Jaeger, Zipkin)
□ Centralized log aggregation — All service logs in one place (ELK stack, etc.)
□ Health check endpoints per service — /health endpoint for automated checks
□ Real-time dashboards — Architectural AND business metrics visible
□ Automated alerting — Fires when services fail or degrade

Resilience
□ Circuit breakers on all outbound service calls
□ Explicit timeouts on all outbound calls
□ Bulkheads to isolate resource pools
□ Retry logic with exponential backoff
□ Runbooks for each service failure mode

Team
□ Cross-functional team per service (frontend + backend + DB + ops)
□ On-call rotation for each service team
□ "You build, you run it" operational model
```

**Fowler's explicit warning (from Resource Guide):**
> "You shouldn't start a new project with microservices. Even if you're sure your application will be big enough to make it worthwhile."

**The recommended path:**
1. Build a well-structured monolith
2. Identify capabilities with different change rates, scaling needs, or tech requirements
3. Extract those capabilities incrementally via Strangler Fig pattern
4. Maintain CI/CD and monitoring throughout migration

---

## PART 11: ARTICLE STRUCTURE FOR PRECISE REFERENCING

```
martinfowler.com/articles/microservices.html
│
├── Introduction — Monolith comparison, core definition
│   └── #top
│
├── 9 Characteristics
│   ├── Componentization via Services          → #ComponentizationViaServices
│   ├── Organized around Business Capabilities → #OrganizedAroundBusinessCapabilities
│   ├── Products not Projects                  → #ProductsNotProjects
│   ├── Smart endpoints and dumb pipes         → #SmartEndpointsAndDumbPipes
│   ├── Decentralized Governance               → #DecentralizedGovernance
│   ├── Decentralized Data Management          → #DecentralizedDataManagement
│   ├── Infrastructure Automation              → #InfrastructureAutomation
│   ├── Design for failure                     → #DesignForFailure
│   └── Evolutionary Design                    → #EvolutionaryDesign
│
├── Are Microservices the Future?              → #AreMicroservicesTheFuture
│
└── 7 Sidebars
    ├── How big is a microservice?             → #HowBigIsAMicroservice
    ├── Microservices and SOA                  → #MicroservicesAndSoa
    ├── Many languages, many options           → #ManyLanguagesManyOptions
    ├── Battle-tested standards                → #Battle-testedStandardsAndEnforcedStandards
    ├── Make it easy to do the right thing     → #MakeItEasyToDoTheRightThing
    ├── The circuit breaker                    → #TheCircuitBreakerAndProductionReadyCode
    └── Synchronous calls considered harmful   → #SynchronousCallsConsideredHarmful
```

---

*End of Reference — martinfowler.com/articles/microservices.html*  
*Source: Original article by James Lewis and Martin Fowler, 25 March 2014*  
*All 9 characteristics, 7 sidebars, all trade-offs, all referenced patterns documented.*  
*For AI agents: Cursor, Antigravity IDE, Claude Code*
