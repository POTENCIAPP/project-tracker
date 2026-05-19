/**
 * MilestoneTimeline.tsx
 * Linea de tiempo vertical: nodos conectados + una MilestoneCard por hito.
 * En modo admin con `onReorder`, los hitos se reordenan con drag & drop
 * (@dnd-kit) usando un handle de agarre — los botones de la tarjeta siguen
 * funcionando porque el drag solo se activa desde el handle.
 */

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, GripVertical, ListChecks } from 'lucide-react';
import type { Milestone, MilestoneStatus, UserRole } from '../types';
import { STATUS_META } from '../constants';
import { MilestoneCard } from './MilestoneCard';

export interface MilestoneTimelineProps {
  milestones: Milestone[];
  role: UserRole;
  onStatusChange?: (id: string, status: MilestoneStatus) => void;
  onEdit?: (milestone: Milestone) => void;
  onDelete?: (id: string) => void;
  /** Solo admin: nuevo orden de ids tras un drag. Si falta, no hay drag. */
  onReorder?: (orderedIds: string[]) => void;
}

interface RowProps {
  milestone: Milestone;
  index: number;
  total: number;
  role: UserRole;
  sortable: boolean;
  onStatusChange?: (id: string, status: MilestoneStatus) => void;
  onEdit?: (milestone: Milestone) => void;
  onDelete?: (id: string) => void;
}

function MilestoneRow({
  milestone,
  index,
  total,
  role,
  sortable,
  onStatusChange,
  onEdit,
  onDelete,
}: RowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: milestone.id, disabled: !sortable });

  const isLast = index === total - 1;
  const isCompleted = milestone.status === 'completed';
  const isActive = milestone.status === 'in_progress';
  const meta = STATUS_META[milestone.status];

  const style = sortable
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
        opacity: isDragging ? 0.85 : undefined,
      }
    : undefined;

  return (
    <li
      ref={sortable ? setNodeRef : undefined}
      style={style}
      className={`flex gap-4 sm:gap-5 ${isDragging ? 'relative' : ''}`}
    >
      {/* Columna del nodo + conector vertical */}
      <div className="relative flex flex-col items-center">
        {isActive && (
          <span
            className="absolute left-1/2 top-0 h-9 w-9 -translate-x-1/2 animate-ping rounded-full bg-pp-lime opacity-25"
            aria-hidden="true"
          />
        )}
        <div
          className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-sm font-semibold ${meta.nodeClass}`}
        >
          {isCompleted ? (
            <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
          ) : (
            <span aria-hidden="true">{milestone.order}</span>
          )}
        </div>

        {sortable && (
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Reordenar hito: ${milestone.title}`}
            title="Arrastrar para reordenar"
            className={`mt-2 rounded-md p-1 text-slate-300 transition hover:bg-slate-100 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pp-green/40 ${
              isDragging ? 'cursor-grabbing text-slate-500' : 'cursor-grab'
            }`}
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
          </button>
        )}

        {!isLast && (
          <div
            className={`mt-1.5 w-0.5 flex-1 rounded-full ${
              isCompleted ? 'bg-pp-green' : 'bg-slate-200'
            }`}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Tarjeta del hito */}
      <div
        className={`flex-1 ${isLast ? '' : 'pb-6'} ${
          isDragging ? 'rounded-xl ring-2 ring-pp-green/60' : ''
        }`}
      >
        <MilestoneCard
          milestone={milestone}
          role={role}
          onStatusChange={(status) => onStatusChange?.(milestone.id, status)}
          onEdit={() => onEdit?.(milestone)}
          onDelete={() => onDelete?.(milestone.id)}
        />
      </div>
    </li>
  );
}

export function MilestoneTimeline({
  milestones,
  role,
  onStatusChange,
  onEdit,
  onDelete,
  onReorder,
}: MilestoneTimelineProps) {
  const sortable = role === 'admin' && typeof onReorder === 'function' && milestones.length > 1;

  const sensors = useSensors(
    // distancia mínima: deja que los clicks en botones funcionen sin disparar drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (milestones.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <ListChecks className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-slate-500">
          Aún no hay hitos definidos para este proyecto.
        </p>
      </div>
    );
  }

  const ids = milestones.map((m) => m.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder?.(arrayMove(ids, oldIndex, newIndex));
  };

  const rows = milestones.map((milestone, index) => (
    <MilestoneRow
      key={milestone.id}
      milestone={milestone}
      index={index}
      total={milestones.length}
      role={role}
      sortable={sortable}
      onStatusChange={onStatusChange}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  ));

  if (!sortable) {
    return <ol className="relative">{rows}</ol>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ol className="relative">{rows}</ol>
      </SortableContext>
    </DndContext>
  );
}
