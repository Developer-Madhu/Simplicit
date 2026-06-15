import { IngestionResult } from "@/features/ingestion/types";
import { 
  DomainInsight, 
  DomainEntity, 
  DomainRole, 
  DomainWorkflow, 
  StructuredEvidence, 
  DomainGraph, 
  BoundedContext,
  DomainNode,
  DomainEdge,
  ReadinessBreakdown,
  SemanticType,
  ArchitectureGap,
  PatternSuggestion,
  EvidenceClass,
  BusinessCapability
} from "./domain-intelligence-types";
import { EvidenceEngine } from "./evidence-engine";
import { SemanticClassifier } from "./engines/semantic-classifier";
import { EntityQualifier } from "./engines/entity-qualifier";
import { ConfidenceEngine } from "./engines/confidence-engine";
import { InfraVerifier } from "./engines/infra-verifier";
import { PatternRecognitionEngine } from "./engines/pattern-engine";
import { ArchitectureGapDetector } from "./engines/gap-detector";
import { IntelligentClarificationEngine } from "./engines/clarification-engine";
import { ReadinessValidator } from "./engines/readiness-validator";
import { BusinessCapabilityEngine } from "./engines/business-capability-engine";
import { traceEntity, resetTraceReport } from "./trace";
import { CRUDClusterReconstructionEngine } from "./engines/crud-cluster-engine";
import { CapabilityEntityValidator } from "./engines/capability-entity-validator";
import { DomainGraphValidator } from "./engines/domain-graph-validator";
import { RelationshipReconstructionEngine } from "./engines/relationship-engine";

export class DomainIntelligenceEngine {
  private evidenceEngine: EvidenceEngine;
  private classifier: SemanticClassifier;
  private qualifier: EntityQualifier;
  private confidenceEngine: ConfidenceEngine;
  private infraVerifier: InfraVerifier;
  private patternEngine: PatternRecognitionEngine;
  private gapDetector: ArchitectureGapDetector;
  private clarificationEngine: IntelligentClarificationEngine;
  private readinessValidator: ReadinessValidator;
  private capabilityEngine: BusinessCapabilityEngine;

  constructor(
    private result: IngestionResult,
    private answers: Record<string, string | string[]>,
    private prompt: string
  ) {
    // Rule #8: Context Isolation (New instance per construction)
    this.evidenceEngine = new EvidenceEngine(result);
    this.classifier = new SemanticClassifier();
    this.qualifier = new EntityQualifier();
    this.confidenceEngine = new ConfidenceEngine();
    this.infraVerifier = new InfraVerifier();
    this.patternEngine = new PatternRecognitionEngine();
    this.gapDetector = new ArchitectureGapDetector();
    this.clarificationEngine = new IntelligentClarificationEngine();
    this.readinessValidator = new ReadinessValidator();
    this.capabilityEngine = new BusinessCapabilityEngine();
  }

  /**
   * Main entry point for Deterministic Domain Reconstruction + Capability Extraction
   */
  public analyze(): DomainInsight {
    // Reset trace report
    resetTraceReport();

    // Phase 1: Evidence Extraction (Structured + Sanitized)
    const signals = this.evidenceEngine.extractSignals();

    // Phase 2: Concept Grouping & Semantic Classification
    const conceptMap = this.groupEvidence(signals);
    
    // Trace Evidence Engine Output
    conceptMap.forEach((evidence, name) => {
      traceEntity(name, "Evidence Engine output", {
        score: 0,
        sources: evidence.map(e => e.sourceType),
        qualificationPassed: false,
        rejectionReason: ""
      });
    });

    const resolvedConcepts = this.classifyConcepts(conceptMap);

    // Extract workflows to find CRUD promoted entities
    const rawWorkflows: string[] = [];
    resolvedConcepts.forEach((data, name) => {
      if (data.type === SemanticType.WORKFLOW || data.type === SemanticType.COMMAND) {
        rawWorkflows.push(name);
      }
    });

    const crudClusterEngine = new CRUDClusterReconstructionEngine();
    const promotedEntityNames = crudClusterEngine.getPromotedEntities(rawWorkflows);

    // STEP 1: Entity-Centric Reconstruction (with CRUD promotions)
    let entities = this.reconstructEntities(resolvedConcepts, promotedEntityNames);
    const roles = this.reconstructRoles(resolvedConcepts);

    // Normalize entities before relationships
    entities = this.normalizeEntities(entities);

    // STEP 2: Relationship Reconstruction Engine (Fully Integrated)
    const relationshipEngine = new RelationshipReconstructionEngine();
    const relationships = relationshipEngine.reconstruct(entities, signals);

    // STEP 3: Business Capability Reconstruction (Must follow Entities)
    const capabilities = this.reconstructCapabilities(resolvedConcepts, entities);
    
    // Filter capabilities: must not have status === "INVALID"
    const validCapabilities = capabilities.filter(cap => cap.status !== "INVALID");

    // Validate capability names (Rule: Human business language)
    validCapabilities.forEach(cap => {
        if (!this.capabilityEngine.validateWorkflowName(cap.name)) {
            console.warn(`Invalid capability name detected: ${cap.name}`);
        }
    });

    const workflows = this.reconstructWorkflows(resolvedConcepts);

    // STEP 4: Module Reconstruction (Clustering around capabilities and entities)
    const modules = this.synthesizeModules(entities, workflows, validCapabilities);

    // Phase 6: Pattern & Suggestions (Advisory only)
    const suggestions = this.patternEngine.recognize(signals);

    // Phase 7: Architecture Gap Detection (Evidence-based only)
    const gaps = this.gapDetector.detect(entities, roles, signals);
    
    // STEP 6: Graph Reconstruction (Canonical Model)
    const graph = this.buildDomainGraph(entities, roles, workflows, signals, validCapabilities, modules);

    // Phase 6: Apply user wizard answers to the reconstructed graph (the engine
    // previously stored `answers` in the constructor but never read them).
    this.applyWizardAnswers(graph);

    // Validate capability-entity consistency (Orphan Capabilities check)
    const capabilityValidator = new CapabilityEntityValidator();
    const capabilityValidation = capabilityValidator.validate(capabilities, entities);

    // Validate Domain Graph Integrity (Rules 1-5 validation)
    const graphValidator = new DomainGraphValidator();
    const graphValidation = graphValidator.validate(graph);

    // Phase 9: Readiness Scoring
    const initialValidationErrors = capabilityValidation.errorStrings.concat(graphValidation.errors);
    const validation = this.readinessValidator.validate({
      entities,
      capabilities: validCapabilities,
      gaps,
      evidenceLog: signals,
      validationErrors: initialValidationErrors
    });

    const finalValidationErrors = (validation.errors || []);

    return {
      domain: this.inferDomain(signals),
      entities,
      roles,
      workflows,
      capabilities: validCapabilities,
      graph,
      modules,
      readinessScore: validation.score,
      readinessBreakdown: validation.breakdown,
      validationErrors: finalValidationErrors,
      evidenceLog: signals,
      gaps,
      suggestions
    };
  }

  /**
   * STEP 2: Relationship Inference
   */
  private inferRelationships(entities: DomainEntity[], signals: StructuredEvidence[]) {
    // Deprecated in favor of RelationshipReconstructionEngine
  }

  /**
   * Phase 6: Apply user wizard answers to the reconstructed domain graph.
   * Only maps question IDs NOT already handled by mapAnswersToArchitecture
   * (which covers rbac_model, ai_provider, notification_methods, custom).
   */
  private applyWizardAnswers(graph: DomainGraph): void {
    const answers = this.answers;
    if (!answers || Object.keys(answers).length === 0) return;

    // Multi-tenancy → inject a tenant discriminator field on every entity.
    // Wizard option values are "single" | "teams" | "orgs".
    const tenancy = answers["multi_tenancy"];
    if (tenancy === "teams" || tenancy === "orgs" || tenancy === "yes") {
      for (const entity of graph.entities) {
        const hasTenant = entity.fields.some(
          (f) => f.name === "tenantId" || f.name === "tenant_id"
        );
        if (!hasTenant) {
          entity.fields = [
            ...entity.fields,
            { name: "tenantId", type: "uuid", isNullable: false, evidence: [] },
          ];
        }
      }
      graph.features = [...(graph.features ?? []), "multi-tenancy"];
    }

    // Audit logging granularity ("basic" | "detailed" | "none").
    const audit = answers["audit_granularity"];
    if (typeof audit === "string" && audit && audit !== "none") {
      graph.features = [...(graph.features ?? []), `audit:${audit}`];
    }

    // Analytics scope ("realtime" | "business" | "user_tracking").
    const analytics = answers["analytics_scope"];
    if (typeof analytics === "string" && analytics && analytics !== "none") {
      graph.features = [...(graph.features ?? []), `analytics:${analytics}`];
    }

    // External integrations (multi-choice array).
    const integrations = answers["external_integrations"];
    if (Array.isArray(integrations) && integrations.length > 0) {
      graph.integrations = [...(graph.integrations ?? []), ...integrations];
    }
  }

  /**
   * Sprint: Business Capability Reconstruction
   */
  private reconstructCapabilities(
    concepts: Map<string, { type: SemanticType, evidence: StructuredEvidence[] }>,
    entities: DomainEntity[]
  ): BusinessCapability[] {
    const allCapabilities: BusinessCapability[] = [];
    
    concepts.forEach((data, name) => {
      if (data.type === SemanticType.WORKFLOW || data.type === SemanticType.COMMAND) {
        const caps = this.capabilityEngine.reconstruct(name, data.evidence, entities);
        allCapabilities.push(...caps);
      }
    });

    // Deduplicate capabilities with same name
    const unique = new Map<string, BusinessCapability>();
    allCapabilities.forEach(cap => {
        if (!unique.has(cap.name) || cap.confidence > unique.get(cap.name)!.confidence) {
            unique.set(cap.name, cap);
        }
    });

    return Array.from(unique.values());
  }

  /**
   * Phase 6: Cross Repository Normalization
   */
  private normalizeEntities(entities: DomainEntity[]): DomainEntity[] {
    return entities.map(ent => {
      const normalizedName = this.capabilityEngine.normalizeConcept(ent.name);
      if (normalizedName !== ent.name) {
        return {
          ...ent,
          name: normalizedName,
          table: this.pluralize(normalizedName.toLowerCase())
        };
      }
      return ent;
    });
  }

  private groupEvidence(signals: StructuredEvidence[]): Map<string, StructuredEvidence[]> {
    const map = new Map<string, StructuredEvidence[]>();
    
    const verbs = new Set([
      "login", "register", "signup", "signin", "logout", "auth", "authenticate", "onboarding",
      "update", "create", "delete", "remove", "add", "cancel", "submit", "confirm", "approve", "reject", "upload", "reserve", "book", "pay"
    ]);

    // Group all non-form signals first, normalizing concept name and applying uniqueEvidenceFingerprint
    signals.forEach(sig => {
      if (sig.sourceType === "form") return;

      const words = sig.originalValue.split(/[\/\-_ ]/).filter(w => w.length > 2);
      words.forEach(w => {
        const name = this.normalizeName(w);
        const lowerW = w.toLowerCase();
        const normalizedConcept = verbs.has(lowerW) ? name : this.capabilityEngine.normalizeConcept(name);

        if (!map.has(normalizedConcept)) {
          map.set(normalizedConcept, []);
        }

        const parentFile = sig.filePath || "";
        const fingerprint = `${sig.sourceType}:${normalizedConcept}:${parentFile}`;

        const list = map.get(normalizedConcept)!;
        const exists = list.some(e => `${e.sourceType}:${normalizedConcept}:${e.filePath || ""}` === fingerprint);

        if (!exists) {
          list.push(sig);
        }
      });
    });

    // Share generic form signals with all candidate concepts
    const formSignals = signals.filter(sig => sig.sourceType === "form");
    if (formSignals.length > 0) {
      map.forEach((list, concept) => {
        formSignals.forEach(formSig => {
          const parentFile = formSig.filePath || "";
          const fingerprint = `${formSig.sourceType}:${concept}:${parentFile}`;
          const exists = list.some(e => `${e.sourceType}:${concept}:${e.filePath || ""}` === fingerprint);

          if (!exists) {
            list.push({
              ...formSig,
              originalValue: `${concept} Form`
            });
          }
        });
      });
    }

    return map;
  }

  private classifyConcepts(map: Map<string, StructuredEvidence[]>): Map<string, { type: SemanticType, evidence: StructuredEvidence[] }> {
    const resolved = new Map<string, { type: SemanticType, evidence: StructuredEvidence[] }>();
    map.forEach((evidence, name) => {
      const type = this.classifier.classify(name, evidence);
      resolved.set(name, { type, evidence });
    });
    return resolved;
  }

  private reconstructEntities(
    concepts: Map<string, { type: SemanticType, evidence: StructuredEvidence[] }>,
    promotedEntityNames: string[]
  ): DomainEntity[] {
    const entities: DomainEntity[] = [];
    const promotedSet = new Set(promotedEntityNames.map(e => e.toLowerCase()));
    const emittedNouns = new Set<string>();

    // PASS 1 — existing qualification path (UNCHANGED): backend-shaped evidence
    // (DATABASE/SCHEMA/API) or CRUD-cluster promotion.
    concepts.forEach((data, name) => {
      const isPromoted = promotedSet.has(name.toLowerCase());
      const qualification = this.qualifier.qualify(name, data.type, data.evidence);
      if (qualification.passed || isPromoted) {
        entities.push(this.buildEntity(name, data, qualification, isPromoted ? "crud" : "qualified"));
        emittedNouns.add(this.normalizeNoun(name));
      }
    });

    // PASS 2a (Phase L2, primary) — trust the classifier: any concept the
    // SemanticClassifier already typed as ENTITY IS a domain entity. The score
    // threshold (60) is backend-evidence-weighted and wrongly rejects frontend
    // entities (e.g. "Product" scored 55); the threshold only exists to catch
    // ambiguous/UNKNOWN concepts, which an ENTITY-typed concept is not. Additive,
    // de-duped against Pass 1.
    concepts.forEach((data, name) => {
      if (data.type !== SemanticType.ENTITY) return;
      const noun = this.normalizeNoun(name);
      if (emittedNouns.has(noun)) return;
      const qualification = this.qualifier.qualify(name, data.type, data.evidence);
      entities.push(this.buildEntity(name, data, qualification, "classifier"));
      emittedNouns.add(noun);
    });

    // PASS 2b (Phase L2, secondary/conservative) — a routed noun that ALSO shows
    // component/state/API evidence. FORM is excluded (groupEvidence shares it to
    // EVERY concept, so it's no signal). This rescues a real entity the classifier
    // under-typed without promoting bare routed pages (Login/Logout/Dashboard/
    // NotFound), which have only ROUTE (+ the shared FORM). Additive, de-duped.
    const clusterReps = this.promoteFrontendClusters(concepts);
    clusterReps.forEach((repName, noun) => {
      if (emittedNouns.has(noun)) return;
      const data = concepts.get(repName);
      if (!data) return;
      const qualification = this.qualifier.qualify(repName, data.type, data.evidence);
      entities.push(this.buildEntity(repName, data, qualification, "cluster"));
      emittedNouns.add(noun);
    });

    return entities;
  }

  /** Builds a DomainEntity from a qualified/promoted concept (shared by all paths). */
  private buildEntity(
    name: string,
    data: { type: SemanticType; evidence: StructuredEvidence[] },
    qualification: { passed: boolean; score: number; reason: string },
    source: "qualified" | "crud" | "cluster" | "classifier"
  ): DomainEntity {
    let confidence = this.confidenceEngine.calculate(data.evidence);
    // Phase 5b: boost confidence for entities sourced from graph god-nodes.
    confidence = this.boostConfidenceForGodNodes(name, confidence);

    // Distinguish entity type based on persistence evidence.
    const hasPersistence = data.evidence.some(
      e => e.className === EvidenceClass.DATABASE || e.className === EvidenceClass.API || e.className === EvidenceClass.FORM
    );
    const finalType = hasPersistence ? SemanticType.PERSISTENT_ENTITY : SemanticType.REFERENCE_ENTITY;
    const promoted = source !== "qualified";

    return {
      name,
      table: this.pluralize(name.toLowerCase()),
      type: finalType,
      description: `Reconstructed domain entity representing ${name}`,
      fields: this.inferFields(name, data.evidence),
      relationships: [],
      indexes: ["id"],
      constraints: [],
      confidence: Math.round(confidence * 100),
      evidence: data.evidence,
      reasoning:
        source === "crud" ? `Promoted: Identified from CRUD operations cluster.`
        : source === "classifier" ? `Promoted: classifier typed this concept as a domain ENTITY.`
        : source === "cluster" ? `Promoted: routed feature with component/state/API evidence.`
        : qualification.reason,
      qualificationPassed: true,
      qualificationScore: promoted ? Math.max(qualification.score, 60) : qualification.score,
    };
  }

  /**
   * Phase L: normalize a concept name to its domain noun for clustering —
   * lowercase, strip common UI/page suffixes, naive singularization. So
   * "ProductPage", "ProductForm", "products" all collapse to "product".
   */
  private normalizeNoun(name: string): string {
    let n = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    n = n.replace(/(page|form|list|detail|details|item|card|modal|view|table|screen|container|wrapper)$/u, "");
    if (n.length > 3 && n.endsWith("s") && !n.endsWith("ss")) n = n.slice(0, -1);
    return n;
  }

  /**
   * Phase L2: detect frontend entity clusters. Groups concepts by normalized noun,
   * collects the distinct evidence classes across the cluster, and promotes a noun
   * whose cluster has ROUTE AND at least one of {STATE, API, SOURCE_CODE,
   * DEPENDENCY}. FORM is deliberately NOT a signal — groupEvidence shares it to
   * every concept, so it can't discriminate a real entity from a bare page.
   * Returns noun -> representative (highest-scoring) concept name. Additive only.
   */
  private promoteFrontendClusters(
    concepts: Map<string, { type: SemanticType, evidence: StructuredEvidence[] }>
  ): Map<string, string> {
    const DISCRIMINATING = [
      EvidenceClass.STATE,
      EvidenceClass.API,
      EvidenceClass.SOURCE_CODE,
      EvidenceClass.DEPENDENCY,
    ];
    const ROLE_ACTOR_NOUNS = new Set([
      "admin", "customer", "lead", "user", "vendor",
      "owner", "member", "client", "agent", "operator",
    ]);
    const clusters = new Map<string, { repName: string; repScore: number; classes: Set<EvidenceClass> }>();

    concepts.forEach((data, name) => {
      const noun = this.normalizeNoun(name);
      if (!noun || noun.length < 3) return;
      let c = clusters.get(noun);
      if (!c) {
        c = { repName: name, repScore: -1, classes: new Set<EvidenceClass>() };
        clusters.set(noun, c);
      }
      const score = this.qualifier.qualify(name, data.type, data.evidence).score;
      if (score > c.repScore) { c.repScore = score; c.repName = name; }
      for (const e of data.evidence) c.classes.add(e.className);
    });

    const promoted = new Map<string, string>();
    clusters.forEach((c, noun) => {
      // Pass 2b-extended: role/actor nouns promoted on ROUTE alone (they rarely
      // have a dedicated redux slice/API client, so DISCRIMINATING would miss them).
      if (ROLE_ACTOR_NOUNS.has(noun.toLowerCase()) && c.classes.has(EvidenceClass.ROUTE)) {
        promoted.set(noun, c.repName);
        return;
      }
      if (c.classes.has(EvidenceClass.ROUTE) && DISCRIMINATING.some(d => c.classes.has(d))) {
        promoted.set(noun, c.repName);
      }
    });
    return promoted;
  }

  private reconstructWorkflows(concepts: Map<string, { type: SemanticType, evidence: StructuredEvidence[] }>): DomainWorkflow[] {
    const workflows: DomainWorkflow[] = [];
    concepts.forEach((data, name) => {
      if (data.type === SemanticType.WORKFLOW || data.type === SemanticType.COMMAND) {
        workflows.push({
          name,
          type: data.type,
          description: `Discovered business ${data.type.toLowerCase()}: ${name}`,
          steps: [],
          trigger: "User action",
          outcome: "State transition",
          entities: [],
          evidence: data.evidence
        });
      }
    });
    return workflows;
  }

  private reconstructRoles(concepts: Map<string, { type: SemanticType, evidence: StructuredEvidence[] }>): DomainRole[] {
    const roles: DomainRole[] = [];
    concepts.forEach((data, name) => {
      const lower = name.toLowerCase();
      if (["admin", "host", "guest", "user", "editor", "owner"].includes(lower)) {
        roles.push({
          name: this.capitalize(name),
          description: `System role: ${name}`,
          permissions: [],
          evidence: data.evidence,
          reasoning: `Role identified from system terminology.`
        });
      }
    });
    return roles;
  }

  private buildDomainGraph(
    entities: DomainEntity[], 
    roles: DomainRole[], 
    workflows: DomainWorkflow[], 
    signals: StructuredEvidence[],
    capabilities: BusinessCapability[],
    modules: BoundedContext[]
  ): DomainGraph {
    const nodes: DomainNode[] = [];
    const edges: DomainEdge[] = [];

    entities.forEach(e => nodes.push({ id: `entity:${e.name}`, type: SemanticType.ENTITY, label: e.name }));
    roles.forEach(r => nodes.push({ id: `role:${r.name}`, type: SemanticType.ROLE, label: r.name }));
    capabilities.forEach(c => nodes.push({ id: `cap:${c.name}`, type: SemanticType.WORKFLOW, label: c.name }));
    
    entities.forEach(e => {
      e.relationships.forEach(rel => {
          edges.push({ from: `entity:${e.name}`, to: `entity:${rel.target}`, relation: rel.ownership ? "owns" : "depends_on" });
      });
    });

    capabilities.forEach(cap => {
        if (cap.associatedEntity) {
            edges.push({ from: `cap:${cap.name}`, to: `entity:${cap.associatedEntity}`, relation: "accesses" });
        }
    });

    return { 
        entities, 
        relationships: entities.flatMap(e => e.relationships),
        capabilities,
        modules,
        roles,
        evidence: signals,
        businessRules: [],
        infrastructure: {
            database: { provider: "PostgreSQL", rationale: "", confidence: 100 },
            auth: { provider: "Unknown", rationale: "", confidence: 0 },
            storage: { provider: "Unknown", rationale: "", confidence: 0 },
            email: { provider: "Unknown", rationale: "", confidence: 0 },
            queue: { provider: "Unknown", rationale: "", confidence: 0 },
            monitoring: { provider: "Unknown", rationale: "", confidence: 0 },
            analytics: { provider: "Unknown", rationale: "", confidence: 0 },
            payments: { provider: "Unknown", rationale: "", confidence: 0 }
        },
        nodes, 
        edges 
    };
  }

  private inferFields(entityName: string, evidence: StructuredEvidence[]): any[] {
    const fields = new Map<string, any>();

    // Rule: Foundation Fields
    fields.set("id", { name: "id", type: "uuid", isPrimary: true, isNullable: false, evidence: [] });
    fields.set("created_at", { name: "created_at", type: "timestamp", isPrimary: false, isNullable: false, evidence: [] });

    // Phase 5a: Extract fields directly from AST type definitions — the richest,
    // most reliable source (actual parsed interface/type/zod fields). Runs before
    // the keyFiles regex extractors so AST-parsed fields take priority.
    this.extractFieldsFromTypeDefinitions(entityName, fields);

    evidence.forEach(sig => {
      if (!sig.filePath) return;
      const content = this.result.keyFiles.get(sig.filePath);
      if (!content) return;

      // 1. Extract from TypeScript Interfaces/Types
      this.extractFieldsFromTypes(entityName, content, sig, fields);

      // 2. Extract from Zod Schemas
      this.extractFieldsFromZod(entityName, content, sig, fields);

      // 3. Extract from React Forms
      this.extractFieldsFromForms(entityName, content, sig, fields);
      
      // 4. Extract from API Payloads
      this.extractFieldsFromAPIs(entityName, content, sig, fields);
    });

    return Array.from(fields.values());
  }

  /**
   * Phase 5a: Pull fields straight from the AST type definitions
   * (astGraph.allTypeDefinitions), matching the entity by name (+ common
   * suffixes). This is the precise source the pipeline previously bypassed in
   * favour of regex over a configs-only keyFiles map.
   */
  private extractFieldsFromTypeDefinitions(entityName: string, fields: Map<string, any>) {
    const typeDefs = this.result.astGraph?.allTypeDefinitions;
    if (!typeDefs || typeDefs.length === 0) return;

    const entityLower = entityName.toLowerCase();
    for (const typeDef of typeDefs) {
      const defName = (typeDef.name ?? "").toLowerCase();
      const matches =
        defName === entityLower ||
        defName === entityLower + "s" ||
        defName === entityLower + "type" ||
        defName === entityLower + "schema" ||
        defName === entityLower + "model";
      if (!matches) continue;

      for (const field of typeDef.fields ?? []) {
        const name = field.name;
        if (!name) continue;
        // Don't override foundation/stronger fields already present.
        if (!fields.has(name) || fields.get(name).type === "text") {
          fields.set(name, {
            name,
            type: this.mapToDbType(field.type ?? "text"),
            isNullable: field.optional ?? false,
            evidence: [],
          });
        }
      }
    }
  }

  /**
   * Phase 5b: Entities whose source file is a graph god-node (a highly-imported
   * hub) are almost always genuine domain types — give them a confidence boost.
   */
  private boostConfidenceForGodNodes(entityName: string, baseConfidence: number): number {
    const analytics = this.result.graphAnalytics;
    if (!analytics || analytics.godNodes.length === 0) return baseConfidence;
    const isFromGodNode = analytics.godNodes.some((node) =>
      node.filePath.toLowerCase().includes(entityName.toLowerCase())
    );
    return isFromGodNode ? Math.min(1.0, baseConfidence + 0.2) : baseConfidence;
  }

  private extractFieldsFromTypes(entityName: string, content: string, sig: StructuredEvidence, fields: Map<string, any>) {
    const typeRegex = new RegExp(`(?:interface|type)\\s+${entityName}\\s*(?:=|{)([\\s\\S]*?)}`, 'g');
    let match;
    while ((match = typeRegex.exec(content)) !== null) {
      const body = match[1];
      const fieldLines = body.split('\n');
      fieldLines.forEach(line => {
        const fieldMatch = line.trim().match(/^(\w+)(\?)?:\s*([^;,\n]+)/);
        if (fieldMatch) {
          const name = fieldMatch[1];
          const isOptional = !!fieldMatch[2];
          const type = this.mapToDbType(fieldMatch[3]);
          
          if (!fields.has(name) || fields.get(name).type === 'text') {
             fields.set(name, {
               name,
               type,
               isNullable: isOptional,
               evidence: [sig]
             });
          }
        }
      });
    }
  }

  private extractFieldsFromZod(entityName: string, content: string, sig: StructuredEvidence, fields: Map<string, any>) {
    const zodRegex = new RegExp(`(?:const|let|var)\\s+(\\w*${entityName}\\w*)\\s*=\\s*z\\.object\\s*\\({([\\s\\S]*?)}\\)`, 'gi');
    let match;
    while ((match = zodRegex.exec(content)) !== null) {
      const body = match[2];
      const fieldLines = body.split('\n');
      fieldLines.forEach(line => {
        // Match base type even with chained validators: z.string().min(2).email() → "string"
        const fieldMatch = line.trim().match(/^(\w+):\s*z\.(\w+)\s*\(/);
        if (fieldMatch) {
          const name = fieldMatch[1];
          const type = this.mapToDbType(fieldMatch[2]);
          const isOptional = line.includes('.optional()') || line.includes('.nullable()');
          
          if (!fields.has(name)) {
            fields.set(name, {
              name,
              type,
              isNullable: isOptional,
              evidence: [sig]
            });
          }
        }
      });
    }
  }

  private extractFieldsFromForms(entityName: string, content: string, sig: StructuredEvidence, fields: Map<string, any>) {
    // Look for name attributes in inputs
    const nameRegex = /name=["'](\w+)["']/g;
    let match;
    while ((match = nameRegex.exec(content)) !== null) {
      const name = match[1];
      if (!fields.has(name)) {
        fields.set(name, {
          name,
          type: 'text', // Default to text for form fields if type unknown
          isNullable: true,
          evidence: [sig]
        });
      }
    }
  }

  private extractFieldsFromAPIs(entityName: string, content: string, sig: StructuredEvidence, fields: Map<string, any>) {
    // Look for property assignments in object literals that might be entity-related
    if (content.toLowerCase().includes(entityName.toLowerCase())) {
        const assignmentRegex = /(\w+):\s*[\w.]+(?=[,}])/g;
        let match;
        while ((match = assignmentRegex.exec(content)) !== null) {
            const name = match[1];
            if (!fields.has(name) && name !== 'id') {
                fields.set(name, {
                    name,
                    type: 'text',
                    isNullable: true,
                    evidence: [sig]
                });
            }
        }
    }
  }

  private mapToDbType(tsType: string): string {
    const type = tsType.toLowerCase().trim();
    if (type.includes("string")) return "varchar";
    if (type.includes("number")) return "integer";
    if (type.includes("boolean")) return "boolean";
    if (type.includes("date") || type.includes("timestamp")) return "timestamp";
    if (type.includes("[]") || type.includes("array") || type.includes("object")) return "jsonb";
    return "text";
  }

  private synthesizeModules(entities: DomainEntity[], workflows: DomainWorkflow[], capabilities: BusinessCapability[]): BoundedContext[] {
    const contexts: BoundedContext[] = [];
    
    // Group by capability category
    const categoryGroups = new Map<string, BusinessCapability[]>();
    capabilities.forEach(cap => {
        if (!categoryGroups.has(cap.category)) categoryGroups.set(cap.category, []);
        categoryGroups.get(cap.category)!.push(cap);
    });

    categoryGroups.forEach((caps, category) => {
        if (category === "UNKNOWN") return;
        
        const entitiesInContext = Array.from(new Set(caps.map(c => c.associatedEntity).filter(Boolean)));
        const moduleName = this.capitalize(category.replace('_MANAGEMENT', '').toLowerCase());
        
        contexts.push({
            name: `${moduleName}Module`,
            description: `Domain module for ${category.toLowerCase().replace('_', ' ')}.`,
            entities: entitiesInContext as string[],
            services: [`${moduleName}Service`],
            workflows: caps.map(c => c.name),
            evidence: caps.flatMap(c => c.evidence)
        });
    });

    // Ensure every entity has its OWN dedicated module. Any entity not already
    // claimed by a capability-derived module gets a `${entity.name}Module`. This
    // MUST match the module name that ServiceGenerator AND ApiSurfaceCompiler tag
    // their output with (both use `${entity.name}Module`), so NestJSGenerator's
    // `services/apiSurface.filter(x => x.module === mod.name)` actually finds the
    // per-entity service + controller files.
    //
    // M-audit bug this fixes: the previous fallback lumped ALL entities into one
    // "CoreModule", whose name matched none of the per-entity services → 0 service
    // files emitted → Stability "0 services" → TestWriterError.
    const assignedEntities = new Set<string>();
    contexts.forEach(ctx => ctx.entities.forEach(ent => assignedEntities.add(ent)));

    entities.forEach(ent => {
      if (assignedEntities.has(ent.name)) return;
      contexts.push({
        name: `${ent.name}Module`,
        description: `Domain module for ${ent.name}.`,
        entities: [ent.name],
        services: [`${ent.name}Service`],
        workflows: [],
        evidence: [],
      });
      assignedEntities.add(ent.name);
    });

    return contexts;
  }

  private inferDomain(signals: StructuredEvidence[]): string {
    const text = signals.filter(s => s.className !== EvidenceClass.DOCUMENTATION).map(s => s.originalValue).join(" ").toLowerCase();
    if (text.includes("listing") || text.includes("room")) return "Booking Marketplace";
    if (text.includes("course") || text.includes("lesson")) return "Learning Platform";
    return "Custom Domain";
  }

  private normalizeName(s: string): string {
    const clean = s.replace(/[^a-zA-Z]/g, "");
    if (!clean) return "Unknown";
    return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  }

  private pluralize(s: string): string {
    if (s.endsWith("y")) return s.slice(0, -1) + "ies";
    return s.endsWith("s") ? s : s + "s";
  }

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
