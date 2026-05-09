'use client';

/**
 * @archivo PieLanding.tsx
 * @descripcion Pie de página con enlaces legales y de navegación.
 */
import Link from 'next/link';
import { Box, Container, Group, Stack, Text, Anchor, Divider } from '@mantine/core';

export function PieLanding() {
  return (
    <Box
      component="footer"
      py="xl"
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(15, 16, 20, 0.6)',
      }}
    >
      <Container size="lg">
        <Stack gap="md">
          <Group justify="space-between" wrap="wrap" gap="md">
            <Stack gap={4}>
              <Text fw={700} size="lg">
                es-ldmd
              </Text>
              <Text size="sm" c="dimmed">
                Lenguaje de modelado de diagramas en español.
              </Text>
            </Stack>

            <Group gap="lg" wrap="wrap">
              <Anchor component={Link} href="/aplicacion" c="dimmed" size="sm">
                Aplicación
              </Anchor>
              <Anchor component={Link} href="/documentacion" c="dimmed" size="sm">
                Documentación
              </Anchor>
              <Anchor component={Link} href="/acerca-de" c="dimmed" size="sm">
                Acerca de
              </Anchor>
              <Anchor component={Link} href="/politica-privacidad" c="dimmed" size="sm">
                Privacidad
              </Anchor>
              <Anchor component={Link} href="/politica-cookies" c="dimmed" size="sm">
                Cookies
              </Anchor>
            </Group>
          </Group>

          <Divider color="dark.6" />

          <Group justify="space-between" wrap="wrap" gap="xs">
            <Text size="xs" c="dimmed">
              © {new Date().getFullYear()} es-ldmd. Todos los derechos reservados.
            </Text>
            <Text size="xs" c="dimmed">
              Hecho con cariño para la comunidad hispanohablante.
            </Text>
          </Group>
        </Stack>
      </Container>
    </Box>
  );
}
