import { SemanticType, StructuredEvidence, EvidenceClass } from "../domain-intelligence-types";

export interface QualificationResult {
  passed: boolean;
  score: number;
  reason: string;
  threshold?: number;
  rejectionReason?: string;
  evidenceBreakdown?: Record<string, number>;
}

export class EntityQualifier {
  /**
   * Entity Score Model Weights
   */
  private scoreWeights: Record<EvidenceClass, number> = {
    [EvidenceClass.DATABASE]: 40,
    [EvidenceClass.SCHEMA]: 35,
    [EvidenceClass.API]: 30,
    [EvidenceClass.STATE]: 25,
    [EvidenceClass.FORM]: 25,
    [EvidenceClass.ROUTE]: 20,
    [EvidenceClass.SOURCE_CODE]: 10, // Component / Service
    [EvidenceClass.CONFIG]: 5,
    [EvidenceClass.DEPENDENCY]: 5,
    [EvidenceClass.TEST]: 5,
    [EvidenceClass.DOCUMENTATION]: 1
  };

  /**
   * Rule #4 & Persistence Fallacy Fix: Entity promotion requirements using Weighted Score Model
   */
  public qualify(name: string, type: SemanticType, evidence: StructuredEvidence[]): QualificationResult {
    // 1. Never promote workflows or UI artifacts
    if ([SemanticType.UI_COMPONENT, SemanticType.PAGE, SemanticType.WORKFLOW, SemanticType.COMMAND, SemanticType.UNKNOWN].includes(type)) {
      const reason = `Rejected: Classified as ${type}, which is not a domain entity concept.`;
      return {
        passed: false,
        score: 0,
        reason,
        threshold: 60,
        rejectionReason: reason,
        evidenceBreakdown: {}
      };
    }

    // 2. Filter out pure documentation noise (keep for count, but doesn't decide)
    const validEvidence = evidence.filter(e => e.className !== EvidenceClass.DOCUMENTATION);
    
    // 3. Calculate Score based on unique/additive sources with caps
    const evidenceBreakdown: Record<string, number> = {};
    evidence.forEach(e => {
      const cls = e.className;
      const weight = this.scoreWeights[cls] || 0;
      evidenceBreakdown[cls] = (evidenceBreakdown[cls] || 0) + weight;
    });

    let score = 0;
    const MAX_PER_SOURCE_TYPE = 30;
    const cappedBreakdown: Record<string, number> = {};

    Object.keys(evidenceBreakdown).forEach(clsStr => {
      const cls = clsStr as EvidenceClass;
      const rawScore = evidenceBreakdown[cls] || 0;
      const weight = this.scoreWeights[cls] || 0;
      const cap = Math.max(MAX_PER_SOURCE_TYPE, weight);
      const cappedScore = Math.min(rawScore, cap);
      cappedBreakdown[cls] = cappedScore;
      score += cappedScore;
    });

    const THRESHOLD = 60;

    if (score >= THRESHOLD) {
      return {
        passed: true,
        score,
        reason: `Promoted: Score ${score} meets threshold (>= ${THRESHOLD}) across evidence sources.`,
        threshold: THRESHOLD,
        evidenceBreakdown: cappedBreakdown
      };
    } else {
      const reason = `Rejected: Score ${score} below threshold (${THRESHOLD}). Insufficient business evidence.`;
      return {
        passed: false,
        score,
        reason,
        threshold: THRESHOLD,
        rejectionReason: reason,
        evidenceBreakdown: cappedBreakdown
      };
    }
  }
}
