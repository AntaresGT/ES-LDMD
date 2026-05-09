'use client';

/**
 * @archivo SeccionCasosUso.tsx
 * @descripcion Casos de uso de es-ldmd con texto descriptivo.
 */
import { Box, Container, Title, Text, SimpleGrid, Stack, Group, ThemeIcon } from '@mantine/core';
import { TbSchool, TbUsers, TbBolt, TbBook2 } from 'react-icons/tb';

const CASOS = [
  {
    icono: TbSchool,
    titulo: 'Estudiantes y docentes',
    texto:
      'Resuelve prácticas de bases de datos sin tener que traducir palabras técnicas. Profesores pueden compartir esquemas que se leen como un enunciado.',
  },
  {
    icono: TbUsers,
    titulo: 'Equipos hispanohablantes',
    texto:
      'Documentación de modelos que cualquier persona del equipo puede leer y editar, incluyendo perfiles no técnicos como producto o negocio.',
  },
  {
    icono: TbBolt,
    titulo: 'Prototipos rápidos',
    texto:
      'Pasa de una idea a un esquema visual y a un script SQL ejecutable en minutos, sin abrir una herramienta pesada de modelado.',
  },
  {
    icono: TbBook2,
    titulo: 'Documentación viva',
    texto:
      'Versiona el archivo .es-ldmd en Git: el modelo es texto plano, así que las revisiones de código muestran exactamente qué cambió.',
  },
];

export function SeccionCasosUso() {
  return (
    <Box component="section" py={96} id="casos-uso">
      <Container size="lg">
        <Stack align="center" mb="xl" gap="xs" ta="center">
          <Title order={2} style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', letterSpacing: '-0.02em' }}>
            Pensado para personas reales
          </Title>
          <Text c="dimmed" size="lg" maw={620}>
            es-ldmd no intenta ser todo para todos. Está enfocado en quienes
            necesitan modelar datos en español con la menor fricción posible.
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          {CASOS.map((c) => {
            const Icono = c.icono;
            return (
              <Group key={c.titulo} align="flex-start" gap="md" wrap="nowrap">
                <ThemeIcon
                  size={44}
                  radius="md"
                  variant="light"
                  color="azul"
                  style={{ flexShrink: 0 }}
                >
                  <Icono size={24} />
                </ThemeIcon>
                <Stack gap={4}>
                  <Title order={3} size="h5">
                    {c.titulo}
                  </Title>
                  <Text c="dimmed" size="sm" style={{ lineHeight: 1.6 }}>
                    {c.texto}
                  </Text>
                </Stack>
              </Group>
            );
          })}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
