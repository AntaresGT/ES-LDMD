/**
 * @archivo AnuncioAdSense.tsx
 * @descripcion Bloque base de Google AdSense (display) para Next.js/React.
 * El script se inyecta con CargarScriptAdSense; el push ocurre tras el evento de carga (ver adsense-constantes).
 */
'use client';

import { Box, type BoxProps } from '@mantine/core';
import { useEffect, useRef } from 'react';
import {
  ADSENSE_CLIENT_ID,
} from './adsense-constantes';

/** Reexport para código que ya importaba el cliente desde aquí. */
export { ADSENSE_CLIENT_ID };

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export interface PropiedadesAnuncioAdSense extends BoxProps {
  /** ID del anuncio en AdSense (data-ad-slot). */
  adSlot: string;
  /** Formato solicitado a AdSense (horizontal suele ocupar menos alto que auto). */
  formato?: 'auto' | 'horizontal';
  /** Si el anuncio puede usar todo el ancho del contenedor (false = más control con maxWidth). */
  anchoCompletoResponsivo?: boolean;
}

/**
 * Unidad de anuncio AdSense. El tamaño visible lo marca el Box (altura/ancho) + clase .anuncio-esldmd.
 */
export function AnuncioAdSense({
  adSlot,
  formato = 'auto',
  anchoCompletoResponsivo = true,
  className,
  style,
  ...boxProps
}: PropiedadesAnuncioAdSense) {
  const ya_hecho_push = useRef(false);

  useEffect(() => {
    const animId = requestAnimationFrame(() => {
      if (ya_hecho_push.current) return;
      ya_hecho_push.current = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        ya_hecho_push.current = false;
      }
    });
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <Box
      {...boxProps}
      className={['anuncio-esldmd', className].filter(Boolean).join(' ')}
      style={{
        overflow: 'hidden',
        ...style,
      }}
      aria-label="Publicidad"
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format={formato}
        data-full-width-responsive={anchoCompletoResponsivo ? 'true' : 'false'}
      />
    </Box>
  );
}
