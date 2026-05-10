/**
 * @archivo error/[codigo]/page.tsx
 * @descripcion Página dinámica para mostrar cualquier código HTTP soportado
 * por el catálogo (`codigos-http.ts`). Útil cuando se necesita redirigir desde
 * un handler, middleware o enlace manual hacia un código específico
 * (ej. `/error/410`, `/error/418`).
 *
 * Si el código solicitado no está en el catálogo, se delega en `notFound()`
 * para que se sirva la página 404 personalizada.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PaginaErrorBase } from '@/componentes/errores/PaginaErrorBase';
import {
  CODIGOS_HTTP,
  esCodigoSoportado,
  obtenerInfoCodigo,
} from '@/componentes/errores/codigos-http';

interface PropiedadesPagina {
  /** Parámetros dinámicos de la ruta. En Next 16 son una Promise. */
  params: Promise<{ codigo: string }>;
}

/**
 * Pre-genera estáticamente las páginas de los códigos del catálogo.
 *
 * @returns Lista de combinaciones de parámetros a pre-renderizar.
 */
export function generateStaticParams(): Array<{ codigo: string }> {
  return Object.keys(CODIGOS_HTTP).map((codigo) => ({ codigo }));
}

/**
 * Metadata dinámica basada en el código solicitado.
 *
 * @param props - Propiedades con los parámetros de la ruta.
 * @returns Metadata para SEO.
 */
export async function generateMetadata({
  params,
}: PropiedadesPagina): Promise<Metadata> {
  const { codigo: codigoTexto } = await params;
  const codigo = Number.parseInt(codigoTexto, 10);

  if (!Number.isFinite(codigo) || !esCodigoSoportado(codigo)) {
    return {
      title: 'Error | es-ldmd',
      robots: { index: false, follow: false },
    };
  }

  const info = obtenerInfoCodigo(codigo);
  return {
    title: `Error ${info.codigo} · ${info.titulo} | es-ldmd`,
    description: info.mensaje,
    robots: { index: false, follow: false },
  };
}

export default async function PaginaErrorDinamica({ params }: PropiedadesPagina) {
  const { codigo: codigoTexto } = await params;
  const codigo = Number.parseInt(codigoTexto, 10);

  if (!Number.isFinite(codigo) || !esCodigoSoportado(codigo)) {
    notFound();
  }

  const info = obtenerInfoCodigo(codigo);

  return (
    <PaginaErrorBase
      codigo={info.codigo}
      titulo={info.titulo}
      mensaje={info.mensaje}
    />
  );
}
