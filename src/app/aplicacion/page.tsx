/**
 * @archivo aplicacion/page.tsx
 * @descripcion Página de la aplicación principal (editor + diagrama + IA).
 * Contiene el `DisenioPrincipal` que antes vivía en la raíz `/`.
 */
'use client';

import { DisenioPrincipal } from '@/componentes/diseno-principal/DisenioPrincipal';

/**
 * Página de la aplicación es-ldmd.
 *
 * @returns {JSX.Element} Aplicación renderizada
 */
export default function PaginaAplicacion() {
  return <DisenioPrincipal />;
}
