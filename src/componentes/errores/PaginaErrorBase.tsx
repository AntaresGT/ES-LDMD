/**
 * @archivo PaginaErrorBase.tsx
 * @descripcion Componente presentacional reutilizable para páginas de error.
 * Usa Mantine y un fondo coherente con la landing (gradientes + FondoAnimado).
 *
 * Es un client component porque algunas de sus variantes pueden requerir
 * interacción (botón "Intentar de nuevo"). Aun así, puede ser embebido desde
 * server components (Next.js permite client → render dentro de server).
 */
'use client';

import Link from 'next/link';
import { Box, Container, Title, Text, Group, Button, Stack } from '@mantine/core';
import { FondoAnimado } from '@/componentes/landing/FondoAnimado';

export interface PaginaErrorBaseProps {
  /** Código HTTP a mostrar (ej. 404, 500). */
  codigo: number;
  /** Título principal mostrado debajo del código. */
  titulo: string;
  /** Mensaje descriptivo orientado al usuario. */
  mensaje: string;
  /** Si es true, muestra un botón adicional para reintentar. */
  mostrarReintento?: boolean;
  /** Callback ejecutado al pulsar "Intentar de nuevo". */
  alReintentar?: () => void;
}

/**
 * Página de error con estética coherente con la landing del sitio.
 *
 * @param props - Configuración del contenido a mostrar.
 * @returns JSX renderizado.
 */
export function PaginaErrorBase({
  codigo,
  titulo,
  mensaje,
  mostrarReintento = false,
  alReintentar,
}: PaginaErrorBaseProps) {
  return (
    <Box
      component="main"
      role="main"
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBlock: 96,
        background:
          'radial-gradient(ellipse at 20% 0%, rgba(77,171,247,0.18), transparent 60%), radial-gradient(ellipse at 90% 30%, rgba(151,117,250,0.18), transparent 55%), #0e0f12',
      }}
    >
      <FondoAnimado />

      <Container size="md" style={{ position: 'relative', zIndex: 1 }}>
        <Stack align="center" gap="lg" ta="center">
          <Box
            component="span"
            aria-hidden="true"
            style={{
              fontSize: 'clamp(5rem, 14vw, 10rem)',
              lineHeight: 1,
              fontWeight: 800,
              letterSpacing: '-0.05em',
              background: 'linear-gradient(90deg, #74c0fc, #b197fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {codigo}
          </Box>

          <Title
            order={1}
            style={{
              fontSize: 'clamp(1.6rem, 3.5vw, 2.6rem)',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              maxWidth: 720,
              fontWeight: 700,
            }}
          >
            {titulo}
          </Title>

          <Text size="lg" c="dimmed" style={{ maxWidth: 620, lineHeight: 1.6 }}>
            {mensaje}
          </Text>

          <Group gap="md" mt="md" justify="center" wrap="wrap">
            <Button
              component={Link}
              href="/"
              size="lg"
              radius="md"
              variant="gradient"
              gradient={{ from: 'azul.6', to: 'violet.6', deg: 135 }}
              styles={{ root: { paddingInline: 28, fontWeight: 600 } }}
            >
              Ir al inicio
            </Button>
            <Button
              component={Link}
              href="/aplicacion"
              size="lg"
              radius="md"
              variant="default"
              styles={{ root: { paddingInline: 28, fontWeight: 600 } }}
            >
              Abrir el editor
            </Button>
            {mostrarReintento && alReintentar && (
              <Button
                onClick={alReintentar}
                size="lg"
                radius="md"
                variant="subtle"
                color="gray"
                styles={{ root: { paddingInline: 24, fontWeight: 600 } }}
              >
                Intentar de nuevo
              </Button>
            )}
          </Group>
        </Stack>
      </Container>
    </Box>
  );
}
