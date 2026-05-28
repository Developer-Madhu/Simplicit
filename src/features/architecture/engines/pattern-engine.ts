import { PatternSuggestion, StructuredEvidence, EvidenceClass } from "../domain-intelligence-types";

export class PatternRecognitionEngine {
  private patterns: any[] = [
    {
      id: "workspace_system",
      name: "Document Workspace System (Notion-like)",
      description: "A hierarchical document management system with collaboration and nested structures.",
      expectedEntities: ["Workspace", "Document", "Member", "Page"],
      exclusiveSignals: ["recursive", "hierarchy", "nested", "blocks", "sharing"],
      activationThreshold: 60
    },
    {
      id: "booking_marketplace",
      name: "Booking Marketplace (Airbnb-like)",
      description: "A two-sided marketplace for listings, availability, and reservations.",
      expectedEntities: ["Listing", "Booking", "Review", "Payment"],
      exclusiveSignals: ["availability", "host", "guest", "stay", "reservation"],
      activationThreshold: 60
    },
    {
      id: "learning_platform",
      name: "Learning Platform (LMS)",
      description: "Educational system for courses, lessons, enrollments, and assessments.",
      expectedEntities: ["Course", "Lesson", "Enrollment", "Student", "Instructor"],
      exclusiveSignals: ["lesson", "curriculum", "grade", "proctor", "enrolled"],
      activationThreshold: 60
    }
  ];

  /**
   * Rule #5: Pattern Activation Requires Exclusive Evidence
   * Rule #2: Patterns become advisory recommendations
   */
  public recognize(signals: StructuredEvidence[]): PatternSuggestion[] {
    const suggestions: PatternSuggestion[] = [];

    this.patterns.forEach(p => {
      let score = 0;
      const matchingEvidence: StructuredEvidence[] = [];
      let exclusiveFound = false;

      signals.forEach(sig => {
        const val = sig.originalValue.toLowerCase();
        
        // Skip low-quality signals for pattern activation (Rule #1: Documentation capped)
        if (sig.className === EvidenceClass.DOCUMENTATION && sig.confidence <= 0.05) return;

        const isExclusive = p.exclusiveSignals.some((s: string) => val.includes(s));
        if (isExclusive) {
          exclusiveFound = true;
          score += sig.confidence * 40; // Exclusive signals weighted heavily
          matchingEvidence.push(sig);
        } else if (p.expectedEntities.some((e: string) => val.includes(e.toLowerCase()))) {
          score += sig.confidence * 15;
          matchingEvidence.push(sig);
        }
      });

      // Rule #5: Must find exclusive evidence
      if (exclusiveFound && score >= p.activationThreshold) {
        suggestions.push({
          id: p.id,
          name: p.name,
          description: p.description,
          expectedEntities: p.expectedEntities,
          expectedModules: [], // Legacy
          expectedIntegrations: [],
          confidence: Math.min(100, Math.round(score)),
          evidence: matchingEvidence,
          isAdvisory: true
        });
      }
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }
}
