"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Lock, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import type { BlueprintEntity, BlueprintField } from "@/features/architecture";

// Drizzle/Postgres-aligned column types the user can choose from.
const FIELD_TYPES = ["text", "integer", "boolean", "timestamp", "decimal", "json", "uuid"] as const;

interface EntityFieldsWizardProps {
  entities: BlueprintEntity[];
  onComplete: (updatedEntities: BlueprintEntity[]) => void;
}

const monoInput: React.CSSProperties = { height: 28, fontFamily: "var(--sf-font-mono)" };

const headerRowStyle: React.CSSProperties = {
  gap: 8,
  padding: "8px 10px",
  background: "var(--sf-surface)",
  borderBottom: "1px solid var(--sf-border)",
  fontFamily: "var(--sf-font-mono)",
  fontSize: 10.5,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "var(--sf-text-faint)",
};

const bodyRowStyle: React.CSSProperties = {
  gap: 8,
  padding: "6px 10px",
  borderBottom: "1px solid var(--sf-border)",
  alignItems: "center",
  fontSize: 12.5,
};

/**
 * Phase O — entity-fields wizard step. Lets the user confirm/edit the fields the
 * AST extracted for each blueprint entity before the pipeline runs. One entity
 * per page; edits accumulate across pages and are returned in full on Confirm.
 */
export function EntityFieldsWizard({ entities, onComplete }: EntityFieldsWizardProps) {
  // Deep-ish copy so edits don't mutate the caller's blueprint entities.
  const [edited, setEdited] = useState<BlueprintEntity[]>(() =>
    entities.map((e) => ({ ...e, fields: (e.fields ?? []).map((f) => ({ ...f })) }))
  );
  const [index, setIndex] = useState(0);
  // Boundary between AST-detected entities and ones the user adds in this step.
  const originalCount = useRef(entities.length).current;

  // Phase W — a field is "uncertain" when it was inferred (no AST evidence)
  // rather than extracted from source. Primary keys (id) are always expected.
  const isUncertainField = (field: BlueprintField) =>
    !field.isPrimary && (!field.evidence || field.evidence.length === 0);

  const hasUncertainEntities = useMemo(
    () => edited.some((e) => e.fields.some(isUncertainField)),
    [edited]
  );

  const [reviewOnlyMode, setReviewOnlyMode] = useState(false);

  // In review-only mode, only entities with at least one uncertain field show.
  const visibleEntities = useMemo(
    () => (reviewOnlyMode ? edited.filter((e) => e.fields.some(isUncertainField)) : edited),
    [reviewOnlyMode, edited]
  );

  // If the user resolves all uncertainty while reviewing, leave review mode so
  // the wizard never gets stuck on an empty page.
  useEffect(() => {
    if (reviewOnlyMode && visibleEntities.length === 0) setReviewOnlyMode(false);
  }, [reviewOnlyMode, visibleEntities.length]);

  // Pagination runs over the visible list; `edited` stays the source of truth
  // for onComplete. safeIndex guards against the list shrinking under us.
  const total = visibleEntities.length;
  const safeIndex = total > 0 ? Math.min(index, total - 1) : 0;
  const entity = visibleEntities[safeIndex];
  const isLast = safeIndex === total - 1;
  // The current entity's real position in `edited` (same object refs), so field
  // patches target the right entity even when the visible list is filtered.
  const editedIndex = entity ? edited.indexOf(entity) : -1;
  const isAdded = editedIndex >= originalCount;

  const patchField = (fi: number, patch: Partial<BlueprintField>) => {
    setEdited((prev) =>
      prev.map((e, ei) =>
        ei === editedIndex ? { ...e, fields: e.fields.map((f, j) => (j === fi ? { ...f, ...patch } : f)) } : e
      )
    );
  };

  const addField = () => {
    setEdited((prev) =>
      prev.map((e, ei) =>
        ei === editedIndex
          ? {
              ...e,
              fields: [
                ...e.fields,
                { name: "", type: "text", isPrimary: false, isNullable: true, evidence: undefined },
              ],
            }
          : e
      )
    );
  };

  const deleteField = (fi: number) => {
    setEdited((prev) =>
      prev.map((e, ei) => (ei === editedIndex ? { ...e, fields: e.fields.filter((_, j) => j !== fi) } : e))
    );
  };

  // Append a blank user-defined entity and navigate to it immediately.
  const addEntity = () => {
    const newIndex = edited.length;
    setEdited((prev) => [
      ...prev,
      {
        name: "NewEntity",
        tableName: "new_entities",
        fields: [{ name: "id", type: "uuid", isPrimary: true, isNullable: false }],
        indexes: [],
        constraints: [],
        isPrimary: false,
      },
    ]);
    // A fresh entity has no uncertain fields; leave review mode so it's visible.
    setReviewOnlyMode(false);
    setIndex(newIndex);
  };

  // Editable name for user-added entities (keeps tableName in sync).
  const patchEntityName = (value: string) => {
    setEdited((prev) =>
      prev.map((e, ei) =>
        ei === editedIndex
          ? {
              ...e,
              name: value,
              tableName: value.trim() ? value.trim().toLowerCase().replace(/\s+/g, "_") : e.tableName,
            }
          : e
      )
    );
  };

  if (!entity) return null;

  return (
    <div
      className="sf-card-elev"
      style={{
        padding: 28,
        background: "var(--sf-surface-2)",
        border: "1px solid var(--sf-border-strong)",
        borderRadius: "var(--sf-r-xl)",
      }}
    >
      {/* Heading */}
      <h2
        style={{
          fontFamily: "var(--sf-font-sans)",
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--sf-text)",
          margin: 0,
        }}
      >
        Confirm entity fields
      </h2>
      <p
        style={{
          fontFamily: "var(--sf-font-sans)",
          fontSize: 13,
          color: "var(--sf-text-muted)",
          marginTop: 6,
          marginBottom: 0,
        }}
      >
        Review and edit the fields detected for each entity before generation. These become the
        database columns and API DTOs.
      </p>

      {/* Phase W — bulk actions: accept everything as-is, or focus only on uncertain fields */}
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: 16, marginBottom: "12px" }}>
        <button
          type="button"
          onClick={() => onComplete(edited)}
          style={{
            fontFamily: "var(--sf-font-sans)",
            fontSize: "12px",
            padding: "4px 10px",
            background: "transparent",
            border: "0.5px solid var(--sf-border, #444)",
            borderRadius: "4px",
            color: "var(--sf-text-dim, #888)",
            cursor: "pointer",
          }}
        >
          Accept All →
        </button>
        {hasUncertainEntities && (
          <button
            type="button"
            onClick={() => {
              setReviewOnlyMode(true);
              setIndex(0);
            }}
            style={{
              fontFamily: "var(--sf-font-sans)",
              fontSize: "12px",
              padding: "4px 10px",
              background: "transparent",
              border: "0.5px solid var(--sf-border, #444)",
              borderRadius: "4px",
              color: "var(--sf-text-dim, #888)",
              cursor: "pointer",
            }}
          >
            Review Uncertain Only
          </button>
        )}
      </div>

      {reviewOnlyMode && total > 0 && (
        <div
          style={{
            background: "var(--sf-surface-2, #222)",
            border: "0.5px solid var(--sf-border, #444)",
            borderRadius: "4px",
            padding: "6px 10px",
            fontSize: "12px",
            fontFamily: "var(--sf-font-sans)",
            color: "var(--sf-text-dim, #888)",
            marginBottom: "10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            Showing {visibleEntities.length} {visibleEntities.length === 1 ? "entity" : "entities"} with uncertain
            fields
          </span>
          <button
            type="button"
            onClick={() => {
              setReviewOnlyMode(false);
              setIndex(0);
            }}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "12px" }}
          >
            Show all
          </button>
        </div>
      )}

      {/* Entity name — editable for user-added entities, read-only for detected ones */}
      <div className="sf-row" style={{ gap: 8, alignItems: "center", margin: "20px 0 10px" }}>
        {isAdded ? (
          <input
            className="sf-input"
            value={entity.name}
            placeholder="EntityName"
            onChange={(e) => patchEntityName(e.target.value)}
            style={{ ...monoInput, maxWidth: 240, fontSize: 14, fontWeight: 600 }}
          />
        ) : (
          <span className="mono" style={{ fontSize: 15, fontWeight: 600, color: "var(--sf-text)" }}>
            {entity.name}
          </span>
        )}
        {entity.tableName && (
          <span className="sf-chip sf-chip-mono" style={{ height: 18, fontSize: 10 }}>
            {entity.tableName}
          </span>
        )}
        {isAdded && (
          <span className="sf-chip" style={{ height: 18, fontSize: 10 }}>
            Added by you
          </span>
        )}
      </div>

      {/* Fields table */}
      <div style={{ border: "1px solid var(--sf-border)", borderRadius: "var(--sf-r-md)", overflow: "hidden" }}>
        <div className="sf-row" style={headerRowStyle}>
          <span style={{ flex: 2 }}>Field Name</span>
          <span style={{ flex: 1.4 }}>Type</span>
          <span style={{ width: 70, textAlign: "center" }}>Nullable</span>
          <span style={{ width: 64, textAlign: "center" }}>Primary</span>
          <span style={{ width: 32 }} />
        </div>

        {entity.fields.length === 0 && (
          <div className="sf-dim" style={{ fontSize: 12, padding: "12px 10px" }}>
            No fields yet — add one below.
          </div>
        )}

        {entity.fields.map((f, fi) => (
          <div key={fi} className="sf-row" style={bodyRowStyle}>
            {/* Field name — locked for the primary key */}
            <span style={{ flex: 2, display: "inline-flex", alignItems: "center", gap: 4 }}>
              {f.isPrimary ? (
                <span
                  className="mono"
                  style={{ display: "inline-flex", alignItems: "center", height: 28, color: "var(--sf-text)" }}
                >
                  {f.name}
                </span>
              ) : (
                <input
                  className="sf-input"
                  value={f.name}
                  placeholder="field_name"
                  onChange={(e) => patchField(fi, { name: e.target.value })}
                  style={{
                    ...monoInput,
                    flex: 1,
                    minWidth: 0,
                    ...(isUncertainField(f) ? { color: "var(--sf-text-dim, #888)" } : null),
                  }}
                />
              )}
              {isUncertainField(f) && (
                <span
                  title="Field inferred — no direct evidence in source code"
                  style={{ fontSize: "10px", opacity: 0.5, fontFamily: "var(--sf-font-sans)", color: "var(--sf-text-dim, #888)" }}
                >
                  ?
                </span>
              )}
            </span>

            {/* Type */}
            <span style={{ flex: 1.4 }}>
              <select
                className="sf-input"
                value={f.type}
                onChange={(e) => patchField(fi, { type: e.target.value })}
                style={monoInput}
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </span>

            {/* Nullable (PK can't be nullable) */}
            <span style={{ width: 70, textAlign: "center" }}>
              <input
                type="checkbox"
                checked={f.isNullable ?? false}
                disabled={f.isPrimary}
                onChange={(e) => patchField(fi, { isNullable: e.target.checked })}
              />
            </span>

            {/* Primary indicator */}
            <span style={{ width: 64, textAlign: "center" }}>
              {f.isPrimary ? (
                <Lock size={13} style={{ color: "var(--sf-amber)" }} aria-label="Primary key" />
              ) : (
                <span className="sf-faint">—</span>
              )}
            </span>

            {/* Delete (not for PK) */}
            <span style={{ width: 32, textAlign: "center" }}>
              {!f.isPrimary && (
                <button
                  className="sf-btn sf-btn--ghost sf-btn--sm"
                  style={{ width: 24, padding: 0, justifyContent: "center" }}
                  onClick={() => deleteField(fi)}
                  title="Delete field"
                  type="button"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Add field / Add entity */}
      <div className="sf-row" style={{ marginTop: 10, gap: 8 }}>
        <button className="sf-btn sf-btn--sm" onClick={addField} type="button">
          <Plus size={12} /> Add field
        </button>
        <button className="sf-btn sf-btn--ghost sf-btn--sm" onClick={addEntity} type="button">
          <Plus size={12} /> Add Entity
        </button>
      </div>

      {/* Pagination footer */}
      <div className="sf-row" style={{ marginTop: 24, gap: 10, alignItems: "center" }}>
        <span className="sf-muted" style={{ fontSize: 12 }}>
          Entity {safeIndex + 1} of {total}
        </span>
        <span className="sf-grow" />
        <button
          className="sf-btn sf-btn--sm"
          disabled={safeIndex === 0}
          onClick={() => setIndex(Math.max(0, safeIndex - 1))}
          type="button"
        >
          <ChevronLeft size={12} /> Prev
        </button>
        {isLast ? (
          <button className="sf-btn sf-btn--primary sf-btn--sm" onClick={() => onComplete(edited)} type="button">
            Confirm
          </button>
        ) : (
          <button
            className="sf-btn sf-btn--primary sf-btn--sm"
            onClick={() => setIndex(Math.min(total - 1, safeIndex + 1))}
            type="button"
          >
            Next <ChevronRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
