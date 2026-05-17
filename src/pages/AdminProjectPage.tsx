/**
 * AdminProjectPage.tsx
 * Espacio de administración: barra superior, panel del link del cliente
 * y el ProjectTracker en modo admin.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Copy, Link2, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '@/features/auth';
import {
  ProjectTracker,
  type Milestone,
  type MilestoneDraft,
  type ProjectData,
} from '@/features/project-tracker';
import { AGENCY_NAME } from '@/lib/branding';
import {
  createMilestone,
  deleteMilestone,
  getAdminProject,
  regenerateShareToken,
  reorderMilestones,
  updateProject,
  upsertMilestone,
} from '@/lib/mockProjectStore';
import { buildShareUrl } from '@/lib/shareLink';

export function AdminProjectPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    getAdminProject().then(setProject);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const handleCopy = async () => {
    if (!project?.publicToken) return;
    try {
      await navigator.clipboard.writeText(buildShareUrl(project.publicToken));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Si el navegador bloquea el portapapeles, el input queda visible para copiar a mano.
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    const updated = await regenerateShareToken();
    setProject({ ...updated });
    setCopied(false);
    setRegenerating(false);
  };

  // Cada mutación persiste en el store y re-sincroniza la vista (y el link
  // del cliente, que lee del mismo store).
  const handleUpdateMilestone = async (milestone: Milestone) => {
    setProject({ ...(await upsertMilestone(milestone)) });
  };

  const handleCreateMilestone = async (draft: MilestoneDraft) => {
    const { project: next } = await createMilestone(draft);
    setProject({ ...next });
  };

  const handleDeleteMilestone = async (id: string) => {
    setProject({ ...(await deleteMilestone(id)) });
  };

  const handleReorderMilestones = async (orderedIds: string[]) => {
    setProject({ ...(await reorderMilestones(orderedIds)) });
  };

  const handleUpdateProject = async (
    patch: Partial<Pick<ProjectData, 'projectName' | 'clientName'>>,
  ) => {
    setProject({ ...(await updateProject(patch)) });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Barra superior */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <div className="font-bold tracking-tight text-slate-900">
            {AGENCY_NAME}
            <span className="ml-1.5 text-sm font-normal text-slate-400">· Gestión</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">{user?.email}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        {!project ? (
          <div className="flex items-center gap-2.5 py-12 text-sm text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
            Cargando proyecto…
          </div>
        ) : (
          <>
            {/* Panel del link para el cliente */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-slate-900">Link para el cliente</h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Cualquiera con este link puede ver el avance del proyecto en modo lectura.
                No requiere cuenta.
              </p>

              <div className="mt-3 flex gap-2">
                <input
                  readOnly
                  value={project.publicToken ? buildShareUrl(project.publicToken) : ''}
                  onFocus={(e) => e.currentTarget.select()}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600 outline-none"
                  aria-label="Link del cliente"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  {copied ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  )}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  Regenerar link
                </button>
                <span className="text-xs text-slate-400">
                  Regenerar invalida el link anterior.
                </span>
              </div>
            </section>

            {/* Tracker en modo administración */}
            <ProjectTracker
              data={project}
              role="admin"
              onUpdateMilestone={handleUpdateMilestone}
              onCreateMilestone={handleCreateMilestone}
              onDeleteMilestone={handleDeleteMilestone}
              onReorderMilestones={handleReorderMilestones}
              onUpdateProject={handleUpdateProject}
            />
          </>
        )}
      </main>
    </div>
  );
}
