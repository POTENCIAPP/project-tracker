/**
 * AuthProvider.tsx
 * ----------------------------------------------------------------------------
 * Estado de autenticación del equipo admin.
 *
 * IMPLEMENTACIÓN ACTUAL: MOCK (credencial demo + persistencia en localStorage).
 *
 * Para producción, reemplazá el bloque marcado "MOCK AUTH" por Supabase Auth:
 *   - signIn        -> supabase.auth.signInWithPassword({ email, password })
 *   - signOut       -> supabase.auth.signOut()
 *   - estado inicial -> supabase.auth.getSession() + supabase.auth.onAuthStateChange()
 * La interfaz pública (useAuth) NO cambia.
 * ----------------------------------------------------------------------------
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AuthContext } from './context';
import type { AdminUser, AuthContextValue, AuthStatus } from './types';

/* === MOCK AUTH ============================================================ */
const DEMO_ADMIN = {
  email: 'admin@admin.com',
  password: 'PotenciappAdmin!',
  user: { id: 'usr-admin-1', email: 'admin@admin.com', name: 'Equipo Potenciapp' },
} as const;

const SESSION_KEY = 'pt_admin_session';

function readStoredSession(): AdminUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
}
/* ========================================================================== */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AdminUser | null>(null);

  // Restaurar sesión al iniciar la app.
  useEffect(() => {
    const stored = readStoredSession();
    setUser(stored);
    setStatus(stored ? 'authenticated' : 'unauthenticated');
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    /* === MOCK AUTH: validar contra la credencial demo ===================== */
    await new Promise((resolve) => setTimeout(resolve, 400)); // simula latencia
    const ok =
      email.trim().toLowerCase() === DEMO_ADMIN.email && password === DEMO_ADMIN.password;
    if (!ok) {
      throw new Error('Email o contraseña incorrectos.');
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(DEMO_ADMIN.user));
    setUser(DEMO_ADMIN.user);
    setStatus('authenticated');
    /* ====================================================================== */
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, signIn, signOut }),
    [status, user, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
