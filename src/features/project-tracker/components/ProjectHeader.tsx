/**
 * ProjectHeader.tsx
 * Encabezado del proyecto: saludo / metadatos + barra de progreso global.
 * En modo admin permite editar inline el nombre del proyecto y del cliente.
 */

import { useState } from 'react';
import { LayoutDashboard, Pencil, SlidersHorizontal } from 'lucide-react';
import type { ProgressSummary, ProjectData, UserRole } from '../types';
import { INPUT_CLASS } from '../constants';
import { ProgressBar } from '../ui/ProgressBar';
import { Field } from '../ui/Field';

export interface ProjectHeaderProps {
  data: ProjectData;
  role: UserRole;
  progress: ProgressSummary;
  onUpdateProject?: (
    patch: Partial<Pick<ProjectData, 'projectName' | 'clientName'>>,
  ) => void;
}

export function ProjectHeader({ data, role, progress, onUpdateProject }: ProjectHeaderProps) {
  const isAdmin = role === 'admin';
  const BadgeIcon = isAdmin ? SlidersHorizontal : LayoutDashboard;
  const canEdit = isAdmin && Boolean(onUpdateProject);

  const [editing, setEditing] = useState(false);
  const [projectName, setProjectName] = useState(data.projectName);
  const [clientName, setClientName] = useState(data.clientName);

  const startEditing = () => {
    setProjectName(data.projectName);
    setClientName(data.clientName);
    setEditing(true);
  };

  const save = () => {
    onUpdateProject?.({
      projectName: projectName.trim() || data.projectName,
      clientName: clientName.trim() || data.clientName,
    });
    setEditing(false);
  };

  return (
    <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {editing ? (
        <div className="space-y-4">
          <Field label="Nombre del proyecto">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              aria-label="Nombre del proyecto"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Nombre del cliente">
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              aria-label="Nombre del cliente"
              className={INPUT_CLASS}
            />
          </Field>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={save}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Guardar
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">
                <BadgeIcon className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
                {isAdmin ? 'Panel de gestión' : 'Portal del cliente'}
              </span>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {data.projectName}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {isAdmin ? (
                  <>
                    Cliente: <span className="font-medium text-slate-700">{data.clientName}</span>
                    <span className="mx-1.5 text-slate-300">•</span>
                    <span className="font-mono text-xs">{data.projectId}</span>
                  </>
                ) : (
                  <>
                    Hola <span className="font-medium text-slate-700">{data.clientName}</span>, este
                    es el avance en tiempo real de tu proyecto.
                  </>
                )}
              </p>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                Editar
              </button>
            )}
          </div>

          <div className="mt-6">
            <ProgressBar {...progress} />
          </div>
        </>
      )}
    </header>
  );
}
