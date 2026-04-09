/**
 * @archivo CargarScriptAdSense.tsx
 * @descripcion Carga adsbygoogle.js sin usar `next/script`, porque Next añade
 * `data-nscript` y AdSense lo rechaza en consola ("head tag doesn't support data-nscript").
 *
 * Recomendaciones (AdSense / UX):
 * - Un solo bloque `<ins class="adsbygoogle">` por slot en la misma URL; evita duplicar
 *   el mismo `data-ad-slot` en varios sitios de la página.
 * - Crea unidades distintas en la consola de AdSense si necesitas más de un anuncio visible.
 * - Verifica el dominio (p. ej. localhost no muestra anuncios reales hasta producción).
 * - Respeta las políticas de Google sobre cantidad y ubicación de anuncios.
 * - Si cambias de dominio, actualiza sitios autorizados en AdSense.
 */
'use client';

import { useEffect } from 'react';
import {
  ADSENSE_CLIENT_ID,
  ADSENSE_READY_EVENT,
  ADSENSE_SCRIPT_ELEMENT_ID,
} from './adsense-constantes';

function notificar_script_listo() {
  window.dispatchEvent(new Event(ADSENSE_READY_EVENT));
}

export function CargarScriptAdSense() {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const existente = document.getElementById(ADSENSE_SCRIPT_ELEMENT_ID);
    if (existente instanceof HTMLScriptElement) {
      window.adsbygoogle = window.adsbygoogle || [];
      if (existente.dataset.loaded === 'true') {
        queueMicrotask(notificar_script_listo);
      } else {
        existente.addEventListener('load', () => {
          existente.dataset.loaded = 'true';
          notificar_script_listo();
        });
      }
      return;
    }

    const script = document.createElement('script');
    script.id = ADSENSE_SCRIPT_ELEMENT_ID;
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
    script.crossOrigin = 'anonymous';
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      notificar_script_listo();
    });
    window.adsbygoogle = window.adsbygoogle || [];
    document.body.appendChild(script);
  }, []);

  return null;
}
