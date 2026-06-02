# Tool icons

Drop the brand logos here to render them on the "Generate Simplicit Context File"
tabs (rendered at 13×13):

- `cursor.png`  — Cursor
- `lovable.png` — Lovable
- `bolt.png`    — Bolt

If a file is missing, the app falls back to a built-in inline SVG glyph, so the
tabs never break. PNG (transparent background recommended) or SVG both work —
update the extensions in `TOOL_PNGS` (src/features/generation/components/context-generator-hub.tsx)
if you use `.svg`.
