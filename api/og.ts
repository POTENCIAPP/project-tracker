/**
 * /api/og?slug=...  (rewrite desde /c/:slug)
 * Devuelve el index.html del SPA pero con <title> y meta OG inyectados por
 * servidor, para que el preview de WhatsApp/redes muestre el proyecto del
 * cliente (los crawlers NO ejecutan JS, así que esto no se puede hacer en React).
 *
 * Toma el index.html real del propio deploy (con los assets hasheados) y solo
 * reescribe el <head>. El SPA sigue booteando igual.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getProject } from '../lib/store.js';

const DESCRIPTION = 'Seguí el avance de tu proyecto en tiempo real.';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const slug = String(req.query.slug ?? '').trim();
  const host =
    (req.headers['x-forwarded-host'] as string) ||
    (req.headers.host as string) ||
    'clientes.potenciapp.com';

  // index.html real del deploy (assets hasheados correctos)
  let html: string;
  try {
    html = await fetch(`https://${host}/index.html`).then((r) => r.text());
  } catch {
    // Fallback mínimo si no se pudo traer el shell.
    html =
      '<!doctype html><html lang="es"><head></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>';
  }

  let project = null;
  try {
    project = slug ? await getProject(slug) : null;
  } catch {
    project = null;
  }

  const title = project
    ? `Potenciapp · ${project.projectName}`
    : 'Potenciapp · Portal de proyecto';
  const url = `https://${host}/c/${encodeURIComponent(slug)}`;
  const image = `https://${host}/api/og-image?v=1`;

  const meta = `
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(DESCRIPTION)}" />
    <meta property="og:site_name" content="Potenciapp" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(DESCRIPTION)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${esc(url)}" />
    <meta property="og:image" content="${esc(image)}" />
    <meta property="og:image:secure_url" content="${esc(image)}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Potenciapp" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(DESCRIPTION)}" />
    <meta name="twitter:image" content="${esc(image)}" />`;

  // Saca el <title> y metas OG/twitter/description que ya trae el shell,
  // para no dejar duplicados, y mete los nuestros antes de </head>.
  const cleaned = html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta[^>]+(?:property="og:[^"]*"|name="twitter:[^"]*"|name="description")[^>]*>\s*/gi, '');
  const out = cleaned.replace(/<\/head>/i, `${meta}\n  </head>`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Cache corto en el edge: previews frescos pero sin pegarle al origen cada vez.
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  res.status(200).send(out);
}
