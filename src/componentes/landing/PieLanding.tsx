

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
              <Link href="/aplicacion" passHref legacyBehavior>
                <Anchor c="dimmed" size="sm">
                  Aplicación
                </Anchor>
              </Link>
              <Link href="/documentacion" passHref legacyBehavior>
                <Anchor c="dimmed" size="sm">
                  Documentación
                </Anchor>
              </Link>
              <Link href="/acerca-de" passHref legacyBehavior>
                <Anchor c="dimmed" size="sm">
                  Acerca de
                </Anchor>
              </Link>
              <Link href="/politica-privacidad" passHref legacyBehavior>
                <Anchor c="dimmed" size="sm">
                  Privacidad
                </Anchor>
              </Link>
              <Link href="/politica-cookies" passHref legacyBehavior>
                <Anchor c="dimmed" size="sm">
                  Cookies
                </Anchor>
              </Link>
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
