import { ArchitectureGap, DomainGraph } from "../domain-intelligence-types";

export interface GapQuestionOption {
  label: string;
  value: string;
  isCustom?: boolean;
}

export interface GapQuestion {
  id: string;
  type: "OWNERSHIP" | "RELATIONSHIP" | "HIERARCHY" | "PERMISSION" | "LIFECYCLE";
  entity: string;
  targetEntity?: string;
  question: string;
  reason: string;
  options: GapQuestionOption[];
  gapId: string;
}

export interface GapResolutionAnswer {
  questionId: string;
  value: string;
}

/**
 * Converts critical/blocking ArchitectureGaps into structured user questions.
 */
export function generateGapQuestions(gaps: ArchitectureGap[]): GapQuestion[] {
  // Cover EVERY unresolved detected gap (not only critical ones) so the number
  // of questions scales with the gaps found in the project rather than a fixed,
  // pre-declared set. Higher-severity gaps are asked first.
  const severityRank: Record<string, number> = { critical: 0, important: 1, optional: 2 };
  const sortedGaps = [...gaps]
    .filter((g) => !g.isResolved)
    .sort((a, b) => (severityRank[a.severity] ?? 3) - (severityRank[b.severity] ?? 3));
  const questions: GapQuestion[] = [];

  const extractEntity = (gap: ArchitectureGap): string => {
    if (gap.entityName) return gap.entityName;
    
    // Improved fallback regex for legacy/description-based gaps
    const match = gap.description.match(/(?:Entity|The|owns) ['"]?([A-Z][a-zA-Z0-9_]*)['"]?/i);
    return match ? match[1] : "Resource";
  };
  
  // Sort priority implicitly by checking in order
  
  for (const gap of sortedGaps) {
    if (questions.length >= 50) break; // safety ceiling only — count scales with detected gaps
    
    // 1. Ownership
    if (gap.description.toLowerCase().includes("owner") || gap.description.toLowerCase().includes("belongs to") || gap.description.toLowerCase().includes("owns ")) {
        const entity = extractEntity(gap);

        questions.push({
            id: `ownership_${entity}_${gap.id}`,
            type: "OWNERSHIP",
            entity,
            question: `Who owns ${entity}?`,
            reason: "Required for ownership modeling, RLS policies, and foreign key generation.",
            gapId: gap.id,
            options: [
                { label: `User owns ${entity}`, value: "USER" },
                { label: `Workspace owns ${entity}`, value: "WORKSPACE" },
                { label: `Organization owns ${entity}`, value: "ORGANIZATION" },
                { label: `Team owns ${entity}`, value: "TEAM" },
                { label: "Shared / Public", value: "PUBLIC" },
                { label: "Other", value: "CUSTOM", isCustom: true }
            ]
        });
        continue;
    }
    
    // 2. Relationships
    if (gap.description.toLowerCase().includes("relationship") || gap.description.toLowerCase().includes("relates to")) {
        const entity = extractEntity(gap);
        const targetEntity = "Entity B"; // Needs deeper NLP for perfect extraction, fallback for now
        
        questions.push({
            id: `rel_${entity}_${gap.id}`,
            type: "RELATIONSHIP",
            entity,
            targetEntity,
            question: `How does ${entity} relate to other core entities?`,
            reason: "Required for database schema relationships and query optimization.",
            gapId: gap.id,
            options: [
                { label: "One-to-One", value: "1:1" },
                { label: "One-to-Many", value: "1:N" },
                { label: "Many-to-One", value: "N:1" },
                { label: "Many-to-Many", value: "N:N" },
                { label: "Not Related", value: "NONE" },
            ]
        });
        continue;
    }
    
    // 3. Permissions
    if (gap.description.toLowerCase().includes("permission") || gap.description.toLowerCase().includes("access")) {
        const entity = extractEntity(gap);
        
        questions.push({
            id: `perm_${entity}_${gap.id}`,
            type: "PERMISSION",
            entity,
            question: `Who can access ${entity}?`,
            reason: "Required for generating strict row-level security and API middleware.",
            gapId: gap.id,
            options: [
                { label: "Owner Only", value: "OWNER" },
                { label: "Workspace Members", value: "WORKSPACE" },
                { label: "Organization Members", value: "ORG" },
                { label: "Public Read", value: "PUBLIC_READ" },
                { label: "Public Read/Write", value: "PUBLIC_RW" },
                { label: "Custom", value: "CUSTOM", isCustom: true }
            ]
        });
        continue;
    }
    
    // 4. Hierarchy
    if (gap.description.toLowerCase().includes("hierarchy") || gap.description.toLowerCase().includes("recursive") || gap.description.toLowerCase().includes("parent")) {
        const entity = extractEntity(gap);
        
        questions.push({
            id: `hier_${entity}_${gap.id}`,
            type: "HIERARCHY",
            entity,
            question: `Can ${entity} contain other ${entity} items?`,
            reason: "Recursive structures require self-referencing foreign keys.",
            gapId: gap.id,
            options: [
                { label: "Yes", value: "YES" },
                { label: "No", value: "NO" }
            ]
        });
        continue;
    }
    
    // 5. Lifecycle
    if (gap.description.toLowerCase().includes("lifecycle") || gap.description.toLowerCase().includes("delete")) {
        const entity = extractEntity(gap);
        
        questions.push({
            id: `life_${entity}_${gap.id}`,
            type: "LIFECYCLE",
            entity,
            question: `Can ${entity} be soft deleted?`,
            reason: "Affects query generation and cascading deletes.",
            gapId: gap.id,
            options: [
                { label: "Yes (Soft Delete)", value: "SOFT" },
                { label: "No (Hard Delete)", value: "HARD" }
            ]
        });
        continue;
    }
    
    // Generic fallback for any gap that doesn't match the heuristics above
    questions.push({
        id: `gen_${gap.id}`,
        type: "PERMISSION",
        entity: extractEntity(gap),
        question: `How should we handle: ${gap.description}?`,
        reason: gap.impact || "Detected gap that affects generation accuracy.",
        gapId: gap.id,
        options: [
            { label: "Standard approach", value: "STANDARD" },
            { label: "Custom approach", value: "CUSTOM", isCustom: true }
        ]
    });
  }

  return questions;
}

/**
 * Patches the DomainGraph based on user answers to gap questions.
 */
export function applyGapResolutionsToGraph(graph: DomainGraph, answers: GapResolutionAnswer[], questions: GapQuestion[]): DomainGraph {
  const patchedGraph = { ...graph };
  
  if (!patchedGraph.entities) patchedGraph.entities = [];
  if (!patchedGraph.relationships) patchedGraph.relationships = [];

  for (const answer of answers) {
    const q = questions.find(q => q.id === answer.questionId);
    if (!q) continue;

    const entityIndex = patchedGraph.entities.findIndex((e: any) => e.name.toLowerCase() === q.entity.toLowerCase());
    
    if (q.type === "OWNERSHIP") {
        if (entityIndex !== -1) {
            let ownerName = answer.value;
            if (answer.value === "USER") ownerName = "User";
            else if (answer.value === "WORKSPACE") ownerName = "Workspace";
            else if (answer.value === "ORGANIZATION") ownerName = "Organization";
            else if (answer.value === "TEAM") ownerName = "Team";
            
            if (ownerName !== "PUBLIC" && ownerName !== "CUSTOM") {
                 // Ensure target entity exists heuristically
                 if (!patchedGraph.entities.some((e: any) => e.name.toLowerCase() === ownerName.toLowerCase())) {
                     patchedGraph.entities.push({
                         normalizedId: `ent_${Date.now()}_${ownerName}`,
                         name: ownerName,
                         table: ownerName.toLowerCase(),
                         type: "ENTITY" as any,
                         description: `Inferred ${ownerName} entity from ownership resolution`,
                         fields: [{ name: "id", type: "uuid", isPrimary: true, evidence: [] }],
                         relationships: [],
                         indexes: [],
                         constraints: [],
                         confidence: 100,
                         evidence: [],
                         reasoning: "Inferred from ownership resolution",
                         qualificationPassed: true,
                         qualificationScore: 100
                     });
                 }
                 
                 // Add relationship to graph
                 patchedGraph.relationships.push({
                     source: ownerName,
                     target: q.entity,
                     type: "one-to-many",
                     description: `${ownerName} owns ${q.entity}`
                 } as any);
                 
                 // Add relationship to entity for GapDetector recognition
                 patchedGraph.entities[entityIndex].relationships.push({
                     target: ownerName,
                     type: "many-to-one",
                     ownership: true
                 } as any);
                 
                 // Add field
                 patchedGraph.entities[entityIndex].fields.push({
                     name: `${ownerName.toLowerCase()}Id`,
                     type: "uuid",
                     evidence: []
                 });
            }
        }
    } else if (q.type === "HIERARCHY" && answer.value === "YES") {
        if (entityIndex !== -1) {
            patchedGraph.entities[entityIndex].fields.push({
                 name: `parentId`,
                 type: "uuid",
                 evidence: []
            });
            patchedGraph.relationships.push({
                source: q.entity,
                target: q.entity,
                type: "one-to-many",
                description: `${q.entity} hierarchy`
            } as any);
            
            // Add to entity for recognition
            patchedGraph.entities[entityIndex].relationships.push({
                target: q.entity,
                type: "many-to-one", // recursive parent
                description: "parent"
            } as any);
        }
    }
  }

  return patchedGraph;
}
