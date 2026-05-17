/**
 * mockProjectStore.ts
 * ----------------------------------------------------------------------------
 * BACKEND SIMULADO. Es el unico punto de la app que "habla con los datos".
 *
 * Persiste en localStorage para que lo que el admin crea sobreviva recargas y
 * el link del cliente lo refleje (mismo navegador). En producción esto se
 * reemplaza por Supabase y el resto de la app NO cambia:
 *   - getAdminProject       -> query con RLS (admin autenticado)
 *   - resolveProjectByToken -> RPC `get_project_by_token(token)` SECURITY DEFINER,
 *                              invocable por el rol anon
 *   - regenerateShareToken  -> UPDATE del token (solo admin)
 *   - updateProject / *Milestone -> mutaciones con RLS (solo admin)
 *
 * Las funciones son async a proposito: ya tienen la forma de un backend real.
 * ----------------------------------------------------------------------------
 */

import {
  dummyProjectData,
  type Milestone,
  type MilestoneStatus,
  type ProjectData,
} from '@/features/project-tracker';
import { generateShareToken } from './shareLink';

const STORAGE_KEY = 'project-tracker:project';

/** Lee el proyecto persistido; si no hay nada (o el JSON es inválido) usa el demo. */
function loadProject(): ProjectData {
  if (typeof window === 'undefined') return { ...dummyProjectData };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...dummyProjectData };
    const parsed = JSON.parse(raw) as ProjectData;
    if (!parsed || !Array.isArray(parsed.milestones)) return { ...dummyProjectData };
    return parsed;
  } catch {
    return { ...dummyProjectData };
  }
}

function persist(next: ProjectData): ProjectData {
  project = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  } catch {
    // Sin localStorage (modo privado / SSR): el singleton de módulo alcanza.
  }
  return project;
}

// Singleton de modulo: mantiene el estado consistente entre rutas.
let project: ProjectData = loadProject();

let idSeq = 0;
/** Id estable para un hito nuevo (no es el id temporal de formularios). */
function makeMilestoneId(): string {
  idSeq += 1;
  return `ms-${Date.now().toString(36)}-${idSeq}`;
}

/** Reasigna `order` 1..N según la posición actual en el array. */
function renumber(milestones: Milestone[]): Milestone[] {
  return milestones.map((m, index) => ({ ...m, order: index + 1 }));
}

/* ===== Lectura ============================================================ */

/** Proyecto que administra el equipo. */
export async function getAdminProject(): Promise<ProjectData> {
  return project;
}

/** Resuelve un proyecto a partir del token del link del cliente. */
export async function resolveProjectByToken(token: string): Promise<ProjectData | null> {
  return project.publicToken === token ? project : null;
}

/* ===== Mutaciones (solo admin) =========================================== */

/** Regenera el token: invalida el link anterior y crea uno nuevo. */
export async function regenerateShareToken(): Promise<ProjectData> {
  return persist({ ...project, publicToken: generateShareToken() });
}

/** Edita metadatos del proyecto (nombre del proyecto / del cliente). */
export async function updateProject(
  patch: Partial<Pick<ProjectData, 'projectName' | 'clientName'>>,
): Promise<ProjectData> {
  return persist({ ...project, ...patch });
}

/**
 * Crea o actualiza un hito. Si el id existe, lo reemplaza; si no, lo agrega
 * al final. Siempre renumera para mantener `order` consistente.
 */
export async function upsertMilestone(milestone: Milestone): Promise<ProjectData> {
  const exists = project.milestones.some((m) => m.id === milestone.id);
  const milestones = exists
    ? project.milestones.map((m) => (m.id === milestone.id ? milestone : m))
    : [...project.milestones, milestone];
  return persist({ ...project, milestones: renumber(milestones) });
}

/** Crea un hito nuevo a partir de los campos editables y lo devuelve. */
export async function createMilestone(input: {
  title: string;
  description: string;
  status: MilestoneStatus;
  deliverables: string[];
}): Promise<{ project: ProjectData; milestone: Milestone }> {
  const milestone: Milestone = {
    id: makeMilestoneId(),
    order: project.milestones.length + 1,
    title: input.title,
    description: input.description,
    status: input.status,
    deliverables: input.deliverables,
    lastUpdated: new Date().toISOString(),
  };
  const next = persist({
    ...project,
    milestones: renumber([...project.milestones, milestone]),
  });
  return { project: next, milestone };
}

/** Elimina un hito y renumera el resto. */
export async function deleteMilestone(id: string): Promise<ProjectData> {
  const milestones = renumber(project.milestones.filter((m) => m.id !== id));
  return persist({ ...project, milestones });
}

/** Reordena los hitos según el array de ids dado y renumera. */
export async function reorderMilestones(orderedIds: string[]): Promise<ProjectData> {
  const byId = new Map(project.milestones.map((m) => [m.id, m]));
  const reordered = orderedIds
    .map((id) => byId.get(id))
    .filter((m): m is Milestone => Boolean(m));
  // Conserva cualquier hito que no estuviera en la lista (defensivo).
  for (const m of project.milestones) {
    if (!orderedIds.includes(m.id)) reordered.push(m);
  }
  return persist({ ...project, milestones: renumber(reordered) });
}

/** Restaura el proyecto al demo original (útil para pruebas). */
export async function resetProject(): Promise<ProjectData> {
  return persist({ ...dummyProjectData });
}
