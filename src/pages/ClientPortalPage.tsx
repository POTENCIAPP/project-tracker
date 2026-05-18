/**
 * ClientPortalPage.tsx
 * Portal PÚBLICO del cliente, solo lectura. Resuelve el slug por path
 * (/c/:slug) o por subdominio (gisbert.potenciapp.com) y muestra el
 * ProjectTracker en modo cliente. Sin login, sin CRUD.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Unlink } from 'lucide-react';
import { ProjectTracker, type ProjectData } from '@/features/project-tracker';
import { AGENCY_NAME } from '@/lib/branding';
import { getProject } from '@/lib/api';

type LoadState =
  | { status: 'loading' }
  | { status: 'found'; project: ProjectData }
  | { status: 'invalid' };

/**
 * @param slugOverride  cuando el slug viene del subdominio (no del path).
 */
export function ClientPortalPage({ slugOverride }: { slugOverride?: string }) {
  const params = useParams<{ slug: string }>();
  const slug = slugOverride ?? params.slug ?? '';
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    if (!slug) {
      setState({ status: 'invalid' });
      return;
    }
    setState({ status: 'loading' });
    getProject(slug)
      .then((project) => {
        if (!active) return;
        setState(project ? { status: 'found', project } : { status: 'invalid' });
      })
      .catch(() => active && setState({ status: 'invalid' }));
    return () => {
      active = false;
    };
  }, [slug]);

  if (state.status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100">
        <div className="flex items-center gap-2.5 text-sm text-slate-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
          Cargando proyecto…
        </div>
      </div>
    );
  }

  if (state.status === 'invalid') {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100 p-4">
        <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-400">
            <Unlink className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-lg font-bold tracking-tight text-slate-900">
            Link no válido
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Este link no existe o fue dado de baja. Pedile al equipo de{' '}
            {AGENCY_NAME} un enlace actualizado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <span className="font-bold tracking-tight text-slate-900">{AGENCY_NAME}</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <ProjectTracker data={state.project} role="client" />
      </main>
    </div>
  );
}
