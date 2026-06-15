"use client";

import { useMemo, useState } from "react";
import { AppTopbar } from "@/features/shell";
import { Icons } from "@/components/ui/icons";
import styles from "./dashboard-page.module.css";
import { useRouter } from "next/navigation";
import { useToast } from "@/features/auth/context/toast-context";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "../api/projects";
import { Project, ProjectStatus } from "@/lib/types";
import { useWorkspace } from "@/features/workspace/context/workspace-context";

const STATUS = {
  deployed: { dot: 'green', label: 'Deployed' },
  building: { dot: 'amber', label: 'Building' },
  draft:    { dot: 'gray',  label: 'Draft' },
  paused:   { dot: 'gray',  label: 'Paused' },
} as const;

interface SparkProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

function Spark({ data, width = 80, height = 24, color = 'var(--sf-text-muted)' }: SparkProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / (max - min || 1)) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

interface StatTileProps {
  label: string;
  value: string;
  delta?: string;
  deltaKind?: 'up' | 'down';
  sparkline?: React.ReactNode;
}

function StatTile({ label, value, delta, deltaKind = 'up', sparkline }: StatTileProps) {
  return (
    <div className="sf-card" style={{ padding: 16, minHeight: 96, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="sf-row">
        <span className="sf-grow sf-muted" style={{ fontSize: 12 }}>{label}</span>
        {delta && (
          <span className="mono" style={{
            fontSize: 10.5, color: deltaKind === 'up' ? 'var(--sf-green)' : 'var(--sf-red)',
          }}>{deltaKind === 'up' ? '↑' : '↓'} {delta}</span>
        )}
      </div>
      <div className="sf-row" style={{ alignItems: 'flex-end', gap: 10 }}>
        <span style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em' }}>{value}</span>
        {sparkline && <div className="sf-grow" style={{ display: 'flex', justifyContent: 'flex-end' }}>{sparkline}</div>}
      </div>
    </div>
  );
}

interface ProjectCardProps {
  p: Project;
  showMenu: boolean;
  onToggleMenu: () => void;
  onSelect: () => void;
  onHover?: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

function ProjectCard({ p, showMenu, onToggleMenu, onSelect, onHover, onEdit, onToggleStatus, onDelete }: ProjectCardProps) {
  return (
    <div
      className="sf-card"
      onClick={onSelect}
      onMouseEnter={onHover}
      style={{ padding: 0, overflow: 'visible', display: 'flex', flexDirection: 'column', minHeight: 168, cursor: 'pointer' }}
    >
      <div style={{ padding: 18, flex: 1, position: 'relative' }}>
        <div className="sf-row" style={{ marginBottom: 14 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--sf-surface-2)', border: '1px solid var(--sf-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Box size={14} />
          </div>
          <span className="sf-grow" />
          <div style={{ position: 'relative' }}>
            <button 
              className="sf-btn sf-btn--ghost sf-btn--sm" 
              style={{ padding: '0 5px' }} 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMenu();
              }}
            >
              <Icons.More size={13} />
            </button>
            
            {showMenu && (
              <div
                className="sf-card-elev"
                style={{
                  position: 'absolute',
                  top: 28,
                  right: 0,
                  zIndex: 50,
                  width: 140,
                  padding: 4,
                  background: 'var(--sf-surface-2)',
                  border: '1px solid var(--sf-border-strong)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    onSelect();
                  }}
                  className="sf-row"
                  style={{
                    width: '100%', padding: '6px 8px', fontSize: 12, border: 'none', background: 'transparent',
                    color: 'var(--sf-text)', borderRadius: 4, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit'
                  }}
                  type="button"
                >
                  Open Details
                </button>
                <button
                  onClick={() => {
                    onEdit();
                  }}
                  className="sf-row"
                  style={{
                    width: '100%', padding: '6px 8px', fontSize: 12, border: 'none', background: 'transparent',
                    color: 'var(--sf-text)', borderRadius: 4, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit'
                  }}
                  type="button"
                >
                  Edit Project
                </button>
                <button
                  onClick={() => {
                    onToggleStatus();
                  }}
                  className="sf-row"
                  style={{
                    width: '100%', padding: '6px 8px', fontSize: 12, border: 'none', background: 'transparent',
                    color: 'var(--sf-text)', borderRadius: 4, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit'
                  }}
                  type="button"
                >
                  {p.status === 'paused' ? 'Resume' : 'Pause'}
                </button>
                <div style={{ height: 1, background: 'var(--sf-border)', margin: '4px 0' }} />
                <button
                  onClick={() => {
                    onDelete();
                  }}
                  className="sf-row"
                  style={{
                    width: '100%', padding: '6px 8px', fontSize: 12, border: 'none', background: 'transparent',
                    color: 'var(--sf-red)', borderRadius: 4, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit'
                  }}
                  type="button"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="sf-row" style={{ gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>
          <span className={`sf-dot sf-dot--${p.dot}`} />
        </div>
        <p className="sf-muted" style={{ fontSize: 12.5, margin: '0 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.prompt}</p>
        <div className="sf-row" style={{ gap: 6, flexWrap: 'wrap' }}>
          {p.stack.split(' · ').map(s => <span key={s} className="sf-chip sf-chip-mono">{s}</span>)}
        </div>
      </div>
      <div className="sf-row" style={{ padding: '10px 18px', borderTop: '1px solid var(--sf-border)', background: 'var(--sf-bg-2)', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
        <span className="sf-faint" style={{ fontSize: 11.5 }}>{STATUS[p.status]?.label || p.status} · {p.updated}</span>
        <span className="sf-grow" />
        <span className="mono sf-faint" style={{ fontSize: 11 }}>{p.health ? p.health + '%' : '—'}</span>
      </div>
    </div>
  );
}

// Zod validation schemas
const projectFormSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  prompt: z.string().min(10, "Prompt must describe the backend (min 10 chars)"),
  stack: z.string().min(2, "Please select or specify a stack"),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { activeWorkspace, loading: workspaceLoading } = useWorkspace();

  // Supabase Queries & Mutations
  const { data: dbProjects = [], isLoading: projectsLoading, error } = useProjects(activeWorkspace?.id);
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const isLoading = workspaceLoading || projectsLoading;

  // Component local states
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'deployed' | 'building' | 'draft'>('all');
  const [query, setQuery] = useState("");
  const [stackFilter, setStackFilter] = useState<'any' | 'Hono' | 'Fastify' | 'Express'>('any');
  const [sort, setSort] = useState<'updated' | 'name' | 'health'>('updated');

  const [showStackDropdown, setShowStackDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [actionMenuProjectId, setActionMenuProjectId] = useState<string | null>(null);

  // Modal Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // React Hook Form for Create/Edit
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      prompt: "",
      stack: "Hono · PG · Redis",
    }
  });

  const formStack = watch("stack");

  // Handle Form Submission for Create
  const onCreateSubmit = async (values: ProjectFormValues) => {
    if (!activeWorkspace) return;
    try {
      const dot = "gray"; 
      await createMutation.mutateAsync({
        name: values.name,
        prompt: values.prompt,
        stack: values.stack,
        workspace_id: activeWorkspace.id,
        status: "draft",
        dot,
        health: null
      });
      toast(`Project "${values.name}" created successfully.`, "success");
      setIsCreateOpen(false);
      reset();
    } catch (e) {
      toast("Failed to create project. Please try again.", "error");
    }
  };

  // Handle Form Submission for Edit
  const onEditSubmit = async (values: ProjectFormValues) => {
    if (!editingProject) return;
    try {
      await updateMutation.mutateAsync({
        id: editingProject.id,
        name: values.name,
        prompt: values.prompt,
        stack: values.stack
      });
      toast(`Project "${values.name}" updated successfully.`, "success");
      setEditingProject(null);
      reset();
    } catch (e) {
      toast("Failed to update project. Please try again.", "error");
    }
  };

  // Handle delete trigger
  const handleDeleteProject = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast("Project deleted successfully.", "success");
    } catch (e) {
      toast("Failed to delete project.", "error");
    }
  };

  // Handle status toggle (Pause/Resume)
  const handleToggleStatus = async (p: Project) => {
    const nextStatus: ProjectStatus = p.status === "paused" ? "deployed" : "paused";
    const nextDot = nextStatus === "deployed" ? "green" : "gray";
    try {
      await updateMutation.mutateAsync({
        id: p.id,
        status: nextStatus,
        dot: nextDot,
      });
      toast(`Project is now ${nextStatus}.`, "success");
    } catch (e) {
      toast("Failed to change project status.", "error");
    }
  };

  // Open Edit Dialog
  const handleOpenEdit = (p: Project) => {
    setEditingProject(p);
    setValue("name", p.name);
    setValue("prompt", p.prompt);
    setValue("stack", p.stack);
  };

  // Open Create Dialog
  const handleOpenCreate = () => {
    reset({
      name: "",
      prompt: "",
      stack: "Hono · PG · Redis",
    });
    setIsCreateOpen(true);
  };

  // Dynamic calculations
  const filteredAndSortedProjects = useMemo(() => {
    let result = dbProjects.filter((project) => {
      const matchesFilter = filter === "all" ? true : project.status === filter;
      const matchesStack = stackFilter === "any" ? true : project.stack.toLowerCase().includes(stackFilter.toLowerCase());
      const matchesQuery =
        query.length === 0 ||
        project.name.toLowerCase().includes(query.toLowerCase()) ||
        project.prompt.toLowerCase().includes(query.toLowerCase()) ||
        project.stack.toLowerCase().includes(query.toLowerCase());

      return matchesFilter && matchesStack && matchesQuery;
    });

    // Apply sorting
    if (sort === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'health') {
      result = [...result].sort((a, b) => {
        const hA = a.health ?? 0;
        const hB = b.health ?? 0;
        return hB - hA;
      });
    }

    return result;
  }, [dbProjects, filter, stackFilter, query, sort]);

  const isEmptyState = dbProjects.length === 0 && !isLoading && !error;

  return (
    <div className="sf-app" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--sf-bg)', flexDirection: 'column' }}>
      <AppTopbar
        breadcrumbs={[activeWorkspace?.name || 'Workspace', 'Projects']}
        actions={<>
          <button className="sf-btn sf-btn--sm" onClick={() => {}}><Icons.Filter size={11} /> Filters</button>
          <button className="sf-btn sf-btn--primary sf-btn--sm" onClick={handleOpenCreate}><Icons.Plus size={11} /> New project</button>
        </>}
      />
      <main className={`sf-scroll ${styles.main}`} style={{
        flex: 1,
        overflow: 'auto', 
        padding: isEmptyState ? 0 : 28,
        display: isEmptyState ? 'flex' : 'block',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {isEmptyState ? (
          <div style={{ maxWidth: 520, textAlign: 'center', padding: 40, width: '100%' }}>
            {/* Illustrative scaffold */}
            <div style={{
              width: 220, height: 140, margin: '0 auto 28px',
              position: 'relative', borderRadius: 14, overflow: 'hidden',
              background: 'var(--sf-bg-2)', border: '1px solid var(--sf-border)',
            }}>
              <div className="sf-linegrid" style={{ position: 'absolute', inset: 0, opacity: 0.7 }} />
              <div style={{
                position: 'absolute', left: '20%', top: '24%', width: '60%', height: '50%',
                border: '1.5px dashed rgba(255,255,255,0.18)', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--sf-text-faint)',
              }}>
                <Icons.Plus size={22} />
              </div>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: '0 0 8px', color: 'var(--sf-text)' }}>
              No projects yet
            </h2>
            <p className="sf-muted" style={{ fontSize: 14, margin: '0 0 24px', lineHeight: 1.5 }}>
              Describe what you want to build. Simplicit will design a backend,
              generate the code, and let you deploy it in minutes.
            </p>
            <div className="sf-row" style={{ gap: 8, justifyContent: 'center' }}>
              <button className="sf-btn sf-btn--primary" onClick={handleOpenCreate}>
                <Icons.Sparkle size={12} style={{ marginRight: 6 }} /> Generate first backend
              </button>
              <button className="sf-btn" onClick={() => router.push('/templates')}>
                <Icons.Box size={12} style={{ marginRight: 6 }} /> Browse templates
              </button>
            </div>

            {/* Starter prompt suggestions */}
            <div style={{ marginTop: 36 }}>
              <div className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                Or start from a prompt
              </div>
              <div className="sf-col" style={{ gap: 6 }}>
                {[
                  "Backend for an online exam platform with proctoring and payments",
                  "Marketplace API with escrow and seller onboarding",
                  "AI document workspace with shared prompts and usage limits",
                ].map(p => (
                  <button key={p} className="sf-card sf-row" onClick={() => {
                    localStorage.setItem('simplicit_draft_prompt', p);
                    router.push('/workspace');
                  }} style={{
                    padding: '10px 14px', gap: 10, cursor: 'pointer',
                    fontFamily: 'inherit', color: 'var(--sf-text-muted)', fontSize: 12.5,
                    textAlign: 'left', background: 'var(--sf-surface)', border: '1px solid var(--sf-border)',
                    width: '100%', borderRadius: 8
                  }}>
                    <Icons.Sparkle size={11} className="sf-faint" style={{ flexShrink: 0 }} />
                    <span className="sf-grow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>&quot;{p}&quot;</span>
                    <Icons.ArrowR size={11} className="sf-faint" style={{ flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            {/* Page head */}
            <div className="sf-row" style={{ marginBottom: 24 }}>
              <div>
                <div className="sf-row" style={{ gap: 10, marginBottom: 6 }}>
                  <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>Projects</h1>
                  <span className="sf-chip">{dbProjects.length}</span>
                </div>
                <p className="sf-muted" style={{ fontSize: 13.5, margin: 0 }}>Backend projects across this workspace.</p>
              </div>
            </div>

            {/* Stat row */}
            <div className={styles.statsGrid}>
              <StatTile label="Active projects" value={dbProjects.length.toString()} delta="" sparkline={<Spark data={[0, 0, 0, 0, 0, 0, dbProjects.length]} />} />
              <StatTile label="Deployments" value={dbProjects.filter(p => p.status === 'deployed').length.toString()} delta="" sparkline={<Spark data={[0, 0, 0, 0, 0, 0, dbProjects.filter(p => p.status === 'deployed').length]} color="oklch(0.78 0.18 145)" />} />
            </div>

            {/* Filters + view */}
            <div className="sf-row" style={{ marginBottom: 16, gap: 8 }}>
              <div className="sf-row" style={{ background: 'var(--sf-surface)', border: '1px solid var(--sf-border)', borderRadius: 8, padding: 2 }}>
                {(['all', 'deployed', 'building', 'draft'] as const).map(f => (
                  <button key={f} type="button" onClick={() => setFilter(f)} className="sf-row" style={{
                    height: 26, padding: '0 12px', borderRadius: 6, border: 'none', fontFamily: 'inherit',
                    background: filter === f ? 'var(--sf-elevated)' : 'transparent',
                    color: filter === f ? 'var(--sf-text)' : 'var(--sf-text-muted)',
                    fontSize: 12, textTransform: 'capitalize', cursor: 'pointer',
                  }}>{f}</button>
                ))}
              </div>
              <div className="sf-row" style={{ gap: 8, height: 30, background: 'var(--sf-surface)', border: '1px solid var(--sf-border)', borderRadius: 8, padding: '0 10px', minWidth: 240, color: 'var(--sf-text-dim)' }}>
                <Icons.Search size={12} />
                <input
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 12.5, color: 'var(--sf-text)', flex: 1 }}
                  placeholder="Search projects, prompts, stacks…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <span className="sf-grow" />
              
              {/* Stack Filter Dropdown Container */}
              <div style={{ position: 'relative' }}>
                <button
                  className="sf-btn sf-btn--sm"
                  style={{ padding: '0 8px' }}
                  type="button"
                  onClick={() => {
                    setShowStackDropdown(!showStackDropdown);
                    setShowSortDropdown(false);
                  }}
                >
                  <Icons.Filter size={11} /> Stack: {stackFilter === 'any' ? 'any' : stackFilter}
                </button>
                {showStackDropdown && (
                  <div
                    className="sf-card-elev"
                    style={{
                      position: 'absolute', top: 34, right: 0, zIndex: 50, width: 140, padding: 4,
                      background: 'var(--sf-surface-2)', border: '1px solid var(--sf-border-strong)'
                    }}
                  >
                    {(['any', 'Hono', 'Fastify', 'Express'] as const).map(opt => (
                      <button
                        key={opt}
                        onClick={() => { setStackFilter(opt); setShowStackDropdown(false); }}
                        className="sf-row"
                        style={{
                          width: '100%', padding: '6px 8px', fontSize: 12, border: 'none', background: 'transparent',
                          color: stackFilter === opt ? 'var(--sf-text)' : 'var(--sf-text-muted)',
                          borderRadius: 4, cursor: 'pointer', textAlign: 'left'
                        }}
                        type="button"
                      >
                        {opt === 'any' ? 'Any Stack' : opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort Dropdown Container */}
              <div style={{ position: 'relative' }}>
                <button
                  className="sf-btn sf-btn--sm"
                  style={{ padding: '0 8px' }}
                  type="button"
                  onClick={() => {
                    setShowSortDropdown(!showSortDropdown);
                    setShowStackDropdown(false);
                  }}
                >
                  Sort: {sort === 'updated' ? 'Updated' : sort === 'name' ? 'Name' : 'Health'} <Icons.ChevD size={11} />
                </button>
                {showSortDropdown && (
                  <div
                    className="sf-card-elev"
                    style={{
                      position: 'absolute', top: 34, right: 0, zIndex: 50, width: 120, padding: 4,
                      background: 'var(--sf-surface-2)', border: '1px solid var(--sf-border-strong)'
                    }}
                  >
                    {([
                      { key: 'updated', label: 'Updated' },
                      { key: 'name', label: 'Name' },
                      { key: 'health', label: 'Health' }
                    ] as const).map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => { setSort(opt.key); setShowSortDropdown(false); }}
                        className="sf-row"
                        style={{
                          width: '100%', padding: '6px 8px', fontSize: 12, border: 'none', background: 'transparent',
                          color: sort === opt.key ? 'var(--sf-text)' : 'var(--sf-text-muted)',
                          borderRadius: 4, cursor: 'pointer', textAlign: 'left'
                        }}
                        type="button"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="sf-row" style={{ background: 'var(--sf-surface)', border: '1px solid var(--sf-border)', borderRadius: 8, padding: 2 }}>
                <button type="button" onClick={() => setView('grid')} className="sf-row" style={{ height: 26, padding: '0 8px', border: 'none', background: view==='grid'?'var(--sf-elevated)':'transparent', color: view==='grid'?'var(--sf-text)':'var(--sf-text-muted)', borderRadius: 6, cursor: 'pointer' }}>
                  <Icons.Grid size={12} />
                </button>
                <button type="button" onClick={() => setView('list')} className="sf-row" style={{ height: 26, padding: '0 8px', border: 'none', background: view==='list'?'var(--sf-elevated)':'transparent', color: view==='list'?'var(--sf-text)':'var(--sf-text-muted)', borderRadius: 6, cursor: 'pointer' }}>
                  <Icons.List size={12} />
                </button>
              </div>
            </div>

            {/* Project grid / list */}
            {view === 'grid' ? (
              <div className={styles.projectGrid}>
                {/* Create card */}
                <div 
                  className="sf-card" 
                  onClick={handleOpenCreate}
                  style={{
                    padding: 18, minHeight: 168,
                    border: '1px dashed rgba(255,255,255,0.10)',
                    background: 'transparent',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                    gap: 8, cursor: 'pointer',
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--sf-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icons.Plus size={16} />
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>New project</div>
                  <div className="sf-faint" style={{ fontSize: 12 }}>Generate from a prompt</div>
                </div>

                {filteredAndSortedProjects.map(p => (
                  <ProjectCard 
                    key={p.id} 
                    p={p} 
                    showMenu={actionMenuProjectId === p.id}
                    onToggleMenu={() => setActionMenuProjectId(actionMenuProjectId === p.id ? null : p.id)}
                    onSelect={() => router.push(`/generations/${p.id}`)}
                    onHover={() => router.prefetch(`/generations/${p.id}`)}
                    onEdit={() => handleOpenEdit(p)}
                    onToggleStatus={() => handleToggleStatus(p)}
                    onDelete={() => {
                      if (confirm(`Are you sure you want to delete "${p.name}"?`)) {
                        handleDeleteProject(p.id);
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="sf-card" style={{ padding: 0, marginBottom: 28, overflow: 'visible' }}>
                <div className="sf-row" style={{ padding: '8px 14px', borderBottom: '1px solid var(--sf-border)', background: 'var(--sf-bg-2)', fontSize: 11, color: 'var(--sf-text-faint)', letterSpacing: '0.04em', textTransform: 'uppercase', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                  <span style={{ flex: '0 0 36%' }}>Project</span>
                  <span style={{ flex: '0 0 22%' }}>Stack</span>
                  <span style={{ flex: '0 0 16%' }}>Status</span>
                  <span style={{ flex: '0 0 14%' }}>Health</span>
                  <span className="sf-grow">Updated</span>
                </div>
                
                {filteredAndSortedProjects.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--sf-text-muted)', fontSize: 13 }}>
                    No projects match your current filters.
                  </div>
                ) : (
                  filteredAndSortedProjects.map((p, i) => (
                    <div 
                      key={p.id} 
                      className="sf-row" 
                      onClick={() => router.push(`/generations/${p.id}`)}
                      style={{ padding: '12px 14px', borderBottom: i < filteredAndSortedProjects.length - 1 ? '1px solid var(--sf-border)' : 'none', fontSize: 13, gap: 8, cursor: 'pointer', position: 'relative' }}
                    >
                      <div className="sf-row" style={{ flex: '0 0 36%', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--sf-surface-2)', border: '1px solid var(--sf-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icons.Box size={12} />
                        </div>
                        <div>
                          <div style={{ color: 'var(--sf-text)', fontWeight: 500 }}>{p.name}</div>
                          <div className="sf-faint" style={{ fontSize: 11 }}>{p.prompt}</div>
                        </div>
                      </div>
                      <span className="mono" style={{ flex: '0 0 22%', fontSize: 11.5, color: 'var(--sf-text-muted)' }}>{p.stack}</span>
                      <span style={{ flex: '0 0 16%' }} className="sf-row">
                        <span className={`sf-dot sf-dot--${p.dot}`} style={{ marginRight: 6 }} />
                        <span style={{ fontSize: 12.5 }}>{STATUS[p.status]?.label || p.status}</span>
                      </span>
                      <span style={{ flex: '0 0 14%' }} className="mono sf-muted">{p.health ? p.health + '%' : '—'}</span>
                      <span className="sf-grow sf-faint" style={{ fontSize: 12 }}>{p.updated}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Activity feed + usage */}
            <div className={styles.bottomGrid}>
              <div className="sf-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="sf-row" style={{ padding: '14px 18px', borderBottom: '1px solid var(--sf-border)' }}>
                  <span className="sf-h2 sf-grow" style={{ margin: 0 }}>Activity</span>
                  <button className="sf-btn sf-btn--ghost sf-btn--sm" type="button">View all</button>
                </div>
                <div style={{
                  padding: "24px",
                  opacity: 0.5,
                  fontFamily: "var(--sf-font-sans)",
                  fontSize: "13px",
                }}>
                  Activity feed coming soon.
                </div>
              </div>
              <div className="sf-card" style={{ padding: 18 }}>
                <div className="sf-h2" style={{ marginBottom: 6, marginTop: 0 }}>Usage</div>
                <div style={{ opacity: 0.5, fontSize: "13px" }}>
                  Usage tracking coming soon.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CREATE PROJECT DIALOG */}
      <Dialog 
        open={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        title="New Project" 
        description="Provision a new developer-first backend codebase."
      >
        <form onSubmit={handleSubmit(onCreateSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--sf-text-muted)', marginBottom: 6 }}>Project Name</label>
            <Input 
              {...register("name")} 
              placeholder="e.g. Acme API, Payments Service" 
              autoFocus
            />
            {errors.name && (
              <span style={{ color: 'var(--sf-red)', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                {errors.name.message}
              </span>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--sf-text-muted)', marginBottom: 6 }}>Description / AI Prompt</label>
            <Textarea 
              {...register("prompt")} 
              placeholder="Describe what you want to build (models, relationships, endpoints, etc.)"
              rows={4}
            />
            {errors.prompt && (
              <span style={{ color: 'var(--sf-red)', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                {errors.prompt.message}
              </span>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--sf-text-muted)', marginBottom: 6 }}>Runtime & Technologies Stack</label>
            
            {/* Tech stack presets */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {[
                "Hono · PG · Redis",
                "Fastify · PG · S3",
                "Express · PG · Stripe"
              ].map(preset => {
                const active = formStack === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setValue("stack", preset)}
                    className="sf-chip"
                    style={{
                      background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                      borderColor: active ? 'var(--sf-border-strong)' : 'var(--sf-border)',
                      color: active ? 'var(--sf-text)' : 'var(--sf-text-muted)',
                      cursor: 'pointer',
                      padding: '4px 10px',
                      fontSize: 11.5,
                      borderRadius: 6
                    }}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>

            <Input 
              {...register("stack")} 
              placeholder="Custom Tech Stack (e.g. Hono · Neon PG · Redis)" 
            />
            {errors.stack && (
              <span style={{ color: 'var(--sf-red)', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                {errors.stack.message}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* EDIT PROJECT DIALOG */}
      <Dialog 
        open={!!editingProject} 
        onClose={() => setEditingProject(null)} 
        title="Edit Project" 
        description="Update project details and specifications."
      >
        <form onSubmit={handleSubmit(onEditSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--sf-text-muted)', marginBottom: 6 }}>Project Name</label>
            <Input 
              {...register("name")} 
              placeholder="e.g. Acme API, Payments Service" 
              autoFocus
            />
            {errors.name && (
              <span style={{ color: 'var(--sf-red)', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                {errors.name.message}
              </span>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--sf-text-muted)', marginBottom: 6 }}>Description / AI Prompt</label>
            <Textarea 
              {...register("prompt")} 
              placeholder="Describe what you want to build"
              rows={4}
            />
            {errors.prompt && (
              <span style={{ color: 'var(--sf-red)', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                {errors.prompt.message}
              </span>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--sf-text-muted)', marginBottom: 6 }}>Runtime & Technologies Stack</label>
            <Input 
              {...register("stack")} 
              placeholder="Custom Tech Stack" 
            />
            {errors.stack && (
              <span style={{ color: 'var(--sf-red)', fontSize: 11.5, marginTop: 4, display: 'block' }}>
                {errors.stack.message}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setEditingProject(null)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Global CSS spinner definition */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
