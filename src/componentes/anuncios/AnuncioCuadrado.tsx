/**
 * @archivo AnuncioCuadrado.tsx
 * @descripcion Unidad aislada: principal-anuncio-cuadrado (slot 6679812815).
 */
'use client';

import { AnuncioAdSense } from './AnuncioAdSense';

const AD_SLOT_CUADRADO = '6679812815';

export function AnuncioCuadrado() {
  return (
    <AnuncioAdSense
      adSlot={AD_SLOT_CUADRADO}
      formato="auto"
      anchoCompletoResponsivo
      style={{
        height: 72,
        maxHeight: 72,
        width: '100%',
        maxWidth: '100%',
      }}
      py={2}
    />
  );
}
