/**
 * MilestoneEditModal.tsx
 * Modal para crear o editar un hito (título, descripción, estado, entregables).
 * - Con `milestone`: modo edición (emite el hito completo por onSave).
 * - Sin `milestone`: modo creación (emite un MilestoneDraft por onCreate).
 */

import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { Milestone, MilestoneDraft, MilestoneStatus } from '../types';
import { INPUT_CLASS, STATUS_META, STATUS_ORDER } from '../constants';
import { makeTempId, nowIso } from '../utils';
import { Field } from '../ui/Field';

interface EditableDeliverable {
  id: string;
  value: string;
}

export interface MilestoneEditModalProps {
  /** Hito a editar. Si es null/undefined el modal está en modo creación. */
  milestone?: Milestone | null;
  onClose: () => void;
  /** Modo edición: hito completo actualizado. */
  onSave?: (milestone: Milestone) => void;
  /** Modo creación: campos editables del hito nuevo. */
  onCreate?: (draft: MilestoneDraft) => void;
}

export function MilestoneEditModal({
  milestone,
  onClose,
  onSave,
  onCreate,
}: MilestoneEditModalProps) {
  const isCreate = !milestone;

  const [title, setTitle] = useState(milestone?.title ?? '');
  const [description, setDescription] = useState(milestone?.description ?? '');
  const [status, setStatus] = useState<MilestoneStatus>(milestone?.status ?? 'pending');
  const [deliverables, setDeliverables] = useState<EditableDeliverable[]>(() =>
    (milestone?.deliverables ?? []).map((value) => ({ id: makeTempId(), value })),
  );
  const [touched, setTouched] = useState(false);

  // Cerrar el modal con la tecla Escape.
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const updateDeliverable = (id: string, value: string) => {
    setDeliverables((prev) => prev.map((item) => (item.id === id ? { ...item, value } : item)));
  };

  const addDeliverable = () => {
    setDeliverables((prev) => [...prev, { id: makeTempId(), value: '' }]);
  };

  const removeDeliverable = (id: string) => {
    setDeliverables((prev) => prev.filter((item) => item.id !== id));
  };

  const trimmedTitle = title.trim();

  const handleSubmit = () => {
    if (!trimmedTitle) {
      setTouched(true);
      return;
    }

    const cleanedDeliverables = deliverables
      .map((item) => item.value.trim())
      .filter((value) => value.length > 0);

    if (isCreate) {
      onCreate?.({
        title: trimmedTitle,
        description: description.trim(),
        status,
        deliverables: cleanedDeliverables,
      });
      return;
    }

    onSave?.({
      ...milestone,
      title: trimmedTitle,
      description: description.trim(),
      status,
      deliverables: cleanedDeliverables,
      lastUpdated: nowIso(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isCreate ? 'Crear hito' : 'Editar hito'}
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {isCreate ? 'Nuevo hito' : 'Editar hito'}
            </h2>
            <p className="text-xs text-slate-400">
              {isCreate ? 'Definí lo que verá el cliente' : `Hito ${milestone.order}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-5 overflow-y-auto px-6 py-5">
          <Field label="Título">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Diseño UI/UX"
              aria-label="Título del hito"
              autoFocus
              className={`${INPUT_CLASS} ${
                touched && !trimmedTitle ? 'border-red-300 focus:border-red-500' : ''
              }`}
            />
            {touched && !trimmedTitle && (
              <p className="mt-1 text-xs font-medium text-red-600">El título es obligatorio.</p>
            )}
          </Field>

          <Field label="Descripción">
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Qué incluye esta etapa, en lenguaje claro para el cliente."
              aria-label="Descripción del hito"
              className={`${INPUT_CLASS} resize-none`}
            />
          </Field>

          <Field label="Estado">
            <div className="grid grid-cols-2 gap-2">
              {STATUS_ORDER.map((option) => {
                const meta = STATUS_META[option];
                const { Icon } = meta;
                const isSelected = status === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setStatus(option)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50 text-slate-900'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${meta.accentText}`} aria-hidden="true" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Entregables">
            <div className="space-y-2">
              {deliverables.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.value}
                    onChange={(e) => updateDeliverable(item.id, e.target.value)}
                    placeholder={`Entregable ${index + 1}`}
                    aria-label={`Entregable ${index + 1}`}
                    className={INPUT_CLASS}
                  />
                  <button
                    type="button"
                    onClick={() => removeDeliverable(item.id)}
                    aria-label="Quitar entregable"
                    className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addDeliverable}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Agregar entregable
              </button>
            </div>
          </Field>
        </div>

        <footer className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            {isCreate ? 'Crear hito' : 'Guardar cambios'}
          </button>
        </footer>
      </div>
    </div>
  );
}
