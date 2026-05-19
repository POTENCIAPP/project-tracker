/**
 * ProgressBar.tsx
 * Barra de progreso global del proyecto.
 */

import type { ProgressSummary } from '../types';

export function ProgressBar({ completed, total, inProgress, percent }: ProgressSummary) {
  const label =
    inProgress > 0
      ? `${completed} completado${completed === 1 ? '' : 's'} · ${inProgress} en progreso`
      : `${completed} de ${total} ${total === 1 ? 'hito completado' : 'hitos completados'}`;
  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-4">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-slate-900">{percent}%</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progreso global del proyecto"
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
