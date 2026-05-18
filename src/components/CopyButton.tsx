/**
 * CopyButton.tsx
 * Botón reutilizable: copia un texto al portapapeles y muestra feedback.
 */

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function CopyButton({
  value,
  label = 'Copiar',
  className = '',
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* el navegador puede bloquear el portapapeles: el input queda visible */
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={
        'inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 ' +
        'text-sm font-medium text-white transition hover:bg-slate-800 ' +
        className
      }
    >
      {copied ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4" aria-hidden="true" />
      )}
      {copied ? 'Copiado' : label}
    </button>
  );
}
