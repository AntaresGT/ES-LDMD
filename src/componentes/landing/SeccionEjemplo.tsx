

/**
 * @archivo SeccionEjemplo.tsx
 * @descripcion Bloque destacado con un ejemplo real del DSL.
 */
import { Box, Container, Title, Text, Stack } from '@mantine/core';
import { BloqueCodigo } from '@/componentes/documentacion/BloqueCodigo';

const EJEMPLO = `Tabla usuarios {
    id entero [incremento]
    nombre texto(100) [no nulo]
    correo texto(255) [no nulo, nota: 'Correo único']
    activo lógico [por_defecto: \`true\`]

    primaria {
        id
    }
}

Tabla pedidos {
    id entero [incremento]
    usuario_id entero [no nulo]
    total decimal [no nulo]
    fecha fecha [no nulo]

    primaria { id }

    foranea {
        usuario_id usuarios(id) [eliminación en cascada]
    }
}

Grupo ventas {
    pedidos
}`;

export function SeccionEjemplo() {
  return (
    <Box
      component="section"
      py={96}
      style={{
        backgroundColor: 'rgba(255,255,255,0.015)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
      id="ejemplo"
    >
      <Container size="lg">
        <Stack align="center" mb="xl" gap="xs" ta="center">
          <Title order={2} style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', letterSpacing: '-0.02em' }}>
            Así se ve el lenguaje
          </Title>
          <Text c="dimmed" size="lg" maw={680}>
            Un fragmento real que define dos tablas relacionadas y las agrupa.
            Todo en español, sin sorpresas.
          </Text>
        </Stack>

        <Box
          style={{
            position: 'relative',
            maxWidth: 800,
            margin: '0 auto',
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow:
              '0 30px 80px -20px rgba(77, 171, 247, 0.18), 0 10px 40px -10px rgba(151, 117, 250, 0.18)',
            background:
              'linear-gradient(180deg, rgba(28,30,36,0.95), rgba(20,21,25,0.95))',
          }}
        >
          <Box
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontFamily:
                '"JetBrains Mono", "Fira Code", Consolas, monospace',
              fontSize: 12,
              color: 'var(--mantine-color-dimmed)',
            }}
          >
            <Box style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
            <Box style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
            <Box style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
            <Box ml="sm">esquema.es-ldmd</Box>
          </Box>
          <BloqueCodigo codigo={EJEMPLO} />
        </Box>
      </Container>
    </Box>
  );
}
