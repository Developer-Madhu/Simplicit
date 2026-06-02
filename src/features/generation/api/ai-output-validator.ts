/**
 * AI Output Validator
 * Performs safety checks on AI-generated code before project assembly.
 * Ensures the AI remains an implementer and doesn't mutate architecture.
 */
export class AIOutputValidator {
  public static validate(
    code: string,
    allowedRepositories: string[],
    allowedDtos: string[]
  ): { isValid: boolean; error?: string } {
    // 1. Basic Syntax Check (simplified for MVP)
    if (!code || code.trim().length === 0) {
      return { isValid: false, error: "Empty implementation received from AI." };
    }

    // 2. Structural Constraint Checks
    const forbiddenKeywords = ["pgTable", "pgEnum", "Controller", "Module", "Injectable"];
    for (const kw of forbiddenKeywords) {
      if (code.includes(`@${kw}`) || code.includes(`${kw}(`)) {
         return { isValid: false, error: `AI attempted to define architecture artifact: ${kw}` };
      }
    }

    // 3. Dependency Check (Heuristic)
    // Ensure AI uses provided repositories and not random ones
    const repoMatch = code.match(/this\.\w+Repo/g);
    if (repoMatch) {
        for (const match of repoMatch) {
            const repoName = match.replace('this.', '').replace('Repo', '');
            if (!allowedRepositories.some(r => r.toLowerCase().includes(repoName.toLowerCase()))) {
                return { isValid: false, error: `AI referenced unknown repository: ${match}` };
            }
        }
    }

    return { isValid: true };
  }
}
