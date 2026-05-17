/**
 * StatusBadge.tsx
 * Etiqueta visual con ícono que indica el estado de un hito.
 */

import type { MilestoneStatus } from '../types';
import { STATUS_META } from '../constants';

export function StatusBadge({ status }: { status: MilestoneStatus }) {
  const meta = STATUS_META[status];
  const { Icon } = meta;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.badgeClass}`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
      {meta.label}
    </span>
  );
}
