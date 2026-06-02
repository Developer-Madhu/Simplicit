import type { IngestionResult, ClarificationQuestion, ConfidenceLevel, QuestionOption } from "../types";

/**
 * PHASE 1 — Known Facts Model
 * Derives what we already know from the provided context and code analysis.
 */
function deriveKnownFacts(result: IngestionResult, prompt: string) {
  const promptLower = prompt.toLowerCase();
  const context = result.simplicitContext;
  const metadata = result.metadata;
  const rawCtx = context?.rawMarkdown.toLowerCase() || "";

  // Helper to check for a signal across all inputs
  const getSignal = (keywords: string[]) => {
    const fromPrompt = keywords.some(k => promptLower.includes(k));
    const fromContext = keywords.some(k => rawCtx.includes(k));
    const fromModules = keywords.some(k => metadata.featureModules.some(m => m.name.toLowerCase().includes(k)));
    const fromWorkflows = keywords.some(k => metadata.workflows.some(w => w.name.toLowerCase().includes(k)));
    
    if (fromContext) return "Deterministic";
    if (fromPrompt && fromModules) return "Multi-source confirmation";
    if (fromPrompt || fromModules || fromWorkflows) return "Strong evidence";
    return "Heuristic inference";
  };

  return {
    hasAI: getSignal(["ai", "llm", "openai", "gemini", "anthropic", "generate", "analyze"]),
    hasNotifications: getSignal(["notification", "email", "sms", "push", "resend", "sendgrid"]),
    hasRoles: metadata.roles.length > 0 ? "Deterministic" : "Heuristic inference",
    hasMultiTenancy: getSignal(["multi-tenant", "organization", "team", "workspace"]),
    hasApprovalWorkflows: getSignal(["approval", "review", "approve", "reject"]),
    hasAuditLogs: getSignal(["audit", "history", "log", "activity"]),
    hasPublicSharing: getSignal(["public profile", "share", "public link"]),
    hasAnalytics: getSignal(["analytics", "dashboard", "report", "metric", "chart"]),
    isExamPlatform: getSignal(["exam", "proctoring", "quiz", "student", "instructor"]),
  };
}

/**
 * PHASE 2 — Dynamic Question Generator
 */
export function generateClarificationQuestions(
  result: IngestionResult,
  prompt: string
): ClarificationQuestion[] {
  const facts = deriveKnownFacts(result, prompt);
  const questions: ClarificationQuestion[] = [];

  const addOther = (options: QuestionOption[]): QuestionOption[] => [
    ...options,
    { label: "Other (Custom)", value: "other", description: "Provide a custom requirement", isCustom: true }
  ];

  // 1. User Roles & Permissions
  if (result.metadata.roles.length > 0) {
    questions.push({
      id: "rbac_model",
      category: "User Roles",
      type: "single-choice",
      confidence: "Strong evidence",
      text: "Who should be allowed to manage data?",
      reason: `We identified roles like ${result.metadata.roles.map(r => r.name).join(", ")}. Clarifying permission boundaries.`,
      options: addOther([
        { label: "Administrators only", value: "admin_only" },
        { label: "Resource owners only", value: "owner_only" },
        { label: "Specific custom roles", value: "custom_roles" },
      ])
    });
  }

  // 2. Multi-tenancy / Team Collaboration
  if (facts.hasMultiTenancy !== "Deterministic") {
    questions.push({
      id: "multi_tenancy",
      category: "Multi-tenancy",
      type: "single-choice",
      confidence: facts.hasMultiTenancy as ConfidenceLevel,
      text: "Does the application require isolated team workspaces?",
      reason: "Detected signals of multi-tenant or collaborative workflows.",
      options: addOther([
        { label: "No, single user accounts", value: "single" },
        { label: "Yes, team-based workspaces", value: "teams" },
        { label: "Yes, complex organization hierarchy", value: "orgs" },
      ])
    });
  }

  // 3. AI Features
  if (facts.hasAI !== "Deterministic" && facts.hasAI !== "Heuristic inference") {
    questions.push({
      id: "ai_provider",
      category: "AI Features",
      type: "single-choice",
      confidence: facts.hasAI as ConfidenceLevel,
      text: "Which AI model should power the intelligence layer?",
      reason: "Automated analysis or generation features identified.",
      options: addOther([
        { label: "OpenAI (GPT-4o)", value: "openai" },
        { label: "Anthropic (Claude 3.5)", value: "anthropic" },
        { label: "Google (Gemini 1.5)", value: "gemini" },
      ])
    });
  }

  // 4. Audit Logs / Activity
  if (facts.hasAuditLogs === "Strong evidence" || facts.hasAuditLogs === "Multi-source confirmation") {
     questions.push({
        id: "audit_granularity",
        category: "Audit Logs",
        type: "single-choice",
        confidence: facts.hasAuditLogs as ConfidenceLevel,
        text: "What level of activity tracking is required?",
        reason: "Compliance or history signals detected.",
        options: addOther([
          { label: "Basic CRUD history", value: "basic" },
          { label: "Detailed immutable audit trail", value: "detailed" },
          { label: "None", value: "none" },
        ])
     });
  }

  // 5. Public Sharing
  if (facts.hasPublicSharing === "Strong evidence" || facts.hasPublicSharing === "Multi-source confirmation") {
    questions.push({
      id: "public_visibility",
      category: "Public Sharing",
      type: "single-choice",
      confidence: facts.hasPublicSharing as ConfidenceLevel,
      text: "How should public data visibility be controlled?",
      reason: "Detected requirements for sharing or public profiles.",
      options: addOther([
        { label: "Public by default", value: "public" },
        { label: "Explicit opt-in sharing", value: "opt_in" },
        { label: "Password protected links", value: "password" },
      ])
    });
  }

  // 6. Analytics
  if (facts.hasAnalytics === "Strong evidence" || facts.hasAnalytics === "Multi-source confirmation") {
    questions.push({
      id: "analytics_scope",
      category: "Analytics",
      type: "single-choice",
      confidence: facts.hasAnalytics as ConfidenceLevel,
      text: "What is the primary goal of the analytics dashboard?",
      reason: "Visualization or reporting requirements detected.",
      options: addOther([
        { label: "Real-time system monitoring", value: "realtime" },
        { label: "Business/Usage reporting", value: "business" },
        { label: "User behavior tracking", value: "user_tracking" },
      ])
    });
  }

  // 7. Approval Workflows
  if (facts.hasApprovalWorkflows !== "Deterministic") {
    questions.push({
      id: "approval_process",
      category: "Approval Workflows",
      type: "single-choice",
      confidence: facts.hasApprovalWorkflows as ConfidenceLevel,
      text: "How should data approval or moderation be handled?",
      reason: "Detected business logic requiring verification or review stages.",
      options: addOther([
        { label: "Direct publication (No approval)", value: "direct" },
        { label: "Admin review required", value: "admin_review" },
        { label: "Peer review / Multi-stage", value: "peer_review" },
      ])
    });
  }

  // 8. Integrations
  questions.push({
    id: "external_integrations",
    category: "Integrations",
    type: "multi-choice",
    confidence: "Heuristic inference",
    text: "Which third-party services must be integrated?",
    reason: "Mapping the external ecosystem for API connectivity.",
    options: addOther([
      { label: "GitHub / GitLab", value: "vcs" },
      { label: "Slack / Discord", value: "messaging" },
      { label: "Google Calendar", value: "calendar" },
      { label: "Salesforce / Hubspot", value: "crm" },
    ])
  });

  // 9. Exam Specific (Objective 12)
  if (facts.isExamPlatform === "Strong evidence" || facts.isExamPlatform === "Multi-source confirmation") {
    questions.push({
      id: "exam_proctoring",
      category: "Approval Workflows",
      type: "single-choice",
      confidence: "Strong evidence",
      text: "What level of proctoring/validation is required for exams?",
      reason: "Examination system signals detected.",
      options: addOther([
        { label: "None (Trust-based)", value: "none" },
        { label: "Basic activity tracking", value: "activity" },
        { label: "AI-powered vision/audio monitoring", value: "ai_proctoring" },
      ])
    });
  }

  return questions;
}

/**
 * PHASE 3 — Architecture Mapping
 * Converts raw question answers into structured architectural requirements.
 */
export function mapAnswersToArchitecture(answers: Record<string, string | string[]>) {
  const requirements: any = {
    roles: [],
    permissions: [],
    workflows: [],
    integrations: [],
    security: [],
  };

  for (const [id, value] of Object.entries(answers)) {
    const valStr = Array.isArray(value) ? value.join(", ") : String(value);

    // Security
    if (id === "rbac_model") requirements.security.push({ type: "access_control", model: value });

    // AI
    if (id === "ai_provider") requirements.integrations.push({ type: "ai", provider: value });

    // Notifications
    if (id === "notification_methods") {
      (value as string[]).forEach(v => requirements.workflows.push({ type: "notification", channel: v }));
    }

    // Custom
    if (valStr.startsWith("custom: ")) {
       requirements.security.push({ type: "custom_requirement", detail: valStr.replace("custom: ", "") });
    }
  }

  return requirements;
}
