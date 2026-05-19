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
    <span className={`pp-chip shrink-0 ${meta.badgeClass}`}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
      {meta.label}
    </span>
  );
}
