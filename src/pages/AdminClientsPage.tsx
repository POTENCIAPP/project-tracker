/**
 * AdminClientsPage.tsx
 * Consola multi-cliente de Potenciapp: listar clientes, crear uno nuevo
 * (genera su slug/link estable) y entrar a editar su proyecto.
 */

import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Loader2,
  LogOut,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { AGENCY_NAME } from '@/lib/branding';
import {
  createProject,
  deleteProject,
  listProjects,
  type ProjectSummary,
} from '@/lib/api';
import { buildClientUrl } from '@/lib/clientSlug';
import { StorageBanner } from '@/components/StorageBanner';
import { CopyButton } from '@/components/CopyButton';
import { AdminTokenField } from '@/components/AdminTokenField';

export function AdminClientsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [clients, setClients] = useState<ProjectSummary[] | null>(null);
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    listProjects()
      .then(setClients)
      .catch((e) => {
        setClients([]);
        setError(e instanceof Error ? e.message : 'No se pudo cargar la lista.');
      });
  };

  useEffect(load, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

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

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <div className="font-bold tracking-tight text-slate-900">
            {AGENCY_NAME}
            <span className="ml-1.5 text-sm font-normal text-slate-400">· Clientes</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/usuarios"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              Usuarios
            </Link>
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
        <StorageBanner />
        <AdminTokenField onSaved={load} />

        {/* Alta de cliente */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-slate-500" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-slate-900">Nuevo cliente</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Creás el proyecto y te queda un link estable para mandarle por WhatsApp.
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

        {/* Lista de clientes */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <Users className="h-4 w-4 text-slate-500" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-slate-900">Clientes</h2>
          </div>

          {clients === null ? (
            <div className="flex items-center gap-2.5 px-5 py-12 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Cargando…
            </div>
          ) : clients.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-slate-500">
              Todavía no hay clientes. Creá el primero arriba.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {clients.map((c) => (
                <li
                  key={c.slug}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <Link
                    to={`/admin/c/${c.slug}`}
                    className="group min-w-0 flex-1"
                  >
                    <p className="truncate font-medium text-slate-900 group-hover:underline">
                      {c.projectName}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      {c.clientName}
                      <span className="mx-1.5 text-slate-300">•</span>
                      {c.progress.percent}% completado
                      <span className="mx-1.5 text-slate-300">•</span>
                      <span className="font-mono text-xs">/c/{c.slug}</span>
                    </p>
                  </Link>
                  <div className="flex shrink-0 items-center gap-2">
                    <CopyButton
                      value={buildClientUrl(c.slug)}
                      label="Link cliente"
                      className="!bg-slate-100 !text-slate-700 hover:!bg-slate-200"
                    />
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
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
