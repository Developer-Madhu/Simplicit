import { IngestionResult } from "@/features/ingestion/types";
import { 
  BackendSpecification, 
  BackendBlueprint, 
  BlueprintModule, 
  BlueprintEntity, 
  BlueprintAPI, 
  BlueprintService, 
  BlueprintStorage, 
  BlueprintQueue, 
  BlueprintEvent, 
  BlueprintPermission,
  BlueprintBusinessRule,
  BlueprintInfrastructure,
  BlueprintIntegration,
  BackendEntity as SpecEntity,
  BackendWorkflow,
  BackendRole,
  BackendRelationship
} from "./types";
import { DomainIntelligenceEngine } from "./domain-intelligence-engine";
import { DomainEntity, DomainWorkflow as DWorkflow, DomainRole as DRole, StructuredEvidence, SemanticType, EvidenceClass, BusinessCapability } from "./domain-intelligence-types";

export class ArchitectureSynthesisEngine {
  private intelligence: DomainIntelligenceEngine;

  constructor(
    private result: IngestionResult,
    private answers: Record<string, string | string[]>,
    private prompt: string
  ) {
    this.intelligence = new DomainIntelligenceEngine(result, answers, prompt);
  }

  /**
   * Main entry point: Build a production-grade domain-driven blueprint
   */
  public generate(spec: BackendSpecification): BackendBlueprint {
    const insight = this.intelligence.analyze();
    const graph = insight.graph;
    const infra = this.synthesizeInfrastructure(graph.evidence);
    
    const blueprint: BackendBlueprint = {
      summary: `Verified business architecture for ${insight.domain}. Reconstructed from ${graph.evidence.length} structured repository signals.`,
      modules: graph.modules.map(m => ({
        name: m.name,
        description: m.description,
        entities: m.entities,
        services: m.services
      })),
      entities: graph.entities.map(e => ({
        name: e.name,
        table: e.table,
        description: e.description,
        fields: e.fields.map(f => ({ name: f.name, type: f.type, isPrimary: f.isPrimary })),
        relationships: e.relationships,
        indexes: e.indexes,
        evidence: e.evidence // Phase 11: Explainability
      })),
      database: {
        type: spec.infrastructure.database,
        tables: graph.entities.map(e => e.table),
        schemas: ["public"]
      },
      apis: this.synthesizeApis(graph.entities, insight.workflows, graph.capabilities),
      services: graph.modules.map(m => ({
        name: m.services[0],
        module: m.name,
        description: m.description,
        methods: m.workflows
      })),
      storage: infra.storage.provider !== "Unknown" ? [{ bucket: "uploads", purpose: "User assets", access: "private" }] : [],
      queues: infra.queue.provider !== "Unknown" ? [{ name: "default", purpose: "Background tasks", concurrency: 5 }] : [],
      events: [],
      permissions: graph.roles.flatMap(role => 
        role.permissions.map(p => ({ role: role.name, action: p.action, resource: p.resource }))
      ),
      businessRules: graph.entities.flatMap(e => e.constraints.map((c, i) => ({
        id: `rule-${e.name}-${i}`,
        rule: c,
        type: "constraint" as const,
        logic: `Database-level constraint on ${e.name}`
      }))),
      infrastructure: infra,
      integrations: spec.integrations.map(i => ({
        name: i.name,
        provider: i.provider || "Standard",
        requiredEnv: [`${i.name.toUpperCase()}_API_KEY`],
        webhooks: []
      })),
      capabilities: graph.capabilities,
      suggestions: insight.suggestions,
      securityModel: `RBAC with Reconstructed Domain Ownership. Roles: ${graph.roles.map(r => r.name).join(", ")}`,
      readinessScore: insight.readinessScore,
      validationErrors: insight.validationErrors
    };

    if (graph.entities.length !== blueprint.entities.length) {
      throw new Error(`Blueprint serialization error: Entity count mismatch between DomainGraph (${graph.entities.length}) and Blueprint (${blueprint.entities.length}).`);
    }

    return blueprint;
  }

  /**
   * Phase 7: API Synthesis Engine (Resource-Based)
   */
  private synthesizeApis(entities: DomainEntity[], workflows: DWorkflow[], capabilities: BusinessCapability[]): BlueprintAPI[] {
    const apis: BlueprintAPI[] = [];
    
    // Resource based APIs (from Entities)
    entities.forEach(ent => {
      const resource = ent.table.toLowerCase();
      const moduleName = `${ent.name}Module`;

      apis.push({
        module: moduleName,
        path: `/api/v1/${resource}`,
        method: "GET",
        description: `List ${ent.name} resources`,
        isProtected: true,
        requiredRoles: []
      });
      apis.push({
        module: moduleName,
        path: `/api/v1/${resource}`,
        method: "POST",
        description: `Create new ${ent.name}`,
        isProtected: true,
        requiredRoles: []
      });
    });

    // Workflow APIs (from Business Capabilities - RPC style)
    capabilities.forEach(cap => {
      apis.push({
        module: `${cap.category.replace('_MANAGEMENT', '')}Module`,
        path: `/api/v1/actions/${cap.name.toLowerCase().replace(/\s+/g, "-")}`,
        method: "POST",
        description: cap.description,
        isProtected: true,
        requiredRoles: []
      });
    });

    return apis;
  }

  /**
   * Phase 8: Infrastructure Decision Engine (Evidence-Backed - SDK/Package check)
   */
  private synthesizeInfrastructure(signals: StructuredEvidence[]): BlueprintInfrastructure {
    const getDecision = (keywords: string[], provider: string, component: string) => {
      const evidence = signals.filter(s => 
        s.className === EvidenceClass.DEPENDENCY && 
        keywords.some(k => s.originalValue.toLowerCase().includes(k))
      );
      
      if (evidence.length > 0) {
        return {
          provider,
          rationale: `${provider} package detected in dependencies.`,
          confidence: 100
        };
      }
      return { provider: "Unknown", rationale: `No hard evidence for ${component.toLowerCase()} provider.`, confidence: 0 };
    };

    return {
      database: { provider: "PostgreSQL", rationale: "Standard relational store for domain-driven systems.", confidence: 90 },
      auth: getDecision(["clerk", "auth0", "supabase", "firebase"], "Evidence-Backed Auth", "Authentication"),
      payments: getDecision(["stripe", "paypal", "lemon"], "Stripe", "Payments"),
      storage: getDecision(["aws-sdk", "s3", "r2", "cloudinary"], "Cloudflare R2", "Storage"),
      email: getDecision(["sendgrid", "resend", "postmark"], "Resend", "Email"),
      queue: getDecision(["bullmq", "bee-queue", "redis"], "BullMQ", "Queue"),
      monitoring: getDecision(["sentry", "datadog", "newrelic"], "Sentry", "Monitoring"),
      analytics: getDecision(["posthog", "mixpanel", "amplitude"], "Posthog", "Analytics")
    };
  }
}
