/**
 * POST /api/auth/login   (público)
 * Body: { username, password }
 * OK -> { token, slug, projectName }   |  credenciales inválidas -> 401
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getProject, verifyCredentials } from '../../lib/store.js';
import { signSession } from '../../lib/auth.js';
import { handleError, readBody, sendJson } from '../../lib/http.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      sendJson(res, 405, { error: `Método ${req.method} no permitido.` });
      return;
    }
    const { username, password } = readBody<{
      username?: string;
      password?: string;
    }>(req);
    if (!username || !password) {
      sendJson(res, 400, { error: 'Usuario y contraseña requeridos.' });
      return;
    }
    const cred = await verifyCredentials(username, password);
    if (!cred) {
      sendJson(res, 401, { error: 'Usuario o contraseña incorrectos.' });
      return;
    }
    const token = signSession(cred.username, cred.slug);
    const project = await getProject(cred.slug);
    sendJson(res, 200, {
      token,
      slug: cred.slug,
      projectName: project?.projectName ?? '',
    });
  } catch (err) {
    handleError(res, err);
  }
}
