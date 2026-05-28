import type { ReactNode } from "react";

import { CodeBlock } from "@/components/ui/code-block";
import { ElevatedCard } from "@/components/ui/card";

import { Brand } from "@/features/shell";

const landingCode = [
  "import { Hono } from 'hono';",
  "import { zValidator } from '@hono/zod-validator';",
  "import { z } from 'zod';",
  "",
  "const app = new Hono();",
  "",
  "app.post('/api/projects', ",
  "  zValidator('json', z.object({",
  "    name: z.string(),",
  "    stack: z.string()",
  "  })),",
  "  async (c) => {",
  "    const data = c.req.valid('json');",
  "    const project = await db.insert(projects).values(data);",
  "    return c.json(project, 201);",
  "  }",
  ");"
];

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  banner?: ReactNode;
  footnote?: ReactNode;
}

export function AuthShell({
  title,
  subtitle,
  children,
  banner,
  footnote
}: AuthShellProps) {
  return (
    <div className="flex min-h-screen bg-bg">
      <div className="relative hidden flex-1 overflow-hidden border-r border-border bg-bg-2 px-10 py-10 lg:flex">
        <div className="absolute inset-0 bg-line-grid bg-[size:32px_32px] opacity-55 [mask-image:radial-gradient(ellipse_80%_70%_at_30%_50%,black,transparent_80%)]" />
        <div className="absolute left-[18%] top-[18%] h-96 w-96 rounded-full bg-[radial-gradient(circle,oklch(0.4_0.12_250_/_0.28),transparent_70%)] blur-3xl" />
        <div className="relative z-10 flex w-full flex-col">
          <Brand />
          <div className="my-auto max-w-xl">
            {banner}
            <h1 className="mt-5 text-5xl font-medium tracking-[-0.05em]">{title}</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted">{subtitle}</p>
            <ElevatedCard className="mt-10 overflow-hidden">
              <CodeBlock title="src/routes.ts" lines={landingCode} />
            </ElevatedCard>
          </div>
          <div className="relative z-10 flex flex-wrap gap-3 text-xs text-faint">
            <span>SOC 2 Type II</span>
            <span>Self-host the output</span>
            <span>MIT-licensed exports</span>
          </div>
        </div>
      </div>
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-[560px] lg:px-12">
        <div className="w-full max-w-md">
          {children}
          {footnote ? <div className="mt-8 text-center text-xs text-faint">{footnote}</div> : null}
        </div>
      </div>
    </div>
  );
}
