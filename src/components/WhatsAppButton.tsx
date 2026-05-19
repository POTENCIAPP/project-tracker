/**
 * WhatsAppButton.tsx
 * Abre WhatsApp con un mensaje prearmado (para mandarle el portal al cliente).
 */

import { MessageCircle } from 'lucide-react';

export function WhatsAppButton({
  url,
  className = '',
}: {
  url: string;
  className?: string;
}) {
  const text = encodeURIComponent(
    `Hola 👋 Te comparto el portal para seguir el avance de tu proyecto en tiempo real:\n${url}\n\nEntrás con el usuario y la contraseña que te pasamos.`,
  );
  return (
    <a
      href={`https://wa.me/?text=${text}`}
      target="_blank"
      rel="noreferrer"
      className={
        'inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-200 ' +
        'bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition ' +
        'hover:bg-emerald-100 ' +
        className
      }
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      WhatsApp
    </a>
  );
}
