/**
 * @archivo page.tsx (política de cookies)
 * @descripcion Información en español sobre cookies y almacenamiento relacionado con AdSense y la app.
 */
'use client';

import {
  Anchor,
  Box,
  Container,
  List,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import Link from 'next/link';
import { EnlacesLegalesPie } from '@/componentes/legal/EnlacesLegalesPie';

export default function PaginaPoliticaCookies() {
  return (
    <Box style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Container component="main" size="md" py="xl" style={{ flex: 1 }}>
        <Stack gap="md">
          <Title order={1}>Política de cookies</Title>
          <Text c="dimmed" size="sm">
            Última actualización: abril de 2026.
          </Text>

          <Text>
            Esta página explica cómo <strong>es-ldmd</strong> y terceros asociados pueden usar
            cookies y tecnologías similares cuando visitas{' '}
            <Anchor href="https://es-ldmd.com/" target="_blank" rel="noopener noreferrer">
              es-ldmd.com
            </Anchor>
            .
          </Text>

          <Title order={2}>¿Qué son las cookies?</Title>
          <Text>
            Las cookies son pequeños archivos que el sitio o un tercero guarda en tu navegador. Sirven
            para recordar preferencias, mantener sesiones, medir audiencias o mostrar publicidad de
            forma acorde a la normativa de tu región.
          </Text>

          <Title order={2}>Tipos de uso en este sitio</Title>
          <List spacing="xs">
            <List.Item>
              <strong>Funcionamiento de la aplicación (local):</strong> la herramienta puede usar{' '}
              <code>localStorage</code> u orígenes similares del navegador para guardar tus proyectos,
              preferencias de interfaz (p. ej. tema) y datos de trabajo. No sustituyen a las cookies
              de terceros, pero cumplen una función parecida desde el punto de vista de almacenamiento
              en el dispositivo.
            </List.Item>
            <List.Item>
              <strong>Publicidad (Google AdSense):</strong> Google y sus socios pueden establecer o
              leer cookies u otros identificadores para servir y medir anuncios, limitar la
              frecuencia, combatir el fraude y personalizar contenidos cuando la ley y tu
              consentimiento u opt-out lo permitan.
            </List.Item>
            <List.Item>
              <strong>Modo de consentimiento de Google (Consent Mode v2):</strong> el sitio envía
              señales sobre el uso de almacenamiento publicitario y analítico para adaptar el
              comportamiento de las etiquetas de Google a tus elecciones.
            </List.Item>
          </List>

          <Title order={2}>Resumen orientativo de cookies de terceros (AdSense)</Title>
          <Text size="sm" c="dimmed">
            Los nombres exactos y la duración pueden variar; consulta las herramientas de tu
            navegador o la documentación de Google para el detalle técnico actualizado.
          </Text>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Finalidad</Table.Th>
                <Table.Th>Descripción breve</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td>Publicidad y medición</Table.Td>
                <Table.Td>
                  Cookies o identificadores utilizados por Google y socios para mostrar anuncios,
                  medir impresiones y clics, y modelos de atribución.
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Preferencias del usuario</Table.Td>
                <Table.Td>
                  Registro de tu consentimiento u opt-out respecto a publicidad personalizada u otras
                  opciones gestionadas mediante el mensaje de privacidad de Google.
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Seguridad y prevención de abuso</Table.Td>
                <Table.Td>
                  Datos técnicos para proteger el servicio frente a fraude o usos indebidos.
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>

          <Title order={2}>Cómo gestionar o eliminar cookies</Title>
          <List spacing="xs">
            <List.Item>
              Usa la opción «Preferencias de privacidad y anuncios» en el pie de página para abrir el
              mensaje de Google cuando esté disponible.
            </List.Item>
            <List.Item>
              Configura tu navegador para bloquear o borrar cookies (consulta la ayuda de Chrome,
              Firefox, Safari, Edge, etc.).
            </List.Item>
            <List.Item>
              Activa señales como <strong>GPC</strong> si deseas enviar una solicitud de opt-out
              reconocida en determinadas jurisdicciones de EE. UU.
            </List.Item>
          </List>

          <Title order={2}>Más información</Title>
          <Text>
            Los detalles sobre datos personales y derechos legales figuran en la{' '}
            <Anchor component={Link} href="/politica-privacidad">
              política de privacidad
            </Anchor>
            .
          </Text>

          <Anchor component={Link} href="/" size="sm" mt="md">
            Volver al editor
          </Anchor>
        </Stack>
      </Container>
      <EnlacesLegalesPie />
    </Box>
  );
}
