import Graph from "graphology";
import louvain from "graphology-communities-louvain";
import type { SimplicitASTGraph } from "../ast/ast-types";

/**
 * GraphAnalyticsEngine
 * ─────────────────────────────────────────────────────────────────────
 * Consumes the existing SimplicitASTGraph (import adjacency already built by
 * ast-graph-builder) and derives structured analytics:
 *   • in/out degree + normalised centrality per file
 *   • god-node ranking (highly-imported hub files)
 *   • community assignments (feature-area clustering)
 *
 * NOTE: community detection uses Louvain (graphology-communities-louvain).
 * The plan originally specified Leiden, but no Leiden package is published
 * for the graphology ecosystem; Louvain is the canonical, API-compatible
 * equivalent and produces near-identical clustering for import graphs.
 */

export interface NodeMetrics {
  filePath: string;
  inDegree: number;
  outDegree: number;
  centralityScore: number; // 0..1, normalised by max in-degree
  isGodNode: boolean;
  communityId: number;
}

export interface CommunityInfo {
  id: number;
  files: string[];
  dominantName: string; // inferred from the most-imported file in the community
}

export interface GraphAnalytics {
  nodeMetrics: Map<string, NodeMetrics>;
  godNodes: NodeMetrics[]; // sorted descending by centralityScore
  communities: CommunityInfo[];
  totalFiles: number;
  totalEdges: number;
}

export class GraphAnalyticsEngine {
  analyze(astGraph: SimplicitASTGraph): GraphAnalytics {
    const graph = new Graph({ type: "directed", multi: false });

    // Build graphology graph from the existing import adjacency map.
    // astGraph.importGraph is Map<filePath, importedFilePaths[]>.
    for (const [source, targets] of astGraph.importGraph.entries()) {
      if (!graph.hasNode(source)) graph.addNode(source);
      for (const target of targets) {
        if (!graph.hasNode(target)) graph.addNode(target);
        // Skip self-imports and duplicate edges (importGraph may repeat).
        if (source !== target && !graph.hasEdge(source, target)) {
          graph.addEdge(source, target);
        }
      }
    }

    // Add nodes for files that appear as components but were never linked
    // through the import graph (so they still get metrics + a community).
    for (const component of astGraph.allComponents ?? []) {
      if (component.filePath && !graph.hasNode(component.filePath)) {
        graph.addNode(component.filePath);
      }
    }

    if (graph.order === 0) {
      // Empty graph — nothing to analyze.
      return {
        nodeMetrics: new Map(),
        godNodes: [],
        communities: [],
        totalFiles: 0,
        totalEdges: 0,
      };
    }

    // In/out degrees per node.
    const inDegrees = new Map<string, number>();
    const outDegrees = new Map<string, number>();
    graph.forEachNode((node) => {
      inDegrees.set(node, graph.inDegree(node));
      outDegrees.set(node, graph.outDegree(node));
    });

    // Normalise centrality to 0..1 by the max in-degree.
    const maxInDegree = Math.max(1, ...Array.from(inDegrees.values()));

    // Community detection via Louvain. Returns { [node]: communityId }.
    let communityAssignments: Record<string, number> = {};
    try {
      communityAssignments = louvain(graph, { resolution: 1.0 });
    } catch {
      // Louvain can fail on trivial/edge-less graphs — fallback: each file
      // becomes its own community (numeric index).
      let idx = 0;
      graph.forEachNode((node) => {
        communityAssignments[node] = idx++;
      });
    }

    // Build NodeMetrics map.
    const GOD_NODE_THRESHOLD = 0.20; // top ~fifth by normalised in-degree
    // Scale minimum in-degree: small projects (< 50 nodes) use 2, larger use 3.
    const MIN_IN_DEGREE_FOR_GOD_NODE = graph.order < 50 ? 2 : 3;

    const nodeMetrics = new Map<string, NodeMetrics>();
    graph.forEachNode((node) => {
      const inDeg = inDegrees.get(node) ?? 0;
      const normScore = inDeg / maxInDegree;
      nodeMetrics.set(node, {
        filePath: node,
        inDegree: inDeg,
        outDegree: outDegrees.get(node) ?? 0,
        centralityScore: normScore,
        isGodNode: normScore >= GOD_NODE_THRESHOLD && inDeg >= MIN_IN_DEGREE_FOR_GOD_NODE,
        communityId: communityAssignments[node] ?? -1,
      });
    });

    // God-node list sorted by centrality descending.
    const allGodNodes = Array.from(nodeMetrics.values())
      .filter((m) => m.isGodNode)
      .sort((a, b) => b.centralityScore - a.centralityScore);

    // Cap god nodes to top 10% of total nodes, minimum 3, maximum 15
    const godNodeCap = Math.min(15, Math.max(3, Math.floor(graph.order * 0.10)));
    const godNodes = allGodNodes.slice(0, godNodeCap);

    // Community summaries.
    const communityMap = new Map<number, string[]>();
    for (const [file, metrics] of nodeMetrics.entries()) {
      const cid = metrics.communityId;
      if (!communityMap.has(cid)) communityMap.set(cid, []);
      communityMap.get(cid)!.push(file);
    }

    const communities: CommunityInfo[] = [];
    for (const [cid, files] of communityMap.entries()) {
      if (cid === -1) continue;
      const mostImported = files
        .map((f) => ({ f, deg: inDegrees.get(f) ?? 0 }))
        .sort((a, b) => b.deg - a.deg)[0];
      const dominantName = deriveNameFromPath(mostImported?.f ?? files[0]);
      communities.push({ id: cid, files, dominantName });
    }

    return {
      nodeMetrics,
      godNodes,
      communities,
      totalFiles: graph.order,
      totalEdges: graph.size,
    };
  }
}

/**
 * Extract a human-readable name from a file path.
 * e.g. "src/features/orders/order-service.ts" → "orders"
 */
function deriveNameFromPath(filePath: string): string {
  if (!filePath) return "unknown";
  const parts = filePath.replace(/\.(ts|tsx|js|jsx)$/, "").split("/");
  const SKIP = new Set(["index", "src", "app", "features", "lib", "utils", "components", "pages"]);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i].replace(/[-_](service|controller|module|component|page|hook|store)$/, "");
    if (!SKIP.has(p) && p.length > 1) return p;
  }
  return parts[parts.length - 1];
}
