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
import { AnuncioHorizontal } from '@/componentes/anuncios/AnuncioHorizontal';

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

        {/* Banner de anuncio horizontal (no intrusivo) */}
        <Box style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#0e0f12' }} py="lg">
          <AnuncioHorizontal />
        </Box>

        <CtaFinal />
      </main>
      <PieLanding />
    </Box>
  );
}
