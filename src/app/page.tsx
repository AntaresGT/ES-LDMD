/**
 * @archivo page.tsx
 * @descripcion Página principal de la aplicación es-ldmd.
 * Renderiza el layout principal con los 3 paneles.
 */
'use client';

import { DisenioPrincipal } from '@/componentes/diseno-principal/DisenioPrincipal';

/**
 * Página principal de la aplicación.
 * Renderiza el diseño principal con editor, diagrama y panel de herramientas.
 *
 * @returns {JSX.Element} Página principal renderizada
 */
export default function Principal() {
  return <DisenioPrincipal />;
}
