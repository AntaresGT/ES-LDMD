import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const TITULO = 'Documentación | es-ldmd';
const DESCRIPCION =
  'Guía del lenguaje de modelado de diagramas en español (LDMD): sintaxis, ejemplos y uso del editor de diagramas entidad-relación en es-ldmd.';

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRIPCION,
  alternates: {
    canonical: 'https://es-ldmd.com/documentacion',
  },
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    url: 'https://es-ldmd.com/documentacion',
    type: 'website',
    locale: 'es_ES',
    siteName: 'es-ldmd',
    images: [
      {
        url: '/imagen_seo.png',
        width: 1200,
        height: 630,
        alt: 'Logo de es-ldmd: Español - Lenguaje de Modelado de Diagramas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITULO,
    description: DESCRIPCION,
    images: ['/imagen_seo.png'],
  },
};

export default function LayoutDocumentacion({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
