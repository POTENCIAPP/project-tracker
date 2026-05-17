/**
 * StatusSelect.tsx
 * Selector nativo estilizado para cambiar rapidamente el estado de un hito.
 */

import { ChevronDown } from 'lucide-react';
import type { MilestoneStatus } from '../types';
import { STATUS_META, STATUS_ORDER } from '../constants';

interface StatusSelectProps {
  value: MilestoneStatus;
  onChange: (status: MilestoneStatus) => void;
}

export function StatusSelect({ value, onChange }: StatusSelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as MilestoneStatus)}
        aria-label="Cambiar estado del hito"
        className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-9 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
      >
        {STATUS_ORDER.map((status) => (
          <option key={status} value={status}>
            {STATUS_META[status].label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
    </div>
  );
}
