/**
 * useAuth.ts
 * Hook de acceso al estado de autenticación.
 */

import { useContext } from 'react';
import { AuthContext } from './context';
import type { AuthContextValue } from './types';

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  }
  return ctx;
}
