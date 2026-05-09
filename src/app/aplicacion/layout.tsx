import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const TITULO = 'Aplicación | es-ldmd';
const DESCRIPCION =
  'Editor interactivo de es-ldmd: escribe el lenguaje de modelado en español, visualiza tu diagrama entidad-relación en tiempo real y exporta a SQL o imagen.';

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRIPCION,
  alternates: {
    canonical: 'https://es-ldmd.com/aplicacion',
  },
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    url: 'https://es-ldmd.com/aplicacion',
    type: 'website',
    locale: 'es_ES',
    siteName: 'es-ldmd',
    images: [
      {
        url: '/imagen_seo.png',
        width: 1200,
        height: 630,
        alt: 'Editor de es-ldmd: Español - Lenguaje de Modelado de Diagramas',
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

export default function LayoutAplicacion({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
