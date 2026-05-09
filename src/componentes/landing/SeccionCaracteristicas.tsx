'use client';

/**
 * @archivo SeccionCaracteristicas.tsx
 * @descripcion Grid con las características principales del producto.
 */
import {
  Box,
  Container,
  Title,
  Text,
  SimpleGrid,
  Card,
  ThemeIcon,
  Stack,
} from '@mantine/core';
import {
  TbLanguage,
  TbVectorTriangle,
  TbDatabaseExport,
  TbShieldCheck,
  TbBrain,
  TbDeviceLaptop,
} from 'react-icons/tb';

const CARACTERISTICAS = [
  {
    icono: TbLanguage,
    titulo: 'Lenguaje 100% en español',
    descripcion:
      'Sintaxis pensada para hispanohablantes: Tabla, primaria, foranea, eliminación en cascada. Sin traducciones mentales.',
  },
  {
    icono: TbVectorTriangle,
    titulo: 'Diagrama en tiempo real',
    descripcion:
      'Cada cambio en el editor se refleja al instante en el diagrama entidad-relación, con relaciones y cardinalidades visibles.',
  },
  {
    icono: TbDatabaseExport,
    titulo: 'Exportación a SQL e imagen',
    descripcion:
      'Genera scripts SQL listos para ejecutar o exporta el diagrama como imagen para informes y entregas.',
  },
  {
    icono: TbShieldCheck,
    titulo: 'Validación clara',
    descripcion:
      'Mensajes de error en español con la línea y columna exacta del problema, para que sepas qué corregir y por qué.',
  },
  {
    icono: TbBrain,
    titulo: 'IA local en tu navegador',
    descripcion:
      'Un asistente basado en WebLLM se ejecuta dentro de tu navegador. Tus datos nunca salen de tu equipo.',
  },
  {
    icono: TbDeviceLaptop,
    titulo: 'Funciona sin conexión',
    descripcion:
      'Tras la primera carga, todo se guarda localmente. Sigue trabajando aunque pierdas la conexión a internet.',
  },
];

export function SeccionCaracteristicas() {
  return (
    <Box
      component="section"
      py={96}
      style={{
        backgroundColor: 'rgba(255,255,255,0.015)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
      id="caracteristicas"
    >
      <Container size="lg">
        <Stack align="center" mb="xl" gap="xs" ta="center">
          <Title order={2} style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', letterSpacing: '-0.02em' }}>
            Todo lo que necesitas para modelar
          </Title>
          <Text c="dimmed" size="lg" maw={620}>
            Una herramienta enfocada, sin fricciones, pensada para que pases más
            tiempo diseñando y menos peleándote con el formato.
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {CARACTERISTICAS.map((c) => {
            const Icono = c.icono;
            return (
              <Card
                key={c.titulo}
                radius="lg"
                padding="xl"
                withBorder
                style={{
                  backgroundColor: 'rgba(28, 30, 36, 0.6)',
                  borderColor: 'rgba(255,255,255,0.06)',
                  transition: 'transform 200ms ease, border-color 200ms ease',
                }}
              >
                <ThemeIcon
                  size={48}
                  radius="md"
                  variant="gradient"
                  gradient={{ from: 'azul.6', to: 'violet.6', deg: 135 }}
                  mb="md"
                >
                  <Icono size={26} />
                </ThemeIcon>
                <Title order={3} size="h4" mb="xs">
                  {c.titulo}
                </Title>
                <Text c="dimmed" size="sm" style={{ lineHeight: 1.6 }}>
                  {c.descripcion}
                </Text>
              </Card>
            );
          })}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
