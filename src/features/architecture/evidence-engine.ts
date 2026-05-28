import { IngestionResult } from "@/features/ingestion/types";
import { StructuredEvidence, EvidenceClass, getEvidenceQuality } from "./domain-intelligence-types";

export class EvidenceEngine {
  constructor(private result: IngestionResult) {}

  /**
   * Rule #9: HTML / Markdown Sanitization
   */
  private sanitize(text: string): string {
    return text
      .replace(/<[^>]*>?/gm, '') // Remove HTML tags
      .replace(/!\[.*\]\(.*\)/g, '') // Remove Markdown images
      .replace(/\[.*\]\(.*\)/g, '') // Remove Markdown links
      .replace(/#{1,6}\s?/g, '') // Remove Markdown headers
      .replace(/[*_`~]/g, '') // Remove Markdown styling
      .trim();
  }

  /**
   * Phase 1: Extract all available evidence signals with full context
   */
  public extractSignals(): StructuredEvidence[] {
    const signals: StructuredEvidence[] = [];

    // 1. Routes (Rule #7 weight: 0.6)
    this.result.routes.forEach(route => {
      signals.push({
        className: EvidenceClass.ROUTE,
        sourceType: "route",
        originalValue: route.path,
        semanticContext: `Route ${route.path} identified as ${route.kind}.`,
        confidence: 0.6,
        filePath: route.component || undefined,
        reasoning: "Route paths explicitly define top-level entry points and resource boundaries."
      });
    });

    // 2. Data Contracts / State (Rule #7 weight: 0.8)
    for (const [path, content] of this.result.keyFiles) {
      const typeMatches = content.match(/(interface|type)\s+([A-Z]\w+)/g);
      if (typeMatches) {
        typeMatches.forEach(m => {
          const name = m.split(/\s+/)[1];
          signals.push({
            className: EvidenceClass.STATE,
            sourceType: "state",
            originalValue: name,
            semanticContext: `Data structure '${name}' found in ${path}`,
            confidence: 0.8,
            filePath: path,
            reasoning: "Type definitions represent formal data contracts used in the application."
          });
        });
      }
    }

    // 3. UI Components (Rule #7 weight: 0.3)
    this.result.metadata.inferredEntities.forEach(e => {
      e.hints.forEach(hint => {
        signals.push({
          className: EvidenceClass.SOURCE_CODE,
          sourceType: "component",
          originalValue: e.name,
          semanticContext: hint,
          confidence: 0.3,
          reasoning: "UI component naming often reflects the business objects they manipulate."
        });
      });
    });

    // 4. API Usage (Rule #7 weight: 0.9)
    this.result.metadata.apiExpectations.forEach(api => {
      signals.push({
        className: EvidenceClass.API,
        sourceType: "api_call",
        originalValue: api.path,
        semanticContext: `${api.method} call to ${api.path} for ${api.purpose}`,
        confidence: 0.9,
        reasoning: "Outbound API calls explicitly define resource interactions."
      });
    });

    // 5. Documentation (Rule #1 & #7 weight: 0.05 capped)
    if (this.result.simplicitContext) {
      signals.push({
        className: EvidenceClass.DOCUMENTATION,
        sourceType: "documentation",
        originalValue: "simplicit.context.md",
        semanticContext: "Explicit business specification provided.",
        confidence: 0.05,
        reasoning: "User-provided documentation informs investigation but never decides truth."
      });

      this.result.simplicitContext.dataModels.forEach(m => {
        signals.push({
          className: EvidenceClass.DOCUMENTATION,
          sourceType: "documentation",
          originalValue: m.name,
          semanticContext: `Domain model '${m.name}' mentioned in context.`,
          confidence: 0.05,
          reasoning: "Documentation suggests hypotheses but requires source code verification."
        });
      });
    }

    // 6. Dependencies (Rule #7 weight: 0.8 approx for CONFIG/DEPENDENCY)
    this.result.dependencies.forEach(dep => {
      signals.push({
        className: EvidenceClass.DEPENDENCY,
        sourceType: "dependency",
        originalValue: dep.name,
        semanticContext: `Package '${dep.name}' version ${dep.version} detected.`,
        confidence: 0.8,
        reasoning: "Package dependencies provide hard evidence for infrastructure usage."
      });
    });

    // 7. Form Interactions (Rule #7 weight: 0.8)
    if (this.result.metadata.intent.hasForms) {
       signals.push({
         className: EvidenceClass.FORM,
         sourceType: "form",
         originalValue: "User Form",
         semanticContext: "Input forms detected in metadata.",
         confidence: 0.8,
         reasoning: "Forms represent business data entry points."
       });
    }

    // Assign quality to all signals
    signals.forEach((s: any) => {
      s.quality = getEvidenceQuality(s.className, s.sourceType);
    });

    return signals;
  }
}
