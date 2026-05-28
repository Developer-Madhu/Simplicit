"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

export interface CodeBlockProps {
  language?: string;
  lines: string[];
  showLineNumbers?: boolean;
  scroll?: boolean;
  height?: number | string;
  title?: string;
  actions?: React.ReactNode;
  showCopy?: boolean;
}

export function CodeBlock({
  language = "ts",
  lines = [],
  showLineNumbers = true,
  scroll = false,
  height,
  title,
  actions,
  showCopy = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    // Strip HTML tags to get raw code text
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = lines.join("\n");
    const rawText = tempDiv.textContent || tempDiv.innerText || "";
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="sf-code" style={{ overflow: "hidden", display: "flex", flexDirection: "column", height: height || "auto" }}>
      {(title || actions || showCopy) && (
        <div className="sf-row" style={{ padding: "8px 12px", borderBottom: "1px solid var(--sf-border)", gap: 8, background: "var(--sf-surface)", flex: "0 0 auto", alignItems: "center" }}>
          {title && <span className="mono" style={{ fontSize: 11, color: "var(--sf-text-muted)" }}>{title}</span>}
          <span className="sf-chip sf-chip-mono" style={{ height: 18, padding: "0 6px", fontSize: 10 }}>{language}</span>
          <span className="sf-grow" />
          {actions}
          {showCopy && (
            <button
              onClick={handleCopy}
              className="sf-btn sf-btn--ghost sf-btn--sm"
              style={{ width: 28, height: 28, padding: 0, justifyContent: "center", minWidth: "auto" }}
              title="Copy Code"
              type="button"
            >
              {copied ? <Check size={12} style={{ color: "var(--sf-green)" }} /> : <Copy size={12} style={{ color: "var(--sf-text-muted)" }} />}
            </button>
          )}
        </div>
      )}
      <pre className="sf-scroll" style={{
        margin: 0, padding: "12px 14px", overflow: scroll ? "auto" : "hidden",
        height: height ? "100%" : "auto", flex: "1 1 auto", whiteSpace: "pre"
      }}>
        {lines.map((ln, i) => (
          <div key={i} style={{ minHeight: "1.65em" }}>
            {showLineNumbers && <span className="ln" style={{ marginRight: 12, color: "var(--sf-text-faint)", userSelect: "none" }}>{i + 1}</span>}
            <span dangerouslySetInnerHTML={{ __html: ln }} />
          </div>
        ))}
      </pre>
    </div>
  );
}
