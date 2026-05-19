/**
 * utils.ts
 * Funciones puras de apoyo (sin estado de React).
 */

import type { Milestone, ProgressSummary } from './types';

/**
 * Avance ponderado: cada hito suma según su estado, no solo los terminados.
 * pendiente 0 · en progreso 0.4 · revisión 0.8 · completado 1.
 */
const STATUS_WEIGHT: Record<Milestone['status'], number> = {
  pending: 0,
  in_progress: 0.4,
  client_review: 0.8,
  completed: 1,
};

export function computeProgress(milestones: Milestone[]): ProgressSummary {
  const total = milestones.length;
  const completed = milestones.filter((m) => m.status === 'completed').length;
  const inProgress = milestones.filter(
    (m) => m.status === 'in_progress' || m.status === 'client_review',
  ).length;
  const score = milestones.reduce((a, m) => a + STATUS_WEIGHT[m.status], 0);
  const percent = total === 0 ? 0 : Math.round((score / total) * 100);
  return { total, completed, inProgress, percent };
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
