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
    badgeClass: 'border border-slate-200 bg-slate-100 text-slate-600',
    nodeClass: 'border-slate-300 bg-white text-slate-400',
    accentText: 'text-slate-400',
  },
  in_progress: {
    label: 'En progreso',
    Icon: Clock,
    badgeClass: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
    nodeClass: 'border-pp-green bg-white text-pp-green',
    accentText: 'text-pp-green',
  },
  client_review: {
    label: 'Revisión del cliente',
    Icon: Eye,
    badgeClass: 'border border-amber-200 bg-amber-50 text-amber-700',
    nodeClass: 'border-amber-500 bg-white text-amber-600',
    accentText: 'text-amber-600',
  },
  completed: {
    label: 'Completado',
    Icon: CheckCircle2,
    badgeClass: 'border border-pp-lime/40 bg-pp-lime/20 text-emerald-700',
    nodeClass: 'border-pp-green bg-pp-green text-white',
    accentText: 'text-pp-green',
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
  'focus:border-pp-green focus:ring-2 focus:ring-pp-green/30';
