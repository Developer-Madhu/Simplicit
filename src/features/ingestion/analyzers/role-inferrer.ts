import type { InferredRole, DetectedRoute } from "../types";

export function inferRoles(routes: DetectedRoute[], files: Map<string, string>): InferredRole[] {
  const roles = new Map<string, InferredRole>();

  const addRole = (name: string, desc: string, conf: "Strong evidence" | "Partial evidence" | "Heuristic inference") => {
    if (!roles.has(name) || roles.get(name)!.confidence !== "Strong evidence") {
      roles.set(name, { name, description: desc, confidence: conf, evidence: [] });
    }
  };

  for (const route of routes) {
    if (route.category === "admin" || route.path.includes("admin") || route.path.includes("manage")) {
      addRole("Administrator", "Manages platform configuration and oversees entities.", "Strong evidence");
    }
    if (route.path.includes("instructor") || route.path.includes("teacher")) {
      addRole("Instructor", "Creates and manages educational content.", "Strong evidence");
    }
    if (route.path.includes("student") || route.path.includes("learner")) {
      addRole("Student", "Consumes educational content and tracks progress.", "Strong evidence");
    }
    if (route.path.includes("customer") || route.path.includes("buyer")) {
      addRole("Customer", "Purchases products or services.", "Strong evidence");
    }
  }

  for (const [path, content] of files) {
    if (!/\.(tsx|jsx|ts|js)$/.test(path)) continue;
    const lower = content.toLowerCase();
    
    if (lower.includes("role === 'admin'") || lower.includes("isadmin") || lower.includes("roles.admin")) {
      addRole("Administrator", "System Administrator", "Strong evidence");
    }
    if (lower.includes("role === 'manager'") || lower.includes("ismanager")) {
      addRole("Manager", "Department or System Manager", "Partial evidence");
    }
    if (lower.includes("role === 'moderator'") || lower.includes("ismoderator")) {
      addRole("Moderator", "Content or Community Moderator", "Partial evidence");
    }
    if (lower.includes("role === 'guest'") || lower.includes("isguest") || lower.includes("unauthenticated")) {
      addRole("Guest", "Unauthenticated Visitor", "Partial evidence");
    }
    if (lower.includes("organization") || lower.includes("tenant_id") || lower.includes("org_id")) {
      addRole("Organization Admin", "B2B Tenant Administrator", "Partial evidence");
    }
  }

  if (roles.size === 0) {
    addRole("User", "Standard authenticated user profile.", "Heuristic inference");
  }

  return Array.from(roles.values());
}
