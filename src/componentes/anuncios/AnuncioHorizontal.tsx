/**
 * @archivo AnuncioHorizontal.tsx
 * @descripcion Unidad aislada: anuncio-horizontal (slot 7709620191).
 */
'use client';

import { AnuncioAdSense } from './AnuncioAdSense';

const AD_SLOT_HORIZONTAL = '7709620191';

export function AnuncioHorizontal() {
  return (
    <AnuncioAdSense
      adSlot={AD_SLOT_HORIZONTAL}
      formato="horizontal"
      anchoCompletoResponsivo={false}
      style={{
        height: 68,
        maxHeight: 68,
        maxWidth: 200,
        width: '100%',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
      py={2}
    />
  );
}
