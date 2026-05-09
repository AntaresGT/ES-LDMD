'use client';

/**
 * @archivo SeccionQueEs.tsx
 * @descripcion Sección descriptiva del proyecto, contenido textual sustancial.
 */
import { Box, Container, Title, Text, Stack } from '@mantine/core';

export function SeccionQueEs() {
  return (
    <Box component="section" py={96} id="que-es">
      <Container size="md">
        <Stack gap="md">
          <Title order={2} style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', letterSpacing: '-0.02em' }}>
            ¿Qué es es-ldmd?
          </Title>

          <Text size="lg" c="dimmed" style={{ lineHeight: 1.7 }}>
            <strong>es-ldmd</strong> (Español — Lenguaje de Modelado de Diagramas) nació de
            una idea sencilla: la mayoría de herramientas para diseñar bases de datos
            obligan a aprender una sintaxis en inglés, llena de palabras como{' '}
            <em>table</em>, <em>references</em> o <em>cascade</em>. Esa fricción puede
            parecer pequeña, pero en aulas universitarias, equipos hispanohablantes y
            documentaciones técnicas se traduce en errores, malentendidos y horas
            perdidas.
          </Text>

          <Text size="lg" c="dimmed" style={{ lineHeight: 1.7 }}>
            Por eso construimos un lenguaje de modelado completamente en español. Al
            escribir <code>Tabla usuarios</code>, <code>primaria</code>, <code>foranea</code>{' '}
            o <code>eliminación en cascada</code>, expresas exactamente lo que tienes en
            la cabeza, en el idioma en el que piensas. El editor analiza el código en
            tiempo real, lo valida con mensajes claros también en español y dibuja un
            diagrama entidad-relación que actualiza al instante.
          </Text>

          <Text size="lg" c="dimmed" style={{ lineHeight: 1.7 }}>
            Cuando termines, exportas el resultado como <strong>script SQL</strong> listo
            para ejecutar o como <strong>imagen</strong> para tu informe, presentación o
            entrega. Y si te bloqueas, un asistente de IA que se descarga y ejecuta{' '}
            <strong>dentro de tu propio navegador</strong> puede ayudarte a generar
            modelos a partir de descripciones en lenguaje natural — sin enviar tus datos
            a ningún servidor.
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}
