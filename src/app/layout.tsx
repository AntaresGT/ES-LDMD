/**
 * @archivo layout.tsx
 * @descripcion Layout raíz de la aplicación Next.js.
 * Integra MantineProvider, tema y scripts necesarios.
 */
import type { Metadata } from 'next';
import { mantineHtmlProps, ColorSchemeScript } from '@mantine/core';
import './globals.css';
import { ProveedorAplicacion } from '@/componentes/proveedor-aplicacion';

/**
 * Metadata de la aplicación para SEO y accesibilidad.
 */
export const metadata: Metadata = {
  title: 'es-ldmd - Editor de Diagramas Entidad Relación',
  description: 'Herramienta para crear diagramas de entidad relación usando un lenguaje de modelado en español.',
  keywords: ['diagrama', 'entidad-relación', 'base de datos', 'modelado', 'español', 'SQL'],
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
      </head>
      <body>
        <ProveedorAplicacion>
          {children}
        </ProveedorAplicacion>
      </body>
    </html>
  );
}
