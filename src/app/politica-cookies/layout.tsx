import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Política de cookies | es-ldmd',
  description:
    'Uso de cookies y tecnologías similares en es-ldmd, incluida publicidad con Google AdSense y almacenamiento local de la aplicación.',
};

export default function LayoutPoliticaCookies({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
