/**
 * DeliverableList.tsx
 * Lista de entregables con checkboxes (marcados si el hito esta completado).
 */

import { Check } from 'lucide-react';

interface DeliverableListProps {
  deliverables: string[];
  completed: boolean;
}

export function DeliverableList({ deliverables, completed }: DeliverableListProps) {
  return (
    <ul className="space-y-2">
      {deliverables.map((deliverable, index) => (
        <li key={index} className="flex items-start gap-2.5 text-sm">
          <span
            className={`mt-px grid h-4 w-4 shrink-0 place-items-center rounded border transition ${
              completed
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : 'border-slate-300 bg-white'
            }`}
            aria-hidden="true"
          >
            {completed && <Check className="h-3 w-3" strokeWidth={3.5} />}
          </span>
          <span
            className={
              completed ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-600'
            }
          >
            {deliverable}
          </span>
        </li>
      ))}
    </ul>
  );
}
