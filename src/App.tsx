/**
 * App.tsx
 * Tabla de rutas.
 *   /              -> subdominio de cliente => su portal; si no, va a /admin
 *   /login         -> acceso del equipo
 *   /admin         -> consola multi-cliente (protegida)
 *   /admin/c/:slug -> editor del proyecto de un cliente (protegida)
 *   /c/:slug       -> portal público del cliente (solo lectura)
 */

import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage, ProtectedRoute } from '@/features/auth';
import { AdminClientsPage } from '@/pages/AdminClientsPage';
import { AdminProjectPage } from '@/pages/AdminProjectPage';
import { AdminUsersPage } from '@/pages/AdminUsersPage';
import { ClientPortalPage } from '@/pages/ClientPortalPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { AGENCY_NAME } from '@/lib/branding';
import { resolveSubdomainSlug } from '@/lib/clientSlug';

/** Raíz: en un subdominio de cliente muestra su portal; si no, manda a /admin. */
function RootRoute() {
  const subdomainSlug = resolveSubdomainSlug();
  if (subdomainSlug) return <ClientPortalPage slugOverride={subdomainSlug} />;
  return <Navigate to="/admin" replace />;
}

/** Los links viejos /p/:token quedaron obsoletos: el modelo ahora es por slug. */
function LegacyLink() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-bold tracking-tight text-slate-900">
          Link desactualizado
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          El formato de los links cambió. Pedile al equipo de {AGENCY_NAME} el
          link nuevo de tu proyecto.
        </p>
        <Link
          to="/"
          className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminClientsPage />} />
        <Route path="/admin/usuarios" element={<AdminUsersPage />} />
        <Route path="/admin/c/:slug" element={<AdminProjectPage />} />
      </Route>

      <Route path="/c/:slug" element={<ClientPortalPage />} />
      <Route path="/p/:token" element={<LegacyLink />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
