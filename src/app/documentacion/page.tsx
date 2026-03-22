'use client';

import dynamic from 'next/dynamic';

const PaginaDocumentacion = dynamic(
  () =>
    import('@/componentes/documentacion/PaginaDocumentacion').then(
      (mod) => mod.PaginaDocumentacion
    ),
  { ssr: false }
);

export default function Documentacion() {
  return <PaginaDocumentacion />;
}
