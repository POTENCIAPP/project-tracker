/**
 * GET /api/health
 * Diagnóstico de infraestructura. El front lo usa para avisar si el storage
 * todavía no está conectado (modo memoria efímera).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminToken, storageMode } from '../lib/store';
import { sendJson } from '../lib/http';

export default function handler(_req: VercelRequest, res: VercelResponse): void {
  sendJson(res, 200, {
    ok: true,
    storage: storageMode(), // 'kv' (persistente) | 'memory' (efímero)
    protected: Boolean(adminToken()),
  });
}
