/**
 * prompt-sanitizer.ts
 * Sanitizes user prompt input before it reaches the generation API.
 * Purpose: protect generation quality and prevent data leakage.
 * NOT designed as a general LLM security layer.
 */

export interface SanitizeResult {
  clean: string;
  blocked: boolean;
  reason: string | null;
  warnings: string[];
}

// Patterns that indicate accidental sensitive data paste
const SENSITIVE_DATA_PATTERNS = [
  { pattern: /sk-[a-zA-Z0-9]{20,}/g, label: "OpenAI API key" },
  { pattern: /ghp_[a-zA-Z0-9]{36}/g, label: "GitHub token" },
  { pattern: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, label: "JWT token" },
  { pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/g, label: "Private key" },
  { pattern: /AKIA[A-Z0-9]{16}/g, label: "AWS access key" },
  { pattern: /password\s*[:=]\s*['"]?[^\s'"]{8,}/gi, label: "Hardcoded password" },
];

// Patterns that indicate prompt injection attempts.
// NARROW set — only phrases that try to override system behavior.
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /you\s+are\s+now\s+(a|an)\s+\w+/i,
  /disregard\s+(your\s+)?(previous\s+)?instructions/i,
  /system\s*prompt\s*:/i,
  /\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/i, // LLM control tokens
];

// Hidden Unicode control/override characters (zero-width space, ZWNJ,
// right-to-left override, BOM, etc.). Built from a string so the escape
// sequences stay intact in source.
const HIDDEN_UNICODE = new RegExp(
  "[\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\uFEFF]",
  "g"
);

export function sanitizePrompt(raw: string): SanitizeResult {
  const warnings: string[] = [];
  let clean = raw ?? "";

  // 1. Normalize whitespace — collapse excessive newlines/spaces
  clean = clean.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  clean = clean.replace(/\n{4,}/g, "\n\n\n"); // max 3 consecutive newlines
  clean = clean.replace(/[ \t]{10,}/g, "   "); // max 9 spaces inline
  clean = clean.trim();

  // 2. Strip hidden Unicode control/override characters
  clean = clean.replace(HIDDEN_UNICODE, "");

  // 3. Check for sensitive data — BLOCK and warn (do not log the value)
  for (const { pattern, label } of SENSITIVE_DATA_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(clean)) {
      return {
        clean: "",
        blocked: true,
        reason: `Your prompt appears to contain a ${label}. Remove it before submitting.`,
        warnings: [],
      };
    }
    pattern.lastIndex = 0;
  }

  // 4. Check for prompt injection — BLOCK
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        clean: "",
        blocked: true,
        reason:
          "Your prompt contains text that cannot be processed. Please describe your backend requirements directly.",
        warnings: [],
      };
    }
  }

  // 5. Length check — warn but do not block (UI enforces the hard limit)
  if (clean.length > 2000) {
    warnings.push("Long prompts may reduce generation accuracy. Consider being more concise.");
  }
  if (clean.length < 10) {
    warnings.push("Very short prompts produce generic backends. Add more detail.");
  }

  return { clean, blocked: false, reason: null, warnings };
}

// Wrap user prompt inside a structural delimiter for the LLM.
// This prevents the user content from being parsed as instructions.
export function wrapPromptForLLM(sanitizedPrompt: string): string {
  return `<user_requirements>\n${sanitizedPrompt}\n</user_requirements>`;
}
