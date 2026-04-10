import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const TITULO = 'Política de privacidad | es-ldmd';
const DESCRIPCION =
  'Información sobre el tratamiento de datos personales, publicidad (Google AdSense) y derechos según el RGPD y leyes de privacidad de Estados Unidos.';

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRIPCION,
  alternates: {
    canonical: 'https://es-ldmd.com/politica-privacidad',
  },
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    url: 'https://es-ldmd.com/politica-privacidad',
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

export default function LayoutPoliticaPrivacidad({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
