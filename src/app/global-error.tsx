/**
 * @archivo global-error.tsx
 * @descripcion Página de error fatal (App Router). Se renderiza cuando el
 * error ocurre en el RootLayout o en algún proveedor global, por lo que DEBE
 * proveer su propio `<html>` y `<body>`. No puede asumir que MantineProvider
 * ni otros contextos estén disponibles.
 */
'use client';

import { useEffect } from 'react';
import { PaginaErrorMinima } from '@/componentes/errores/PaginaErrorMinima';
import { obtenerInfoCodigo } from '@/componentes/errores/codigos-http';

interface PropiedadesGlobalError {
  /** Error capturado por React/Next.js. */
  error: Error & { digest?: string };
  /** Reintenta renderizar la aplicación. */
  reset: () => void;
}

const INFO = obtenerInfoCodigo(500);

export default function ErrorGlobal({ error, reset }: PropiedadesGlobalError) {
  useEffect(() => {
    console.error('[global-error.tsx] Error fatal:', error.digest, error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ margin: 0, background: '#0e0f12' }}>
        <PaginaErrorMinima
          codigo={INFO.codigo}
          titulo={INFO.titulo}
          mensaje={INFO.mensaje}
          mostrarReintento
          alReintentar={reset}
        />
      </body>
    </html>
  );
}
