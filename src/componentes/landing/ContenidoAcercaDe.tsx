/**
 * @archivo ContenidoAcercaDe.tsx
 * @descripcion Cuerpo (cliente) de la página /acerca-de.
 * Se separa del page.tsx para mantener la metadata en un server component.
 */
'use client';

import Link from 'next/link';
import {
  Box,
  Container,
  Title,
  Text,
  Stack,
  Anchor,
  Group,
  List,
  ThemeIcon,
} from '@mantine/core';
import { TbCheck } from 'react-icons/tb';
import { EncabezadoLanding } from './EncabezadoLanding';
import { PieLanding } from './PieLanding';
import { AnuncioHorizontal } from '@/componentes/anuncios/AnuncioHorizontal';

export function ContenidoAcercaDe() {
  return (
    <Box style={{ backgroundColor: '#0e0f12', color: 'var(--mantine-color-text)', minHeight: '100vh' }}>
      <EncabezadoLanding />

      <Box
        component="section"
        style={{
          paddingTop: 80,
          paddingBottom: 32,
          background:
            'radial-gradient(ellipse at 30% 0%, rgba(77,171,247,0.14), transparent 60%), radial-gradient(ellipse at 80% 30%, rgba(151,117,250,0.14), transparent 55%)',
        }}
      >
        <Container size="md">
          <Stack gap="md">
            <Text c="azul.4" fw={600} size="sm" style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Acerca del proyecto
            </Text>
            <Title order={1} style={{ fontSize: 'clamp(2rem, 4.5vw, 3.4rem)', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
              Una herramienta hecha para pensar en español.
            </Title>
            <Text size="xl" c="dimmed" style={{ lineHeight: 1.55, maxWidth: 680 }}>
              es-ldmd nace de una observación cotidiana: la mayoría de herramientas
              técnicas asumen que pensamos en inglés. Este proyecto propone lo
              contrario.
            </Text>
          </Stack>
        </Container>
      </Box>

      <Container size="md" py={60}>
        <Stack gap="xl">
          <section>
            <Title order={2} mb="md" style={{ letterSpacing: '-0.02em' }}>
              La motivación
            </Title>
            <Stack gap="md">
              <Text size="lg" c="dimmed" style={{ lineHeight: 1.7 }}>
                Diseñar el esquema de una base de datos es una tarea profundamente
                cognitiva: nombras entidades, defines reglas, modelas relaciones del
                mundo real. Hacerlo en un idioma que no es el tuyo añade una capa
                innecesaria de traducción mental que cuesta tiempo y, peor aún,
                claridad.
              </Text>
              <Text size="lg" c="dimmed" style={{ lineHeight: 1.7 }}>
                Existen lenguajes de modelado excelentes en inglés. Pero en aulas de
                ingeniería en universidades de Latinoamérica y España, en equipos
                pequeños que documentan APIs en español, en proyectos donde el
                negocio habla en castellano, esa fricción se acumula. <strong>es-ldmd</strong>{' '}
                es un experimento sencillo: ofrecer una sintaxis que se lea como
                pseudocódigo natural en español, sin renunciar al rigor de un
                lenguaje formal con análisis sintáctico y semántico.
              </Text>
            </Stack>
          </section>

          <section>
            <Title order={2} mb="md" style={{ letterSpacing: '-0.02em' }}>
              Filosofía local-first
            </Title>
            <Stack gap="md">
              <Text size="lg" c="dimmed" style={{ lineHeight: 1.7 }}>
                Cada decisión técnica del proyecto sigue un principio: tus datos
                son tuyos. No hay servidor que almacene tus esquemas. No hay base
                de datos remota a la que enviar tus modelos. El editor vive en tu
                navegador, persiste en <code>localStorage</code> y, si decides usar
                el asistente de IA, el modelo se descarga una sola vez y se ejecuta
                con WebGPU dentro de tu propio equipo.
              </Text>
              <Text size="lg" c="dimmed" style={{ lineHeight: 1.7 }}>
                Esto tiene implicaciones agradables: la herramienta sigue
                funcionando sin conexión, no depende de la disponibilidad de un
                servidor externo y no recolecta tus contenidos para entrenar nada.
                Los anuncios que pueda mostrar el sitio (Google AdSense, configurado
                con Consent Mode v2) son la única manera de sostener los costes de
                hosting sin pedirte una cuenta.
              </Text>
            </Stack>
          </section>

          <section>
            <Title order={2} mb="md" style={{ letterSpacing: '-0.02em' }}>
              Qué incluye hoy
            </Title>
            <List
              spacing="sm"
              size="md"
              icon={
                <ThemeIcon color="azul" size={22} radius="xl">
                  <TbCheck size={14} />
                </ThemeIcon>
              }
            >
              <List.Item>Editor con resaltado de sintaxis basado en Monaco.</List.Item>
              <List.Item>Analizador léxico, sintáctico y semántico con mensajes en español.</List.Item>
              <List.Item>Renderizado en tiempo real del diagrama entidad-relación.</List.Item>
              <List.Item>Exportación a SQL (PostgreSQL/MySQL) e imagen del diagrama.</List.Item>
              <List.Item>Asistente de IA opcional con WebLLM ejecutado en navegador.</List.Item>
              <List.Item>Persistencia automática en almacenamiento local.</List.Item>
            </List>
          </section>

          <section>
            <Title order={2} mb="md" style={{ letterSpacing: '-0.02em' }}>
              Stack tecnológico
            </Title>
            <Text size="lg" c="dimmed" style={{ lineHeight: 1.7 }}>
              El proyecto está construido con Next.js 16, React 19 y Mantine 8 para
              la interfaz; Monaco como editor; WebLLM para la inferencia de IA en el
              navegador; y un parser hecho a mano en TypeScript sin librerías
              externas para mantener el control total sobre los mensajes de error.
              Vitest cubre las pruebas y el despliegue corre sobre Docker en una
              infraestructura sencilla.
            </Text>
          </section>

          <section>
            <Title order={2} mb="md" style={{ letterSpacing: '-0.02em' }}>
              ¿Cómo contribuir?
            </Title>
            <Text size="lg" c="dimmed" style={{ lineHeight: 1.7 }}>
              Cualquier comentario, reporte de error o sugerencia de palabra del
              lenguaje es valioso. Si encuentras una inconsistencia en la
              traducción, una expresión que se sentiría más natural de otra forma,
              o detectas un fallo en la generación de SQL, queremos saberlo. La
              forma más rápida es escribir desde la página de{' '}
              <Anchor component={Link} href="/documentacion">documentación</Anchor>{' '}
              o seguir las indicaciones del repositorio del proyecto.
            </Text>
          </section>

          <section>
            <Group justify="center" mt="xl">
              <Anchor
                component={Link}
                href="/aplicacion"
                fw={600}
                style={{ fontSize: 18 }}
              >
                Probar la aplicación →
              </Anchor>
            </Group>
          </section>
        </Stack>
      </Container>

      {/* Banner de anuncio horizontal en el pie de la página (no intrusivo) */}
      <Container size="md" pb="md">
        <Box style={{ display: 'flex', justifyContent: 'center' }}>
          <AnuncioHorizontal />
        </Box>
      </Container>

      <PieLanding />
    </Box>
  );
}
