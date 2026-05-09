/**
 * @archivo acerca-de/page.tsx
 * @descripcion Página informativa sobre el proyecto.
 * Server component que solo expone metadata y delega el render al cliente.
 */
import type { Metadata } from 'next';
import { ContenidoAcercaDe } from '@/componentes/landing/ContenidoAcercaDe';

const TITULO = 'Acerca de es-ldmd';
const DESCRIPCION =
  'Conoce la motivación detrás de es-ldmd: un lenguaje de modelado de diagramas entidad-relación pensado para la comunidad hispanohablante, su filosofía local-first y su stack abierto.';

export const metadata: Metadata = {
  title: `${TITULO} | es-ldmd`,
  description: DESCRIPCION,
  alternates: { canonical: 'https://es-ldmd.com/acerca-de' },
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    url: 'https://es-ldmd.com/acerca-de',
    type: 'article',
    locale: 'es_ES',
    siteName: 'es-ldmd',
    images: [{ url: '/imagen_seo.png', width: 1200, height: 630, alt: 'es-ldmd' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITULO,
    description: DESCRIPCION,
    images: ['/imagen_seo.png'],
  },
};

export default function AcercaDe() {
  return <ContenidoAcercaDe />;
}
