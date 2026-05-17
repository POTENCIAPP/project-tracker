/**
 * utils.ts
 * Funciones puras de apoyo (sin estado de React).
 */

import type { Milestone, ProgressSummary } from './types';

/** Calcula el progreso global: hitos completados vs totales. */
export function computeProgress(milestones: Milestone[]): ProgressSummary {
  const total = milestones.length;
  const completed = milestones.filter((m) => m.status === 'completed').length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, percent };
}

/** Devuelve una copia ordenada por el campo `order`. */
export function sortByOrder(milestones: Milestone[]): Milestone[] {
  return [...milestones].sort((a, b) => a.order - b.order);
}

/** Formatea una fecha ISO al formato local es-AR. */
export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/** Timestamp ISO actual. */
export function nowIso(): string {
  return new Date().toISOString();
}

let idCounter = 0;

/** Genera un id temporal para keys de React en formularios. */
export function makeTempId(): string {
  idCounter += 1;
  return `tmp-${Date.now().toString(36)}-${idCounter}`;
}
