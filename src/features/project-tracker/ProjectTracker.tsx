/**
 * ProjectTracker.tsx
 * Componente contenedor. Es el unico punto de entrada del modulo:
 * mantiene el estado de los hitos (sin store global) y decide que vista mostrar.
 */

import { useEffect, useMemo, useState } from 'react';
import type { Milestone, MilestoneDraft, MilestoneStatus, ProjectTrackerProps } from './types';
import { computeProgress, nowIso, sortByOrder } from './utils';
import { AdminView } from './components/AdminView';
import { ClientView } from './components/ClientView';
import { MilestoneEditModal } from './components/MilestoneEditModal';

export function ProjectTracker({
  data,
  role,
  onUpdateMilestone,
  onDeleteMilestone,
  onCreateMilestone,
  onReorderMilestones,
  onUpdateProject,
}: ProjectTrackerProps) {
  // El estado vive dentro del modulo: no hace falta un store global.
  const [milestones, setMilestones] = useState<Milestone[]>(() => sortByOrder(data.milestones));
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Re-sincroniza si el proyecto cambia desde el exterior (ej. nueva carga de datos).
  useEffect(() => {
    setMilestones(sortByOrder(data.milestones));
  }, [data.milestones]);

  const progress = useMemo(() => computeProgress(milestones), [milestones]);

  const handleStatusChange = (id: string, status: MilestoneStatus) => {
    const current = milestones.find((m) => m.id === id);
    if (!current) return;
    const updated: Milestone = { ...current, status, lastUpdated: nowIso() };
    setMilestones((prev) => prev.map((m) => (m.id === id ? updated : m)));
    onUpdateMilestone?.(updated);
  };

  const handleSaveEdit = (updated: Milestone) => {
    setMilestones((prev) => sortByOrder(prev.map((m) => (m.id === updated.id ? updated : m))));
    onUpdateMilestone?.(updated);
    setEditingMilestone(null);
  };

  const handleCreate = (draft: MilestoneDraft) => {
    // Optimista: el store asigna id/order definitivos y re-sincroniza por `data`.
    const optimistic: Milestone = {
      id: `tmp-${Date.now()}`,
      order: milestones.length + 1,
      lastUpdated: nowIso(),
      ...draft,
    };
    setMilestones((prev) => sortByOrder([...prev, optimistic]));
    onCreateMilestone?.(draft);
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
    onDeleteMilestone?.(id);
  };

  const handleReorder = (orderedIds: string[]) => {
    setMilestones((prev) => {
      const byId = new Map(prev.map((m) => [m.id, m]));
      const next = orderedIds
        .map((id, index) => {
          const m = byId.get(id);
          return m ? { ...m, order: index + 1 } : undefined;
        })
        .filter((m): m is Milestone => Boolean(m));
      return next;
    });
    onReorderMilestones?.(orderedIds);
  };

  return (
    <div className="w-full text-slate-900 antialiased">
      {role === 'admin' ? (
        <AdminView
          data={data}
          milestones={milestones}
          progress={progress}
          onStatusChange={handleStatusChange}
          onEdit={setEditingMilestone}
          onDelete={handleDelete}
          onCreate={() => setIsCreating(true)}
          onReorder={handleReorder}
          onUpdateProject={onUpdateProject}
        />
      ) : (
        <ClientView data={data} milestones={milestones} progress={progress} />
      )}

      {editingMilestone && (
        <MilestoneEditModal
          milestone={editingMilestone}
          onClose={() => setEditingMilestone(null)}
          onSave={handleSaveEdit}
        />
      )}

      {isCreating && (
        <MilestoneEditModal
          onClose={() => setIsCreating(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

export default ProjectTracker;
