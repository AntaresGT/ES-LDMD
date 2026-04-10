import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Política de privacidad | es-ldmd',
  description:
    'Información sobre el tratamiento de datos personales, publicidad (Google AdSense) y derechos según el RGPD y leyes de privacidad de Estados Unidos.',
};

export default function LayoutPoliticaPrivacidad({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
