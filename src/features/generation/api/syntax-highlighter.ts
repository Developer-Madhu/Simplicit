/**
 * A fast, lightweight, client-safe TypeScript syntax highlighter that matches
 * Simplicit's default token classes (tok-kw, tok-fn, tok-str, tok-num, tok-cmt, tok-type, tok-prop).
 */
export function highlightTypeScript(code: string | string[]): string[] {
  const lines = Array.isArray(code) ? code : code.split("\n");

  return lines.map((line) => {
    // 1. Escape HTML entities
    let escaped = line
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // 2. Comments (match first to avoid styling symbols inside comments)
    if (escaped.trim().startsWith("//") || escaped.trim().startsWith("/*")) {
      return `<span class="tok-cmt">${escaped}</span>`;
    }

    // 3. String literals (match double, single, and template quotes)
    escaped = escaped.replace(/(["'`])(.*?)\1/g, (match, quote, str) => {
      return `<span class="tok-str">${quote}${str}${quote}</span>`;
    });

    // 4. Keywords list
    const keywords = [
      "import", "from", "export", "const", "let", "var", "function", "return",
      "async", "await", "default", "type", "interface", "class", "extends",
      "implements", "new", "null", "undefined", "true", "false", "typeof",
      "instanceof", "as", "select", "insert", "delete", "update"
    ];

    // Highlight keywords with boundary matching
    keywords.forEach((kw) => {
      const reg = new RegExp(`\\b(${kw})\\b`, "g");
      escaped = escaped.replace(reg, `<span class="tok-kw">$1</span>`);
    });

    // 5. Numbers
    escaped = escaped.replace(/\b(\d+)\b/g, `<span class="tok-num">$1</span>`);

    // 6. Function calls (e.g. name())
    escaped = escaped.replace(/(\b\w+)(?=\s*\()/g, `<span class="tok-fn">$1</span>`);

    // 7. Property accessors/keys (e.g. key:)
    escaped = escaped.replace(/(\b\w+)(?=\s*:)/g, `<span class="tok-prop">$1</span>`);

    return escaped;
  });
}
