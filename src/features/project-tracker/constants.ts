/**
 * constants.ts
 * Configuración visual de estados (single source of truth) y constantes de estilo.
 */

import { CheckCircle2, Circle, Clock, Eye, type LucideIcon } from 'lucide-react';
import type { MilestoneStatus } from './types';

export interface StatusMeta {
  label: string;
  Icon: LucideIcon;
  /** Clases del badge de estado. */
  badgeClass: string;
  /** Clases del nodo circular en la línea de tiempo. */
  nodeClass: string;
  /** Color del ícono dentro del selector de estados. */
  accentText: string;
}

export const STATUS_META: Record<MilestoneStatus, StatusMeta> = {
  pending: {
    label: 'Pendiente',
    Icon: Circle,
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    nodeClass: 'border-slate-300 bg-white text-slate-400',
    accentText: 'text-slate-400',
  },
  in_progress: {
    label: 'En progreso',
    Icon: Clock,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    nodeClass: 'border-blue-500 bg-white text-blue-600',
    accentText: 'text-blue-600',
  },
  client_review: {
    label: 'Revisión del cliente',
    Icon: Eye,
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    nodeClass: 'border-amber-500 bg-white text-amber-600',
    accentText: 'text-amber-600',
  },
  completed: {
    label: 'Completado',
    Icon: CheckCircle2,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    nodeClass: 'border-emerald-500 bg-emerald-500 text-white',
    accentText: 'text-emerald-600',
  },
};

export const STATUS_ORDER: MilestoneStatus[] = [
  'pending',
  'in_progress',
  'client_review',
  'completed',
];

export const INPUT_CLASS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ' +
  'outline-none transition placeholder:text-slate-400 ' +
  'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30';
