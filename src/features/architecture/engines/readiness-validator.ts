import { DomainInsight, ReadinessBreakdown } from "../domain-intelligence-types";

export class ReadinessValidator {
  /**
   * Phase 7: Weighted readiness score based on multiple dimensions of architectural certainty.
   */
  public validate(insight: Partial<DomainInsight>): { score: number, breakdown: ReadinessBreakdown, errors: string[] } {
    const entities = insight.entities || [];
    const capabilities = insight.capabilities || [];
    const gaps = insight.gaps || [];
    const pattern = (insight.suggestions && insight.suggestions.length > 0) || !!(insight as any).activePattern;
    const errors: string[] = insight.validationErrors ? [...insight.validationErrors] : [];

    const breakdown: ReadinessBreakdown = {
      semanticAccuracy: insight.validationErrors?.length === 0 ? 100 : 60,
      evidenceCoverage: Math.min(100, (insight.evidenceLog?.length || 0) * 5),
      relationshipQuality: entities.some(e => e.relationships.length > 0) ? 90 : 30,
      domainConsistency: pattern ? 100 : 50,
      infraVerification: entities.length ? 80 : 0,
      securityCoverage: gaps.some(g => g.category === "security" && g.severity === "critical") ? 40 : 90,
      architectureCoherence: 100 - (gaps.filter(g => g.severity === "critical").length * 15)
    };

    // Phase 7: Backend Readiness Validator (Weighted score)
    const weights: Record<keyof ReadinessBreakdown, number> = {
      semanticAccuracy: 0.2,
      evidenceCoverage: 0.1,
      relationshipQuality: 0.15,
      domainConsistency: 0.15,
      infraVerification: 0.1,
      securityCoverage: 0.15,
      architectureCoherence: 0.15
    };

    // Rule: Capabilities exist without entities
    if (capabilities.length > 0 && entities.length === 0) {
      breakdown.infraVerification = 0;
      errors.push("Capabilities exist without entities");
    }

    const weightedScore = Object.keys(breakdown).reduce((acc, key) => {
      const k = key as keyof ReadinessBreakdown;
      return acc + (breakdown[k] * weights[k]);
    }, 0);

    let finalScore = Math.round(Math.max(0, Math.min(100, weightedScore)));

    if (entities.length === 0) {
      finalScore = 0;
    }

    if (gaps.some(g => g.severity === 'critical')) {
      errors.push(`Found ${gaps.filter(g => g.severity === 'critical').length} critical gaps.`);
    }

    return { score: finalScore, breakdown, errors };
  }
}
