/**
 * @archivo layout.tsx
 * @descripcion Layout raíz de la aplicación Next.js.
 * Integra MantineProvider, tema y scripts necesarios.
 */
import type { Metadata } from 'next';
import { mantineHtmlProps, ColorSchemeScript } from '@mantine/core';
import './globals.css';
import { ProveedorAplicacion } from '@/componentes/proveedor-aplicacion';
import { CargarScriptAdSense } from '@/componentes/anuncios/CargarScriptAdSense';
import { ConsentimientoPrivacidad } from '@/componentes/anuncios/ConsentimientoPrivacidad';

/** Consent Mode v2 (Google): valores por defecto antes de cualquier etiqueta de Google. */
const SCRIPT_CONSENT_MODE_DEFECTO = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'analytics_storage': 'denied',
  'wait_for_update': 500
});
gtag('set', 'ads_data_redaction', true);
gtag('set', 'url_passthrough', true);
`;

/**
 * Metadata de la aplicación para SEO y accesibilidad.
 */
export const metadata: Metadata = {
  metadataBase: new URL('https://es-ldmd.com'),
  title: 'es-ldmd - Editor de Diagramas Entidad Relación',
  description: 'Herramienta para crear diagramas de entidad relación usando un lenguaje de modelado en español.',
  keywords: ['diagrama', 'entidad-relación', 'base de datos', 'modelado', 'español', 'SQL'],
  openGraph: {
    title: 'es-ldmd - Editor de Diagramas Entidad Relación',
    description: 'Herramienta para crear diagramas de entidad relación usando un lenguaje de modelado en español.',
    images: [
      {
        url: '/imagen_seo.png',
        width: 1200,
        height: 630,
        alt: 'es-ldmd - Español - Lenguaje de Modelado de Diagramas',
      },
    ],
    type: 'website',
    locale: 'es_ES',
    siteName: 'es-ldmd',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'es-ldmd - Editor de Diagramas Entidad Relación',
    description: 'Herramienta para crear diagramas de entidad relación usando un lenguaje de modelado en español.',
    images: ['/imagen_seo.png'],
  },
};

/**
 * Layout raíz de la aplicación.
 * Envuelve toda la aplicación con los proveedores necesarios.
 *
 * @param {object} props - Propiedades del layout
 * @param {React.ReactNode} props.children - Elementos hijos
 * @returns {JSX.Element} Layout raíz renderizado
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" {...mantineHtmlProps} suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_CONSENT_MODE_DEFECTO }} />
        <meta name="google-adsense-account" content="ca-pub-7793838991292720" />
      </head>

      <body>
        <ConsentimientoPrivacidad />
        <CargarScriptAdSense />
        <ProveedorAplicacion>
          {children}
        </ProveedorAplicacion>
      </body>
    </html>
  );
}
