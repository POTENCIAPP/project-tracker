/**
 * /api/projects/:slug
 *   GET    -> proyecto completo. PÚBLICO: lo consume el portal del cliente
 *             (capability = conocer el slug) y también el editor admin.
 *   PUT    -> actualiza nombres / hitos (admin).
 *   DELETE -> elimina el proyecto (admin).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  deleteProject,
  getProject,
  updateProject,
  type Milestone,
} from '../../lib/store.js';
import { assertAdmin, handleError, readBody, sendJson } from '../../lib/http.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  try {
    const slug = String(req.query.slug ?? '').trim();
    if (!slug) {
      sendJson(res, 400, { error: 'Slug requerido.' });
      return;
    }

    if (req.method === 'GET') {
      const project = await getProject(slug);
      if (!project) {
        sendJson(res, 404, { error: 'Proyecto no encontrado.' });
        return;
      }
      sendJson(res, 200, { project });
      return;
    }

    if (req.method === 'PUT') {
      assertAdmin(req);
      const body = readBody<{
        clientName?: string;
        projectName?: string;
        milestones?: Milestone[];
      }>(req);
      const updated = await updateProject(slug, {
        ...(body.clientName !== undefined ? { clientName: body.clientName } : {}),
        ...(body.projectName !== undefined ? { projectName: body.projectName } : {}),
        ...(Array.isArray(body.milestones) ? { milestones: body.milestones } : {}),
      });
      if (!updated) {
        sendJson(res, 404, { error: 'Proyecto no encontrado.' });
        return;
      }
      sendJson(res, 200, { project: updated });
      return;
    }

    if (req.method === 'DELETE') {
      assertAdmin(req);
      const ok = await deleteProject(slug);
      sendJson(res, ok ? 200 : 404, { ok });
      return;
    }

    res.setHeader('Allow', 'GET, PUT, DELETE');
    sendJson(res, 405, { error: `Método ${req.method} no permitido.` });
  } catch (err) {
    handleError(res, err);
  }
}
