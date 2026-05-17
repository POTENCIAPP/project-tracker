/**
 * shareLink.ts
 * Generacion y armado de links publicos de solo lectura para clientes.
 *
 * Patron "capability URL": quien tiene el link, ve el proyecto.
 * Por eso el token debe ser largo e imposible de adivinar.
 */

/** Genera un token aleatorio no adivinable para el link de un cliente. */
export function generateShareToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    // randomUUID -> 122 bits de aleatoriedad. Suficiente para una capability URL.
    return crypto.randomUUID().replace(/-/g, '');
  }
  // Fallback para entornos sin Web Crypto.
  return Array.from({ length: 4 }, () => Math.random().toString(36).slice(2)).join('');
}

/** Arma la URL completa del portal del cliente a partir de un token. */
export function buildShareUrl(token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/p/${token}`;
}
