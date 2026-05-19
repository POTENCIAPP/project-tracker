/**
 * AdminShell.tsx
 * Marco común de todo el panel de Potenciapp: barra superior con navegación
 * (Clientes / Usuarios), sesión, aviso de storage y campo de token de admin.
 * Mantiene consistencia y evita repetir el header en cada página.
 */

import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { BRAND } from '@/lib/brand';
import { StorageBanner } from '@/components/StorageBanner';
import { AdminTokenField } from '@/components/AdminTokenField';

interface Props {
  section: 'clientes' | 'usuarios';
  children: ReactNode;
  /** Link "volver" opcional (ej. desde la ficha de un cliente). */
  back?: { to: string; label: string };
  /** Se dispara cuando se guarda el token de admin (para recargar datos). */
  onTokenSaved?: () => void;
}

const tab = (active: boolean) =>
  'rounded-lg px-3 py-1.5 text-sm font-medium transition ' +
  (active
    ? 'bg-slate-900 text-white'
    : 'text-slate-600 hover:bg-slate-100');

export function AdminShell({ section, children, back, onTokenSaved }: Props) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-pp-paper">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link to="/admin" aria-label="Potenciapp">
              <img
                src={BRAND.wordmarkLight}
                alt="Potenciapp"
                className="h-7 w-auto"
              />
            </Link>
            <nav className="flex items-center gap-1">
              <Link to="/admin" className={tab(section === 'clientes')}>
                Clientes
              </Link>
              <Link to="/admin/usuarios" className={tab(section === 'usuarios')}>
                Usuarios
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">
              {user?.email}
            </span>
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
        {back && (
          <Link
            to={back.to}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {back.label}
          </Link>
        )}
        <StorageBanner />
        <AdminTokenField onSaved={onTokenSaved} />
        {children}
      </main>
    </div>
  );
}
