/**
 * @archivo error.tsx
 * @descripcion Página de error genérica (App Router) para fallos en segmentos hijos.
 * Se monta dentro del RootLayout, así que tiene acceso a Mantine y al resto de
 * proveedores. Equivale a un "500" de cara al usuario.
 */
'use client';

import { useEffect } from 'react';
import { PaginaErrorBase } from '@/componentes/errores/PaginaErrorBase';
import { obtenerInfoCodigo } from '@/componentes/errores/codigos-http';

interface PropiedadesError {
  /** Error capturado por React/Next.js. */
  error: Error & { digest?: string };
  /** Reintenta renderizar el segmento que falló. */
  reset: () => void;
}

const INFO = obtenerInfoCodigo(500);

export default function ErrorAplicacion({ error, reset }: PropiedadesError) {
  useEffect(() => {
    // Registramos en consola para depuración. El digest permite correlacionar
    // el fallo con los logs del servidor en producción.
    console.error('[error.tsx] Error no controlado:', error.digest, error);
  }, [error]);

  return (
    <PaginaErrorBase
      codigo={INFO.codigo}
      titulo={INFO.titulo}
      mensaje={INFO.mensaje}
      mostrarReintento
      alReintentar={reset}
    />
  );
}
