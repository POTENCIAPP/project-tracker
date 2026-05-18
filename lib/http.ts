/**
 * lib/http.ts
 * Helpers compartidos por las funciones serverless de /api.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminToken } from './store';

export function sendJson(res: VercelResponse, status: number, data: unknown): void {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(data));
}

/** Body JSON robusto: Vercel ya parsea application/json, pero defendemos el string. */
export function readBody<T = Record<string, unknown>>(req: VercelRequest): T {
  const b = req.body;
  if (!b) return {} as T;
  if (typeof b === 'string') {
    try {
      return JSON.parse(b) as T;
    } catch {
      return {} as T;
    }
  }
  return b as T;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * Si ADMIN_TOKEN está configurado en el entorno, las escrituras exigen el
 * header `x-pt-admin` con ese valor. Si NO está configurado, se permite
 * (modo demo) — el front muestra un aviso de que falta endurecer esto.
 */
export function assertAdmin(req: VercelRequest): void {
  const token = adminToken();
  if (!token) return; // modo demo: sin protección de servidor
  const sent = req.headers['x-pt-admin'];
  if (sent !== token) {
    throw new HttpError(401, 'No autorizado: token de admin inválido o ausente.');
  }
}

export function handleError(res: VercelResponse, err: unknown): void {
  if (err instanceof HttpError) {
    sendJson(res, err.status, { error: err.message });
    return;
  }
  // eslint-disable-next-line no-console
  console.error('[api] error inesperado:', err);
  sendJson(res, 500, {
    error: err instanceof Error ? err.message : 'Error interno del servidor.',
  });
}
