/**
 * AdminUsersPage.tsx
 * Panel de Potenciapp para administrar los usuarios que ven los dashboards:
 * crear (usuario + contraseña + proyecto asignado), listar y eliminar.
 */

import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound, Loader2, LogOut, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { AGENCY_NAME } from '@/lib/branding';
import {
  createUser,
  deleteUser,
  listProjects,
  listUsers,
  type ClientUser,
  type ProjectSummary,
} from '@/lib/api';
import { StorageBanner } from '@/components/StorageBanner';
import { AdminTokenField } from '@/components/AdminTokenField';

export function AdminUsersPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<ClientUser[] | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [slug, setSlug] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ username: string; password: string } | null>(
    null,
  );

  const load = () => {
    listUsers()
      .then(setUsers)
      .catch((e) => {
        setUsers([]);
        setError(e instanceof Error ? e.message : 'No se pudo cargar.');
      });
    listProjects()
      .then(setProjects)
      .catch(() => setProjects([]));
  };

  useEffect(load, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreated(null);
    if (!slug) {
      setError('Elegí a qué proyecto tiene acceso.');
      return;
    }
    setBusy(true);
    try {
      await createUser({ username: username.trim(), password, slug });
      setCreated({ username: username.trim().toLowerCase(), password });
      setUsername('');
      setPassword('');
      setSlug('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el usuario.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (u: string) => {
    if (!window.confirm(`¿Eliminar el acceso de "${u}"?`)) return;
    try {
      await deleteUser(u);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar.');
    }
  };

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
            <span className="ml-1 text-sm font-normal text-slate-400">· Usuarios</span>
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
        <StorageBanner />
        <AdminTokenField onSaved={load} />

        {/* Alta de usuario */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-slate-500" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-slate-900">Nuevo usuario</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Le da acceso de solo lectura al dashboard del proyecto que elijas.
          </p>
          <form onSubmit={handleCreate} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Usuario (ej. agos)"
              autoComplete="off"
              required
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña (mín. 6)"
              type="text"
              autoComplete="off"
              required
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
            <select
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 sm:col-span-2"
            >
              <option value="">— Proyecto al que accede —</option>
              {projects.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.projectName} ({p.slug})
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60 sm:col-span-2"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="h-4 w-4" aria-hidden="true" />
              )}
              {busy ? 'Creando…' : 'Crear usuario'}
            </button>
          </form>

          {created && (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Usuario creado. Pasale estos datos al cliente (no se vuelven a
              mostrar):
              <div className="mt-1 font-mono text-xs">
                usuario: {created.username} · contraseña: {created.password}
              </div>
            </div>
          )}
          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
        </section>

        {/* Lista de usuarios */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <KeyRound className="h-4 w-4 text-slate-500" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-slate-900">
              Usuarios con acceso
            </h2>
          </div>
          {users === null ? (
            <div className="flex items-center gap-2.5 px-5 py-12 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Cargando…
            </div>
          ) : users.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-slate-500">
              Todavía no hay usuarios. Creá el primero arriba.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {users.map((u) => (
                <li
                  key={u.username}
                  className="flex items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{u.username}</p>
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      {u.projectName}
                      <span className="mx-1.5 text-slate-300">•</span>
                      <span className="font-mono text-xs">/c/{u.slug}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(u.username)}
                    aria-label={`Eliminar ${u.username}`}
                    className="inline-flex shrink-0 items-center rounded-lg border border-slate-200 p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
