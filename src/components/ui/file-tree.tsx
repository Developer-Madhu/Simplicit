"use client";

import { ChevronRight, File, Folder, FolderOpen } from "lucide-react";
import { useState } from "react";

import type { FileNode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FileTreeProps {
  nodes: FileNode[];
  selectedPath?: string;
}

export function FileTree({ nodes, selectedPath }: FileTreeProps) {
  return (
    <div className="space-y-0.5">
      {nodes.map((node) => (
        <FileTreeNode key={`${node.name}-${node.path ?? "dir"}`} node={node} depth={0} selectedPath={selectedPath} />
      ))}
    </div>
  );
}

function FileTreeNode({
  node,
  depth,
  selectedPath
}: {
  node: FileNode;
  depth: number;
  selectedPath?: string;
}) {
  const [open, setOpen] = useState(true);
  const isSelected = selectedPath === node.path;
  const isDir = node.type === "dir";

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (isDir) {
            setOpen((current) => !current);
          }
        }}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-muted transition hover:bg-white/5",
          isSelected && "bg-white/5 text-text"
        )}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        {isDir ? (
          <ChevronRight className={cn("h-3.5 w-3.5 transition", open && "rotate-90")} />
        ) : (
          <span className="w-3.5" />
        )}
        {isDir ? (
          open ? <FolderOpen className="h-3.5 w-3.5" /> : <Folder className="h-3.5 w-3.5" />
        ) : (
          <File className="h-3.5 w-3.5 text-faint" />
        )}
        <span className="truncate">{node.name}</span>
        {node.badge ? (
          <span className="ml-auto rounded-full border border-border px-1.5 py-0.5 font-mono text-[10px] text-faint">
            {node.badge}
          </span>
        ) : null}
      </button>
      {isDir && open && node.children ? (
        <div className="space-y-0.5">
          {node.children.map((child) => (
            <FileTreeNode
              key={`${child.name}-${child.path ?? "dir"}`}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

