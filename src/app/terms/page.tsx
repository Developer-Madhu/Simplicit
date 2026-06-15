import Link from "next/link";

export const metadata = {
  title: "Terms of Service · Simplicit",
  description: "The terms that govern your use of Simplicit.",
};

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--sf-bg)",
  color: "var(--sf-text)",
  fontFamily: "var(--sf-font-sans)",
};
const wrap: React.CSSProperties = { maxWidth: 760, margin: "0 auto", padding: "40px 24px 96px" };
const back: React.CSSProperties = { fontSize: 13, color: "var(--sf-text-muted)", textDecoration: "none" };
const h1: React.CSSProperties = { fontSize: 32, fontWeight: 600, letterSpacing: "-0.025em", margin: "28px 0 6px" };
const updated: React.CSSProperties = {
  fontSize: 12,
  color: "var(--sf-text-faint)",
  fontFamily: "var(--sf-font-mono)",
  margin: "0 0 28px",
};
const h2: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  letterSpacing: "-0.01em",
  margin: "34px 0 10px",
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

export default function TermsPage() {
  return (
    <div style={page}>
      <div style={wrap}>
        <Link href="/" style={back}>
          ← Back to home
        </Link>

        <h1 style={h1}>Terms of Service</h1>
        <p style={updated}>Last updated: June 15, 2026</p>

        <p style={p}>
          By using Simplicit, you agree to these terms. Please read them — they describe what Simplicit does, what you
          own, and what you are responsible for.
        </p>

        <h2 style={h2}>Service provided “as is”</h2>
        <p style={p}>
          Simplicit is provided on an “as is” and “as available” basis, without warranties of any kind. We do not
          guarantee the correctness, quality, security, or fitness for any purpose of the code it generates.
        </p>

        <h2 style={h2}>You own your generated code</h2>
        <p style={p}>
          You own all of the backend code Simplicit generates for you. We claim no rights over your generated output.
        </p>

        <h2 style={h2}>Your responsibility</h2>
        <p style={p}>
          You are responsible for reviewing, testing, and securing all generated code before using it in production.
          Treat Simplicit&apos;s output as a starting point that requires your engineering judgment, not a finished
          product.
        </p>

        <h2 style={h2}>Acceptable use</h2>
        <ul style={ul}>
          <li>Do not use Simplicit to generate malicious code, malware, or anything designed to cause harm.</li>
          <li>Do not attempt to circumvent usage limits, rate limits, or other technical restrictions.</li>
          <li>Do not abuse, disrupt, or attempt to gain unauthorized access to the service or other users&apos; data.</li>
        </ul>

        <h2 style={h2}>Account suspension</h2>
        <p style={p}>
          Simplicit reserves the right to suspend or terminate accounts that violate these terms or abuse the service.
        </p>

        <h2 style={h2}>Scope of the current version</h2>
        <p style={p}>
          Simplicit v1 performs <strong>initial backend generation only</strong>. Ongoing management — schema
          migrations, incremental feature additions, and updates to an already-generated backend — is a planned future
          capability (Phase 7 on our roadmap) and is not part of the current service. Generate, review, and own the
          output; continuing evolution of that backend is up to you for now.
        </p>

        <h2 style={h2}>Contact</h2>
        <p style={p}>
          Questions about these terms? Email us at{" "}
          <span style={{ fontFamily: "var(--sf-font-mono)", color: "var(--sf-text)" }}>you@simplicit.dev</span>.
        </p>
      </div>
    </div>
  );
}
