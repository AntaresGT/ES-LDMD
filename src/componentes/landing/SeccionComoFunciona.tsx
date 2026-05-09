'use client';

/**
 * @archivo SeccionComoFunciona.tsx
 * @descripcion 3 pasos visuales del flujo: escribes → validamos → exportas.
 */
import { Box, Container, Title, Text, SimpleGrid, Stack, Group } from '@mantine/core';

const PASOS = [
  {
    numero: '01',
    titulo: 'Describe tus tablas',
    texto:
      'Abre el editor y declara cada Tabla con sus columnas, llaves primarias y foráneas. La sintaxis se siente natural si hablas español.',
  },
  {
    numero: '02',
    titulo: 'Validamos al instante',
    texto:
      'El analizador procesa cada tecla. Los errores aparecen subrayados en el editor con explicaciones claras y la línea exacta del problema.',
  },
  {
    numero: '03',
    titulo: 'Exporta o comparte',
    texto:
      'Genera SQL listo para tu motor favorito o descarga el diagrama como imagen. También puedes copiar el código para versionarlo en Git.',
  },
];

export function SeccionComoFunciona() {
  return (
    <Box component="section" py={96} id="como-funciona">
      <Container size="lg">
        <Stack align="center" mb="xl" gap="xs" ta="center">
          <Title order={2} style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', letterSpacing: '-0.02em' }}>
            Tres pasos del bloc al diagrama
          </Title>
          <Text c="dimmed" size="lg" maw={600}>
            Sin instalación. Sin cuenta. Sin pasos intermedios.
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
          {PASOS.map((p) => (
            <Stack key={p.numero} gap="sm">
              <Group gap="md" align="center">
                <Box
                  style={{
                    fontSize: 42,
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #74c0fc, #b197fc)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    lineHeight: 1,
                    fontFamily:
                      '"JetBrains Mono", "Fira Code", Consolas, monospace',
                  }}
                >
                  {p.numero}
                </Box>
                <Box style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              </Group>
              <Title order={3} size="h4">
                {p.titulo}
              </Title>
              <Text c="dimmed" size="md" style={{ lineHeight: 1.6 }}>
                {p.texto}
              </Text>
            </Stack>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
