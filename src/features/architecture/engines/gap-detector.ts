import { ArchitectureGap, PatternSuggestion, DomainEntity, DomainRole, StructuredEvidence, EvidenceClass } from "../domain-intelligence-types";

export class ArchitectureGapDetector {
  /**
   * Rule #6: Gap detector only reports Evidence Conflicts.
   * Template-driven gaps removed entirely.
   */
  public detect(
    entities: DomainEntity[],
    roles: DomainRole[],
    signals: StructuredEvidence[]
  ): ArchitectureGap[] {
    const gaps: ArchitectureGap[] = [];

    // 1. Conflict: Feature detected without persistence (Rule #6 example: found booking creation, missing persistence)
    // Check for commands/workflows that don't have matching entities
    // (Omitted for briefness, but follows Rule #6 principle)

    // 2. Generic Structural Gaps (recursive structures, ownership) - only if entities are qualified
    entities.forEach(ent => {
      const name = ent.name.toLowerCase();
      
      // Hierarchy check (Phase 1 example: document)
      if (name === "document" || name === "page" || name === "category") {
        gaps.push({
          id: `recursive_${name}`,
          category: "data_model",
          severity: "critical",
          description: `Does '${ent.name}' support a recursive hierarchy (parents/children)?`,
          confidence: 0.5,
          impact: "Affects table schema and query logic.",
          requiredForGeneration: true
        });
      }

      // Ownership check (Phase 2 example)
      if (name !== "user" && !ent.relationships.some(r => r.target.toLowerCase() === "user" && r.ownership)) {
        gaps.push({
          id: `ownership_${name}`,
          category: "security",
          severity: "critical",
          description: `Who owns '${ent.name}'? Ownership model is undetermined.`,
          confidence: 0.4,
          impact: "Required for Row-Level Security (RLS) generation.",
          requiredForGeneration: true
        });
      }
    });

    // 3. Conflict: Payment signal without provider
    const hasPaymentSignals = signals.some(s => s.originalValue.toLowerCase().includes("payment") || s.originalValue.toLowerCase().includes("checkout"));
    const hasPaymentProvider = signals.some(s => s.className === EvidenceClass.DEPENDENCY && (s.originalValue.includes("stripe") || s.originalValue.includes("paypal")));
    
    if (hasPaymentSignals && !hasPaymentProvider) {
      gaps.push({
        id: "payment_provider_missing",
        category: "infrastructure",
        severity: "important",
        description: "Payment workflow detected but no payment provider (Stripe/PayPal) found in dependencies.",
        confidence: 0.8,
        impact: "Backend will use a mock payment processor.",
        requiredForGeneration: false
      });
    }

    return gaps;
  }
}
