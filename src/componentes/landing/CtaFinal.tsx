'use client';

/**
 * @archivo CtaFinal.tsx
 * @descripcion Sección final con llamada a la acción.
 */
import Link from 'next/link';
import { Box, Container, Title, Text, Button, Group, Stack } from '@mantine/core';

export function CtaFinal() {
  return (
    <Box component="section" py={120}>
      <Container size="md">
        <Box
          style={{
            position: 'relative',
            borderRadius: 24,
            padding: 'clamp(40px, 6vw, 72px)',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
            background:
              'radial-gradient(ellipse at 30% 20%, rgba(77,171,247,0.22), transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(151,117,250,0.22), transparent 60%), rgba(20,21,25,0.9)',
          }}
        >
          <Stack align="center" gap="lg" ta="center">
            <Title
              order={2}
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                letterSpacing: '-0.02em',
                maxWidth: 600,
              }}
            >
              ¿Listo para diseñar tu próxima base de datos?
            </Title>
            <Text c="dimmed" size="lg" maw={520}>
              Abre el editor y empieza a escribir. No tardarás más de un minuto en
              tener tu primer diagrama.
            </Text>
            <Group gap="md" mt="sm">
              <Button
                component={Link}
                href="/aplicacion"
                size="lg"
                radius="md"
                variant="gradient"
                gradient={{ from: 'azul.6', to: 'violet.6', deg: 135 }}
                styles={{ root: { paddingInline: 28, fontWeight: 600 } }}
              >
                Abrir aplicación
              </Button>
              <Button
                component={Link}
                href="/documentacion"
                size="lg"
                radius="md"
                variant="default"
                styles={{ root: { paddingInline: 28, fontWeight: 600 } }}
              >
                Ir a documentación
              </Button>
            </Group>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
