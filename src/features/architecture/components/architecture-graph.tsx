"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Database,
  Zap,
  Server,
  Globe,
  Lock,
  Search,
  Layers as LayersIcon,
  Cylinder,
  ChevronRight,
  Info,
  X,
  Plus,
  Minus,
  Maximize
} from "lucide-react";
import { BackendBlueprint, BlueprintModule, BlueprintEntity } from "../types";
import { BusinessCapability, SemanticType } from "../domain-intelligence-types";

const Icons = {
  Box,
  Database,
  Zap,
  Server,
  Globe,
  Lock,
  Search,
  Layers: LayersIcon,
  Cylinder,
  ChevronRight,
  Info,
  Plus,
  Minus,
  Maximize
} as const;

interface Node {
  id: string;
  type: "MODULE" | "ENTITY" | "CAPABILITY" | "INFRASTRUCTURE" | "EXTERNAL_SERVICE" | "DATABASE";
  title: string;
  subtitle?: string;
  icon: keyof typeof Icons;
  accent: "blue" | "purple" | "green" | "amber" | "red";
  x: number;
  y: number;
  width: number;
  data: any;
}

interface Edge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
  animated?: boolean;
}

function ArchNode({
  node,
  onClick,
  isSelected
}: {
  node: Node;
  onClick: () => void;
  isSelected: boolean;
}) {
  const Ic = Icons[node.icon] || Icons.Server;
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: node.width,
        minHeight: 64,
        background: "var(--sf-surface)",
        border: isSelected ? "2px solid var(--sf-blue)" : "1px solid var(--sf-border-strong)",
        borderRadius: 12,
        padding: "10px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        boxShadow: isSelected ? "0 8px 24px rgba(0,120,255,0.25)" : "0 4px 12px rgba(0,0,0,0.3)",
        cursor: "pointer",
        userSelect: "none",
        zIndex: isSelected ? 10 : 2,
        transition: "border 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease"
      }}
    >
      <div className="sf-row" style={{ gap: 8, alignItems: "center" }}>
        <div style={{ 
          width: 22, height: 22, borderRadius: 6, 
          background: `var(--sf-${node.accent}-faint)`, 
          display: "flex", alignItems: "center", justifyContent: "center",
          color: `var(--sf-${node.accent})`
        }}>
          <Ic size={12} />
        </div>
        <span className="mono" style={{ fontSize: 9, color: "var(--sf-text-faint)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700 }}>
          {node.type}
        </span>
        <span className="sf-grow" />
        <span className={`sf-dot sf-dot--${node.accent}`} />
      </div>
      <div style={{ 
        fontSize: 14, 
        fontWeight: 600, 
        lineHeight: 1.2, 
        color: "var(--sf-text)", 
        wordBreak: "break-word",
        whiteSpace: "pre-wrap" 
      }}>{node.title}</div>
      {node.subtitle && <div className="mono" style={{ fontSize: 10.5, color: "var(--sf-text-muted)", opacity: 0.8 }}>{node.subtitle}</div>}
    </div>
  );
}

function ArchEdge({
  from,
  to,
  label,
  dashed = false,
  animated = false
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  label?: string;
  dashed?: boolean;
  animated?: boolean;
}) {
  const midY = (from.y + to.y) / 2;
  const path = `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;
  
  return (
    <g>
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.2)" />
        </marker>
      </defs>
      <path
        d={path}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
        fill="none"
        strokeDasharray={dashed ? "5 5" : "none"}
        markerEnd="url(#arrowhead)"
      />
      {animated && (
        <circle r="2.5" fill="var(--sf-blue)">
          <animateMotion dur="2.5s" repeatCount="indefinite" path={path} />
        </circle>
      )}
      {label && (
        <g transform={`translate(${(from.x + to.x) / 2}, ${midY})`}>
          <rect 
            x={-(label.length * 3.8)} 
            y={-9} 
            width={label.length * 7.6} 
            height={18} 
            rx={4} 
            fill="var(--sf-bg)" 
            stroke="var(--sf-border)" 
            strokeWidth="0.5" 
          />
          <text
            y={3.5}
            fill="var(--sf-text-faint)"
            fontSize="10"
            textAnchor="middle"
            style={{ fontFamily: "var(--sf-font-mono)", fontWeight: 500 }}
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
}

export function ArchitectureGraph({ blueprint }: { blueprint: BackendBlueprint }) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const { nodes, edges, width, height } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const horizontalGap = 80;
    const verticalGap = 140;

    const getNodeWidth = (title: string) => Math.max(180, Math.min(260, title.length * 9 + 40));

    // 1. Modules
    const moduleNodes: Node[] = blueprint.modules.map(m => ({
      id: `module-${m.name}`,
      type: "MODULE",
      title: m.name,
      icon: "Box",
      accent: "purple",
      width: getNodeWidth(m.name),
      x: 0, y: 0,
      data: m
    }));

    // 2. Entities
    const entityNodes: Node[] = blueprint.entities.map(e => ({
      id: `entity-${e.name}`,
      type: "ENTITY",
      title: e.name,
      subtitle: e.table,
      icon: "Database",
      accent: "blue",
      width: getNodeWidth(e.name),
      x: 0, y: 0,
      data: e
    }));

    // 3. Capabilities
    const capabilityNodes: Node[] = (blueprint.capabilities || []).map(c => ({
      id: `capability-${c.name}`,
      type: "CAPABILITY",
      title: c.name,
      subtitle: c.category.replace('_MANAGEMENT', '').toLowerCase(),
      icon: "Zap",
      accent: "amber",
      width: getNodeWidth(c.name),
      x: 0, y: 0,
      data: c
    }));

    // 4. Infrastructure
    const infraNodes: Node[] = Object.entries(blueprint.infrastructure)
      .filter(([_, comp]) => comp.provider !== "Unknown")
      .map(([key, comp]) => ({
        id: `infra-${key}`,
        type: key === "database" ? "DATABASE" : "INFRASTRUCTURE",
        title: comp.provider,
        subtitle: key,
        icon: key === "database" ? "Cylinder" : "Server",
        accent: "green",
        width: getNodeWidth(comp.provider),
        x: 0, y: 0,
        data: comp
      }));

    // Layout
    const canvasWidth = 1600;
    
    // Calculate actual bottom boundary for dynamic container height
    let maxLevel = 0;
    if (moduleNodes.length > 0) maxLevel = 1;
    if (entityNodes.length > 0) maxLevel = 2;
    if (capabilityNodes.length > 0) maxLevel = 3;
    if (infraNodes.length > 0) maxLevel = 4;

    const actualContentHeight = maxLevel === 0 ? 400 : 100 + (verticalGap + 64) * (maxLevel - 1) + 64 + 120;
    const canvasHeight = Math.max(800, actualContentHeight);

    const layoutLevel = (levelNodes: Node[], y: number) => {
      const levelWidth = levelNodes.reduce((acc, n) => acc + n.width + horizontalGap, -horizontalGap);
      let currentX = (canvasWidth - levelWidth) / 2;
      levelNodes.forEach(node => {
        node.x = currentX;
        node.y = y;
        currentX += node.width + horizontalGap;
        nodes.push(node);
      });
    };

    layoutLevel(moduleNodes, 100);
    layoutLevel(entityNodes, 100 + verticalGap + 64);
    layoutLevel(capabilityNodes, 100 + (verticalGap + 64) * 2);
    layoutLevel(infraNodes, 100 + (verticalGap + 64) * 3);

    // Edges
    blueprint.modules.forEach(m => {
      m.entities.forEach(entName => {
        edges.push({ from: `module-${m.name}`, to: `entity-${entName}`, label: "manages" });
      });
    });

    blueprint.entities.forEach(ent => {
      ent.relationships?.forEach(rel => {
        edges.push({ from: `entity-${ent.name}`, to: `entity-${rel.target}`, label: rel.type.replace(/-/g, '_'), dashed: true });
      });
    });

    (blueprint.capabilities || []).forEach(cap => {
      if (cap.associatedEntity) {
        edges.push({ from: `entity-${cap.associatedEntity}`, to: `capability-${cap.name}`, label: "defines", animated: true });
      }
    });

    blueprint.entities.forEach(ent => {
      edges.push({ from: `entity-${ent.name}`, to: "infra-database", label: "persists" });
    });

    (blueprint.capabilities || []).forEach(cap => {
      if (cap.category === "AUTHENTICATION") edges.push({ from: `capability-${cap.name}`, to: "infra-auth", label: "integrates" });
      if (cap.category === "PAYMENT_MANAGEMENT") edges.push({ from: `capability-${cap.name}`, to: "infra-payments", label: "triggers" });
    });

    return { nodes, edges, width: canvasWidth, height: canvasHeight };
  }, [blueprint]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform(prev => ({
      ...prev,
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    }));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.2, Math.min(3, prev.scale * delta))
    }));
  }, []);

  const adjustZoom = (delta: number) => {
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.2, Math.min(3, prev.scale * delta))
    }));
  };

  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div 
      className="sf-row sf-grow" 
      style={{ 
        height: Math.min(840, height), 
        minHeight: 560,
        background: "var(--sf-bg)", 
        border: "1px solid var(--sf-border)", 
        borderRadius: 16, 
        overflow: "hidden" 
      }} 
      onClick={() => setSelectedNodeId(null)}
    >
      {/* Canvas */}
      <div className="sf-col sf-grow" style={{ position: "relative", overflow: "hidden", cursor: isDragging ? "grabbing" : "grab" }}>
        <div className="sf-linegrid" style={{ position: "absolute", inset: 0, opacity: 0.3 }} />
        
        {/* Figma-style Toolbar */}
        <div style={{ position: "absolute", bottom: 24, right: 24, display: "flex", gap: 8, zIndex: 30 }}>
           <div className="sf-card" style={{ padding: 6, display: "flex", gap: 4, background: "var(--sf-surface-2)", border: "1px solid var(--sf-border)", borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
              <button onClick={(e) => { e.stopPropagation(); adjustZoom(1.1); }} className="sf-btn sf-btn--ghost" style={{ width: 32, height: 32, padding: 0 }}><Plus size={16} /></button>
              <div className="mono sf-center" style={{ width: 44, fontSize: 11, fontWeight: 600 }}>{Math.round(transform.scale * 100)}%</div>
              <button onClick={(e) => { e.stopPropagation(); adjustZoom(0.9); }} className="sf-btn sf-btn--ghost" style={{ width: 32, height: 32, padding: 0 }}><Minus size={16} /></button>
              <div className="sf-vdivider" style={{ width: 1, height: 20, margin: "auto 4px" }} />
              <button onClick={(e) => { e.stopPropagation(); resetView(); }} title="Reset View" className="sf-btn sf-btn--ghost" style={{ width: 32, height: 32, padding: 0 }}><Maximize size={15} /></button>
           </div>
        </div>

        <div 
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ width: "100%", height: "100%", position: "relative" }}
        >
          <div style={{ 
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: "center center",
            width: "100%",
            height: "100%",
            transition: isDragging ? "none" : "transform 0.15s ease-out"
          }}>
            <div style={{ width, height, position: "relative" }}>
              <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                {edges.map((edge, i) => {
                  const fromNode = nodes.find(n => n.id === edge.from);
                  const toNode = nodes.find(n => n.id === edge.to);
                  if (!fromNode || !toNode) return null;
                  return (
                    <ArchEdge
                      key={`${edge.from}-${edge.to}-${i}`}
                      from={{ x: fromNode.x + (fromNode.width / 2), y: fromNode.y + 64 }}
                      to={{ x: toNode.x + (toNode.width / 2), y: toNode.y }}
                      label={edge.label}
                      dashed={edge.dashed}
                      animated={edge.animated}
                    />
                  );
                })}
              </svg>
              {nodes.map(node => (
                <ArchNode
                  key={node.id}
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ position: "absolute", bottom: 24, left: 24, padding: "12px 16px", background: "var(--sf-surface-2)", borderRadius: 10, border: "1px solid var(--sf-border)", zIndex: 5, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }} className="sf-col">
           <div className="mono sf-faint" style={{ fontSize: 9, textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.08em" }}>Legend</div>
           {[
             { color: "purple", label: "Module" },
             { color: "blue",   label: "Entity" },
             { color: "amber",  label: "Capability" },
             { color: "green",  label: "Infrastructure" }
           ].map(l => (
             <div key={l.label} className="sf-row" style={{ gap: 8, alignItems: "center", padding: "3px 0" }}>
                <span className={`sf-dot sf-dot--${l.color}`} />
                <span style={{ fontSize: 11.5, color: "var(--sf-text-muted)" }}>{l.label}</span>
             </div>
           ))}
        </div>
      </div>

      {/* Inspector Sidebar */}
      {selectedNode && (
        <aside 
          onClick={(e) => e.stopPropagation()}
          style={{ width: 360, borderLeft: "1px solid var(--sf-border)", background: "var(--sf-bg-2)", display: "flex", flexDirection: "column", zIndex: 40 }}
        >
          <div className="sf-row" style={{ padding: "20px 24px", borderBottom: "1px solid var(--sf-border)", justifyContent: "space-between", alignItems: "center" }}>
            <span className="mono sf-faint" style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Inspector</span>
            <button onClick={() => setSelectedNodeId(null)} className="sf-btn sf-btn--ghost sf-btn--sm" style={{ padding: 6 }}><X size={15} /></button>
          </div>
          
          <div className="sf-scroll sf-grow" style={{ padding: 24 }}>
            <div className="sf-row" style={{ gap: 14, marginBottom: 24 }}>
              <div style={{ 
                width: 44, height: 44, borderRadius: 10, 
                background: `var(--sf-${selectedNode.accent}-faint)`, 
                border: `1px solid var(--sf-${selectedNode.accent})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: `var(--sf-${selectedNode.accent})`
              }}>
                {(() => { const Ic = Icons[selectedNode.icon]; return <Ic size={22} />; })()}
              </div>
              <div className="sf-col" style={{ justifyContent: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>{selectedNode.title}</div>
                <div className="mono sf-faint" style={{ fontSize: 10.5, textTransform: "uppercase" }}>{selectedNode.type}</div>
              </div>
            </div>

            <div className="sf-col" style={{ gap: 24 }}>
              <div className="sf-col" style={{ gap: 8 }}>
                <div className="sf-row" style={{ gap: 6, alignItems: "center" }}>
                   <Info size={13} className="sf-blue" />
                   <span className="mono sf-faint" style={{ fontSize: 10.5, textTransform: "uppercase" }}>Information</span>
                </div>
                <p style={{ fontSize: 13.5, color: "var(--sf-text-muted)", lineHeight: 1.5, margin: 0 }}>
                  {selectedNode.type === 'ENTITY' ? (selectedNode.data as BlueprintEntity).description :
                   selectedNode.type === 'CAPABILITY' ? (selectedNode.data as BusinessCapability).description :
                   selectedNode.type === 'MODULE' ? (selectedNode.data as BlueprintModule).description :
                   selectedNode.data.rationale}
                </p>
              </div>

              {selectedNode.type === 'ENTITY' && (
                <>
                  <div className="sf-col" style={{ gap: 10 }}>
                    <span className="mono sf-faint" style={{ fontSize: 10.5, textTransform: "uppercase" }}>Data Schema</span>
                    <div className="sf-card" style={{ padding: 12, background: "var(--sf-bg)" }}>
                       <div className="sf-row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                          <span className="sf-muted" style={{ fontSize: 12 }}>Table Name</span>
                          <span className="mono" style={{ fontSize: 12 }}>{(selectedNode.data as BlueprintEntity).table}</span>
                       </div>
                       <div className="sf-vdivider" style={{ width: "100%", height: 1, margin: "8px 0", opacity: 0.5 }} />
                       <div className="sf-col" style={{ gap: 6 }}>
                          <span className="sf-muted" style={{ fontSize: 11 }}>Key Fields</span>
                          <div className="sf-row" style={{ flexWrap: "wrap", gap: 6 }}>
                            {(selectedNode.data as BlueprintEntity).fields.slice(0, 12).map((f, i) => (
                              <span key={i} className="sf-chip sf-chip--sm" style={{ fontSize: 10 }}>{f.name}</span>
                            ))}
                          </div>
                       </div>
                    </div>
                  </div>

                  {(selectedNode.data as BlueprintEntity).evidence && (
                    <div className="sf-col" style={{ gap: 10 }}>
                       <span className="mono sf-faint" style={{ fontSize: 10.5, textTransform: "uppercase" }}>Chain of Evidence</span>
                       <div className="sf-col" style={{ gap: 6 }}>
                          {(selectedNode.data as BlueprintEntity).evidence?.slice(0, 6).map((ev: any, i: number) => (
                            <div key={i} className="sf-row" style={{ gap: 8, padding: "8px 12px", background: "var(--sf-surface-2)", borderRadius: 8, border: "1px solid var(--sf-border)" }}>
                               <Search size={12} className="sf-blue" />
                               <span className="mono" style={{ fontSize: 10.5 }}>{ev.originalValue}</span>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}
                </>
              )}

              {selectedNode.type === 'CAPABILITY' && (
                <div className="sf-col" style={{ gap: 12 }}>
                   <div className="sf-row" style={{ justifyContent: "space-between", padding: "12px 16px", background: "var(--sf-bg)", borderRadius: 8, border: "1px solid var(--sf-border)" }}>
                      <span className="sf-muted" style={{ fontSize: 12 }}>Architecture Confidence</span>
                      <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: (selectedNode.data as BusinessCapability).confidence > 80 ? "var(--sf-green)" : "var(--sf-amber)" }}>
                        {(selectedNode.data as BusinessCapability).confidence}%
                      </span>
                   </div>
                   <div className="sf-col" style={{ gap: 8 }}>
                      <span className="mono sf-faint" style={{ fontSize: 10.5, textTransform: "uppercase" }}>Related Entity</span>
                      <div className="sf-row" style={{ gap: 10, padding: "12px 16px", background: "var(--sf-surface-2)", borderRadius: 10, border: "1px solid var(--sf-border)", alignItems: "center" }}>
                         <Database size={14} className="sf-blue" />
                         <span style={{ fontSize: 13, fontWeight: 500 }}>{(selectedNode.data as BusinessCapability).associatedEntity || "Global Capability"}</span>
                      </div>
                   </div>
                </div>
              )}
            </div>

            <button className="sf-btn sf-btn--primary" style={{ width: "100%", marginTop: 40, height: 44, fontSize: 13, gap: 10 }}>
              <Search size={16} /> View Full Specification
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
