/**
 * types.ts (auth)
 * Tipos de la capa de autenticación del equipo admin.
 */

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthContextValue {
  status: AuthStatus;
  user: AdminUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
