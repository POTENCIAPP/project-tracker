/**
 * DELETE /api/users/:username   (solo admin: header x-pt-admin)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { deleteUser } from '../../lib/store.js';
import { assertAdmin, handleError, sendJson } from '../../lib/http.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  try {
    assertAdmin(req);
    if (req.method !== 'DELETE') {
      res.setHeader('Allow', 'DELETE');
      sendJson(res, 405, { error: `Método ${req.method} no permitido.` });
      return;
    }
    const username = String(req.query.username ?? '').trim();
    if (!username) {
      sendJson(res, 400, { error: 'Usuario requerido.' });
      return;
    }
    const ok = await deleteUser(username);
    sendJson(res, ok ? 200 : 404, { ok });
  } catch (err) {
    handleError(res, err);
  }
}
