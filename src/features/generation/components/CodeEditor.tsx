"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import "./CodeEditor.css";

// Monaco is ~MBs — load it only on the client, only when an editor mounts.
const Editor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => <div className="monaco-loading">Loading editor…</div>,
});

interface CodeEditorProps {
  path: string;
  content: string;
  language: string;
  readOnly: boolean;
  onSave?: (path: string, newContent: string) => Promise<void>;
}

/**
 * Real Monaco editor. Read-only for uploaded source files, editable + saveable
 * for generated backend files. The parent remounts this via `key={path}` on
 * file switch, so local edit/dirty state never leaks across files.
 */
export function CodeEditor({ path, content, language, readOnly, onSave }: CodeEditorProps) {
  const [value, setValue] = useState(content);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleChange = useCallback((newValue: string | undefined) => {
    setValue(newValue ?? "");
    setIsDirty(true);
    setSaveError(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!onSave || !isDirty || isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(path, value);
      setIsDirty(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }, [onSave, path, value, isDirty, isSaving]);

  // Monaco's addCommand captures its callback once on mount; route through a ref
  // so Ctrl/Cmd+S always calls the latest handleSave (not a stale closure).
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  const handleMount = useCallback((editor: any, monaco: any) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => handleSaveRef.current());
  }, []);

  // Small theme so the editor surface matches the IDE's dark palette instead of
  // Monaco's lighter default vs-dark background.
  const handleBeforeMount = useCallback((monaco: any) => {
    monaco.editor.defineTheme("simplicit-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#0A0A0B",
        "editorGutter.background": "#0A0A0B",
        "editor.lineHighlightBackground": "#16161A",
        "editorLineNumber.foreground": "#44444C",
      },
    });
  }, []);

  return (
    <div className="code-editor-wrapper">
      <div className="code-editor-toolbar">
        <span className="code-editor-path">{path}</span>
        {!readOnly ? (
          <div className="code-editor-actions">
            {saveError && <span className="code-editor-save-error">{saveError}</span>}
            {isDirty && <span className="code-editor-dirty-dot" title="Unsaved changes" />}
            <button
              className="code-editor-save-btn"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              type="button"
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
          </div>
        ) : (
          <span className="code-editor-readonly-badge">Read-only</span>
        )}
      </div>
      <div className="code-editor-body">
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={handleChange}
          onMount={handleMount}
          beforeMount={handleBeforeMount}
          theme="simplicit-dark"
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "var(--sf-font-mono)",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            renderWhitespace: "none",
          }}
        />
      </div>
    </div>
  );
}
