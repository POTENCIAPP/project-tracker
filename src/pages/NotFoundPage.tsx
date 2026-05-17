/**
 * NotFoundPage.tsx
 * Ruta no encontrada (404).
 */

import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <div className="max-w-sm text-center">
        <p className="text-5xl font-bold tracking-tight text-slate-300">404</p>
        <h1 className="mt-2 text-lg font-bold tracking-tight text-slate-900">
          Página no encontrada
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          La dirección que ingresaste no existe.
        </p>
        <Link
          to="/admin"
          className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Ir al panel
        </Link>
      </div>
    </div>
  );
}
