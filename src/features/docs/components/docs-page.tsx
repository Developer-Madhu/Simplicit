"use client";

import { Code2, FileText, Github, ShieldCheck, type LucideIcon } from "lucide-react";
import { useDisplayName } from "@/features/workspace/api/workspaces";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { AppTopbar } from "@/features/shell";

const docsSections: Array<{
  title: string;
  body: string;
  icon: LucideIcon;
}> = [
  {
    title: "Getting started",
    body: "Create a generation, inspect the output, and export cleanly.",
    icon: FileText
  },
  {
    title: "Generated architecture",
    body: "Understand modules, schema, routes, and deployment shape.",
    icon: Code2
  },
  {
    title: "Security & privacy",
    body: "Review auth, secrets, and private-generation guarantees.",
    icon: ShieldCheck
  }
];

export function DocsPage() {
  const displayName = useDisplayName();
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <AppTopbar
        breadcrumbs={[displayName, "Documentation"]}
        actions={
          <Button size="sm">
            <Github className="h-4 w-4" />
            View examples
          </Button>
        }
      />
      <main className="flex-1 overflow-auto p-7">
        <div className="mx-auto max-w-[1080px]">
          <h1 className="text-[24px] font-medium tracking-[-0.02em]">Documentation</h1>
          <p className="mt-1 text-[13.5px] text-muted">
            Operational guidance for generated backends, exports, and deployment flows.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {docsSections.map((section) => (
              <Card key={section.title} className="p-4">
                <section.icon className="h-4 w-4 text-muted" />
                <div className="mt-4 text-[13.5px] font-medium">{section.title}</div>
                <p className="mt-1 text-xs text-muted">{section.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
