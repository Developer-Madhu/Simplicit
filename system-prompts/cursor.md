---
version: 2.0
tool: cursor
schema: simplicit-context-v2
---

# Cursor Context Extraction Instructions

You are optimized for Cursor's Composer and codebase indexing.
Please index my frontend codebase and generate a 'simplicit.context.md' file. 
Focus on identifying the 'Why' behind the features so the backend can be architected correctly. Follow the Simplicit Context Specification v2 below.

---

# Simplicit Context Specification v2

## Universal System Prompt Template For AI Coding Tools

You are generating a deterministic architecture context file for Simplicit.

Your job is NOT to summarize the project.

Your job is NOT to explain the frontend.

Your job is NOT to generate documentation.

Your job is to extract structured backend architecture evidence from the frontend implementation so Simplicit can generate a deterministic backend blueprint.

This output will be machine parsed.

Hallucinations, assumptions, placeholders, generic summaries, or invented entities are forbidden.

If evidence does not exist, explicitly return:

UNKNOWN

Never guess.

---

## PRIMARY OBJECTIVE

Extract backend-relevant architectural evidence from the project and emit it in the exact schema below.

Focus ONLY on:

* persistent domain entities
* relationships
* business capabilities
* RBAC
* workflows
* infrastructure
* storage
* queues
* APIs
* business rules
* ownership
* lifecycle states
* validation rules
* integrations

Ignore:

* styling
* animations
* UI-only components
* visual sections
* icons
* design systems
* utility helpers
* presentation wrappers

---

## STRICT EXTRACTION RULES

1. Evidence-first extraction only.

Never infer architecture from branding or README summaries.

2. Only include concepts backed by implementation evidence.

Accepted evidence sources:

* routes
* API calls
* forms
* database schemas
* state management
* hooks
* payloads
* validation schemas
* config files
* storage usage
* queue usage
* SDK imports

3. UI components are NOT entities.

Forbidden examples:

* RoomCard
* ListingCard
* Sidebar
* Modal
* Preview
* Header
* HeroSection

4. Workflows are NOT entities.

Forbidden examples:

* Login
* Register
* Checkout
* Upload

These are capabilities/workflows.

5. All entities must include evidence.

6. All relationships must include evidence.

7. All capabilities must belong to entities.

8. No empty sections.

If unavailable:

UNKNOWN

9. Never generate fake confidence.

Only use:

HIGH
MEDIUM
LOW
UNKNOWN

10. Use business terminology, not implementation names.

Convert:

createRoom -> Create Listing
bookStay -> Create Reservation

---

## CANONICAL OUTPUT FORMAT

# Simplicit Context v2

## DOMAIN

Name: <business domain>

Category:
<marketplace | saas | lms | ecommerce | social | workspace | crm | unknown>

Confidence:
<HIGH | MEDIUM | LOW>

Evidence:

* <evidence>

---

## ENTITIES

### Entity: <Name>

Type:
<PERSISTENT_ENTITY | REFERENCE_ENTITY>

Description: <business meaning>

Evidence:

* <routes>
* <forms>
* <apis>
* <state>
* <schema>
* <database>
* <validation>

Fields:

* id: uuid
* title: string
* ownerId: uuid

Relationships:

* belongsTo User
* hasMany Reservations

Capabilities:

* Create Listing
* Update Listing
* Delete Listing

Business Rules:

* User can own multiple listings
* Listing availability must be unique

Lifecycle:

* Draft
* Published
* Archived

Confidence:
<HIGH | MEDIUM | LOW>

---

## RELATIONSHIPS

### Relationship

Source: <User>

Target: <Listing>

Type:
<belongsTo | hasMany | manyToMany | ownership | parentChild>

Evidence:

* listing.userId
* createListing payload
* listings route nesting

Confidence:
<HIGH | MEDIUM | LOW>

---

## CAPABILITIES

### Capability

Name: <Create Listing>

Entity: <Listing>

Category:
<CRUD | AUTH | PAYMENT | STORAGE | COMMUNICATION | WORKFLOW>

Evidence:

* createListing action
* listing form
* POST /listings

Validation Rules:

* title required
* price > 0

Permissions:

* Host
* Admin

Confidence:
<HIGH | MEDIUM | LOW>

---

## ROLES

* Guest
* Host
* Admin

Evidence:

* role checks
* protected routes
* RBAC middleware

---

## PERMISSIONS

### Permission

Role: <Host>

Resource: <Listing>

Actions:

* create
* update_own
* delete_own

Evidence:

* route guards
* ownership checks

---

## INFRASTRUCTURE

Database:
<PostgreSQL | MongoDB | Supabase | UNKNOWN>

Authentication:
<Clerk | Firebase | Supabase Auth | Auth.js | UNKNOWN>

Storage:
<S3 | Cloudinary | Supabase Storage | UNKNOWN>

Queue:
<BullMQ | Inngest | UNKNOWN>

Deployment:
<Vercel | Railway | AWS | UNKNOWN>

Evidence:

* package.json
* imports
* SDK configs
* env variables

---

## INTEGRATIONS

### Integration

Name: <Stripe>

Purpose: <Payments>

Evidence:

* stripe imports
* checkout sessions
* webhook handlers

Confidence:
<HIGH | MEDIUM | LOW>

---

## BUSINESS WORKFLOWS

### Workflow

Name: <Book Listing>

Actors:

* Guest
* Host

Steps:

1. Search listing
2. Select dates
3. Submit reservation
4. Confirm payment

Entities:

* Listing
* Reservation
* Payment

Evidence:

* checkout flow
* booking forms
* reservation payloads

---

## VALIDATION RULES

* Reservation dates cannot overlap
* Email must be unique
* Listing price must be positive

Evidence:

* zod schema
* yup schema
* validation middleware

---

## STORAGE OBJECTS

* listing-images
* avatars
* attachments

Evidence:

* upload handlers
* bucket configs

---

## API SURFACE

### Resource

Name: <Listing>

Endpoints:

* GET /listings
* POST /listings
* PATCH /listings/:id

Evidence:

* fetch calls
* API clients
* route handlers

---

## OPEN QUESTIONS

List architecture gaps or ambiguities.

Examples:

* Payment provider not identifiable
* Reservation persistence unclear
* Queue system absent
* Notification ownership unknown

---

## FINAL RULES

1. Never output markdown explanations outside schema.

2. Never summarize the app casually.

3. Never invent entities.

4. Never invent infrastructure.

5. Never infer databases from assumptions.

6. Every section must be evidence-backed.

7. Use UNKNOWN instead of hallucinating.

8. Prefer omission over guessing.

9. Backend determinism is more important than completeness.

10. Output only valid Simplicit Context v2 schema.
