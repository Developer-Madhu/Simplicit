import Link from "next/link";

export const metadata = {
  title: "Privacy Policy · Simplicit",
  description: "How Simplicit collects, uses, and protects your data.",
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
const mono: React.CSSProperties = { fontFamily: "var(--sf-font-mono)", color: "var(--sf-text)" };

export default function PrivacyPage() {
  return (
    <div style={page}>
      <div style={wrap}>
        <Link href="/" style={back}>
          ← Back to home
        </Link>

        <h1 style={h1}>Privacy Policy</h1>
        <p style={updated}>Last updated: June 15, 2026</p>

        <p style={p}>
          This policy explains what data Simplicit collects, how your uploaded code is handled, and the third-party
          services involved in generating and deploying your backend.
        </p>

        <h2 style={h2}>Information we collect</h2>
        <ul style={ul}>
          <li>
            <strong>Account email</strong> — used to authenticate you and associate projects with your account.
          </li>
          <li>
            <strong>Uploaded code</strong> — the frontend project or specification you provide (ZIP upload, GitHub
            import, or context file) so Simplicit can analyze it and design a matching backend.
          </li>
        </ul>

        <h2 style={h2}>How your uploaded code is handled</h2>
        <p style={p}>
          Your uploaded code is analyzed to design your backend (entities, routes, schema). The{" "}
          <strong>raw source you upload is never sent to the AI models</strong> that generate the backend — those
          models receive only a structured, derived summary of your project — and your code is{" "}
          <strong>never used to train any AI model</strong>.
        </p>
        <p style={p}>
          The files you upload are saved as part of your project so you can view them in the editor alongside the
          generated output. They are retained until you delete the project (see <em>Data retention</em> below).
        </p>

        <h2 style={h2}>Third-party services</h2>
        <ul style={ul}>
          <li>
            <span style={mono}>Supabase</span> — authentication and database (stores your account and projects).
          </li>
          <li>
            <span style={mono}>Anthropic</span> / <span style={mono}>NVIDIA</span> — AI generation of business logic,
            security review, and tests.
          </li>
          <li>
            <span style={mono}>Railway</span> — optional deployment of your generated backend, when you choose to
            deploy.
          </li>
        </ul>

        <h2 style={h2}>Data retention</h2>
        <p style={p}>
          Your projects — including the files you uploaded and the backend Simplicit generated — are stored in your
          account until you delete them. Deleting a project removes its associated data.
        </p>

        <h2 style={h2}>Contact</h2>
        <p style={p}>
          Questions about privacy or your data? Email us at <span style={mono}>you@simplicit.dev</span>.
        </p>
      </div>
    </div>
  );
}
