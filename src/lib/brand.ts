/**
 * brand.ts
 * URLs de los assets oficiales de Potenciapp (hosteados en el sitio principal,
 * con CORS abierto y cache largo). Centralizado acá: si algún día se quiere
 * self-host, se cambian estas constantes a paths de /public y nada más.
 */

const BASE = 'https://www.potenciapp.com/branding';

export const BRAND = {
  /** Wordmark con texto OSCURO — para fondos claros (blanco). */
  wordmarkLight: `${BASE}/png/wordmark-light-800.png`,
  wordmarkLightSm: `${BASE}/png/wordmark-light-400.png`,
  /** Wordmark con texto BLANCO — para fondos oscuros (.pp-grad). */
  wordmarkDark: `${BASE}/png/wordmark-dark-800.png`,
  /** Mark circular (ícono) para espacios compactos. */
  mark: `${BASE}/png/mark-128.png`,
} as const;
