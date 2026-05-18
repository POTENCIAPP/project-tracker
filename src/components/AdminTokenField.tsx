/**
 * AdminTokenField.tsx
 * Solo aparece si el backend exige token (env ADMIN_TOKEN configurada).
 * Permite pegar el token una vez; queda en localStorage y se manda en cada
 * escritura. No viaja en el bundle: es un gate de servidor.
 */

import { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { getAdminToken, getHealth, setAdminToken } from '@/lib/api';

export function AdminTokenField({ onSaved }: { onSaved?: () => void }) {
  const [protectedMode, setProtectedMode] = useState(false);
  const [token, setToken] = useState(getAdminToken());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getHealth()
      .then((h) => setProtectedMode(h.protected))
      .catch(() => setProtectedMode(false));
  }, []);

  if (!protectedMode) return null;

  const save = () => {
    setAdminToken(token.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSaved?.();
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-slate-500" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-slate-900">Token de admin</h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        El servidor exige token para crear o editar. Pegá el valor de la variable
        <span className="mx-1 font-mono text-xs">ADMIN_TOKEN</span> de Vercel.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
        />
        <button
          type="button"
          onClick={save}
          className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          {saved ? 'Guardado' : 'Guardar'}
        </button>
      </div>
    </section>
  );
}
