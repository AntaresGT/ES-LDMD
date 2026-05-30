

/**
 * @archivo EncabezadoLanding.tsx
 * @descripcion Barra de navegación superior fija para la landing y subpáginas.
 */
import Link from 'next/link';
import Image from 'next/image';
import { Box, Container, Group, Button, Anchor } from '@mantine/core';

export function EncabezadoLanding() {
  return (
    <Box
      component="header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(20, 21, 25, 0.72)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <Container size="lg" py="sm">
        <Group justify="space-between" wrap="nowrap">
          <Link href="/" passHref legacyBehavior>
            <Anchor
              underline="never"
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <Image
                src="/logo_es_ldmd_pequeño.png"
                alt="Logo de es-ldmd"
                width={66}
                height={36}
                style={{ borderRadius: 8 }}
              />
              <Box
                component="span"
                style={{
                  fontWeight: 700,
                  fontSize: 18,
                  color: 'var(--mantine-color-text)',
                  letterSpacing: '-0.01em',
                }}
              >
                - ldmd
              </Box>
            </Anchor>
          </Link>

          <Group gap="xl" visibleFrom="sm">
            <Link href="/acerca-de" passHref legacyBehavior>
              <Anchor c="dimmed" fw={500}>
                Acerca de
              </Anchor>
            </Link>
            <Link href="/documentacion" passHref legacyBehavior>
              <Anchor c="dimmed" fw={500}>
                Documentación
              </Anchor>
            </Link>
            <Link href="/aplicacion" passHref legacyBehavior>
              <Button
                variant="gradient"
                gradient={{ from: 'azul.6', to: 'violet.6', deg: 135 }}
                radius="md"
              >
                Abrir aplicación
              </Button>
            </Link>
          </Group>

          <Link href="/aplicacion" passHref legacyBehavior>
            <Button
              variant="gradient"
              gradient={{ from: 'azul.6', to: 'violet.6', deg: 135 }}
              radius="md"
              hiddenFrom="sm"
              size="sm"
            >
              Abrir
            </Button>
          </Link>
        </Group>
      </Container>
    </Box>
  );
}
