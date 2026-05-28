import { StructuredEvidence, DomainEntity, DomainRole, DomainWorkflow } from "./domain-intelligence-types";

// UI patterns to reject as entities
const UI_REJECT_PATTERNS = [
  "form", "modal", "card", "section", "layout", "page", "button", 
  "input", "dropdown", "select", "toggle", "switch", "wrapper",
  "container", "provider", "context", "handler", "event",
  "create", "update", "delete", "edit", "list", "show", "hide",
  "login", "logout", "register", "signup", "signin", "auth"
];

export class DomainDiscoveryEngine {
  /**
   * Phase 2: Resolve entities and roles from evidence
   */
  public discoverEntities(signals: StructuredEvidence[]): DomainEntity[] {
    const conceptMap = new Map<string, { evidence: StructuredEvidence[], confidence: number }>();

    signals.forEach(sig => {
      const concepts = this.extractConcepts(sig);
      concepts.forEach(concept => {
        const normalized = this.normalizeConcept(concept);
        if (this.shouldRejectConcept(normalized)) return;

        if (!conceptMap.has(normalized)) {
          conceptMap.set(normalized, { evidence: [], confidence: 0 });
        }
        const data = conceptMap.get(normalized)!;
        data.evidence.push(sig);
        data.confidence += this.calculateScore(sig);
      });
    });

    return Array.from(conceptMap.entries()).map(([name, data]) => ({
      name,
      table: this.pluralize(name.toLowerCase()),
      type: "ENTITY" as any,
      description: `Discovered domain entity representing ${name}`,
      fields: [],
      relationships: [],
      indexes: ["id"],
      constraints: [],
      confidence: Math.min(100, data.confidence),
      evidence: data.evidence,
      qualificationPassed: false,
      qualificationScore: data.confidence,
      reasoning: `Inferred from ${data.evidence.length} distinct signals across the repository.`
    }));
  }

  public discoverRoles(signals: StructuredEvidence[]): DomainRole[] {
    const roleMap = new Map<string, { evidence: StructuredEvidence[], confidence: number }>();

    signals.forEach(sig => {
      const roles = this.extractRoles(sig);
      roles.forEach(role => {
        if (!roleMap.has(role)) {
          roleMap.set(role, { evidence: [], confidence: 0 });
        }
        const data = roleMap.get(role)!;
        data.evidence.push(sig);
        data.confidence += this.calculateScore(sig);
      });
    });

    return Array.from(roleMap.entries()).map(([name, data]) => ({
      name,
      description: `System role for ${name}`,
      permissions: [],
      evidence: data.evidence,
      reasoning: `Role inferred from usage patterns and system architecture.`
    }));
  }

  private extractConcepts(sig: StructuredEvidence): string[] {
    const concepts: string[] = [];
    // Extract from signal string (e.g. "/rooms" -> ["room"])
    const words = sig.originalValue.split(/[\/\-_ ]/).filter(w => w.length > 2);
    words.forEach(w => {
      const clean = w.replace(/[^a-zA-Z]/g, "");
      if (clean) concepts.push(this.singularize(clean));
    });
    return concepts;
  }

  private extractRoles(sig: StructuredEvidence): string[] {
    const roles: string[] = [];
    const signals = sig.originalValue.toLowerCase();
    const context = sig.semanticContext?.toLowerCase() || "";

    if (signals.includes("admin") || context.includes("admin")) roles.push("Admin");
    if (signals.includes("host") || context.includes("host")) roles.push("Host");
    if (signals.includes("guest") || context.includes("guest")) roles.push("Guest");
    if (signals.includes("user") || context.includes("user")) roles.push("User");

    return roles;
  }

  private normalizeConcept(concept: string): string {
    return concept.charAt(0).toUpperCase() + concept.slice(1).toLowerCase();
  }

  private shouldRejectConcept(concept: string): boolean {
    const lower = concept.toLowerCase();
    return UI_REJECT_PATTERNS.some(p => lower.includes(p)) || lower.length <= 2;
  }

  private calculateScore(sig: StructuredEvidence): number {
    switch (sig.sourceType) {
      case "documentation": return 40;
      case "api_call": return 30;
      case "route": return 20;
      case "form": return 25;
      case "component": return 15;
      default: return 10;
    }
  }

  private singularize(word: string): string {
    const lower = word.toLowerCase();
    if (lower.endsWith("ies")) return lower.slice(0, -3) + "y";
    if (lower.endsWith("s") && !lower.endsWith("ss")) return lower.slice(0, -1);
    return lower;
  }

  private pluralize(word: string): string {
    if (word.endsWith("y")) return word.slice(0, -1) + "ies";
    return word.endsWith("s") ? word : word + "s";
  }
}
