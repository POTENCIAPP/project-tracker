/**
 * GET /api/og-image
 * Tarjeta de preview para WhatsApp/redes (1200×630): gradiente de marca
 * Potenciapp + wordmark. Sin texto dinámico → no necesita fuentes (Satori),
 * por eso es robusta. El título del proyecto lo pone WhatsApp desde og:title.
 *
 * Edge runtime: @vercel/og corre en el edge.
 */

import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

// Satori acepta elementos con forma React { type, props }. Helper sin JSX.
type Node = { type: string; props: Record<string, unknown> };
function n(
  type: string,
  props: Record<string, unknown>,
  children?: Node[] | string,
): Node {
  return {
    type,
    props: { ...props, ...(children !== undefined ? { children } : {}) },
  };
}

export default function handler(): ImageResponse {
  const tree = n(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background:
          'linear-gradient(135deg, #0b1220 0%, #11261e 60%, #1f7a3e 100%)',
      },
    },
    [
      n('img', {
        src: 'https://www.potenciapp.com/branding/png/wordmark-dark-1600.png',
        width: 640,
        height: 90,
        style: { objectFit: 'contain' },
      }),
      n('div', {
        style: {
          marginTop: 44,
          width: 200,
          height: 8,
          borderRadius: 999,
          background: '#1aff1a',
        },
      }),
    ],
  );

  return new ImageResponse(tree as unknown as never, {
    width: 1200,
    height: 630,
    headers: {
      'cache-control':
        'public, no-transform, max-age=86400, s-maxage=604800, immutable',
    },
  });
}
