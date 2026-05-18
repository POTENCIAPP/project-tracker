/**
 * StorageBanner.tsx
 * Aviso honesto en el panel admin sobre el estado del backend:
 *   - storage 'memory'  -> los datos NO persisten (falta provisionar Vercel KV).
 *   - protected === false -> cualquiera con la URL del API podría escribir.
 * Si todo está OK, no muestra nada.
 */

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { getHealth, type HealthInfo } from '@/lib/api';

export function StorageBanner() {
  const [health, setHealth] = useState<HealthInfo | null>(null);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  if (!health) return null;

  const issues: string[] = [];
  if (health.storage === 'memory') {
    issues.push(
      'El almacenamiento todavía no está conectado: los proyectos se reinician en cada rato. ' +
        'Conectá Vercel KV (Storage en el dashboard de Vercel) para que persistan.',
    );
  }
  if (!health.protected) {
    issues.push(
      'Las escrituras no están protegidas por token de servidor (modo demo). ' +
        'Configurá la variable ADMIN_TOKEN en Vercel para endurecerlo.',
    );
  }
  if (issues.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <ul className="space-y-1">
          {issues.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
