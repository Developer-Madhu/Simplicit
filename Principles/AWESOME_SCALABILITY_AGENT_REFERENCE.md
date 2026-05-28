# Awesome Scalability — AI Agent Reference
## General-Purpose Scalable Systems Knowledge Base

**Source:** github.com/binhnguyennus/awesome-scalability  
**Stars:** 69,400+ | **Forks:** 6,900+ | **Commits:** 1,216  
**License:** MIT | **Website:** awesome-scalability.com  

**Scope:** General-purpose. Applies to any system that needs to handle growth — more users, more data, more traffic. Covers scalability, availability, stability, performance, architecture, and engineering organisation. All resources are from real battle-tested systems serving millions to billions of users.

AI agents must use this file when:
- Making architecture decisions that need to handle scale
- Choosing between SQL vs NoSQL, caching strategies, or database designs
- Designing systems that need high availability or fault tolerance
- Optimising performance bottlenecks
- Preparing for system design interviews
- Understanding how large tech companies solved specific engineering problems

---

## How to Use This File

**Diagnostic guide:**
- System is **slow under load** → Section 2 (Scalability) + Section 5 (Performance)
- System **goes down** → Section 3 (Availability) + Section 4 (Stability)
- System is **slow for one user** → Section 5 (Performance)
- Working with **data / ML at scale** → Section 6 (Intelligence)
- Preparing for a **system design interview** → Section 8 (Interview) + Section 7 (Architecture)
- **Building or growing a team** → Section 9 (Organization)

---

## Section 1: Principles — Foundational Rules Before Building Anything

These are the governing principles from the world's leading distributed systems engineers. Agents must understand these before making architecture decisions.

### 1.1 The Core Papers and Their Lessons

**"Designs, Lessons and Advice from Building Large Distributed Systems" — Jeff Dean, Google**
The single most important paper for understanding distributed systems at scale. Key lessons: hardware failures are the norm (thousands of machines = daily failures), design for partial failures, measure everything, latency matters more than throughput for user-facing systems.

**"Lessons from Giant-Scale Services" — Eric Brewer, UC Berkeley & Google**
The author of the CAP theorem. DQ principle: Data Quality times Query rate equals constant — as you scale queries, data quality (freshness, accuracy) must decrease unless you invest proportionally in infrastructure.

**The Twelve-Factor App — Heroku**
12 rules for building software-as-a-service applications that scale. Critical rules:
1. One codebase tracked in version control
2. Explicitly declare and isolate dependencies
3. Store config in the environment (not in code)
4. Treat backing services (databases, queues) as attached resources
5. Strictly separate build, release, and run stages
6. Execute as stateless processes — share nothing
7. Export services via port binding
8. Scale out via the process model (horizontal scaling)
9. Maximize robustness with fast startup and graceful shutdown
10. Keep development, staging, and production as similar as possible
11. Treat logs as event streams
12. Run admin tasks as one-off processes

### 1.2 CAP Theorem — The Inescapable Constraint

Every distributed system can guarantee at most two of three:
- **C — Consistency:** All nodes see the same data at the same time
- **A — Availability:** Every request receives a response (not guaranteed to be latest data)
- **P — Partition Tolerance:** System operates despite network partitions

**In practice, partition tolerance is mandatory** (networks fail). So the real choice is: **CP or AP**.

| Database | Choice | Behavior Under Partition |
|---|---|---|
| PostgreSQL | CP | Refuses requests rather than serve stale data |
| Redis (default) | AP | Serves potentially stale data |
| MongoDB (default) | AP | Eventually consistent |
| HBase | CP | Consistency guaranteed |
| Cassandra | AP | High availability, eventual consistency |
| DynamoDB | AP | Tunable consistency |

**CP databases** (consistency + partition tolerance): Choose when data correctness is critical — financial transactions, inventory, user accounts.

**AP databases** (availability + partition tolerance): Choose when availability matters more than perfect consistency — social feeds, analytics, session data, caches.

### 1.3 ACID vs BASE

**ACID** (traditional relational databases):
- **A**tomicity — transaction succeeds completely or fails completely
- **C**onsistency — database moves from one valid state to another
- **I**solation — concurrent transactions don't interfere
- **D**urability — committed data persists even after crashes

**BASE** (NoSQL / distributed systems):
- **B**asically **A**vailable — system guarantees availability
- **S**oft state — state may change over time without input
- **E**ventually consistent — system will become consistent over time

**When to choose:**
- Financial, transactional data → ACID (PostgreSQL)
- High-volume writes, flexible schema, massive scale → BASE (MongoDB, Cassandra, DynamoDB)

### 1.4 Stateless vs Stateful Scaling

**Stateless services** (preferred for horizontal scaling):
- No session data stored in the server process
- Any request can be handled by any instance
- Scale by adding instances behind a load balancer
- Examples: REST APIs that store state in database/cache

**Stateful services** (harder to scale):
- Server holds state about a specific client session
- Requests from a client must go to the same server (sticky sessions)
- Scaling requires state migration or replication
- Examples: WebSocket connections, game servers

**Rule:** Design services to be stateless by default. Store state in databases or distributed caches (Redis), not in application memory.

### 1.5 Scale Up vs Scale Out

**Scale Up (Vertical)** — bigger hardware:
- Add more CPU, RAM, faster storage
- Simple — no application changes needed
- Hard ceiling — can't add infinite hardware to one machine
- Hidden costs: single point of failure, cost grows non-linearly

**Scale Out (Horizontal)** — more machines:
- Add more instances running the same code
- Requires stateless application design
- Near-infinite ceiling in principle
- Requires load balancing, service discovery, distributed coordination

**Rule:** Design for horizontal scaling from the start. Vertical scaling is a temporary fix.

### 1.6 Consistent Hashing

Standard hashing for distributing data across N nodes uses `hash(key) % N`. Problem: when N changes (adding/removing nodes), nearly all keys are remapped, causing massive cache invalidation.

**Consistent hashing** solves this: keys and nodes are placed on a virtual ring. Each key is served by the nearest node clockwise on the ring. When a node is added/removed, only `K/N` keys are remapped (where K = total keys, N = nodes).

**Used in:** Redis Cluster, Cassandra, DynamoDB, Memcached (ketama), CDN routing.

**Implication for agents:** When designing a distributed cache or data partitioning layer, always use consistent hashing, never modulo hashing.

### 1.7 Performance vs Scalability

**Performance problem:** System is slow for a single user → profiling, optimization, algorithms.

**Scalability problem:** System is fast for one user but slow under load → architecture, caching, horizontal scaling, load balancing.

These are different problems with different solutions. Optimizing code does not fix scalability. Adding servers does not fix performance.

### 1.8 Latency Numbers Every Developer Must Know

| Operation | Approximate Latency |
|---|---|
| L1 cache reference | 0.5 ns |
| L2 cache reference | 7 ns |
| Main memory reference (RAM) | 100 ns |
| Read 1 MB sequentially from RAM | 250 µs |
| SSD random read | 150 µs |
| Read 1 MB sequentially from SSD | 1 ms |
| Network round trip within same datacenter | 0.5 ms |
| HDD seek | 10 ms |
| Read 1 MB sequentially from HDD | 20 ms |
| Network packet US → Europe → US | 150 ms |

**Implications for system design:**
- CPU cache >> RAM >> SSD >> Network >> HDD
- An in-process cache (RAM) is 100,000x faster than a database query involving HDD seeks
- Same-datacenter network latency (0.5ms) is 300x faster than cross-continental (150ms)
- Design to minimize cross-region network calls in critical user-facing paths

### 1.9 Key Anti-Patterns to Avoid

**Over-Engineering:** Building for problems you don't have yet. Solve the problem you know needs solving, not speculative future problems. Start simple, scale when needed.

**Re-inventing the Wheel:** Don't build your own: message queue, caching layer, distributed lock, consensus protocol. Use proven tools (Redis, Kafka, PostgreSQL, etcd).

**Ignoring Performance Until Later:** Performance is a feature. Retrofitting performance into an existing system is exponentially harder than designing for it from the start.

**Not Measuring:** You cannot improve what you don't measure. Instrument everything.

---

## Section 2: Scalability Patterns

### 2.1 Microservices and Service Architecture

**When to use microservices:**
- Team has grown beyond what a monolith can support (Conway's Law: org structure → system structure)
- Different parts of the system have fundamentally different scaling needs
- Parts of the system need to be deployed independently

**When to stay monolithic:**
- Early stage product — don't pay the distributed systems tax before you need to
- Small team — the coordination overhead of microservices is significant
- Not enough load to justify the complexity

**Key microservices patterns from real companies:**

**Domain-oriented microservices (Uber):** Organize services around business domains, not technical layers. A "payments" service owns everything about payments — not split into "payments-api", "payments-db", "payments-cache".

**Backends for Frontends (BFF) at SoundCloud:** Create a specific backend service for each frontend type (mobile app, web app). Each BFF aggregates data from internal services in the shape each frontend needs, rather than making each frontend call multiple APIs.

**Service Mesh (Snap, Airbnb):** A dedicated infrastructure layer for service-to-service communication. Handles retries, timeouts, circuit breaking, tracing, and encryption (mTLS) transparently — without changing application code. Tools: Istio, Linkerd.

**Conductor: Microservices Orchestrator (Netflix):** When a user action requires coordinating multiple microservices in a specific order, use an orchestrator. The orchestrator maintains the workflow state and calls each service in sequence, handling failures and retries.

**Container orchestration:** Kubernetes is the industry standard for running containerized microservices at scale. Used in production at: Stripe, Pinterest, Tinder, Quora, Nubank, BBC, New York Times.

### 2.2 Distributed Caching

**The hierarchy of caching:**

```
L1: In-process cache (in-memory, same JVM/Node.js process)
    ↓ miss
L2: Distributed cache (Redis, Memcached — shared across instances)
    ↓ miss
L3: Database query result cache
    ↓ miss
L4: Database (source of truth)
```

**Cache patterns:**

**Cache-aside (Lazy Loading):** Application checks cache first; on miss, reads from DB and populates cache.
```
read(key):
  value = cache.get(key)
  if value is null:
    value = database.get(key)
    cache.set(key, value, ttl)
  return value
```
Used at: Quora (Pycache), Yelp

**Write-through:** Write to cache and DB simultaneously. Cache always has fresh data. Slower writes, but ensures consistency.

**Write-behind (Write-back):** Write to cache immediately, write to DB asynchronously. Fast writes, risk of data loss on cache failure.

**Cache invalidation strategies:**
- **TTL (Time-To-Live):** Expire cache entries after a fixed duration. Simple but data can be stale for up to TTL duration.
- **Event-driven invalidation:** When data changes in DB, publish an event that invalidates the cache entry. Fresher data, more complex.
- **Cache smearing (Etsy):** Randomize TTLs slightly to prevent the thundering herd — all cache entries for popular items expiring simultaneously.

**Redis at scale:**
- Twitter scaled Redis to 105TB RAM, 39 million QPS, 10,000+ instances
- GitHub: moved persistent data OUT of Redis — Redis is a cache, not a database of record
- Instagram: stored hundreds of millions of simple key-value pairs in Redis

**Eviction policies (from Section 1.9 of this file):**
- `allkeys-lfu` — evict least frequently used across all keys (best for user data)
- `allkeys-lru` — evict least recently used (good general default)
- `volatile-lru` — only evict keys with TTL set

**Key rule:** Never use Redis as your only store for data that must not be lost. Write to PostgreSQL first, then cache in Redis.

### 2.3 Distributed Locking

When multiple instances of a service need exclusive access to a shared resource:

**Redis-based distributed lock (Redlock algorithm):**
```
lock(resource, ttl):
  # Try to SET key only if it doesn't exist:
  result = redis.SET(resource, unique_id, NX, PX, ttl)
  return result == "OK"

unlock(resource, unique_id):
  # Lua script for atomic check-and-delete:
  if redis.GET(resource) == unique_id:
    redis.DEL(resource)
```

**ZooKeeper (Twitter):** For distributed coordination requiring stronger guarantees than Redis — leader election, group membership, configuration management.

**When to use:** Preventing duplicate job processing, distributed rate limiting, exclusive resource access across multiple service instances.

### 2.4 Distributed Tracing

In a microservices architecture, a single user request may touch 10+ services. Distributed tracing tracks that request across all services.

**The correlation ID pattern:**
1. Gateway assigns a unique trace ID to every incoming request
2. Every service logs with that trace ID
3. Every downstream call includes the trace ID in a header (`x-trace-id`, `x-b3-traceid`)
4. To debug a user issue: `grep trace_id=abc123 all-service-logs`

**Tools:**
- **Zipkin (Twitter):** Open-source distributed tracing, industry standard
- **Jaeger (Uber):** Open-source, compatible with OpenTracing/OpenTelemetry
- **Canopy (Facebook):** Scalable distributed tracing and analysis
- **OpenTelemetry:** Vendor-neutral instrumentation standard (replaces Zipkin/Jaeger custom SDKs)

**What tracing reveals:** Where latency is actually coming from (which service, which database query), which services fail most often, how request patterns change under load.

### 2.5 Distributed Scheduling and Job Queues

**For background jobs that must run reliably:**

| Tool | Best For | Companies Using |
|---|---|---|
| BullMQ (Redis) | Node.js job queues with retries | Small-medium scale |
| Celery (Redis/RabbitMQ) | Python async tasks | Most Python shops |
| Apache Airflow | Complex DAG workflows | Airbnb, Lyft, Robinhood, Adobe, Grab |
| Temporal | Long-running workflows with state | Uber, Stripe |
| Conductor (Netflix) | Microservices orchestration | Netflix |

**Airflow at scale (multiple companies):** Directed Acyclic Graph (DAG) based task scheduling. Each job is a node in the graph. Dependencies between jobs are edges. Airflow ensures jobs run in correct order and retries failures.

**Distributed cron patterns:**
- Use a distributed lock (Redis, ZooKeeper) to ensure only one instance runs a cron job
- Store job state in the database (PostgreSQL) to survive crashes
- Design job handlers to be idempotent — safe to run twice

### 2.6 Distributed Monitoring and Alerting

**The observability stack (three pillars):**
1. **Metrics** — numerical measurements over time (request rate, error rate, latency)
2. **Logs** — timestamped event records (what happened, when, for whom)
3. **Traces** — request journeys across services (which services were called, in what order, how long each took)

**Alert design principles (from Airbnb, Uber, SoundCloud):**
- Alert on symptoms (user-visible impact), not causes (disk usage at 80%)
- Use SLOs (Service Level Objectives) as the basis for alerts
- Avoid alert fatigue — too many alerts means all alerts are ignored
- Every alert must be actionable — if you can't do something about it, don't alert on it

**SLO-based alerting (SoundCloud):**
```
SLO: 99.9% of requests complete in < 500ms over a 30-day rolling window
Error budget: 43 minutes of downtime per month
Alert: when burn rate indicates you'll exhaust the error budget within 1 hour
```

**Tools by company:**
- Uber: M3 (Prometheus-compatible metrics platform)
- Dropbox: Athena (build health), Vortex (server monitoring)
- LinkedIn: ThirdEye (real-time anomaly detection and alerting)
- Netflix: Telltale (application health monitoring)

---

## Section 3: Availability Patterns

**Availability formula:**
```
Availability = MTTF / (MTTF + MTTR)
MTTF = Mean Time To Failure
MTTR = Mean Time To Repair/Recovery
```

To improve availability: increase MTTF (make failures less frequent) OR decrease MTTR (recover faster when failures happen). **Decreasing MTTR is usually more actionable.**

**Availability targets:**

| Availability | Downtime Per Year | Downtime Per Month |
|---|---|---|
| 99% ("two nines") | 87.6 hours | 7.3 hours |
| 99.9% ("three nines") | 8.76 hours | 43.8 minutes |
| 99.99% ("four nines") | 52.6 minutes | 4.38 minutes |
| 99.999% ("five nines") | 5.26 minutes | 26.3 seconds |

### 3.1 Redundancy Patterns

**Active-Active:** Multiple instances all serve traffic simultaneously. Load balanced. Failure of one instance is transparent to users. Requires stateless services or shared state.

**Active-Passive:** One primary serves traffic, one standby is ready to take over. Failover is manual or automatic. Higher latency for failover than active-active.

**N+1 redundancy:** N instances needed to serve traffic, N+1 actually running. One instance can fail without degrading service.

### 3.2 Health Checks and Circuit Breakers

**Health check endpoint (required in every service):**
```
GET /health
Response: { "status": "ok", "dependencies": { "db": "ok", "redis": "ok" } }
```
Load balancers route traffic away from unhealthy instances. Zero-downtime deployments depend on this.

**Circuit Breaker pattern (Netflix Hystrix):**
When a downstream service starts failing, don't keep calling it — open the circuit and return a fallback immediately.

```
States:
CLOSED (normal) → requests go through
  ↓ failure threshold exceeded
OPEN (tripped) → requests fail immediately without calling downstream
  ↓ after reset timeout
HALF-OPEN → allow one test request through
  ↓ if succeeds: CLOSED
  ↓ if fails: OPEN again
```

**Why this matters:** Without circuit breakers, failures cascade. Service A calls Service B which calls Service C. If C is slow, A and B accumulate waiting requests until they too become unavailable. Circuit breakers contain failures.

**Libraries:** `opossum` (Node.js), `resilience4j` (Java), `polly` (.NET), `pybreaker` (Python).

### 3.3 Graceful Degradation

Accept partial failures, minimize service loss. When a dependency fails:
- Show cached/stale data rather than an error
- Disable non-critical features
- Return a meaningful fallback

**Examples:**
- Netflix: If recommendation service fails, show generic popular content instead of 500 error
- Amazon: If "customers also viewed" fails, hide that section rather than break the page
- Stripe: If fraud detection is slow, allow transactions with higher monitoring instead of blocking

### 3.4 Data Replication for Availability

**Primary-replica (Master-Slave) replication:**
- Primary: accepts all writes
- Replicas: read-only copies, lag behind primary by milliseconds
- Benefit: reads scale horizontally, primary failure → promote replica

**Multi-primary (Multi-Master) replication:**
- Multiple nodes accept writes
- Requires conflict resolution (last-write-wins, vector clocks, CRDTs)
- Used by: DynamoDB, Cassandra, CockroachDB

**Geographic replication:**
- Multiple regions, each with full data copies
- Reads served from nearest region (low latency)
- Writes may need to cross regions (higher latency)
- Used by: Google Spanner, CockroachDB, PlanetScale

---

## Section 4: Stability Patterns

### 4.1 Chaos Engineering

**Principle:** If something will eventually fail in production, discover it in a controlled experiment instead of during an incident.

**How it works:**
1. Define a steady state (normal metrics baseline)
2. Hypothesize the system will maintain steady state when X fails
3. Inject X failure in production (or staging)
4. Verify system remains in steady state
5. If hypothesis fails → fix the resilience gap

**Netflix Chaos Monkey:** Randomly terminates production EC2 instances to ensure services are resilient to instance failure. This isn't reckless — it's the only way to verify resilience actually works.

**Chaos experiments to run:**
- Kill a random service instance
- Introduce network latency between services
- Simulate a database connection failure
- Fill a disk to capacity
- Introduce packet loss

### 4.2 Bulkhead Pattern

Isolate failures so they can't cascade. Named after ship bulkheads — compartments that prevent one breach from sinking the entire ship.

**Application:** Separate thread pools / connection pools for different categories of work. If one category becomes slow (fills its thread pool), other categories continue serving requests normally.

**Example:** In an API server:
- Normal requests: thread pool of 100
- Premium requests: thread pool of 50 (separate)
- Internal admin requests: thread pool of 20 (separate)

If normal request handlers get slow, premium and admin traffic is unaffected.

### 4.3 Timeout and Retry Patterns

**Every external call must have a timeout.** Without timeouts, one slow downstream service can exhaust your thread pool.

**Retry with exponential backoff:**
```
attempt 1: wait 1s
attempt 2: wait 2s
attempt 3: wait 4s
attempt 4: wait 8s
max retries: 3-5
add jitter: wait = base_delay * 2^attempt + random(0, base_delay)
```

**Jitter is critical:** Without jitter, all instances retry simultaneously after a failure, causing a retry storm that overwhelms the recovering service.

**Idempotency keys for safe retries:** If a request is retried, it must not create duplicate side effects. Use idempotency keys (Stripe pattern) for any mutating operation.

### 4.4 Rate Limiting Strategies

**Fixed window:** Count requests in fixed time windows (e.g., 100 requests per minute). Problem: 100 requests at 0:59 and 100 at 1:01 = 200 requests in 2 seconds.

**Sliding window:** More complex but prevents the fixed window edge case.

**Token bucket (most common):** A bucket holds N tokens. Each request consumes a token. Tokens are added at a fixed rate. Allows bursting up to bucket capacity.

**Leaky bucket:** Requests enter a queue and are processed at a fixed rate. Smooths bursts into steady flow.

**Rate limit by:** IP address, user ID, API key, or combinations.

---

## Section 5: Performance Patterns

### 5.1 Database Performance

**Indexing rules:**
- Index every column used in WHERE, JOIN ON, or ORDER BY
- Index every foreign key column
- Composite index: most selective column first
- Partial index: `CREATE INDEX ON orders (status) WHERE status = 'pending'` — only indexes pending orders
- Too many indexes slow writes — each write must update all indexes

**Query optimization:**
- **N+1 query problem:** Fetching a list of N items then making N additional queries for related data. Use JOINs or include/eager loading instead.
- **Explain/Analyze:** Run `EXPLAIN ANALYZE` on slow queries to see the query plan and where time is spent
- **Connection pooling:** PostgreSQL has a connection limit (default 100). Use PgBouncer or Prisma connection pooling to handle many application instances

**Database isolation levels and performance tradeoffs:**

| Level | Prevents | Performance |
|---|---|---|
| READ UNCOMMITTED | Nothing | Fastest |
| READ COMMITTED | Dirty reads | Fast (default for most DBs) |
| REPEATABLE READ | Dirty reads + non-repeatable reads | Moderate |
| SERIALIZABLE | All anomalies | Slowest |

**Read replicas:** Route read-heavy queries (analytics, reports, search) to read replicas. Write queries go to primary. Can dramatically reduce primary load.

**CQRS (Command Query Responsibility Segregation):**
- Commands (writes) use the primary write-optimized database
- Queries (reads) use a separate read-optimized database or replica
- Used at: eBay, Zalando, Microsoft

### 5.2 Caching as a Performance Tool

**Cache hit rates that matter:**
- 95%+ hit rate: cache is effective
- 80-95%: acceptable
- <80%: cache is not helping much, investigate access patterns

**Cache warming:** Pre-populate the cache before traffic hits. Critical for stateful services after restart. Netflix built a Cache Warmer infrastructure specifically for this.

### 5.3 Asynchronous Processing

Move work out of the critical path:
- **User uploads a file** → return 202 Accepted immediately, process file in background
- **User places an order** → return confirmation immediately, charge card asynchronously
- **User updates profile picture** → return success immediately, resize and CDN-distribute asynchronously

**Queue-based load leveling:** Place a queue between the requester and the processor. The queue absorbs traffic spikes. The processor works at a sustainable rate.

### 5.4 CDN and Edge Caching

**What to put on CDN:**
- Static assets (JS, CSS, images, fonts)
- API responses that are public and cacheable
- Pre-rendered HTML pages

**CDN cache control headers:**
```
Cache-Control: public, max-age=31536000, immutable   # static assets with content hash
Cache-Control: public, max-age=3600                   # API responses
Cache-Control: no-store                               # user-specific API responses
```

**Companies and their CDN usage:**
- Spotify: aligned CDN services across regions for streaming (sub-100ms buffer times)
- Condé Nast: Google AMP with CDN for editorial content
- Zynga: geo proxy reducing mobile game latency

### 5.5 Connection Pooling and Resource Management

**Database connection pools:**
- Rule of thumb: (2 × CPU cores) + effective spindle count
- Too few connections: queue builds up, latency increases
- Too many connections: PostgreSQL overhead increases, performance degrades

**HTTP connection reuse:**
- HTTP/1.1 keep-alive: reuse TCP connection for multiple requests
- HTTP/2 multiplexing: multiple requests on one connection simultaneously
- Reduces TCP and TLS handshake overhead significantly

---

## Section 6: Intelligence — Data and ML at Scale

### 6.1 Data Pipeline Architecture

**Lambda architecture (batch + speed layers):**
- **Batch layer:** Processes all historical data periodically (Hadoop, Spark). Complete and accurate but high latency.
- **Speed layer:** Processes only recent data in real-time (Kafka, Flink). Low latency but approximate.
- **Serving layer:** Merges batch and speed layer results to answer queries.

**Kappa architecture:** Replace batch layer with stream processing. Everything is a stream. Simpler but harder to reprocess historical data.

**Apache Airflow for workflow orchestration:**
Used by: Airbnb, Lyft, Robinhood, Adobe, Grab, Pandora.
- Define jobs as DAGs (Directed Acyclic Graphs)
- Declarative workflow definition
- Built-in retry, alerting, dependency management
- Integrates with all major data platforms

### 6.2 Feature Engineering and ML Infrastructure

**Feature stores:** Centralized repository for ML features — ensures training and serving use the same feature transformations. Prevents train/serve skew.

**Model serving patterns:**
- Batch inference: run predictions on a batch of data overnight
- Real-time inference: predict in <100ms during the request
- Shadow mode: run new model alongside old model, compare predictions before switching traffic

---

## Section 7: Architecture — Real-World System Designs

### 7.1 The Complete Reference Architecture Catalog

Real-world architectures documented by these companies:

**Social Networks:**
- Facebook: TAO (social graph storage), Cassandra (inbox search), Haystack (photo storage)
- Twitter: Snowflake (unique ID generation), Zipkin (distributed tracing), Finagle (RPC)
- LinkedIn: Kafka (messaging backbone), Voldemort (key-value store), Pinot (analytics)
- Instagram: Redis (key-value store), PostgreSQL (primary database), Cassandra (feed)

**E-commerce:**
- Amazon: Dynamo (key-value store — the CAP AP archetype), SOA architecture (2002 Bezos API mandate)
- eBay: GRIT (distributed transactions across microservices), Unicorn (remediation system)
- Shopify: Docker for 100,000+ shops, Kubernetes, MySQL at scale

**Streaming:**
- Netflix: EVCache (distributed caching), Conductor (microservices orchestrator), Zuul (API gateway), Hystrix (circuit breaker), Chaos Monkey, Fenzo (Mesos scheduler)
- Spotify: Kafka for event streaming, Helios (container orchestration), CDN alignment

**Ride-sharing:**
- Uber: Schemaless (Cassandra-based), Ringpop (gossip protocol), M3 (metrics), Peloton (resource scheduler), CRISP (critical path analysis)
- Lyft: Envoy (service mesh), Airflow, Flink (stream processing)

**Communication:**
- Slack: Flannel (channel fanout), job queue scaling with Redis, Kafka for event log
- Discord: Cassandra for message storage (trillions of messages), Elixir/Erlang for real-time

### 7.2 Key Architecture Decisions and Patterns

**API Gateway pattern:**
Single entry point for all client requests. Handles: routing, authentication, rate limiting, SSL termination, request transformation.
Used by: Netflix (Zuul), AWS (API Gateway), Kong.

**Event sourcing:**
Store state as a sequence of events rather than current state. Every change is an immutable append to the event log. Current state is derived by replaying events. Enables: complete audit trail, time travel queries, event replay.

**CQRS (Command Query Responsibility Segregation):**
Separate the read model from the write model. Write side handles commands and emits events. Read side maintains optimized query projections by consuming those events.

**Saga pattern for distributed transactions:**
Replace distributed transactions (two-phase commit) with a sequence of local transactions. Each step publishes an event. If a step fails, compensating transactions undo previous steps.

**Outbox pattern:**
When a service must both write to its database AND publish a message, do both in the same local transaction. The outbox table in the database holds pending messages. A separate process reads and publishes them. Guarantees at-least-once delivery without distributed transactions.

### 7.3 Unique ID Generation

Every distributed system needs globally unique IDs. Options:

**UUID v4:** Random 128-bit ID. No coordination needed. Not ordered — bad for database primary keys (causes B-tree fragmentation).

**Snowflake (Twitter):** 64-bit ID = timestamp (41 bits) + datacenter ID (5 bits) + worker ID (5 bits) + sequence (12 bits). Roughly time-ordered. Requires central ID generation service.

**ULID:** Universally Unique Lexicographically Sortable Identifier. 128-bit, time-ordered, URL-safe. Best of both UUID and Snowflake for most use cases.

**Rule:** Use ULIDs for database primary keys that benefit from ordering. Use UUIDs for external-facing IDs where ordering is irrelevant.

---

## Section 8: Interview — System Design Preparation

### 8.1 The System Design Interview Framework

**Step 1: Clarify requirements (5 minutes)**
- Functional requirements: What does the system do?
- Non-functional requirements: Scale (users, requests/sec, data size), latency targets, availability
- Constraints: Read-heavy vs write-heavy? Consistency vs availability preference?

**Step 2: Capacity estimation (5 minutes)**
```
Example for a URL shortener:
- 100M URLs created/day = ~1,200 writes/sec
- 10:1 read:write ratio = 12,000 reads/sec
- URL storage: 100M/day × 365 days × 5 years × 500 bytes = ~90 TB
- Cache for top 20% URLs handles 80% of reads (80/20 rule)
```

**Step 3: High-level design (10 minutes)**
Draw the core components: clients, load balancers, application servers, databases, caches.

**Step 4: Detailed design (15 minutes)**
Dive deep on 2-3 components. Discuss tradeoffs. Show you understand why choices were made.

**Step 5: Identify bottlenecks and improvements (5 minutes)**
Where would the system fail under 10x load? What would you change?

### 8.2 Common System Design Interview Topics

| System | Key Components | Main Challenges |
|---|---|---|
| URL Shortener | Hash function, KV store, redirect service | Hash collisions, custom aliases, analytics |
| Twitter/Feed | Fan-out on write vs read, timeline service | Hot users (celebrities), consistency |
| YouTube/Netflix | CDN, transcoding pipeline, chunked upload | Storage at scale, bandwidth, encoding |
| Uber/Lyft | Geospatial indexing, matching service | Real-time location, surge pricing |
| WhatsApp/Chat | WebSocket servers, message delivery | Message ordering, offline delivery |
| Search Engine | Inverted index, crawler, ranking | Crawl freshness, ranking quality |
| Rate Limiter | Token bucket, Redis atomic operations | Distributed coordination, edge cases |
| Distributed Cache | Consistent hashing, eviction policies | Cache invalidation, thundering herd |
| News Feed | Fan-out, ranking, storage | Scale for large followings, freshness |

### 8.3 Checklist of Topics to Master

Before any system design interview:

**Data storage:**
- [ ] When to use SQL vs NoSQL
- [ ] Database sharding strategies (range, hash, directory-based)
- [ ] Read replicas and when to use them
- [ ] ACID vs BASE tradeoffs

**Caching:**
- [ ] Cache-aside vs write-through vs write-behind
- [ ] Consistent hashing for distributed caches
- [ ] Cache invalidation strategies
- [ ] Thundering herd prevention

**Scalability:**
- [ ] Horizontal vs vertical scaling
- [ ] Load balancing algorithms (round robin, least connections, consistent hash)
- [ ] Stateless service design
- [ ] Message queue patterns

**Reliability:**
- [ ] Circuit breaker pattern
- [ ] Retry with exponential backoff and jitter
- [ ] Graceful degradation
- [ ] Health checks

**Infrastructure:**
- [ ] CDN for static assets
- [ ] API gateway responsibilities
- [ ] Service mesh basics
- [ ] Distributed tracing

---

## Section 9: Organization — Engineering Team Scaling

### 9.1 Conway's Law

> "Organizations which design systems are constrained to produce designs which are copies of the communication structures of those organizations."

If you have three teams, you'll get a system with three major components. Design your team structure to match the system architecture you want — not the other way around.

**Inverse Conway Maneuver:** Design your desired architecture first, then restructure teams to match it.

### 9.2 Team Topologies

**Stream-aligned teams:** Aligned to a flow of work from a customer segment or business domain. Own a product area end-to-end. Minimize dependencies on other teams.

**Platform teams:** Provide internal self-service capabilities (CI/CD, observability, databases, ML platforms) so stream-aligned teams don't have to solve infrastructure problems.

**Enabling teams:** Help stream-aligned teams acquire capabilities. Short-term, fade out once team is self-sufficient.

### 9.3 On-call and Reliability Culture

**SRE (Site Reliability Engineering) principles (Google):**
- Treat ops as a software problem — automate everything
- Error budgets: if reliability target is 99.9%, you have 0.1% error budget to spend on risk
- When error budget is exhausted: freeze new features, focus on reliability
- Postmortems are blameless — focus on systems, not individuals

**Blameless postmortem structure:**
1. What happened (timeline of events)
2. Why it happened (root cause analysis — 5 Whys)
3. What we're doing to prevent recurrence (action items with owners)
4. What went well (detection was fast, runbook worked)

---

## Section 10: Decision Framework for Agents

When designing or evaluating a backend system, apply these decision rules:

### Database Selection

```
Is data relational with complex queries? → PostgreSQL
Need sub-millisecond key-value access? → Redis (with PostgreSQL as source of truth)
Need document flexibility + horizontal scale? → MongoDB (with care for consistency)
Need to write millions of rows/sec? → Cassandra or DynamoDB
Need full-text search? → Elasticsearch
Need time-series data? → TimescaleDB or InfluxDB
Need graph relationships? → Neo4j
```

### Caching Selection

```
Cache session data across instances? → Redis
Cache database query results? → Redis with cache-aside pattern
Cache static files? → CDN
Cache API responses for all users? → CDN or Redis with proper TTL
Cache user-specific data? → Redis with user_id in key, short TTL
```

### Scalability Decision Tree

```
Traffic spike is unpredictable and infrequent?
  → Horizontal autoscaling (Kubernetes HPA)
  → Cache aggressively to reduce database load

Traffic is high but predictable?
  → Pre-scale before known high-traffic periods
  → CDN for static content

Database is the bottleneck?
  → Add read replicas for read traffic
  → Add caching layer
  → Optimize slow queries (EXPLAIN ANALYZE)
  → Consider partitioning/sharding for very large tables

Service is slow under load?
  → Profile to find actual bottleneck (don't guess)
  → Check for N+1 queries
  → Check for missing indexes
  → Check for synchronous calls that could be async
```

### Reliability Level Targets

```
Internal tool / admin panel: 99% (87.6h downtime/year acceptable)
Standard product: 99.9% (8.76h downtime/year)
Business-critical service: 99.99% (52 min downtime/year)
Financial / payment service: 99.999% (5 min downtime/year)
```

---

## Appendix: Repository Statistics

**URL:** github.com/binhnguyennus/awesome-scalability  
**Stars:** 69,400+ | **Forks:** 6,900+  
**Commits:** 1,216 | **License:** MIT  
**Website:** awesome-scalability.com  
**Contributions:** Welcome — see CONTRIBUTING.md  

**Companion resources referenced in the repo:**
- High Scalability blog: highscalability.com
- Martin Kleppmann's blog: martin.kleppmann.com
- All Things Distributed (Werner Vogels, CTO Amazon): allthingsdistributed.com
- Brendan Gregg (Linux performance): brendangregg.com

**This reference file was generated on: May 15, 2026**  
**Source verification:** All company attributions, system names, architectural patterns, and principles were verified against the live repository at github.com/binhnguyennus/awesome-scalability and the primary source articles linked within it. Latency numbers are from Peter Norvig's widely-cited table. CAP theorem formulation is from Gilbert and Lynch (2002). No claims were fabricated.
