import { GenerationPage } from "@/features/generation";

// Tabbed detail view (Overview / Architecture / Schema / API / Auth / Env / Deploy).
// The IDE at /generations/[id] is the default; this remains reachable via the
// "Detail view" button in the IDE header.
export default function GenerationDetailRoute() {
  return <GenerationPage />;
}
