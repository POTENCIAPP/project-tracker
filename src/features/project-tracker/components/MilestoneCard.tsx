/**
 * MilestoneCard.tsx
 * Tarjeta reutilizable de un hito. Renderiza controles de admin segun `role`.
 */

import { useState } from 'react';
import { AlertTriangle, Calendar, ListChecks, Pencil, Trash2 } from 'lucide-react';
import type { Milestone, MilestoneStatus, UserRole } from '../types';
import { formatDate } from '../utils';
import { StatusBadge } from '../ui/StatusBadge';
import { DeliverableList } from '../ui/DeliverableList';
import { StatusSelect } from '../ui/StatusSelect';

export interface MilestoneCardProps {
  milestone: Milestone;
  role: UserRole;
  onStatusChange?: (status: MilestoneStatus) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MilestoneCard({
  milestone,
  role,
  onStatusChange,
  onEdit,
  onDelete,
}: MilestoneCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isAdmin = role === 'admin';
  const isCompleted = milestone.status === 'completed';
  const isHighlighted = milestone.status === 'in_progress';
  const hasDeliverables = milestone.deliverables.length > 0;

  return (
    <article
      className={`pp-card rounded-2xl p-6 transition-shadow hover:shadow-lg ${
        isHighlighted ? 'ring-2 ring-pp-green/40' : ''
      }`}
    >
      {/* Encabezado de la tarjeta */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Hito {milestone.order}
          </span>
          <h3 className="mt-0.5 text-base font-semibold leading-tight text-slate-900">
            {milestone.title}
          </h3>
        </div>
        <StatusBadge status={milestone.status} />
      </div>

      {/* Descripción */}
      {milestone.description && (
        <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{milestone.description}</p>
      )}

      {/* Entregables */}
      {hasDeliverables && (
        <div className="mt-4 rounded-lg bg-slate-50 p-3.5">
          <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
            Entregables
          </div>
          <DeliverableList deliverables={milestone.deliverables} completed={isCompleted} />
        </div>
      )}

      {/* Metadato de última actualización */}
      <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
        Actualizado el {formatDate(milestone.lastUpdated)}
      </div>

      {/* Controles de administración */}
      {isAdmin && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          {confirmingDelete ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2">
              <span className="flex items-center gap-1.5 text-sm font-medium text-red-700">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                ¿Eliminar este hito?
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="rounded-md px-2.5 py-1 text-sm font-medium text-slate-600 transition hover:bg-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingDelete(false);
                    onDelete?.();
                  }}
                  className="rounded-md bg-red-600 px-2.5 py-1 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <StatusSelect
                value={milestone.status}
                onChange={(status) => onStatusChange?.(status)}
              />
              <div className="ml-auto flex gap-1">
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Eliminar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
