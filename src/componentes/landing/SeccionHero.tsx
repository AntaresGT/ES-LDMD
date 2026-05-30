

/**
 * @archivo SeccionHero.tsx
 * @descripcion Sección hero principal con fondo animado tipo ER.
 */
import Link from 'next/link';
import { Box, Container, Title, Text, Group, Button, Stack, Badge } from '@mantine/core';
import { FondoAnimado } from './FondoAnimado';

export function SeccionHero() {
  return (
    <Box
      component="section"
      style={{
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 96,
        paddingBottom: 120,
        background:
          'radial-gradient(ellipse at 20% 0%, rgba(77,171,247,0.18), transparent 60%), radial-gradient(ellipse at 90% 30%, rgba(151,117,250,0.18), transparent 55%), #0e0f12',
      }}
    >
      <FondoAnimado />

      <Container size="lg" style={{ position: 'relative', zIndex: 1 }}>
        <Stack align="center" gap="lg" ta="center">
          <Badge
            size="lg"
            variant="light"
            color="azul"
            radius="sm"
            style={{ backdropFilter: 'blur(6px)' }}
          >
            DSL en español · Diagrama en tiempo real · IA en el navegador
          </Badge>

          <Title
            order={1}
            style={{
              fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              maxWidth: 900,
              fontWeight: 700,
            }}
          >
            Diseña tus bases de datos{' '}
            <Box
              component="span"
              style={{
                background: 'linear-gradient(90deg, #74c0fc, #b197fc)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              en español
            </Box>
            , sin abandonar el código.
          </Title>

          <Text size="xl" c="dimmed" style={{ maxWidth: 720, lineHeight: 1.55 }}>
            <strong>es-ldmd</strong> es un editor web gratuito que convierte un lenguaje de
            modelado escrito en español en un diagrama entidad-relación interactivo.
            Genera SQL, exporta imágenes y obtén ayuda con un asistente de IA que se
            ejecuta dentro de tu propio navegador.
          </Text>

          <Group gap="md" mt="md">
            <Link href="/aplicacion" passHref legacyBehavior>
              <Button
                size="lg"
                radius="md"
                variant="gradient"
                gradient={{ from: 'azul.6', to: 'violet.6', deg: 135 }}
                styles={{ root: { paddingInline: 28, fontWeight: 600 } }}
              >
                Abrir aplicación
              </Button>
            </Link>
            <Link href="/documentacion" passHref legacyBehavior>
              <Button
                size="lg"
                radius="md"
                variant="default"
                styles={{ root: { paddingInline: 28, fontWeight: 600 } }}
              >
                Ir a documentación
              </Button>
            </Link>
          </Group>

          <Text size="sm" c="dimmed" mt="xs">
            Sin registro · 100% en tu navegador · Código abierto
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}
