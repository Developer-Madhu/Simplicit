"use client";

import { useMemo, useState } from "react";
import { AppTopbar } from "@/features/shell";
import { Icons } from "@/components/ui/icons";
import { useRouter } from "next/navigation";
import { useProjects } from "@/features/dashboard";
import { useWorkspace } from "@/features/workspace/context/workspace-context";

export function GenerationsListPage() {
  const router = useRouter();
  const { activeWorkspace } = useWorkspace();
  const { data: projects = [], isLoading } = useProjects(activeWorkspace?.id);

  const generations = useMemo(() => {
    return projects.filter(p => p.generation_metadata && Object.keys(p.generation_metadata).length > 0);
  }, [projects]);

  return (
    <div className="sf-app" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--sf-bg)', flexDirection: 'column' }}>
      <AppTopbar
        breadcrumbs={['Workspace', 'Generations']}
        actions={<>
          <button className="sf-btn sf-btn--primary sf-btn--sm" onClick={() => router.push('/workspace')}><Icons.Plus size={11} /> New generation</button>
        </>}
      />
      <main className="sf-scroll" style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="sf-row" style={{ marginBottom: 24 }}>
            <div>
              <div className="sf-row" style={{ gap: 10, marginBottom: 6 }}>
                <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>Recent Generations</h1>
                <span className="sf-chip">{generations.length}</span>
              </div>
              <p className="sf-muted" style={{ fontSize: 13.5, margin: 0 }}>View and manage your generated backend foundations.</p>
            </div>
          </div>

          <div className="sf-card" style={{ padding: 0, marginBottom: 28 }}>
            <div className="sf-row" style={{ padding: '8px 14px', borderBottom: '1px solid var(--sf-border)', background: 'var(--sf-bg-2)', fontSize: 11, color: 'var(--sf-text-faint)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              <span style={{ flex: '0 0 40%' }}>Project</span>
              <span style={{ flex: '0 0 25%' }}>Stack</span>
              <span style={{ flex: '0 0 15%' }}>Status</span>
              <span className="sf-grow">Generated</span>
            </div>
            
            {isLoading ? (
              <div style={{ padding: '32px', textAlign: 'center' }}>
                <Icons.Spinner size={16} className="sf-spin" />
              </div>
            ) : generations.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--sf-text-muted)', fontSize: 13 }}>
                No generations found. Start by architecting a new project.
              </div>
            ) : (
              generations.map((p, i) => (
                <div 
                  key={p.id} 
                  className="sf-row" 
                  onClick={() => router.push(`/generations/${p.id}`)}
                  style={{ padding: '12px 14px', borderBottom: i < generations.length - 1 ? '1px solid var(--sf-border)' : 'none', fontSize: 13, gap: 8, cursor: 'pointer' }}
                >
                  <div className="sf-row" style={{ flex: '0 0 40%', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--sf-surface-2)', border: '1px solid var(--sf-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icons.Box size={12} />
                    </div>
                    <div>
                      <div style={{ color: 'var(--sf-text)', fontWeight: 500 }}>{p.name}</div>
                      <div className="sf-faint" style={{ fontSize: 11 }}>{p.prompt}</div>
                    </div>
                  </div>
                  <span className="mono" style={{ flex: '0 0 25%', fontSize: 11.5, color: 'var(--sf-text-muted)' }}>{p.stack}</span>
                  <span style={{ flex: '0 0 15%' }} className="sf-row">
                    <span className={`sf-dot sf-dot--${p.dot}`} style={{ marginRight: 6 }} />
                    <span style={{ fontSize: 12.5 }}>{p.status}</span>
                  </span>
                  <span className="sf-grow sf-faint" style={{ fontSize: 12 }}>{p.updated}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
