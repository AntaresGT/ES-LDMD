/**
 * @archivo ConsentimientoPrivacidad.tsx
 * @descripcion Respeta Global Privacy Control (GPC) y expone revocación del CMP de Google
 * (Privacidad y mensajes / Funding Choices) cuando esté disponible en la página.
 */
'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    dataLayer?: unknown[];
    /** Definido por el script de Consent Mode en layout (antes de AdSense). */
    gtag?: (...args: unknown[]) => void;
    googlefc?: {
      showRevocationMessage?: () => void;
    };
  }

  interface Navigator {
    /** Señal de privacidad global (opt-out de venta/compartición en EE. UU.) */
    globalPrivacyControl?: boolean;
  }
}

/**
 * Abre el diálogo de Google para cambiar o revocar preferencias de privacidad y anuncios,
 * si el sitio tiene activado «Privacidad y mensajes» en AdSense.
 */
export function mostrar_mensaje_revocacion(): void {
  if (typeof window === 'undefined') return;
  try {
    window.googlefc?.showRevocationMessage?.();
  } catch {
    // Si el script de Funding Choices aún no cargó, no hacemos nada.
  }
}

/**
 * Aplica denegación de almacenamiento publicitario cuando el navegador envía GPC=true.
 * Debe montarse antes de cargar anuncios; el layout lo coloca antes de `CargarScriptAdSense`.
 */
export function ConsentimientoPrivacidad() {
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    if (!navigator.globalPrivacyControl) return;

    window.gtag?.('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    });
  }, []);

  return null;
}
