/**
 * index.ts (auth)
 * API pública de la capa de autenticación.
 */

export { AuthProvider } from './AuthProvider';
export { ProtectedRoute } from './ProtectedRoute';
export { LoginPage } from './LoginPage';
export { useAuth } from './useAuth';

export type { AdminUser, AuthStatus, AuthContextValue } from './types';
