import { StructuredEvidence } from "../domain-intelligence-types";

export interface InfraDecision {
  provider: string;
  confidence: number;
  evidence: StructuredEvidence[];
}

export class InfraVerifier {
  /**
   * Sprint 6: Verify infrastructure recommendations based on hard evidence (SDKs, deps)
   */
  public verify(component: string, signals: StructuredEvidence[]): InfraDecision {
    const deps = signals.filter(s => s.sourceType === "dependency");
    const lowerComponent = component.toLowerCase();

    // 1. Payment Verification
    if (lowerComponent.includes("payment")) {
      const stripeDep = deps.find(d => d.originalValue.includes("stripe"));
      if (stripeDep) {
        return { provider: "Stripe", confidence: 1.0, evidence: [stripeDep] };
      }
      const paypalDep = deps.find(d => d.originalValue.includes("paypal"));
      if (paypalDep) {
        return { provider: "PayPal", confidence: 1.0, evidence: [paypalDep] };
      }
    }

    // 2. Auth Verification
    if (lowerComponent.includes("auth")) {
      const clerkDep = deps.find(d => d.originalValue.includes("clerk"));
      if (clerkDep) return { provider: "Clerk", confidence: 1.0, evidence: [clerkDep] };
      
      const supabaseDep = deps.find(d => d.originalValue.includes("supabase"));
      if (supabaseDep) return { provider: "Supabase Auth", confidence: 1.0, evidence: [supabaseDep] };
    }

    // 3. Analytics
    if (lowerComponent.includes("analytics")) {
      const posthogDep = deps.find(d => d.originalValue.includes("posthog"));
      if (posthogDep) return { provider: "Posthog", confidence: 1.0, evidence: [posthogDep] };
    }

    // 4. Fallback (Sprint 6: No guessing permitted)
    return { 
      provider: "Unknown", 
      confidence: 0.1, 
      evidence: [] 
    };
  }
}
