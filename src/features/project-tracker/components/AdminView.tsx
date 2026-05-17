/**
 * AdminView.tsx
 * Vista de gestión: cabecera editable + línea de tiempo con edición,
 * reordenamiento (drag & drop) y alta de hitos.
 */

import { Plus } from 'lucide-react';
import type { Milestone, MilestoneStatus, ProgressSummary, ProjectData } from '../types';
import { ProjectHeader } from './ProjectHeader';
import { MilestoneTimeline } from './MilestoneTimeline';

export interface AdminViewProps {
  data: ProjectData;
  milestones: Milestone[];
  progress: ProgressSummary;
  onStatusChange: (id: string, status: MilestoneStatus) => void;
  onEdit: (milestone: Milestone) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onReorder: (orderedIds: string[]) => void;
  onUpdateProject?: (
    patch: Partial<Pick<ProjectData, 'projectName' | 'clientName'>>,
  ) => void;
}

export function AdminView({
  data,
  milestones,
  progress,
  onStatusChange,
  onEdit,
  onDelete,
  onCreate,
  onReorder,
  onUpdateProject,
}: AdminViewProps) {
  return (
    <div className="space-y-6">
      <ProjectHeader
        data={data}
        role="admin"
        progress={progress}
        onUpdateProject={onUpdateProject}
      />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Hitos del proyecto</h2>
          <p className="text-xs text-slate-500">
            Arrastrá para reordenar. Esto es lo que verá el cliente.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Agregar hito
        </button>
      </div>

      <MilestoneTimeline
        milestones={milestones}
        role="admin"
        onStatusChange={onStatusChange}
        onEdit={onEdit}
        onDelete={onDelete}
        onReorder={onReorder}
      />
    </div>
  );
}
