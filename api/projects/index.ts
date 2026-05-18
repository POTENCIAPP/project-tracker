/**
 * /api/projects
 *   GET  -> lista de proyectos (resumen) para el panel admin de Potenciapp
 *   POST -> crea un cliente/proyecto nuevo (admin) y devuelve el proyecto completo
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createProject, listProjects } from '../../lib/store';
import { assertAdmin, handleError, readBody, sendJson } from '../../lib/http';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  try {
    if (req.method === 'GET') {
      const projects = await listProjects();
      const summary = projects.map((p) => {
        const total = p.milestones.length;
        const completed = p.milestones.filter((m) => m.status === 'completed').length;
        return {
          slug: p.slug,
          clientName: p.clientName,
          projectName: p.projectName,
          projectId: p.projectId,
          updatedAt: p.updatedAt,
          progress: {
            total,
            completed,
            percent: total === 0 ? 0 : Math.round((completed / total) * 100),
          },
        };
      });
      sendJson(res, 200, { projects: summary });
      return;
    }

    if (req.method === 'POST') {
      assertAdmin(req);
      const body = readBody<{ clientName?: string; projectName?: string }>(req);
      if (!body.clientName?.trim() && !body.projectName?.trim()) {
        sendJson(res, 400, { error: 'Falta el nombre del cliente o del proyecto.' });
        return;
      }
      const project = await createProject({
        clientName: body.clientName ?? '',
        projectName: body.projectName ?? '',
      });
      sendJson(res, 201, { project });
      return;
    }

    res.setHeader('Allow', 'GET, POST');
    sendJson(res, 405, { error: `Método ${req.method} no permitido.` });
  } catch (err) {
    handleError(res, err);
  }
}
