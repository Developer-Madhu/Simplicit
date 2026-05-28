import { StructuredEvidence, EvidenceClass } from "../domain-intelligence-types";

export class ConfidenceEngine {
  /**
   * Rule #7: Confidence must measure Evidence Quality, not Evidence Quantity.
   * Weighting:
   * Database = 1.0
   * API = 0.9
   * Form = 0.8
   * State = 0.8
   * Route = 0.6
   * Component = 0.3
   * Documentation = 0.05
   */
  public calculate(evidence: StructuredEvidence[]): number {
    if (evidence.length === 0) return 0;

    // Use highest quality source as base
    const weights: Record<EvidenceClass, number> = {
      [EvidenceClass.DATABASE]: 1.0,
      [EvidenceClass.SCHEMA]: 1.0,
      [EvidenceClass.API]: 0.9,
      [EvidenceClass.FORM]: 0.8,
      [EvidenceClass.STATE]: 0.8,
      [EvidenceClass.ROUTE]: 0.6,
      [EvidenceClass.SOURCE_CODE]: 0.3,
      [EvidenceClass.CONFIG]: 0.5,
      [EvidenceClass.DEPENDENCY]: 0.8,
      [EvidenceClass.TEST]: 0.7,
      [EvidenceClass.DOCUMENTATION]: 0.05
    };

    const maxWeight = Math.max(...evidence.map(e => weights[e.className] || 0.1));
    
    // Diversity bonus (capped at 0.1)
    const sources = new Set(evidence.map(e => e.className));
    const diversityBonus = sources.size > 1 ? 0.1 : 0;

    return Math.min(1.0, maxWeight + diversityBonus);
  }
}
