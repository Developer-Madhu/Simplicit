import Link from "next/link";

const main: React.CSSProperties = {
  flex: 1,
  overflow: "auto",
  background: "var(--sf-bg)",
  color: "var(--sf-text)",
  fontFamily: "var(--sf-font-sans)",
};
const wrap: React.CSSProperties = { maxWidth: 820, margin: "0 auto", padding: "40px 24px 96px" };
const back: React.CSSProperties = { fontSize: 13, color: "var(--sf-text-muted)", textDecoration: "none" };
const h1: React.CSSProperties = { fontSize: 32, fontWeight: 600, letterSpacing: "-0.025em", margin: "24px 0 6px" };
const lede: React.CSSProperties = { fontSize: 14.5, lineHeight: 1.7, color: "var(--sf-text-muted)", margin: "0 0 8px" };
const h2: React.CSSProperties = {
  fontSize: 19,
  fontWeight: 600,
  letterSpacing: "-0.015em",
  margin: "40px 0 12px",
  color: "var(--sf-text)",
};
const p: React.CSSProperties = { fontSize: 14.5, lineHeight: 1.7, color: "var(--sf-text-muted)", margin: "0 0 12px" };
const ul: React.CSSProperties = {
  fontSize: 14.5,
  lineHeight: 1.7,
  color: "var(--sf-text-muted)",
  margin: "0 0 12px",
  paddingLeft: 20,
};
const mono: React.CSSProperties = { fontFamily: "var(--sf-font-mono)", color: "var(--sf-text)" };
const flow: React.CSSProperties = {
  fontFamily: "var(--sf-font-mono)",
  fontSize: 13,
  color: "var(--sf-text)",
  background: "var(--sf-surface)",
  border: "1px solid var(--sf-border)",
  borderRadius: 8,
  padding: "12px 14px",
  margin: "0 0 12px",
  overflowX: "auto",
};
const callout: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.65,
  color: "var(--sf-text-muted)",
  background: "var(--sf-surface)",
  border: "1px solid var(--sf-border)",
  borderRadius: 8,
  padding: "12px 14px",
  margin: "8px 0 0",
};
const q: React.CSSProperties = { fontSize: 14.5, fontWeight: 600, color: "var(--sf-text)", margin: "18px 0 4px" };

export function DocsPage() {
  return (
    <div style={main}>
      <div style={wrap}>
        <Link href="/" style={back}>
          ← Back to home
        </Link>

        <h1 style={h1}>Documentation</h1>
        <p style={lede}>
          Simplicit turns a frontend codebase (or a prompt) into a generated NestJS + Drizzle backend. Here is how to
          use it, what it produces, and where its limits are today.
        </p>

        <h2 style={h2}>1 · How it works</h2>
        <div style={flow}>Upload a ZIP or connect GitHub → analysis → wizard → pipeline → deploy</div>
        <p style={p}>
          You give Simplicit your frontend; it analyzes the code, walks you through a short wizard, runs the generation
          pipeline, and hands you a deployable backend.
        </p>

        <h2 style={h2}>2 · What Simplicit generates</h2>
        <p style={p}>
          A <strong>NestJS + Drizzle ORM</strong> backend on <strong>PostgreSQL</strong>. Every generation includes:
        </p>
        <ul style={ul}>
          <li>An authentication module</li>
          <li>Per-entity CRUD routes</li>
          <li>Typed DTOs with validation</li>
          <li>
            A <span style={mono}>Drizzle</span> schema
          </li>
          <li>
            A typed <span style={mono}>api-client.ts</span> SDK
          </li>
          <li>
            A <span style={mono}>/health</span> endpoint
          </li>
        </ul>

        <h2 style={h2}>3 · The Entity Fields step</h2>
        <p style={p}>
          After analysis, you review the detected entities and their fields. You can add missing fields, correct types,
          and add entirely new entities.
        </p>
        <p style={p}>
          <strong>This is the most important step</strong> — what you confirm here determines exactly what gets built
          (database columns, DTOs, and routes).
        </p>

        <h2 style={h2}>4 · Deploying</h2>
        <ul style={ul}>
          <li>
            Go to <strong>Settings</strong> and paste your <span style={mono}>Railway</span> API token.
          </li>
          <li>
            Click <strong>Deploy</strong> in the IDE.
          </li>
          <li>
            Simplicit creates a GitHub repo, pushes your backend, and connects Railway automatically.
          </li>
        </ul>

        <h2 style={h2}>5 · Current limitations</h2>
        <ul style={ul}>
          <li>
            v1 generates the <strong>initial backend only</strong>. Schema migrations, feature additions, and backend
            updates are on the v2 roadmap.
          </li>
          <li>Test generation may be skipped on the free NVIDIA tier — this is non-fatal; the rest of the backend is unaffected.</li>
          <li>Frontend code analysis works best on React, Next.js, and Vue projects.</li>
        </ul>

        <h2 style={h2}>6 · FAQ</h2>

        <p style={q}>Is my code stored?</p>
        <p style={p}>
          Your code is analyzed to design your backend, and your project files are saved to your account so you can
          view and edit them. It is <strong>never used for AI training</strong>.
        </p>

        <p style={q}>Can I edit generated files?</p>
        <p style={p}>
          Yes — right-click any generated file in the IDE for <strong>Explain</strong>, <strong>Edit</strong>, or{" "}
          <strong>Delete</strong> options.
        </p>

        <p style={q}>What if the pipeline fails?</p>
        <p style={p}>
          You&apos;ll see a plain-English error with next steps. Click <strong>Retry</strong> to re-run all agents.
        </p>

        <div style={callout}>
          Ready to build? <Link href="/workspace" style={{ ...mono, textDecoration: "underline" }}>Open the workspace →</Link>
        </div>
      </div>
    </div>
  );
}
