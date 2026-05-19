/**
 * types.ts
 * Tipos de dominio del módulo Project Tracker. No depende de nada más.
 */

export type MilestoneStatus = 'pending' | 'in_progress' | 'client_review' | 'completed';

export type UserRole = 'admin' | 'client';

export interface Milestone {
  id: string;
  order: number;
  title: string;
  description: string;
  status: MilestoneStatus;
  deliverables: string[];
  lastUpdated: string;
}

export interface ProjectData {
  projectId: string;
  clientName: string;
  projectName: string;
  /**
   * Slug estable del cliente. Es lo que viaja en el link compartible
   * (/c/<slug> o <slug>.dominio) y no cambia aunque se edite el proyecto.
   * Opcional para no acoplar al módulo ProjectTracker, que es agnóstico del acceso.
   */
  slug?: string;
  /** Timestamps de servidor (informativos). */
  createdAt?: string;
  updatedAt?: string;
  milestones: Milestone[];
}

/** Campos editables al crear un hito (el id/order/lastUpdated los pone el store). */
export interface MilestoneDraft {
  title: string;
  description: string;
  status: MilestoneStatus;
  deliverables: string[];
}

export interface ProjectTrackerProps {
  data: ProjectData;
  role: UserRole;
  /** Se dispara cuando un admin cambia el estado o edita un hito. */
  onUpdateMilestone?: (milestone: Milestone) => void;
  /** Se dispara cuando un admin elimina un hito. */
  onDeleteMilestone?: (milestoneId: string) => void;
  /** Se dispara cuando un admin crea un hito nuevo. */
  onCreateMilestone?: (draft: MilestoneDraft) => void;
  /** Se dispara cuando un admin reordena los hitos (ids en el nuevo orden). */
  onReorderMilestones?: (orderedIds: string[]) => void;
  /** Se dispara cuando un admin edita los datos del proyecto. */
  onUpdateProject?: (patch: Partial<Pick<ProjectData, 'projectName' | 'clientName'>>) => void;
}

/** Resumen de progreso calculado a partir de los hitos. */
export interface ProgressSummary {
  total: number;
  completed: number;
  /** Hitos en curso (en progreso + en revisión del cliente). */
  inProgress: number;
  /** Avance ponderado 0–100 (en progreso y revisión suman parcial). */
  percent: number;
}
