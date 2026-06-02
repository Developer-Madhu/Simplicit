import { describe, test, expect } from "vitest";
import { getSystemPrompt, normalizeToolName, computeHash, parseRawPrompt } from "../prompt-loader";
import { parseSimplicitContext } from "../../ingestion/analyzers/context-parser";
import { getEvidenceQuality, EvidenceClass, EvidenceQuality } from "../../architecture/domain-intelligence-types";

describe("Prompt Registry & Loader", () => {
  test("Normalizes tool names correctly", () => {
    expect(normalizeToolName("Cursor")).toBe("cursor");
    expect(normalizeToolName("Claude Code")).toBe("claude");
    expect(normalizeToolName("Lovable")).toBe("lovable");
    expect(normalizeToolName("non-existent-tool")).toBe("generic");
  });

  test("Computes hashes consistently", () => {
    const rawContent1 = "hello world";
    const rawContent2 = "hello world\r\n";
    expect(computeHash(rawContent1)).toBe(computeHash(rawContent2));
    expect(computeHash(rawContent1)).toHaveLength(8);
  });

  test("Parses frontmatter correctly", () => {
    const raw = `---
version: 2.5
tool: custom-tool
schema: simplicit-context-v2
---
# Main Header
Content here`;
    const prompt = parseRawPrompt(raw, "custom.md");
    expect(prompt.metadata.version).toBe("2.5");
    expect(prompt.metadata.tool).toBe("custom-tool");
    expect(prompt.metadata.schema).toBe("simplicit-context-v2");
    expect(prompt.content.trim()).toBe("# Main Header\nContent here");
  });

  test("Loads cursor prompt successfully with valid frontmatter", async () => {
    const prompt = await getSystemPrompt("cursor");
    expect(prompt.metadata.version).toBe("2.0");
    expect(prompt.metadata.tool).toBe("cursor");
    expect(prompt.metadata.schema).toBe("simplicit-context-v2");
    expect(prompt.content).toContain("# Cursor Context Extraction Instructions");
  });

  test("Falls back to generic prompt if tool is missing", async () => {
    const prompt = await getSystemPrompt("some-nonexistent-tool-id");
    expect(prompt.metadata.tool).toBe("generic");
    expect(prompt.filename).toBe("generic.md");
  });
});

describe("Hardened Context Parser", () => {
  const validContextMarkdown = `---
version: 2.0
tool: cursor
schema: simplicit-context-v2
---
# Simplicit Context v2

## DOMAIN
Name: Booking App
Category: marketplace
Description: A booking marketplace app
Confidence: HIGH
Evidence:
* /api/listings

## ENTITIES
### Entity: Listing
Type: PERSISTENT_ENTITY
Description: Represents a lodging offer
Evidence:
* /api/listings
Fields:
* id: uuid
* title: string
Capabilities:
* Create Listing
* Update Listing
Confidence: HIGH

## RELATIONSHIPS
### Relationship
Source: User
Target: Listing
Type: belongsTo
Evidence:
* listing.userId
Confidence: MEDIUM

## CAPABILITIES
### Capability
Name: Create Listing
Entity: Listing
Category: CRUD
Evidence:
* POST /listings
Confidence: HIGH

## INFRASTRUCTURE
Database: PostgreSQL
Authentication: Supabase Auth
Storage: S3
Queue: UNKNOWN
Deployment: Vercel
`;

  test("Strict Schema Check: Accepts valid schema version v2", () => {
    const ctx = parseSimplicitContext(validContextMarkdown);
    expect(ctx.validation.isValid).toBe(true);
    expect(ctx.validation.errors).toHaveLength(0);
    expect(ctx.overview.name).toBe("Booking App");
  });

  test("Lenient Schema Check: unsupported/missing schema is parsed, not blocked", () => {
    const invalidSchemaMarkdown = `---
version: 2.0
tool: cursor
schema: simplicit-context-v3
---
# Simplicit Context v3
`;
    const ctx = parseSimplicitContext(invalidSchemaMarkdown);
    // No longer hard-blocked: no schema-version error is emitted.
    expect(ctx.validation.errors.some((e) => e.toLowerCase().includes("schema version"))).toBe(false);
    // Instead, the unsupported schema is surfaced as a warning.
    expect(ctx.validation.warnings.some((w) => w.includes("simplicit-context-v2"))).toBe(true);
  });

  test("Section-level Confidence Parsing", () => {
    const ctx = parseSimplicitContext(validContextMarkdown);
    expect(ctx.entitiesConfidence).toBe("HIGH");
    expect(ctx.relationshipsConfidence).toBe("MEDIUM");
    expect(ctx.infrastructureConfidence).toBe("HIGH");
  });

  test("Normalized Canonical IDs", () => {
    const ctx = parseSimplicitContext(validContextMarkdown);
    expect(ctx.dataModels[0].normalizedId).toBe("listing");
    expect(ctx.relationships[0].normalizedId).toBe("user-listing");
    expect(ctx.capabilities[0].normalizedId).toBe("create-listing");
  });

  test("Deterministic Alphabetical Ordering", () => {
    const unorderedMarkdown = `---
version: 2.0
tool: cursor
schema: simplicit-context-v2
---
# Simplicit Context v2
## DOMAIN
Name: Sorting Test
Category: saas
Confidence: HIGH

## ENTITIES
### Entity: Zebra
Type: PERSISTENT_ENTITY
Description: Zebra info
Confidence: HIGH

### Entity: Apple
Type: PERSISTENT_ENTITY
Description: Apple info
Confidence: HIGH

## RELATIONSHIPS
### Relationship
Source: User
Target: Zebra
Type: hasMany
Confidence: HIGH

### Relationship
Source: Apple
Target: Box
Type: belongsTo
Confidence: HIGH

## CAPABILITIES
### Capability
Name: Zero capability
Entity: Zebra
Category: CRUD
Confidence: HIGH

### Capability
Name: Alpha capability
Entity: Apple
Category: CRUD
Confidence: HIGH

## INFRASTRUCTURE
Database: PostgreSQL
`;
    const ctx = parseSimplicitContext(unorderedMarkdown);
    
    // Apple (A) must come before Zebra (Z)
    expect(ctx.dataModels[0].name).toBe("Apple");
    expect(ctx.dataModels[1].name).toBe("Zebra");

    // Alpha must come before Zero
    expect(ctx.capabilities[0].name).toBe("Alpha capability");
    expect(ctx.capabilities[1].name).toBe("Zero capability");

    // Apple-Box must come before User-Zebra
    expect(ctx.relationships[0].source).toBe("Apple");
    expect(ctx.relationships[1].source).toBe("User");
  });

  test("Parser Recovery Mode: Malformed section doesn't discard valid ones", () => {
    const malformedMarkdown = `---
version: 2.0
tool: cursor
schema: simplicit-context-v2
---
# Simplicit Context v2

## DOMAIN
Name: Recovery Test
Category: saas
Description: A saas app
Confidence: HIGH

## ENTITIES
### Entity: Account
Type: PERSISTENT_ENTITY
Description: User account
Fields:
* id: uuid
Confidence: HIGH

## RELATIONSHIPS
### Relationship
Source: 
Target:
Type: [CRASH TRIGGER - invalid format target / source missing]
Confidence: LOW

## CAPABILITIES
### Capability
Name: Create Account
Entity: Account
Category: CRUD
Confidence: HIGH

## INFRASTRUCTURE
Database: PostgreSQL
`;
    const ctx = parseSimplicitContext(malformedMarkdown);
    // Validation is still valid overall (warnings populate instead of crashing)
    expect(ctx.overview.name).toBe("Recovery Test");
    expect(ctx.dataModels).toHaveLength(1);
    expect(ctx.dataModels[0].name).toBe("Account");
    expect(ctx.capabilities).toHaveLength(1);
    expect(ctx.capabilities[0].name).toBe("Create Account");
    // Emitted warnings instead of discarding everything
    expect(ctx.validation.warnings.length).toBeGreaterThan(0);
  });

  test("Filters explicit UNKNOWN values", () => {
    const unknownValMarkdown = `---
version: 2.0
tool: cursor
schema: simplicit-context-v2
---
# Simplicit Context v2
## DOMAIN
Name: Unknown Filter
Category: UNKNOWN
Description: UNKNOWN
Confidence: HIGH

## ENTITIES
### Entity: UNKNOWN
Type: PERSISTENT_ENTITY
Description: UNKNOWN
Confidence: HIGH

## RELATIONSHIPS
UNKNOWN

## CAPABILITIES
UNKNOWN

## INFRASTRUCTURE
Database: UNKNOWN
`;
    const ctx = parseSimplicitContext(unknownValMarkdown);
    expect(ctx.overview.category).toBe("unknown");
    expect(ctx.dataModels).toHaveLength(0);
    expect(ctx.relationships).toHaveLength(0);
    expect(ctx.capabilities).toHaveLength(0);
    expect(ctx.infrastructure.database).toBe("UNKNOWN"); // Type supports UNKNOWN, but doesn't crash
  });
});

describe("Evidence Quality Classification", () => {
  test("Classifies evidence categories correctly", () => {
    expect(getEvidenceQuality(EvidenceClass.SCHEMA)).toBe(EvidenceQuality.STRUCTURAL);
    expect(getEvidenceQuality(EvidenceClass.DATABASE)).toBe(EvidenceQuality.STRUCTURAL);
    expect(getEvidenceQuality(EvidenceClass.API)).toBe(EvidenceQuality.STRUCTURAL);
    expect(getEvidenceQuality(EvidenceClass.ROUTE)).toBe(EvidenceQuality.STRUCTURAL);

    expect(getEvidenceQuality(EvidenceClass.FORM)).toBe(EvidenceQuality.BEHAVIORAL);
    expect(getEvidenceQuality(EvidenceClass.STATE)).toBe(EvidenceQuality.BEHAVIORAL);
    expect(getEvidenceQuality(EvidenceClass.SOURCE_CODE)).toBe(EvidenceQuality.BEHAVIORAL);

    expect(getEvidenceQuality(EvidenceClass.CONFIG)).toBe(EvidenceQuality.DECLARATIVE);
    expect(getEvidenceQuality(EvidenceClass.DEPENDENCY)).toBe(EvidenceQuality.DECLARATIVE);

    expect(getEvidenceQuality(EvidenceClass.DOCUMENTATION)).toBe(EvidenceQuality.DOCUMENTATION);
  });
});
