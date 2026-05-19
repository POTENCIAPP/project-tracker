/**
 * AdminClientsPage.tsx
 * Dashboard de Potenciapp: métricas, búsqueda, alta de cliente y listado
 * con progreso, accesos y acciones (abrir, copiar link, WhatsApp, eliminar).
 */

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import {
  ApiError,
  createProject,
  deleteProject,
  listProjects,
  listUsers,
  type ProjectSummary,
} from '@/lib/api';
import { buildClientUrl } from '@/lib/clientSlug';
import { relativeTime } from '@/lib/relativeTime';
import { AdminShell } from '@/components/AdminShell';
import { CopyButton } from '@/components/CopyButton';
import { WhatsAppButton } from '@/components/WhatsAppButton';

export function AdminClientsPage() {
  const navigate = useNavigate();

  const [clients, setClients] = useState<ProjectSummary[] | null>(null);
  const [userCount, setUserCount] = useState<Record<string, number>>({});
  const [query, setQuery] = useState('');
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needToken, setNeedToken] = useState(false);

  const load = () => {
    setError(null);
    listProjects()
      .then((list) => {
        setClients(list);
        setNeedToken(false);
      })
      .catch((e) => {
        setClients([]);
        if (e instanceof ApiError && e.status === 401) setNeedToken(true);
        else setError(e instanceof Error ? e.message : 'No se pudo cargar.');
      });
    listUsers()
      .then((us) => {
        const c: Record<string, number> = {};
        for (const u of us) c[u.slug] = (c[u.slug] ?? 0) + 1;
        setUserCount(c);
      })
      .catch(() => setUserCount({}));
  };

  useEffect(load, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const project = await createProject({
        clientName: clientName.trim(),
        projectName: projectName.trim(),
      });
      navigate(`/admin/c/${project.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el cliente.');
      setCreating(false);
    }
  };

  const handleDelete = async (slug: string, name: string) => {
    if (!window.confirm(`¿Eliminar el proyecto de "${name}"? No se puede deshacer.`))
      return;
    try {
      await deleteProject(slug);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar.');
    }
  };

  const filtered = useMemo(() => {
    const list = clients ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.projectName.toLowerCase().includes(q) ||
        c.clientName.toLowerCase().includes(q) ||
        c.slug.includes(q),
    );
  }, [clients, query]);

  const stats = useMemo(() => {
    const list = clients ?? [];
    const accesos = Object.values(userCount).reduce((a, b) => a + b, 0);
    const avg =
      list.length === 0
        ? 0
        : Math.round(
            list.reduce((a, c) => a + c.progress.percent, 0) / list.length,
          );
    return { clientes: list.length, accesos, avg };
  }, [clients, userCount]);

  return (
    <AdminShell section="clientes" onTokenSaved={load}>
      {needToken && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Pegá el <strong>Token de admin</strong> en el campo de arriba para ver y
          gestionar tus clientes.
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Clientes', value: stats.clientes },
          { label: 'Accesos', value: stats.accesos },
          { label: 'Progreso prom.', value: `${stats.avg}%` },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm"
          >
            <p className="text-2xl font-bold tracking-tight text-slate-900">
              {s.value}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alta de cliente */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-slate-500" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-900">Nuevo cliente</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Creás el proyecto y después le das un acceso (usuario/contraseña) desde
          su ficha.
        </p>
        <form onSubmit={handleCreate} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Nombre del cliente (ej. Gisbert)"
            required
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Nombre del proyecto"
            required
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60 sm:col-span-2"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden="true" />
            )}
            {creating ? 'Creando…' : 'Crear cliente'}
          </button>
        </form>
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
      </section>

      {/* Lista */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <Users className="h-4 w-4 text-slate-500" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-900">Clientes</h2>
          <div className="relative ml-auto">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar…"
              className="w-40 rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-2 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 sm:w-56"
            />
          </div>
        </div>

        {clients === null ? (
          <div className="flex items-center gap-2.5 px-5 py-12 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando…
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500">
            {clients.length === 0
              ? 'Todavía no hay clientes. Creá el primero arriba.'
              : 'Sin resultados para la búsqueda.'}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((c) => {
              const accesos = userCount[c.slug] ?? 0;
              return (
                <li key={c.slug} className="px-5 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Link to={`/admin/c/${c.slug}`} className="group min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900 group-hover:underline">
                        {c.projectName}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-slate-500">
                        {c.clientName}
                        <span className="mx-1.5 text-slate-300">•</span>
                        <span className="font-mono text-xs">/c/{c.slug}</span>
                        <span className="mx-1.5 text-slate-300">•</span>
                        {relativeTime(c.updatedAt)}
                      </p>
                    </Link>
                    <div className="flex shrink-0 items-center gap-2">
                      <CopyButton
                        value={buildClientUrl(c.slug)}
                        label="Link"
                        className="!bg-slate-100 !text-slate-700 hover:!bg-slate-200"
                      />
                      <WhatsAppButton url={buildClientUrl(c.slug)} />
                      <Link
                        to={`/admin/c/${c.slug}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Abrir
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.slug, c.clientName)}
                        aria-label={`Eliminar ${c.clientName}`}
                        className="inline-flex items-center rounded-lg border border-slate-200 p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {/* Progreso + accesos */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-pp-green transition-all"
                        style={{ width: `${c.progress.percent}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs font-medium text-slate-500">
                      {c.progress.percent}%
                    </span>
                    {accesos === 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                        sin acceso
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        <Users className="h-3 w-3" aria-hidden="true" />
                        {accesos}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}
