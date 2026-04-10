/**
 * @archivo EnlacesLegalesPie.tsx
 * @descripcion Enlaces a políticas y acción para revocar preferencias de cookies/anuncios (CMP Google).
 */
'use client';

import { Anchor, Group, Text, UnstyledButton } from '@mantine/core';
import Link from 'next/link';
import { mostrar_mensaje_revocacion } from '@/componentes/anuncios/ConsentimientoPrivacidad';

const estilo_enlace = {
  fontSize: 'var(--mantine-font-size-xs)',
} as const;

export function EnlacesLegalesPie() {
  return (
    <Group
      component="footer"
      gap="md"
      justify="center"
      wrap="wrap"
      py={6}
      px="sm"
      style={{
        borderTop: '1px solid var(--mantine-color-default-border)',
        backgroundColor: 'var(--mantine-color-body)',
        flexShrink: 0,
      }}
      aria-label="Información legal y privacidad"
    >
      <Anchor component={Link} href="/politica-privacidad" size="xs" c="dimmed" style={estilo_enlace}>
        Política de privacidad
      </Anchor>
      <Text component="span" size="xs" c="dimmed" aria-hidden>
        ·
      </Text>
      <Anchor component={Link} href="/politica-cookies" size="xs" c="dimmed" style={estilo_enlace}>
        Política de cookies
      </Anchor>
      <Text component="span" size="xs" c="dimmed" aria-hidden>
        ·
      </Text>
      <UnstyledButton
        type="button"
        onClick={() => mostrar_mensaje_revocacion()}
        style={{
          ...estilo_enlace,
          color: 'var(--mantine-color-dimmed)',
          textDecoration: 'underline',
          cursor: 'pointer',
        }}
        aria-label="Gestionar preferencias de privacidad y anuncios"
      >
        Preferencias de privacidad y anuncios
      </UnstyledButton>
    </Group>
  );
}
