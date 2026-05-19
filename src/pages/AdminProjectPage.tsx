/**
 * AdminProjectPage.tsx
 * Ficha de UN cliente (/admin/c/:slug): link para compartir, accesos
 * (usuarios que pueden entrar) y editor de hitos. Carga/guarda contra /api.
 */

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ExternalLink,
  KeyRound,
  Link2,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  ProjectTracker,
  type Milestone,
  type MilestoneDraft,
  type ProjectData,
} from '@/features/project-tracker';
import {
  adminGetProject,
  createUser,
  deleteUser,
  listUsers,
  saveProject,
  type ClientUser,
} from '@/lib/api';
import { buildClientUrl, subdomainModeEnabled } from '@/lib/clientSlug';
import { AdminShell } from '@/components/AdminShell';
import { CopyButton } from '@/components/CopyButton';
import { WhatsAppButton } from '@/components/WhatsAppButton';

function newMilestoneId(): string {
  return `ms-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

type State =
  | { status: 'loading' }
  | { status: 'notfound' }
  | { status: 'ready'; project: ProjectData };

export function AdminProjectPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [saveError, setSaveError] = useState<string | null>(null);

  // Accesos de este cliente
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [uBusy, setUBusy] = useState(false);
  const [uErr, setUErr] = useState<string | null>(null);
  const [uNew, setUNew] = useState<{ username: string; password: string } | null>(
    null,
  );

  const loadUsers = useCallback(() => {
    listUsers()
      .then((all) => setUsers(all.filter((x) => x.slug === slug)))
      .catch(() => setUsers([]));
  }, [slug]);

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    adminGetProject(slug)
      .then((project) => {
        if (!active) return;
        setState(project ? { status: 'ready', project } : { status: 'notfound' });
      })
      .catch(() => active && setState({ status: 'notfound' }));
    loadUsers();
    return () => {
      active = false;
    };
  }, [slug, loadUsers]);

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

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setUErr(null);
    setUNew(null);
    setUBusy(true);
    try {
      await createUser({ username: u.trim(), password: p, slug });
      setUNew({ username: u.trim().toLowerCase(), password: p });
      setU('');
      setP('');
      loadUsers();
    } catch (err) {
      setUErr(err instanceof Error ? err.message : 'No se pudo crear el acceso.');
    } finally {
      setUBusy(false);
    }
  };

  const handleDeleteUser = async (name: string) => {
    if (!window.confirm(`¿Eliminar el acceso de "${name}"?`)) return;
    try {
      await deleteUser(name);
      loadUsers();
    } catch {
      /* noop */
    }
  };

  const url = buildClientUrl(slug);

  return (
    <AdminShell section="clientes" back={{ to: '/admin', label: 'Volver a clientes' }}>
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
          {/* Link para el cliente */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-slate-900">
                Link para el cliente
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Estable y de solo lectura. El cliente entra con el usuario y
              contraseña que le crees abajo.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <input
                readOnly
                value={url}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600 outline-none"
                aria-label="Link del cliente"
              />
              <CopyButton value={url} />
              <WhatsAppButton url={url} />
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Ver
              </a>
            </div>
            {users.length === 0 && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                Este cliente todavía no tiene accesos: creá uno abajo o no va a
                poder entrar.
              </p>
            )}
            {!subdomainModeEnabled() && (
              <p className="mt-2 text-xs text-slate-400">
                Link estable por path. (El subdominio por cliente requiere migrar
                el DNS del dominio.)
              </p>
            )}
          </section>

          {/* Accesos de este cliente */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-slate-900">
                Accesos de este cliente
              </h2>
            </div>

            <form
              onSubmit={handleCreateUser}
              className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
            >
              <input
                value={u}
                onChange={(e) => setU(e.target.value)}
                placeholder="Usuario"
                autoComplete="off"
                required
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
              <input
                value={p}
                onChange={(e) => setP(e.target.value)}
                placeholder="Contraseña (mín. 6)"
                autoComplete="off"
                required
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
              <button
                type="submit"
                disabled={uBusy}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {uBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Plus className="h-4 w-4" aria-hidden="true" />
                )}
                Crear
              </button>
            </form>

            {uNew && (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Acceso creado (pasáselo al cliente, no se vuelve a mostrar):
                <div className="mt-1 font-mono text-xs">
                  usuario: {uNew.username} · contraseña: {uNew.password}
                </div>
              </div>
            )}
            {uErr && (
              <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {uErr}
              </p>
            )}

            {users.length > 0 && (
              <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-100">
                {users.map((x) => (
                  <li
                    key={x.username}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <span className="truncate text-sm font-medium text-slate-800">
                      {x.username}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(x.username)}
                      aria-label={`Eliminar ${x.username}`}
                      className="inline-flex shrink-0 items-center rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
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
    </AdminShell>
  );
}
