import { ArchitectureGap, StructuredEvidence } from "../domain-intelligence-types";
import { ClarificationQuestion, QuestionOption } from "@/features/ingestion/types";

export class IntelligentClarificationEngine {
  /**
   * Phase 3: Generate architecture-driven questions from gaps.
   */
  public generateQuestions(gaps: ArchitectureGap[]): ClarificationQuestion[] {
    return gaps.map(gap => {
      const options: QuestionOption[] = this.getOptionsForGap(gap);
      
      return {
        id: `q_${gap.id}`,
        category: this.mapCategory(gap.category),
        type: options.length > 0 ? "single-choice" : "free-text",
        text: gap.description,
        options: options,
        reason: gap.impact,
        confidence: "Strong evidence"
      };
    });
  }

  private getOptionsForGap(gap: ArchitectureGap): QuestionOption[] {
    if (gap.id.startsWith("recursive_")) {
      return [
        { label: "Yes, support nesting", value: "recursive" },
        { label: "No, flat structure only", value: "flat" },
        { label: "Not sure", value: "unknown" }
      ];
    }

    if (gap.id.startsWith("ownership_")) {
      return [
        { label: "Created by User", value: "user_owned" },
        { label: "Shared within Workspace", value: "workspace_shared" },
        { label: "Public access", value: "public" }
      ];
    }

    if (gap.id === "payment_provider_missing") {
      return [
        { label: "Stripe", value: "stripe" },
        { label: "PayPal", value: "paypal" },
        { label: "LemonSqueezy", value: "lemonsqueezy" }
      ];
    }

    return [];
  }

  private mapCategory(cat: string): any {
    switch (cat) {
      case "data_model": return "Database";
      case "security": return "Permissions";
      case "infrastructure": return "Integrations";
      default: return "Database";
    }
  }
}
