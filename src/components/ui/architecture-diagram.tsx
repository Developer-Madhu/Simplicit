import {
  Cloud,
  Cylinder,
  Database,
  FileText,
  Globe,
  HardDrive,
  Layers3,
  Lock,
  Server,
  Wallet
} from "lucide-react";

import { Card } from "@/components/ui/card";

export interface ArchNodeData {
  id: string;
  kind: string;
  title: string;
  subtitle?: string;
  icon?: string;
  accent?: "amber" | "blue" | "green" | "purple";
  x: number;
  y: number;
}

export type ArchEdgeData = [string, string, string?];

const iconMap: Record<string, any> = {
  Cloud,
  Cylinder,
  Database,
  FileText,
  Globe,
  HardDrive,
  Layers3,
  Lock,
  Server,
  Wallet
};

const accentMap = {
  amber: "bg-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.35)]",
  blue: "bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.35)]",
  green: "bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.35)]",
  purple: "bg-violet-300 shadow-[0_0_10px_rgba(167,139,250,0.35)]"
} as const;

export function ArchitectureDiagram({
  scale = 0.9,
  highlightedIds,
  architectureNodes = [],
  architectureEdges = []
}: {
  scale?: number;
  highlightedIds?: string[];
  architectureNodes?: ArchNodeData[];
  architectureEdges?: ArchEdgeData[];
}) {
  const visibleNodes = highlightedIds
    ? architectureNodes.filter((node) => highlightedIds.includes(node.id))
    : architectureNodes;
  const visibleIds = new Set(visibleNodes.map((node) => node.id));
  const nodeById = Object.fromEntries(architectureNodes.map((node) => [node.id, node]));

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-bg-2">
      <div className="absolute inset-0 bg-line-grid bg-[size:32px_32px] opacity-60" />
      <div
        className="relative h-[340px] origin-top-left"
        style={{ width: 1120 * scale, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        <svg width={1120} height={360} className="absolute left-0 top-0">
          {architectureEdges.map(([fromId, toId, label]) => {
            if (!visibleIds.has(fromId) || !visibleIds.has(toId)) {
              return null;
            }

            const from = nodeById[fromId];
            const to = nodeById[toId];
            const startX = from.x + 160;
            const startY = from.y + 32;
            const endX = to.x;
            const endY = to.y + 32;
            const midX = (startX + endX) / 2;

            return (
              <g key={`${fromId}-${toId}`}>
                <path
                  d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
                  stroke="rgba(255,255,255,0.18)"
                  fill="none"
                />
                {label ? (
                  <text
                    x={midX}
                    y={(startY + endY) / 2 - 8}
                    fill="rgba(255,255,255,0.45)"
                    fontSize="10"
                    textAnchor="middle"
                    style={{ fontFamily: "var(--sf-font-mono)" }}
                  >
                    {label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>

        {visibleNodes.map((node) => {
          const Icon = iconMap[node.icon as keyof typeof iconMap];

          return (
            <Card
              key={node.id}
              className="absolute h-16 w-40 rounded-xl border-border-strong bg-surface px-3 py-2 shadow-panel"
              style={{ left: node.x, top: node.y }}
            >
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-faint">
                <Icon className="h-3.5 w-3.5 text-muted" />
                <span>{node.kind}</span>
                <div className="flex-1" />
                <span className={`h-2.5 w-2.5 rounded-full ${node.accent ? accentMap[node.accent] : accentMap.blue}`} />      
                </div>              <div className="mt-1.5 text-sm font-medium">{node.title}</div>
              <div className="font-mono text-[10px] text-muted">{node.subtitle}</div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

