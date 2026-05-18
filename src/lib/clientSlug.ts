/**
 * clientSlug.ts
 * ----------------------------------------------------------------------------
 * Resolución del slug del cliente y armado del link compartible.
 *
 * Dos formas, mismo backend:
 *   - Por path (funciona YA, sin DNS):      https://tu-app.vercel.app/c/<slug>
 *   - Por subdominio (cuando haya DNS):     https://<slug>.potenciapp.com
 *
 * El subdominio se activa solo si está seteada VITE_CLIENT_BASE_DOMAIN
 * (ej. "potenciapp.com") y el host actual es <algo>.<ese-dominio>.
 * Así el código ya queda listo: cuando apuntes el wildcard DNS a Vercel,
 * `gisbert.potenciapp.com` funciona sin tocar nada.
 * ----------------------------------------------------------------------------
 */

const BASE_DOMAIN = (import.meta.env.VITE_CLIENT_BASE_DOMAIN ?? '')
  .trim()
  .toLowerCase();

// Labels que NO son clientes (el panel admin / la app en sí).
const RESERVED = new Set(['www', 'app', 'admin', 'api', 'panel']);

/**
 * Si estamos en un subdominio de cliente (`gisbert.potenciapp.com`), devuelve
 * el slug ("gisbert"). Si no, `null` (se usa el slug del path /c/:slug).
 */
export function resolveSubdomainSlug(
  hostname: string = typeof window !== 'undefined' ? window.location.hostname : '',
): string | null {
  if (!BASE_DOMAIN) return null;
  const host = hostname.toLowerCase();
  if (host === BASE_DOMAIN || !host.endsWith(`.${BASE_DOMAIN}`)) return null;
  const label = host.slice(0, host.length - BASE_DOMAIN.length - 1);
  // Solo un nivel de subdominio y que no sea reservado.
  if (!label || label.includes('.') || RESERVED.has(label)) return null;
  return label;
}

/** ¿El subdominio por cliente está disponible (hay dominio base configurado)? */
export function subdomainModeEnabled(): boolean {
  return Boolean(BASE_DOMAIN);
}

/** Arma el link que el equipo le manda al cliente (WhatsApp, etc.). */
export function buildClientUrl(slug: string): string {
  if (BASE_DOMAIN) return `https://${slug}.${BASE_DOMAIN}`;
  const origin =
    typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/c/${slug}`;
}
