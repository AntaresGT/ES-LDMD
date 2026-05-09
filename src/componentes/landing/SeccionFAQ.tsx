/**
 * @archivo SeccionFAQ.tsx
 * @descripcion Acordeón con preguntas frecuentes.
 */
'use client';

import { Box, Container, Title, Text, Stack, Accordion } from '@mantine/core';

const PREGUNTAS = [
  {
    valor: 'gratis',
    pregunta: '¿Es gratis?',
    respuesta:
      'Sí. es-ldmd es gratuito y se ejecuta enteramente en tu navegador. No necesitas crear una cuenta ni introducir datos de pago.',
  },
  {
    valor: 'datos',
    pregunta: '¿Mis datos se envían a algún servidor?',
    respuesta:
      'No. Los esquemas que escribes viven en el almacenamiento local de tu navegador. El asistente de IA opcional descarga un modelo la primera vez y luego se ejecuta en tu equipo, sin enviar tus textos a ningún servicio externo.',
  },
  {
    valor: 'offline',
    pregunta: '¿Funciona sin conexión?',
    respuesta:
      'Tras la primera carga, la aplicación queda cacheada y puedes seguir trabajando sin conexión. Solo necesitas internet para la carga inicial y para descargar el modelo de IA si decides usarlo.',
  },
  {
    valor: 'sql',
    pregunta: '¿Qué SQL se genera?',
    respuesta:
      'Por defecto se genera SQL estándar compatible con PostgreSQL y MySQL. Las cláusulas de claves foráneas con eliminación o actualización en cascada se traducen a sus equivalentes nativos.',
  },
  {
    valor: 'aula',
    pregunta: '¿Puedo usarlo en mi clase o curso?',
    respuesta:
      'Por supuesto. Es una herramienta pensada también para entornos educativos. Puedes compartir el enlace de la aplicación con tus estudiantes y asignar ejercicios usando la sintaxis del lenguaje.',
  },
  {
    valor: 'errores',
    pregunta: '¿Cómo reporto un error o sugerencia?',
    respuesta:
      'Puedes contactar a través de los canales indicados en la página "Acerca de". Cualquier comentario sobre el lenguaje, el editor o la documentación es bienvenido.',
  },
];

export function SeccionFAQ() {
  return (
    <Box
      component="section"
      py={96}
      style={{
        backgroundColor: 'rgba(255,255,255,0.015)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
      id="faq"
    >
      <Container size="md">
        <Stack align="center" mb="xl" gap="xs" ta="center">
          <Title order={2} style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', letterSpacing: '-0.02em' }}>
            Preguntas frecuentes
          </Title>
          <Text c="dimmed" size="lg">
            Lo que normalmente nos preguntan antes de empezar.
          </Text>
        </Stack>

        <Accordion
          variant="separated"
          radius="md"
          chevronPosition="right"
          styles={{
            item: {
              backgroundColor: 'rgba(28, 30, 36, 0.6)',
              border: '1px solid rgba(255,255,255,0.06)',
            },
            control: { fontWeight: 600 },
          }}
        >
          {PREGUNTAS.map((p) => (
            <Accordion.Item key={p.valor} value={p.valor}>
              <Accordion.Control>{p.pregunta}</Accordion.Control>
              <Accordion.Panel>
                <Text c="dimmed" style={{ lineHeight: 1.65 }}>
                  {p.respuesta}
                </Text>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Container>
    </Box>
  );
}
