/**
 * /api/users   (solo admin: header x-pt-admin)
 *   GET  -> lista de usuarios cliente (sin hashes)
 *   POST -> crea un usuario { username, password, slug }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createUser, listUsers } from '../../lib/store.js';
import {
  assertAdmin,
  handleError,
  HttpError,
  readBody,
  sendJson,
} from '../../lib/http.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  try {
    assertAdmin(req);

    if (req.method === 'GET') {
      sendJson(res, 200, { users: await listUsers() });
      return;
    }

    if (req.method === 'POST') {
      const body = readBody<{
        username?: string;
        password?: string;
        slug?: string;
      }>(req);
      if (!body.username || !body.password || !body.slug) {
        throw new HttpError(400, 'Faltan usuario, contraseña o proyecto.');
      }
      let user;
      try {
        user = await createUser({
          username: body.username,
          password: body.password,
          slug: body.slug,
        });
      } catch (e) {
        // createUser solo lanza por validación (usuario repetido, etc.)
        throw new HttpError(400, e instanceof Error ? e.message : 'No se pudo crear.');
      }
      sendJson(res, 201, { user });
      return;
    }

    res.setHeader('Allow', 'GET, POST');
    sendJson(res, 405, { error: `Método ${req.method} no permitido.` });
  } catch (err) {
    handleError(res, err);
  }
}
