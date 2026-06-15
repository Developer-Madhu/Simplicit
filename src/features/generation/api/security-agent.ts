import { BackendBlueprint } from "@/features/architecture/types";
import { AnthropicService } from "./anthropic-service";
import { NvidiaService } from "./nvidia-service";
import { resolveProvider } from "./llm-provider";

/**
 * Agent 3 — Security
 * Runs after Agent 2 (Generator) and before Agent 4 (Stability).
 *
 * Phase 1: deterministic static analysis (regex over generated file contents,
 *          no LLM). Phase 2: a single Anthropic call that produces targeted
 *          patches for the auto-fixable findings.
 *
 * Error convention: anything that must reach the user is thrown with a
 * message starting "SecurityError:" (the pipeline catch-all re-throws that
 * prefix). Internal failures (LLM parse errors, network) are logged and
 * swallowed — the issues are still reported, just unpatched.
 */

export type SecurityIssueSeverity = "critical" | "high" | "medium" | "low";

export interface SecurityIssue {
  severity: SecurityIssueSeverity;
  type:
    | "hardcoded-secret"
    | "sql-injection"
    | "unprotected-route"
    | "mass-assignment"
    | "missing-validation"
    | "insecure-cors"
    | "sensitive-log";
  file: string;
  line?: number;
  description: string;
  autoFixable: boolean;
  snippet?: string; // the offending code line, truncated to 120 chars
}

export interface SecurityReport {
  issues: SecurityIssue[];
  autoFixed: number;
  requiresManualReview: SecurityIssue[];
  patchedFiles: Map<string, string>; // files with auto-fixes applied; subset of input generatedFiles
}

export interface SecurityAgentInput {
  generatedFiles: Map<string, string>;
  blueprint: BackendBlueprint;
  generatedPackageJson?: string; // optional; skip package checks if not provided
}

export interface SecurityAgentOutput {
  report: SecurityReport;
  patchedFiles: Map<string, string>; // complete file map with patches applied; caller replaces generatedFiles with this
}

const SECURITY_FIX_SYSTEM_PROMPT = `You are a security code reviewer fixing vulnerabilities in generated NestJS + Drizzle backend code.
You will receive a list of security issues and the relevant file contents.
For each autoFixable issue, generate a targeted fix.

RULES:
- Fix ONLY what is explicitly listed in the issues array
- Do NOT refactor, rename, or restructure anything not related to the issue
- Preserve all existing imports, decorators, and class structure
- For unprotected-route issues: add @UseGuards(JwtAuthGuard) at the class level (not per-method) if more than 2 routes need guarding; otherwise add per-method
- For sql-injection issues: replace raw template literals with parameterized queries using Drizzle's .where(sql\`...\`) with bound params or Drizzle's eq() operator
- For mass-assignment issues: add class-validator decorators (@IsString(), @IsNumber(), @IsOptional(), @IsNotEmpty()) matching the field types already declared

Respond ONLY with a JSON object. No markdown, no explanation.
Schema:
{
  "fixes": [
    {
      "file": "relative/path/to/file.ts",
      "fixedContent": "complete file content with fix applied"
    }
  ]
}`;

export class SecurityAgent {
  async execute(input: SecurityAgentInput): Promise<SecurityAgentOutput> {
    // 1. Static analysis
    const issues = this.runStaticAnalysis(input.generatedFiles, input.blueprint);

    // 2. If no issues: return early with original files unchanged
    if (issues.length === 0) {
      return {
        report: { issues: [], autoFixed: 0, requiresManualReview: [], patchedFiles: new Map() },
        patchedFiles: input.generatedFiles,
      };
    }

    // 3. LLM fix phase (only for autoFixable issues)
    let patchedFiles = new Map(input.generatedFiles);
    let autoFixed = 0;
    const autoFixableIssues = issues.filter((i) => i.autoFixable);

    if (autoFixableIssues.length > 0) {
      try {
        const fixes = await this.generateFixes(autoFixableIssues, input.generatedFiles);
        patchedFiles = this.applyFixes(patchedFiles, fixes);
        autoFixed = fixes.size; // number of files patched
      } catch (err) {
        console.error("SecurityAgent LLM fix phase failed, continuing with original files:", err);
      }
    }

    // 4. Build report
    const requiresManualReview = issues.filter((i) => !i.autoFixable);
    const report: SecurityReport = {
      issues,
      autoFixed,
      requiresManualReview,
      patchedFiles: new Map(
        Array.from(patchedFiles.entries()).filter(
          ([k]) => input.generatedFiles.get(k) !== patchedFiles.get(k)
        )
      ), // only files that changed
    };

    // 5. Throw if critical/high unresolved issues remain
    const unresolvedCriticalOrHigh = issues.filter(
      (i) => (i.severity === "critical" || i.severity === "high") && !i.autoFixable
    );
    if (unresolvedCriticalOrHigh.length > 0) {
      const summary = unresolvedCriticalOrHigh
        .map((i) => `${i.severity.toUpperCase()} ${i.type} in ${i.file}`)
        .join("; ");
      throw new Error(
        `SecurityError: ${unresolvedCriticalOrHigh.length} unresolved critical/high issue(s): ${summary}`
      );
    }

    return { report, patchedFiles };
  }

  // ── Phase 1: static analysis ───────────────────────────────────────

  private runStaticAnalysis(files: Map<string, string>, blueprint: BackendBlueprint): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    for (const [filePath, content] of files.entries()) {
      if (!/\.(ts|js)$/i.test(filePath)) continue;

      if (!filePath.endsWith(".spec.ts")) {
        issues.push(...this.checkHardcodedSecrets(content, filePath));
      }
      issues.push(...this.checkSqlInjection(content, filePath));
      issues.push(...this.checkSensitiveLogs(content, filePath));

      if (filePath.endsWith(".controller.ts")) {
        issues.push(...this.checkUnprotectedRoutes(content, filePath, blueprint));
      }
      if (filePath.endsWith(".dto.ts")) {
        issues.push(...this.checkMassAssignment(content, filePath));
      }
    }

    return issues;
  }

  private checkHardcodedSecrets(content: string, filePath: string): SecurityIssue[] {
    const patterns: RegExp[] = [
      /(password|passwd|pwd)\s*=\s*['"][^'"]{4,}['"]/i,
      /(api_key|apikey|api-key)\s*=\s*['"][^'"]{8,}['"]/i,
      /(secret|token)\s*=\s*['"][^'"]{8,}['"]/i,
      /(private_key|privatekey)\s*=\s*['"][^'"]{8,}['"]/i,
    ];
    const issues: SecurityIssue[] = [];
    const lines = content.split("\n");

    lines.forEach((line, idx) => {
      if (line.includes("process.env.") || line.includes("configService.get(")) return;
      // Empty/undefined assignments are not credentials.
      if (/=\s*(''|""|``|undefined|null)\s*[;,]?\s*$/.test(line)) return;

      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          issues.push({
            severity: "critical",
            type: "hardcoded-secret",
            file: filePath,
            line: idx + 1,
            description: `Possible hardcoded credential ("${match[1]}") assigned a string literal — move it to an environment variable`,
            autoFixable: false,
            snippet: line.trim().slice(0, 120),
          });
          break; // one finding per line
        }
      }
    });

    return issues;
  }

  private checkSqlInjection(content: string, filePath: string): SecurityIssue[] {
    // Raw string interpolation inside SQL-looking template literals. Drizzle's
    // query builder (.select()/.insert()/...) and its tagged sql`` template
    // (which binds params) are safe and must not be flagged.
    const patterns: RegExp[] = [
      /`[^`]*\b(SELECT|INSERT|UPDATE|DELETE)\b[^`]*\$\{/gi,
      /\.query\s*\(\s*`[^`]*\$\{/g,
      /\b(?:db|drizzle)\.execute\s*\(\s*`[^`]*\$\{/g,
    ];
    const issues: SecurityIssue[] = [];
    const seenLines = new Set<number>();

    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(content)) !== null) {
        // Tagged Drizzle template (sql`...`) parameterizes interpolations.
        const backtickIdx = match[0].indexOf("`");
        const tagStart = match.index + backtickIdx;
        if (content.slice(Math.max(0, tagStart - 3), tagStart) === "sql") continue;

        const line = content.slice(0, match.index).split("\n").length;
        if (seenLines.has(line)) continue;
        seenLines.add(line);

        const offendingLine = content.split("\n")[line - 1] ?? match[0];
        issues.push({
          severity: "high",
          type: "sql-injection",
          file: filePath,
          line,
          description:
            "Raw string interpolation inside a SQL template literal — use Drizzle's parameterized sql`` template or query-builder operators",
          autoFixable: true,
          snippet: offendingLine.trim().slice(0, 120),
        });
      }
    }

    return issues;
  }

  private checkUnprotectedRoutes(
    content: string,
    filePath: string,
    blueprint: BackendBlueprint
  ): SecurityIssue[] {
    // Only meaningful when the blueprint has auth configured.
    const authProvider = blueprint.infrastructure?.auth?.provider;
    if (!authProvider || authProvider === "Unknown") return [];

    const fileName = filePath.split("/").pop() ?? filePath;
    if (fileName.includes("health") || fileName.includes("auth.controller")) return [];

    // Health-check controllers by route prefix.
    const controllerMatch = content.match(/@Controller\s*\(\s*['"`]([^'"`]*)['"`]/);
    if (controllerMatch && /^(health|ping|status)/i.test(controllerMatch[1])) return [];

    const lines = content.split("\n");

    // Class-level guard: any @UseGuards( before the class declaration.
    const classDeclIdx = lines.findIndex((l) => /\bexport\s+class\s+\w+|\bclass\s+\w+/.test(l));
    if (classDeclIdx > -1 && lines.slice(0, classDeclIdx + 1).some((l) => l.includes("@UseGuards("))) {
      return [];
    }

    const issues: SecurityIssue[] = [];
    const routeDecorator = /@(Get|Post|Put|Patch|Delete)\s*\(([^)]*)\)/;

    lines.forEach((line, idx) => {
      const m = line.match(routeDecorator);
      if (!m) return;
      if (/health|ping|status|version/i.test(m[2] ?? "")) return;

      // The generator emits @UseGuards() between the HTTP decorator and the
      // method signature, so scan a window around the decorator (3 above,
      // 2 below) rather than only the lines above it.
      const windowLines = lines.slice(Math.max(0, idx - 3), Math.min(lines.length, idx + 3));
      if (windowLines.some((l) => l.includes("@UseGuards("))) return;

      issues.push({
        severity: "high",
        type: "unprotected-route",
        file: filePath,
        line: idx + 1,
        description: `${m[1].toUpperCase()} route has no @UseGuards() at method or class level while auth (${authProvider}) is configured`,
        autoFixable: true,
        snippet: line.trim().slice(0, 120),
      });
    });

    return issues;
  }

  private checkMassAssignment(content: string, filePath: string): SecurityIssue[] {
    // Generated DTO classes are named Create<Entity>Request / Update<Entity>Request
    // (not *Dto), so match on the Create/Update prefix rather than the suffix.
    if (!/class\s+(Create|Update)[A-Z]\w*/.test(content)) return [];

    const hasValidator =
      /@Is(NotEmpty|String|Number|Boolean|Email|UUID|Url|DateString|Optional|Enum)\s*\(/.test(content) ||
      /@(Min|Max|MinLength|MaxLength|Matches)\s*\(/.test(content);
    if (hasValidator) return [];

    return [
      {
        severity: "medium",
        type: "mass-assignment",
        file: filePath,
        description: "DTO missing input validation decorators (class-validator) — fields accept arbitrary input",
        autoFixable: true,
      },
    ];
  }

  private checkSensitiveLogs(content: string, filePath: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const lines = content.split("\n");

    lines.forEach((line, idx) => {
      const m = line.match(/console\.log\s*\((.*)/);
      if (!m) return;
      if (!/(password|token|secret|key|auth)/i.test(m[1] ?? "")) return;

      issues.push({
        severity: "low",
        type: "sensitive-log",
        file: filePath,
        line: idx + 1,
        description: "console.log may leak credentials/tokens — use sanitized console.error in production code",
        autoFixable: false,
        snippet: line.trim().slice(0, 120),
      });
    });

    return issues;
  }

  // ── Phase 2: LLM fix generation ────────────────────────────────────

  private async generateFixes(
    issues: SecurityIssue[],
    files: Map<string, string>
  ): Promise<Map<string, string>> {
    const uniqueFiles = Array.from(new Set(issues.map((i) => i.file))).filter((f) => files.has(f));
    const fileSections = uniqueFiles
      .map((f) => `--- ${f} ---\n${files.get(f)}`)
      .join("\n\n");

    const userMessage = `Security issues found:\n${JSON.stringify(issues, null, 2)}\n\nRelevant file contents:\n${fileSections}`;

    // Provider per the shared cascade (Anthropic preferred, NVIDIA fallback).
    // Both expose the same static chatComplete; 8000 tokens matches the prior
    // raw-fetch budget for full-file rewrites.
    const provider = resolveProvider("security");
    const llm = provider === "nvidia" ? NvidiaService : AnthropicService;
    const raw = await llm.chatComplete(SECURITY_FIX_SYSTEM_PROMPT, userMessage, { max_tokens: 8000 });

    const fixes = new Map<string, string>();
    try {
      // Defensive: strip markdown fences if the model ignored the instruction.
      const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed?.fixes)) {
        throw new Error('Response is missing the "fixes" array');
      }
      for (const fix of parsed.fixes) {
        if (typeof fix?.file !== "string" || typeof fix?.fixedContent !== "string") {
          console.error("SecurityAgent: malformed fix entry skipped:", fix);
          continue;
        }
        if (!files.has(fix.file)) {
          console.error(`SecurityAgent: LLM referenced unknown file path "${fix.file}" — skipped`);
          continue;
        }
        fixes.set(fix.file, fix.fixedContent);
      }
    } catch (err) {
      // Non-fatal: issues still get reported, files stay unpatched.
      console.error("SecurityAgent: failed to parse LLM fix response, keeping original files:", err);
      return new Map();
    }

    return fixes;
  }

  private applyFixes(
    originalFiles: Map<string, string>,
    fixedFiles: Map<string, string>
  ): Map<string, string> {
    const merged = new Map(originalFiles);
    for (const [file, content] of fixedFiles.entries()) {
      if (merged.has(file)) merged.set(file, content);
    }
    return merged;
  }
}
