'use client';

/**
 * @archivo PaginaLanding.tsx
 * @descripcion Composición de la página de inicio (landing) de es-ldmd.
 */
import { Box } from '@mantine/core';
import { EncabezadoLanding } from './EncabezadoLanding';
import { SeccionHero } from './SeccionHero';
import { SeccionQueEs } from './SeccionQueEs';
import { SeccionCaracteristicas } from './SeccionCaracteristicas';
import { SeccionComoFunciona } from './SeccionComoFunciona';
import { SeccionEjemplo } from './SeccionEjemplo';
import { SeccionCasosUso } from './SeccionCasosUso';
import { SeccionFAQ } from './SeccionFAQ';
import { CtaFinal } from './CtaFinal';
import { PieLanding } from './PieLanding';

export function PaginaLanding() {
  return (
    <Box style={{ backgroundColor: '#0e0f12', color: 'var(--mantine-color-text)', minHeight: '100vh' }}>
      <EncabezadoLanding />
      <main>
        <SeccionHero />
        <SeccionQueEs />
        <SeccionCaracteristicas />
        <SeccionComoFunciona />
        <SeccionEjemplo />
        <SeccionCasosUso />
        <SeccionFAQ />
        <CtaFinal />
      </main>
      <PieLanding />
    </Box>
  );
}
