/**
 * @archivo page.tsx (política de cookies)
 * @descripcion Información en español sobre cookies y almacenamiento relacionado con AdSense y la app.
 */
import type { Metadata } from 'next';
import {
  Anchor,
  Box,
  Container,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import Link from 'next/link';
import { EnlacesLegalesPie } from '@/componentes/legal/EnlacesLegalesPie';

const TITULO = 'Política de cookies';
const DESCRIPCION =
  'Información detallada sobre el uso de cookies, almacenamiento local del navegador y personalización de anuncios (Google AdSense) en es-ldmd.';

export const metadata: Metadata = {
  title: `${TITULO} | es-ldmd`,
  description: DESCRIPCION,
  alternates: { canonical: 'https://es-ldmd.com/politica-cookies' },
  openGraph: {
    title: `${TITULO} | es-ldmd`,
    description: DESCRIPCION,
    url: 'https://es-ldmd.com/politica-cookies',
    type: 'article',
    locale: 'es_ES',
    siteName: 'es-ldmd',
    images: [{ url: '/imagen_seo.png', width: 1200, height: 630, alt: 'es-ldmd' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${TITULO} | es-ldmd`,
    description: DESCRIPCION,
    images: ['/imagen_seo.png'],
  },
};

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
          <ul style={{ listStyleType: 'disc', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12, margin: 0, color: 'var(--mantine-color-text)' }}>
            <li style={{ lineHeight: 1.6 }}>
              <strong>Funcionamiento de la aplicación (local):</strong> la herramienta puede usar{' '}
              <code>localStorage</code> u orígenes similares del navegador para guardar tus proyectos,
              preferencias de interfaz (p. ej. tema) y datos de trabajo. No sustituyen a las cookies
              de terceros, pero cumplen una función parecida desde el punto de vista de almacenamiento
              en el dispositivo.
            </li>
            <li style={{ lineHeight: 1.6 }}>
              <strong>Publicidad (Google AdSense):</strong> Google y sus socios pueden establecer o
              leer cookies u otros identificadores para servir y medir anuncios, limitar la
              frecuencia, combatir el fraude y personalizar contenidos cuando la ley y tu
              consentimiento u opt-out lo permitan.
            </li>
            <li style={{ lineHeight: 1.6 }}>
              <strong>Modo de consentimiento de Google (Consent Mode v2):</strong> el sitio envía
              señales sobre el uso de almacenamiento publicitario y analítico para adaptar el
              comportamiento de las etiquetas de Google a tus elecciones.
            </li>
          </ul>

          <Title order={2}>Resumen orientativo de cookies de terceros (AdSense)</Title>
          <Text size="sm" c="dimmed">
            Los nombres exactos y la duración pueden variar; consulta las herramientas de tu
            navegador o la documentación de Google para el detalle técnico actualizado.
          </Text>
          <div style={{ overflowX: 'auto', width: '100%', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'rgba(28, 30, 36, 0.3)', color: 'var(--mantine-color-text)', fontSize: 14 }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(28, 30, 36, 0.7)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Finalidad</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Descripción breve</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>Publicidad y medición</td>
                  <td style={{ padding: '12px 16px', color: 'var(--mantine-color-dimmed)', lineHeight: 1.5 }}>
                    Cookies o identificadores utilizados por Google y socios para mostrar anuncios,
                    medir impresiones y clics, y modelos de atribución.
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>Preferencias del usuario</td>
                  <td style={{ padding: '12px 16px', color: 'var(--mantine-color-dimmed)', lineHeight: 1.5 }}>
                    Registro de tu consentimiento u opt-out respecto a publicidad personalizada u otras
                    opciones gestionadas mediante el mensaje de privacidad de Google.
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>Seguridad y prevención de abuso</td>
                  <td style={{ padding: '12px 16px', color: 'var(--mantine-color-dimmed)', lineHeight: 1.5 }}>
                    Datos técnicos para proteger el servicio frente a fraude o usos indebidos.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <Title order={2}>Cómo gestionar o eliminar cookies</Title>
          <ul style={{ listStyleType: 'disc', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12, margin: 0, color: 'var(--mantine-color-text)' }}>
            <li style={{ lineHeight: 1.6 }}>
              Usa la opción «Preferencias de privacidad y anuncios» en el pie de página para abrir el
              mensaje de Google cuando esté disponible.
            </li>
            <li style={{ lineHeight: 1.6 }}>
              Configura tu navegador para bloquear o borrar cookies (consulta la ayuda de Chrome,
              Firefox, Safari, Edge, etc.).
            </li>
            <li style={{ lineHeight: 1.6 }}>
              Activa señales como <strong>GPC</strong> si deseas enviar una solicitud de opt-out
              reconocida en determinadas jurisdicciones de EE. UU.
            </li>
          </ul>

          <Title order={2}>Más información</Title>
          <Text>
            Los detalles sobre datos personales y derechos legales figuran en la{' '}
            <Link href="/politica-privacidad" passHref legacyBehavior>
              <Anchor>
                política de privacidad
              </Anchor>
            </Link>
            .
          </Text>

          <Link href="/" passHref legacyBehavior>
            <Anchor size="sm" mt="md">
              Volver al editor
            </Anchor>
          </Link>
        </Stack>
      </Container>
      <EnlacesLegalesPie />
    </Box>
  );
}
