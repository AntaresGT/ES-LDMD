/**
 * @archivo not-found.tsx
 * @descripcion Página 404 personalizada (App Router).
 * Se renderiza cuando una ruta no existe o cuando un segmento llama a `notFound()`.
 */
import type { Metadata } from 'next';
import { PaginaErrorBase } from '@/componentes/errores/PaginaErrorBase';
import { obtenerInfoCodigo } from '@/componentes/errores/codigos-http';

const INFO = obtenerInfoCodigo(404);

export const metadata: Metadata = {
  title: `${INFO.codigo} · ${INFO.titulo} | es-ldmd`,
  description: INFO.mensaje,
  robots: { index: false, follow: false },
};

export default function NoEncontrado() {
  return (
    <PaginaErrorBase
      codigo={INFO.codigo}
      titulo={INFO.titulo}
      mensaje={INFO.mensaje}
    />
  );
}
