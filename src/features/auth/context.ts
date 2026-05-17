/**
 * context.ts (auth)
 * El contexto vive en su propio archivo para no mezclar exports de
 * componentes con no-componentes (mantiene limpio el fast-refresh de Vite).
 */

import { createContext } from 'react';
import type { AuthContextValue } from './types';

export const AuthContext = createContext<AuthContextValue | null>(null);
