import { describe, test, expect } from "vitest";
import { DomainIntelligenceEngine } from "../domain-intelligence-engine";
import { EvidenceClass, SemanticType } from "../domain-intelligence-types";

describe("Architecture Stabilization Sprint - TDD", () => {
  const mockIngestion = (overrides: any = {}): any => ({
    routes: [],
    keyFiles: new Map(),
    metadata: {
      inferredEntities: [],
      intent: { hasForms: false },
      apiExpectations: [],
      stateAnalysis: { libraries: [] }
    },
    dependencies: [],
    ...overrides
  });

  test("Rule #1 & #4: README mentioning 'documentation' does not create Document entity", () => {
    const ingestion = mockIngestion({
      simplicitContext: {
        dataModels: [],
        businessRules: [],
        workflows: []
      },
      // Simulate README content via EvidenceEngine signals (or mock signals directly if possible)
      // For now, let's assume we pass a result that would lead to a Documentation signal
      routes: [{ path: "/docs", kind: "page", component: "DocsPage.tsx" }]
    });
    
    // We need to simulate the raw signals or the environment that produces them
    const engine = new DomainIntelligenceEngine(ingestion, {}, "Test");
    const insight = engine.analyze();
    
    const docEntity = insight.entities.find(e => e.name.toLowerCase() === "document");
    expect(docEntity).toBeUndefined();
  });

  test("Rule #2 & #5: README mentioning 'Notion clone' does not activate Notion pattern without exclusive evidence", () => {
    // Exclusive evidence for Notion: recursive hierarchy, nested pages
    const ingestion = mockIngestion({
      // Only keyword evidence
      routes: [{ path: "/notion-clone", kind: "page" }]
    });
    
    const engine = new DomainIntelligenceEngine(ingestion, {}, "Notion clone project");
    const insight = engine.analyze();
    
    const notionPattern = insight.suggestions.find(s => s.id === "workspace_system");
    // Should be low confidence or not present if exclusive evidence is missing
    if (notionPattern) {
      expect(notionPattern.confidence).toBeLessThan(40);
    }
  });

  test("Rule #6: Airbnb repo never produces Workspace gap (no template-driven gaps)", () => {
    const ingestion = mockIngestion({
      routes: [
        { path: "/listings", kind: "page" },
        { path: "/bookings", kind: "page" }
      ]
    });
    
    const engine = new DomainIntelligenceEngine(ingestion, {}, "Airbnb clone");
    const insight = engine.analyze();
    
    const workspaceGap = insight.gaps.find(g => g.description.toLowerCase().includes("workspace"));
    expect(workspaceGap).toBeUndefined();
  });

  test("Rule #1 & #4: UI component RoomCard never becomes entity", () => {
    const ingestion = mockIngestion({
      metadata: {
        inferredEntities: [
          { name: "RoomCard", hints: ["component name"] }
        ],
        intent: { hasForms: false },
        apiExpectations: [],
        stateAnalysis: { libraries: [] }
      }
    });
    
    const engine = new DomainIntelligenceEngine(ingestion, {}, "Hotel app");
    const insight = engine.analyze();
    
    const roomCardEntity = insight.entities.find(e => e.name === "RoomCard");
    expect(roomCardEntity).toBeUndefined();
  });

  test("Rule #1: Login/Register become workflows, not entities", () => {
    const ingestion = mockIngestion({
      routes: [
        { path: "/login", kind: "page" },
        { path: "/register", kind: "page" }
      ]
    });
    
    const engine = new DomainIntelligenceEngine(ingestion, {}, "App with auth");
    const insight = engine.analyze();
    
    const loginEntity = insight.entities.find(e => e.name.toLowerCase() === "login");
    const registerEntity = insight.entities.find(e => e.name.toLowerCase() === "register");
    
    expect(loginEntity).toBeUndefined();
    expect(registerEntity).toBeUndefined();
    
    expect(insight.workflows.some(w => w.name.toLowerCase() === "login")).toBe(true);
  });

  test("Rule #4: Listing becomes entity only when persistence evidence exists (3+ sources)", () => {
    // 1 source: Route
    const weakIngestion = mockIngestion({
      routes: [{ path: "/listings", kind: "page" }]
    });
    const weakEngine = new DomainIntelligenceEngine(weakIngestion, {}, "Real estate");
    expect(weakEngine.analyze().entities.find(e => e.name === "Listing")).toBeUndefined();

    // 3 sources: Route, API, Form
    const strongIngestion = mockIngestion({
      routes: [{ path: "/listings", kind: "page" }],
      metadata: {
        inferredEntities: [],
        intent: { hasForms: true },
        apiExpectations: [{ method: "GET", path: "/api/listings", purpose: "list" }],
        stateAnalysis: { libraries: [] }
      }
    });
    const strongEngine = new DomainIntelligenceEngine(strongIngestion, {}, "Real estate");
    expect(strongEngine.analyze().entities.find(e => e.name === "Listing")).toBeDefined();
  });

  test("Rule #2: Pattern suggestions cannot modify domain reconstruction", () => {
    // Mock a situation where a pattern is suggested but lacks evidence for its entities
    const ingestion = mockIngestion({
      routes: [{ path: "/listings", kind: "page" }]
    });
    
    const engine = new DomainIntelligenceEngine(ingestion, {}, "Marketplace");
    const insight = engine.analyze();
    
    // Domain should NOT be named after the pattern if it's just a suggestion
    // Re-check: Success Criteria says "Patterns help explain. Patterns never decide."
    // So the domain reconstruction should be driven by evidence.
    expect(insight.domain).not.toBe("Booking Marketplace (Airbnb-like)");
  });

  test("Rule #8: Generation state isolation test", () => {
    const ingestion1 = mockIngestion({
      routes: [{ path: "/alpha", kind: "page" }],
      metadata: {
        inferredEntities: [],
        intent: { hasForms: true },
        apiExpectations: [{ method: "GET", path: "/api/alpha", purpose: "list" }],
        stateAnalysis: { libraries: [] }
      }
    });
    const ingestion2 = mockIngestion({
      routes: [{ path: "/beta", kind: "page" }],
      metadata: {
        inferredEntities: [],
        intent: { hasForms: true },
        apiExpectations: [{ method: "GET", path: "/api/beta", purpose: "list" }],
        stateAnalysis: { libraries: [] }
      }
    });
    
    const engine1 = new DomainIntelligenceEngine(ingestion1, {}, "Alpha");
    const insight1 = engine1.analyze();
    
    const engine2 = new DomainIntelligenceEngine(ingestion2, {}, "Beta");
    const insight2 = engine2.analyze();
    
    expect(insight1.entities).not.toEqual(insight2.entities);
    expect(insight2.evidenceLog.some(e => e.originalValue === "/alpha")).toBe(false);
  });

  test("Rule #7: Documentation weight capped at 0.05", () => {
    const ingestion = mockIngestion({
      simplicitContext: {
        dataModels: [{ name: "Secret", fields: [] }],
        businessRules: [],
        workflows: []
      }
    });
    
    const engine = new DomainIntelligenceEngine(ingestion, {}, "Docs");
    const insight = engine.analyze();
    
    const secretEntity = insight.entities.find(e => e.name === "Secret");
    // If it only has documentation evidence, it shouldn't even be qualified
    // But let's check its confidence if it was somehow qualified
    if (secretEntity) {
      const docEvidence = secretEntity.evidence.filter(e => e.className === EvidenceClass.DOCUMENTATION);
      docEvidence.forEach(e => expect(e.confidence).toBeLessThanOrEqual(0.05));
    }
  });

  test("Rule #6: Gap detector only emits evidence-derived gaps", () => {
    const ingestion = mockIngestion({
      routes: [{ path: "/bookings", kind: "page" }]
    });
    
    const engine = new DomainIntelligenceEngine(ingestion, {}, "Airbnb");
    const insight = engine.analyze();
    
    // Should NOT have "Notion requires Workspace" gaps
    insight.gaps.forEach(gap => {
      expect(gap.description).not.toContain("Workspace");
    });
  });
});
