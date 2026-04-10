/**
 * @archivo page.tsx (política de privacidad)
 * @descripcion Texto informativo en español (RGPD, CCPA/CPRA, AdSense). Revise y adapte con asesoramiento legal.
 */
'use client';

import {
  Anchor,
  Box,
  Container,
  List,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import Link from 'next/link';
import { EnlacesLegalesPie } from '@/componentes/legal/EnlacesLegalesPie';

/** Sustituye por el correo de contacto real del responsable del tratamiento. */
const CORREO_CONTACTO_DATOS = 'contacto@es-ldmd.com';

export default function PaginaPoliticaPrivacidad() {
  return (
    <Box style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Container component="main" size="md" py="xl" style={{ flex: 1 }}>
        <Stack gap="md">
          <Title order={1}>Política de privacidad</Title>
          <Text c="dimmed" size="sm">
            Última actualización: abril de 2026. Sitio:{' '}
            <Anchor href="https://es-ldmd.com/" target="_blank" rel="noopener noreferrer">
              es-ldmd.com
            </Anchor>
          </Text>

          <Text>
            Esta política describe cómo se trata la información cuando utilizas la aplicación web{' '}
            <strong>es-ldmd</strong> (editor de diagramas entidad-relación). El sitio puede mostrar
            publicidad mediante <strong>Google AdSense</strong> y utilizar tecnologías de cookies o
            almacenamiento local según tu región y tus elecciones.
          </Text>

          <Title order={2}>Responsable del tratamiento</Title>
          <Text>
            El responsable del tratamiento de los datos obtenidos a través de este sitio es quien
            opera el dominio y la aplicación. Para consultas sobre privacidad y ejercicio de
            derechos puedes escribir a:{' '}
            <Anchor href={`mailto:${CORREO_CONTACTO_DATOS}`}>{CORREO_CONTACTO_DATOS}</Anchor>.
          </Text>

          <Title order={2}>Datos que podemos tratar</Title>
          <List spacing="xs">
            <List.Item>
              <strong>Datos técnicos y de uso:</strong> por ejemplo dirección IP aproximada, tipo de
              navegador, idioma, páginas visitadas y eventos de interacción, que suelen procesar
              terceros (p. ej. Google) cuando se muestran anuncios o se cargan scripts asociados.
            </List.Item>
            <List.Item>
              <strong>Datos almacenados en tu dispositivo:</strong> la aplicación puede usar
              almacenamiento local del navegador para guardar tus archivos y preferencias (p. ej.
              tema claro/oscuro). Estos datos no se envían automáticamente a nuestros servidores
              salvo que en el futuro se indique lo contrario de forma explícita.
            </List.Item>
            <List.Item>
              <strong>Contenido que introduces:</strong> el código y modelos que escribes se
              procesan en tu navegador para generar el diagrama; no los almacenamos en servidores
              propios salvo funciones futuras que se anuncien por separado.
            </List.Item>
          </List>

          <Title order={2}>Google AdSense y socios publicitarios</Title>
          <Text>
            Utilizamos Google AdSense para mostrar anuncios. Google y sus socios pueden usar
            cookies u otras tecnologías para mostrar anuncios personalizados o limitados, medir el
            rendimiento y combatir el fraude, según la configuración de tu cuenta y las leyes
            aplicables. Puedes consultar cómo Google usa la información en la política de privacidad
            de Google y en la información que facilita el propio anuncio o el centro de
            transparencia de Google.
          </Text>
          <Text>
            En el Espacio Económico Europeo, Reino Unido y Suiza, la publicidad personalizada
            habitualmente requiere tu consentimiento previo. En determinados estados de Estados
            Unidos pueden aplicarse derechos de opt-out respecto a la «venta» o «compartición» de
            datos personales y a la publicidad dirigida.
          </Text>

          <Title order={2}>Base legal (RGPD / Reino Unido / Suiza)</Title>
          <Text>
            Cuando corresponda: <strong>consentimiento</strong> para cookies y tratamientos
            publicitarios no esenciales; <strong>interés legítimo</strong> para medidas de
            seguridad básicas, estadísticas agregadas cuando esté permitido sin consentimiento, y
            cumplimiento de obligaciones legales.
          </Text>

          <Title order={2}>Derechos en el Espacio Económico Europeo y Reino Unido</Title>
          <List spacing="xs">
            <List.Item>Acceder a tus datos personales.</List.Item>
            <List.Item>Rectificar datos inexactos.</List.Item>
            <List.Item>Solicitar la supresión («derecho al olvido») cuando proceda.</List.Item>
            <List.Item>Limitar u oponerte a determinados tratamientos.</List.Item>
            <List.Item>Portabilidad de los datos que nos hayas facilitado directamente, cuando aplique.</List.Item>
            <List.Item>
              Retirar el consentimiento en cualquier momento sin afectar la licitud del tratamiento
              previo.
            </List.Item>
            <List.Item>
              Presentar una reclamación ante una autoridad de protección de datos (en España, la
              AEPD).
            </List.Item>
          </List>

          <Title order={2}>Derechos en California y otros estados de EE. UU.</Title>
          <Text>
            Si la ley de tu estado aplica, puedes tener derecho a conocer qué datos personales se
            tratan, a solicitar su corrección o eliminación, y a optar por no participar en la
            «venta» o «compartición» de datos personales para publicidad dirigida. No discriminaremos
            por el ejercicio de estos derechos, salvo excepciones legales.
          </Text>
          <Text>
            Si tu navegador envía la señal de <strong>Control de privacidad global (GPC)</strong>,
            la trataremos como solicitud de opt-out aplicable según las leyes que lo reconozcan.
          </Text>

          <Title order={2}>Conservación</Title>
          <Text>
            Los plazos de conservación dependen del tipo de dato y del proveedor (p. ej. Google).
            Conservaremos la información mínima necesaria el tiempo imprescindible para las
            finalidades descritas y para cumplir obligaciones legales.
          </Text>

          <Title order={2}>Transferencias internacionales</Title>
          <Text>
            Proveedores como Google pueden tratar datos en servidores fuera de tu país. Cuando
            corresponda, se aplican garantías adecuadas (por ejemplo cláusulas contractuales tipo
            u otras medidas reconocidas por la normativa).
          </Text>

          <Title order={2}>Menores</Title>
          <Text>
            El servicio no está dirigido a menores de 16 años (o la edad que exija tu jurisdicción).
            Si eres padre, madre o tutor y crees que hemos recopilado datos de un menor, contáctanos.
          </Text>

          <Title order={2}>Cambios en esta política</Title>
          <Text>
            Podemos actualizar este texto para reflejar cambios legales o en el servicio. La fecha
            de «última actualización» indicará la revisión más reciente.
          </Text>

          <Title order={2}>Gestionar preferencias de anuncios y cookies</Title>
          <Text>
            Puedes abrir el cuadro de preferencias de privacidad y anuncios de Google desde el enlace
            «Preferencias de privacidad y anuncios» en el pie de página (cuando el mensaje de
            Privacidad y mensajes de AdSense esté publicado y activo).
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
