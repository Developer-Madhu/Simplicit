import { Badge } from "@/components/ui/badge";

const routeColors: Record<string, string> = {
  GET: "text-sky-300 bg-sky-400/10 border-sky-400/20",
  POST: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  PUT: "text-amber-300 bg-amber-400/10 border-amber-400/20",
  PATCH: "text-violet-300 bg-violet-400/10 border-violet-400/20",
  DELETE: "text-rose-300 bg-rose-400/10 border-rose-400/20"
};

export function RoutePill({ method }: { method: string }) {
  return (
    <Badge className={`h-5 min-w-10 justify-center rounded-md border font-mono text-[10px] ${routeColors[method] ?? routeColors.GET}`}>
      {method === "DELETE" ? "DEL" : method}
    </Badge>
  );
}

