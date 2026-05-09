/**
 * @archivo page.tsx (raíz)
 * @descripcion Página de inicio (landing) de es-ldmd.
 * Server component con contenido estático rastreable por buscadores y AdSense.
 */
import type { Metadata } from 'next';
import { PaginaLanding } from '@/componentes/landing/PaginaLanding';

const TITULO = 'es-ldmd · Diseña bases de datos en español';
const DESCRIPCION =
  'Editor web gratuito para crear diagramas entidad-relación con un lenguaje de modelado en español. Genera SQL, exporta imágenes y trabaja con un asistente de IA local en tu navegador.';

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRIPCION,
  alternates: { canonical: 'https://es-ldmd.com' },
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    url: 'https://es-ldmd.com',
    type: 'website',
    locale: 'es_ES',
    siteName: 'es-ldmd',
    images: [
      {
        url: '/imagen_seo.png',
        width: 1200,
        height: 630,
        alt: 'es-ldmd · Lenguaje de Modelado de Diagramas en Español',
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

export default function Pagina() {
  return <PaginaLanding />;
}
