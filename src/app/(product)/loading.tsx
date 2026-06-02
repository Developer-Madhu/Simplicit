/**
 * Navigation loading state for all product routes.
 * Next.js App Router renders this (the nearest Suspense fallback) the moment a
 * user navigates into a (product) route, until the destination page is ready —
 * so navigation always shows immediate feedback. The sidebar/layout persists.
 */
export default function ProductLoading() {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        background: "var(--sf-bg)",
        color: "var(--sf-text-faint)",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          border: "2px solid var(--sf-border-strong)",
          borderTopColor: "var(--sf-text)",
          animation: "sf-nav-spin 0.7s linear infinite",
        }}
      />
      <span className="mono" style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        Loading…
      </span>
      <style>{`@keyframes sf-nav-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
