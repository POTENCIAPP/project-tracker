/**
 * ClientPortalPage.tsx
 * Portal del cliente. AHORA con login: el cliente entra con usuario y
 * contraseña (los crea Potenciapp desde el panel). Solo lectura, sin CRUD.
 * Resuelve el slug por path (/c/:slug) o por subdominio.
 */

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, LogOut, Unlink } from 'lucide-react';
import { ProjectTracker, type ProjectData } from '@/features/project-tracker';
import { AGENCY_NAME } from '@/lib/branding';
import { BRAND } from '@/lib/brand';
import {
  ApiError,
  clientLogin,
  clientLogout,
  getClientProject,
  getClientSession,
} from '@/lib/api';

type State =
  | { status: 'checking' }
  | { status: 'login' }
  | { status: 'ready'; project: ProjectData }
  | { status: 'invalid' };

const FIELD =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 ' +
  'outline-none transition placeholder:text-slate-400 ' +
  'focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10';

export function ClientPortalPage({ slugOverride }: { slugOverride?: string }) {
  const params = useParams<{ slug: string }>();
  const slug = slugOverride ?? params.slug ?? '';

  const [state, setState] = useState<State>({ status: 'checking' });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadProject = useCallback(async () => {
    try {
      const project = await getClientProject(slug);
      setState({ status: 'ready', project });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setState({ status: 'login' });
      } else {
        setError(
          err instanceof Error ? err.message : 'No se pudo cargar el proyecto.',
        );
        setState({ status: 'login' });
      }
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) {
      setState({ status: 'invalid' });
      return;
    }
    const session = getClientSession();
    if (session && session.s === slug) {
      setState({ status: 'checking' });
      loadProject();
    } else {
      setState({ status: 'login' });
    }
  }, [slug, loadProject]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { slug: userSlug } = await clientLogin(username.trim(), password);
      if (userSlug !== slug) {
        clientLogout();
        setError('Tu usuario no tiene acceso a este proyecto.');
        setSubmitting(false);
        return;
      }
      setState({ status: 'checking' });
      await loadProject();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo iniciar sesión. Probá de nuevo.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    clientLogout();
    setUsername('');
    setPassword('');
    setState({ status: 'login' });
  };

  if (state.status === 'checking') {
    return (
      <div className="grid min-h-screen place-items-center bg-pp-paper">
        <div className="flex items-center gap-2.5 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Cargando proyecto…
        </div>
      </div>
    );
  }

  if (state.status === 'invalid') {
    return (
      <div className="grid min-h-screen place-items-center bg-pp-paper p-4">
        <div className="pp-card max-w-sm rounded-2xl p-8 text-center">
          <img
            src={BRAND.wordmarkLight}
            alt="Potenciapp"
            className="mx-auto mb-6 h-7 w-auto"
          />
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-400">
            <Unlink className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-lg font-bold tracking-tight text-slate-900">
            Link no válido
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Este link no existe. Pedile al equipo de {AGENCY_NAME} el enlace
            correcto de tu proyecto.
          </p>
        </div>
      </div>
    );
  }

  if (state.status === 'login') {
    return (
      <div className="grid min-h-screen place-items-center bg-pp-paper p-4">
        <div className="w-full max-w-sm">
          <div className="pp-card rounded-2xl p-7">
            <img
              src={BRAND.wordmarkLight}
              alt="Potenciapp"
              className="h-8 w-auto"
            />
            <h1 className="mt-5 text-xl font-bold tracking-tight text-pp-ink">
              Portal del proyecto
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Ingresá con el usuario que te pasamos
            </p>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Usuario
                </label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={FIELD}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={FIELD}
                  required
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {submitting ? 'Ingresando…' : 'Ingresar'}
              </button>
            </form>
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">
            ¿No tenés acceso? Escribinos y te creamos el usuario.
          </p>
        </div>
      </div>
    );
  }

  // status === 'ready'
  return (
    <div className="min-h-screen bg-pp-paper">
      <div className="pp-grad text-white">
        <header className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-5">
          <img
            src={BRAND.wordmarkDark}
            alt="Potenciapp"
            className="h-8 w-auto"
          />
          <div className="flex items-center gap-4">
            <div className="hidden text-right text-xs text-white/70 sm:block">
              <div>Acceso privado</div>
              <div className="font-medium text-white">
                {state.project.clientName}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 px-3 py-1.5 text-sm font-medium text-white/90 transition hover:bg-white/10"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Salir
            </button>
          </div>
        </header>
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-1">
          <span className="pp-chip border border-pp-lime/30 bg-pp-lime/15 text-pp-lime">
            <span className="pp-dot bg-pp-lime" /> Portal privado del proyecto
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Hola {state.project.clientName}
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-white/80">
            Este es tu portal: seguí en vivo cómo va cada hito, qué está en
            progreso y qué viene a continuación.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <ProjectTracker data={state.project} role="client" />
      </main>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-8 text-xs text-slate-500">
          <img
            src={BRAND.wordmarkLightSm}
            alt="Potenciapp"
            className="h-5 w-auto"
          />
          <span>Portal privado · Solo lectura</span>
        </div>
      </footer>
    </div>
  );
}
