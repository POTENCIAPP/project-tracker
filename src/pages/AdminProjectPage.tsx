/**
 * AdminProjectPage.tsx
 * Editor del proyecto de UN cliente (ruta /admin/c/:slug).
 * Carga y guarda contra el backend (/api) — fuente de verdad compartida,
 * así el portal del cliente refleja lo que el equipo edita acá.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Link2, Loader2, LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth';
import {
  ProjectTracker,
  type Milestone,
  type MilestoneDraft,
  type ProjectData,
} from '@/features/project-tracker';
import { AGENCY_NAME } from '@/lib/branding';
import { getProject, saveProject } from '@/lib/api';
import { buildClientUrl, subdomainModeEnabled } from '@/lib/clientSlug';
import { CopyButton } from '@/components/CopyButton';

function newMilestoneId(): string {
  return `ms-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

type State =
  | { status: 'loading' }
  | { status: 'notfound' }
  | { status: 'ready'; project: ProjectData };

export function AdminProjectPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    getProject(slug)
      .then((project) => {
        if (!active) return;
        setState(project ? { status: 'ready', project } : { status: 'notfound' });
      })
      .catch(() => active && setState({ status: 'notfound' }));
    return () => {
      active = false;
    };
  }, [slug]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  // Persiste y re-sincroniza desde la respuesta del servidor.
  const persist = useCallback(
    async (
      patch: Partial<Pick<ProjectData, 'clientName' | 'projectName'>> & {
        milestones?: Milestone[];
      },
    ) => {
      setSaveError(null);
      try {
        const project = await saveProject(slug, patch);
        setState({ status: 'ready', project });
      } catch (err) {
        setSaveError(
          err instanceof Error ? err.message : 'No se pudo guardar el cambio.',
        );
      }
    },
    [slug],
  );

  const currentMilestones = (): Milestone[] =>
    state.status === 'ready' ? state.project.milestones : [];

  const handleUpdateMilestone = (m: Milestone) =>
    persist({ milestones: currentMilestones().map((x) => (x.id === m.id ? m : x)) });

  const handleCreateMilestone = (draft: MilestoneDraft) =>
    persist({
      milestones: [
        ...currentMilestones(),
        {
          ...draft,
          id: newMilestoneId(),
          order: currentMilestones().length + 1,
          lastUpdated: new Date().toISOString(),
        },
      ],
    });

  const handleDeleteMilestone = (id: string) =>
    persist({ milestones: currentMilestones().filter((m) => m.id !== id) });

  const handleReorderMilestones = (orderedIds: string[]) => {
    const byId = new Map(currentMilestones().map((m) => [m.id, m]));
    const reordered = orderedIds
      .map((id, i) => {
        const m = byId.get(id);
        return m ? { ...m, order: i + 1 } : undefined;
      })
      .filter((m): m is Milestone => Boolean(m));
    persist({ milestones: reordered });
  };

  const handleUpdateProject = (
    patch: Partial<Pick<ProjectData, 'projectName' | 'clientName'>>,
  ) => persist(patch);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 font-bold tracking-tight text-slate-900"
          >
            <ArrowLeft className="h-4 w-4 text-slate-400" aria-hidden="true" />
            {AGENCY_NAME}
            <span className="ml-1 text-sm font-normal text-slate-400">· Clientes</span>
          </Link>
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
        {state.status === 'loading' && (
          <div className="flex items-center gap-2.5 py-12 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando proyecto…
          </div>
        )}

        {state.status === 'notfound' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              Cliente no encontrado
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              El proyecto <span className="font-mono">{slug}</span> no existe o fue
              eliminado.
            </p>
            <Link
              to="/admin"
              className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Volver a clientes
            </Link>
          </div>
        )}

        {state.status === 'ready' && (
          <>
            {/* Panel del link para el cliente */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Link para el cliente
                </h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Mandáselo por WhatsApp. Es estable: no cambia aunque edites el
                proyecto, y es de solo lectura.
              </p>

              <div className="mt-3 flex gap-2">
                <input
                  readOnly
                  value={buildClientUrl(state.project.slug ?? slug)}
                  onFocus={(e) => e.currentTarget.select()}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600 outline-none"
                  aria-label="Link del cliente"
                />
                <CopyButton value={buildClientUrl(state.project.slug ?? slug)} />
                <a
                  href={buildClientUrl(state.project.slug ?? slug)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Ver
                </a>
              </div>
              {!subdomainModeEnabled() && (
                <p className="mt-2 text-xs text-slate-400">
                  Cuando configures el DNS de tu dominio, este link pasa
                  automáticamente a la forma{' '}
                  <span className="font-mono">{state.project.slug ?? slug}.tudominio.com</span>.
                </p>
              )}
            </section>

            {saveError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {saveError}
              </p>
            )}

            <ProjectTracker
              data={state.project}
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
