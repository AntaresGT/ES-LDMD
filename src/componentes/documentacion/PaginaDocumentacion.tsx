'use client';

import {
  AppShell,
  Title,
  Text,
  Table,
  Code,
  List,
  Group,
  ActionIcon,
  Tooltip,
  Box,
  Anchor,
  Divider,
  Badge,
  ScrollArea,
  Burger,
  ThemeIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Link from 'next/link';
import {
  VscHome,
  VscSymbolKeyword,
  VscTable,
  VscCode,
  VscExport,
  VscFile,
  VscComment,
  VscInfo,
  VscKey,
  VscDatabase,
  VscListTree,
  VscTypeHierarchySub,
} from 'react-icons/vsc';
import { IoSunnyOutline, IoMoonOutline } from 'react-icons/io5';
import { UsarTema } from '@/hooks/UsarTema';
import { VERSION_APLICACION } from '@/dominio/constantes';
import { BloqueCodigo } from '@/componentes/documentacion/BloqueCodigo';
import { useState, useEffect, type ReactNode } from 'react';

/* ─── Secciones ─── */

interface SeccionNav {
  id: string;
  titulo: string;
  icono: ReactNode;
}

const SECCIONES: SeccionNav[] = [
  { id: 'introduccion', titulo: 'Introducción', icono: <VscInfo size={16} /> },
  { id: 'interfaz', titulo: 'Interfaz de Usuario', icono: <VscListTree size={16} /> },
  { id: 'lenguaje', titulo: 'Lenguaje es-ldmd', icono: <VscSymbolKeyword size={16} /> },
  { id: 'tablas', titulo: 'Definir Tablas', icono: <VscTable size={16} /> },
  { id: 'tipos', titulo: 'Tipos de Datos', icono: <VscDatabase size={16} /> },
  { id: 'opciones', titulo: 'Opciones de Columna', icono: <VscCode size={16} /> },
  { id: 'primaria', titulo: 'Llaves Primarias', icono: <VscKey size={16} /> },
  { id: 'indices', titulo: 'Índices', icono: <VscListTree size={16} /> },
  { id: 'foraneas', titulo: 'Llaves Foráneas', icono: <VscTypeHierarchySub size={16} /> },
  { id: 'notas', titulo: 'Notas de Tabla', icono: <VscComment size={16} /> },
  { id: 'grupos', titulo: 'Grupos', icono: <VscListTree size={16} /> },
  { id: 'comentarios', titulo: 'Comentarios', icono: <VscComment size={16} /> },
  { id: 'conversion-sql', titulo: 'Conversión a SQL', icono: <VscExport size={16} /> },
  { id: 'exportacion', titulo: 'Exportación', icono: <VscExport size={16} /> },
  { id: 'archivos', titulo: 'Gestión de Archivos', icono: <VscFile size={16} /> },
  { id: 'chat-ia', titulo: 'Chat IA', icono: <VscComment size={16} /> },
];

/* ─── Componente auxiliar ─── */

function SeccionDocumento({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <Box id={id} component="section" mb="xl" style={{ scrollMarginTop: 80 }}>
      <Title order={2} mb="md">{titulo}</Title>
      {children}
    </Box>
  );
}

function SubSeccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Box mb="lg">
      <Title order={3} mb="sm" size="h4">{titulo}</Title>
      {children}
    </Box>
  );
}

/* ─── Componente principal ─── */

export function PaginaDocumentacion() {
  'use no memo';
  const { es_oscuro, alternar_tema } = UsarTema();
  const [abierto, { toggle: alternarNav, close: cerrarNav }] = useDisclosure();
  const [montado, fijarMontado] = useState(false);
  useEffect(() => { fijarMontado(true); }, []);

  const navegarSeccion = (id: string) => {
    cerrarNav();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !abierto } }}
      padding="md"
    >
      {/* ─── Header ─── */}
      <AppShell.Header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
        }}
      >
        <Burger opened={abierto} onClick={alternarNav} hiddenFrom="sm" size="sm" aria-label="Alternar navegación" />

        <Text fw={700} size="sm" c="azul" style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}>
          es-ldmd
        </Text>
        <Badge variant="light" color="azul" size="xs">docs</Badge>

        <Title order={4} size="h5" style={{ flex: 1 }} visibleFrom="sm">
          Documentación
        </Title>

        <Group gap="sm" style={{ marginLeft: 'auto' }}>
          <Tooltip label={es_oscuro ? 'Modo claro' : 'Modo oscuro'} withArrow>
            <ActionIcon variant="subtle" color="gray" onClick={alternar_tema} aria-label="Alternar tema">
              {montado && (es_oscuro ? <IoSunnyOutline size={18} /> : <IoMoonOutline size={18} />)}
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Volver al editor" withArrow>
            <ActionIcon
              variant="subtle"
              color="azul"
              component={Link}
              href="/"
              aria-label="Volver al editor"
            >
              <VscHome size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </AppShell.Header>

      {/* ─── Sidebar ─── */}
      <AppShell.Navbar p="md">
        <AppShell.Section grow component={ScrollArea} scrollbarSize={6}>
          <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="sm">Contenido</Text>
          {SECCIONES.map((s) => (
            <Anchor
              key={s.id}
              component="button"
              size="sm"
              c="var(--mantine-color-text)"
              onClick={() => navegarSeccion(s.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                borderRadius: 6,
                width: '100%',
                textAlign: 'left',
                textDecoration: 'none',
              }}
              styles={{
                root: {
                  '&:hover': {
                    backgroundColor: 'var(--mantine-color-default-hover)',
                  },
                },
              }}
            >
              <ThemeIcon variant="light" color="azul" size="sm">{s.icono}</ThemeIcon>
              {s.titulo}
            </Anchor>
          ))}
        </AppShell.Section>
        <AppShell.Section>
          <Divider my="sm" />
          <Text size="xs" c="dimmed" ta="center">v{VERSION_APLICACION}</Text>
        </AppShell.Section>
      </AppShell.Navbar>

      {/* ─── Contenido ─── */}
      <AppShell.Main>
        <Box maw={860} mx="auto">
          {/* ── Introducción ── */}
          <SeccionDocumento id="introduccion" titulo="Introducción">
            <Text mb="sm">
              <strong>es-ldmd</strong> (Español — Lenguaje de Modelado de Diagramas) es una herramienta web profesional
              para crear <strong>diagramas de entidad-relación (ER)</strong> utilizando un lenguaje de modelado
              específico de dominio escrito en español.
            </Text>
            <Text mb="sm">
              Está diseñada como una alternativa a herramientas como dbdiagram.io, con una interfaz moderna
              que incluye un editor de código con resaltado de sintaxis, una vista previa del diagrama en
              tiempo real y un panel de herramientas con validación de errores y asistente de IA local.
            </Text>
            <Text mb="sm">
              La aplicación se compone de <strong>3 paneles principales</strong> redimensionables:
            </Text>
            <List spacing="xs">
              <List.Item><strong>Editor de código</strong> — Donde escribes tu modelo en lenguaje es-ldmd</List.Item>
              <List.Item><strong>Vista de diagrama</strong> — Renderizado visual en tiempo real de las tablas y sus relaciones</List.Item>
              <List.Item><strong>Panel de herramientas</strong> — Lista de errores, chat IA y panel de exportación</List.Item>
            </List>

            <Code block mt="md" style={{ whiteSpace: 'pre', fontFamily: 'var(--mantine-font-family-monospace)' }}>{`┌─────────────────────────────────────────────────────┐
│            BARRA DE HERRAMIENTAS                    │
├───────────────┬────────────────┬─────────────────────┤
│               │                │                     │
│    EDITOR     │   DIAGRAMA     │   HERRAMIENTAS      │
│    CÓDIGO     │    CANVAS      │   + ERRORES         │
│   (Monaco)    │  (2D Render)   │   + CHAT IA         │
│               │                │   + EXPORTACIÓN     │
│               │                │                     │
└───────────────┴────────────────┴─────────────────────┘`}</Code>
          </SeccionDocumento>

          <Divider my="xl" />

          {/* ── Interfaz de Usuario ── */}
          <SeccionDocumento id="interfaz" titulo="Interfaz de Usuario">
            <SubSeccion titulo="Barra de Herramientas">
              <Text mb="sm">
                La barra de herramientas se ubica en la parte superior y proporciona acceso rápido a
                todas las acciones principales. Cada botón tiene un atajo de teclado asociado:
              </Text>
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Acción</Table.Th>
                    <Table.Th>Atajo</Table.Th>
                    <Table.Th>Descripción</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td>Nuevo</Table.Td>
                    <Table.Td><Code>Ctrl + N</Code></Table.Td>
                    <Table.Td>Crea un nuevo archivo en blanco</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>Guardar</Table.Td>
                    <Table.Td><Code>Ctrl + S</Code></Table.Td>
                    <Table.Td>Guarda el archivo actual en almacenamiento local</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>Borrar contenido</Table.Td>
                    <Table.Td><Code>Ctrl + Shift + D</Code></Table.Td>
                    <Table.Td>Limpia todo el contenido del editor</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>Abrir</Table.Td>
                    <Table.Td><Code>Ctrl + O</Code></Table.Td>
                    <Table.Td>Abre un archivo previamente guardado</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>Exportar</Table.Td>
                    <Table.Td><Code>Ctrl + Shift + E</Code></Table.Td>
                    <Table.Td>Abre el panel de exportación (SQL, imagen)</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>Descargar .esldmd</Table.Td>
                    <Table.Td><Code>Ctrl + E</Code></Table.Td>
                    <Table.Td>Descarga el archivo como .esldmd a tu computadora</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>Importar .esldmd</Table.Td>
                    <Table.Td><Code>Ctrl + Shift + U</Code></Table.Td>
                    <Table.Td>Importa un archivo .esldmd desde tu computadora</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>Alternar tema</Table.Td>
                    <Table.Td><Code>Ctrl + Shift + L</Code></Table.Td>
                    <Table.Td>Cambia entre tema oscuro y claro</Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </SubSeccion>

            <SubSeccion titulo="Editor de Código">
              <Text mb="sm">
                El editor utiliza <strong>Monaco Editor</strong> (el mismo motor de VS Code) y ofrece:
              </Text>
              <List spacing="xs">
                <List.Item><strong>Resaltado de sintaxis</strong> — Colorea las palabras clave, tipos, cadenas y comentarios del lenguaje es-ldmd</List.Item>
                <List.Item><strong>Autocompletado</strong> — Sugiere palabras clave (<Code>Tabla</Code>, <Code>Grupo</Code>), tipos de datos (<Code>entero</Code>, <Code>texto</Code>, etc.) y opciones (<Code>no nulo</Code>, <Code>nota</Code>, etc.)</List.Item>
                <List.Item><strong>Plegado de código</strong> — Permite colapsar bloques delimitados por llaves</List.Item>
                <List.Item><strong>Cierre automático</strong> — Cierra automáticamente llaves, corchetes, paréntesis y comillas</List.Item>
                <List.Item><strong>Navegación desde errores</strong> — Al hacer clic en un error en el panel de errores, el editor se desplaza a la línea y columna correspondiente</List.Item>
              </List>
            </SubSeccion>

            <SubSeccion titulo="Vista de Diagrama">
              <Text mb="sm">
                El diagrama se renderiza en un <strong>Canvas 2D</strong> en tiempo real conforme escribes en el editor.
                Soporta las siguientes interacciones:
              </Text>
              <List spacing="xs">
                <List.Item><strong>Zoom</strong> — Usa la rueda del ratón para acercar o alejar</List.Item>
                <List.Item><strong>Paneo</strong> — Haz clic y arrastra para mover el diagrama</List.Item>
                <List.Item><strong>Layout automático</strong> — 3 algoritmos disponibles:
                  <List spacing={4} mt={4}>
                    <List.Item><Code>Izquierda-derecha</Code> — Dispone las tablas en cadena lineal</List.Item>
                    <List.Item><Code>Copo de nieve</Code> — Disposición radial desde la tabla más conectada</List.Item>
                    <List.Item><Code>Compacto</Code> — Organización densa en forma de rectángulo</List.Item>
                  </List>
                </List.Item>
              </List>
              <Text mt="sm">
                El diagrama muestra iconos especiales en las columnas:
              </Text>
              <List spacing="xs">
                <List.Item><Badge color="yellow" size="xs">PK</Badge> — Llave primaria</List.Item>
                <List.Item><Badge color="red" size="xs">FK</Badge> — Llave foránea</List.Item>
                <List.Item><Badge color="blue" size="xs">NN</Badge> — NOT NULL (no nulo)</List.Item>
              </List>
            </SubSeccion>

            <SubSeccion titulo="Panel de Herramientas">
              <Text mb="sm">
                El panel derecho contiene pestañas con diferentes herramientas:
              </Text>
              <List spacing="xs">
                <List.Item><strong>Errores</strong> — Lista de errores de sintaxis y semánticos detectados en tu código, con nivel de severidad (error, advertencia, información)</List.Item>
                <List.Item><strong>Chat IA</strong> — Asistente de inteligencia artificial local que funciona directamente en el navegador</List.Item>
                <List.Item><strong>Exportación</strong> — Opciones para exportar tu modelo a SQL o como imagen</List.Item>
              </List>
            </SubSeccion>
          </SeccionDocumento>

          <Divider my="xl" />

          {/* ── Lenguaje es-ldmd ── */}
          <SeccionDocumento id="lenguaje" titulo="Lenguaje es-ldmd">
            <Text mb="sm">
              El lenguaje <strong>es-ldmd</strong> te permite definir tablas de base de datos, sus columnas,
              tipos de datos, restricciones, relaciones y agrupaciones usando una sintaxis simple y legible en español.
            </Text>
            <Text mb="sm">
              A continuación se describe cada elemento del lenguaje en detalle con ejemplos prácticos.
            </Text>
          </SeccionDocumento>

          {/* ── Definir Tablas ── */}
          <SeccionDocumento id="tablas" titulo="Definir Tablas">
            <SubSeccion titulo="Tabla simple">
              <Text mb="sm">
                Una tabla se define con la palabra clave <Code>Tabla</Code> seguida del nombre y un bloque
                entre llaves con las columnas:
              </Text>
              <BloqueCodigo codigo={`Tabla usuarios {
    id entero [incremento]
    nombre texto(100) [no nulo]
    email texto(255) [no nulo]
    activo lógico [no nulo]
    creado_en fecha_hora_zona [no nulo]

    primaria {
        id
    }
}`} />
            </SubSeccion>

            <SubSeccion titulo="Tabla con esquema">
              <Text mb="sm">
                Puedes definir tablas dentro de un esquema usando la notación <Code>esquema.nombre_tabla</Code>:
              </Text>
              <BloqueCodigo codigo={`Tabla public.usuarios {
    id entero [incremento]
    nombre texto(100) [no nulo]

    primaria {
        id
    }
}

Tabla ventas.pedidos {
    id entero [incremento]
    total decimal [no nulo]

    primaria {
        id
    }
}`} />
            </SubSeccion>
          </SeccionDocumento>

          <Divider my="xl" />

          {/* ── Tipos de Datos ── */}
          <SeccionDocumento id="tipos" titulo="Tipos de Datos">
            <Text mb="sm">
              El lenguaje es-ldmd soporta los siguientes tipos de datos, que se convierten automáticamente
              al tipo SQL correspondiente al exportar:
            </Text>

            <SubSeccion titulo="Tipos simples">
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Tipo es-ldmd</Table.Th>
                    <Table.Th>Descripción</Table.Th>
                    <Table.Th>Ejemplo</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td><Code>entero</Code></Table.Td>
                    <Table.Td>Número entero</Table.Td>
                    <Table.Td><Code>edad entero</Code></Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td><Code>entero_grande</Code></Table.Td>
                    <Table.Td>Entero grande (64 bits)</Table.Td>
                    <Table.Td><Code>poblacion entero_grande</Code></Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td><Code>entero_pequeño</Code></Table.Td>
                    <Table.Td>Entero pequeño (16 bits)</Table.Td>
                    <Table.Td><Code>cantidad entero_pequeño</Code></Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td><Code>texto</Code></Table.Td>
                    <Table.Td>Texto de longitud variable sin límite</Table.Td>
                    <Table.Td><Code>biografia texto</Code></Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td><Code>decimal</Code></Table.Td>
                    <Table.Td>Número decimal de precisión exacta</Table.Td>
                    <Table.Td><Code>precio decimal</Code></Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td><Code>flotante</Code></Table.Td>
                    <Table.Td>Número de punto flotante</Table.Td>
                    <Table.Td><Code>temperatura flotante</Code></Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td><Code>lógico</Code></Table.Td>
                    <Table.Td>Valor lógico verdadero/falso (alias: <Code>logico</Code>, <Code>log</Code>)</Table.Td>
                    <Table.Td><Code>activo lógico</Code></Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td><Code>fecha</Code></Table.Td>
                    <Table.Td>Fecha (sin hora)</Table.Td>
                    <Table.Td><Code>nacimiento fecha</Code></Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td><Code>hora</Code></Table.Td>
                    <Table.Td>Hora del día</Table.Td>
                    <Table.Td><Code>apertura hora</Code></Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td><Code>fecha_hora</Code></Table.Td>
                    <Table.Td>Fecha y hora sin zona horaria</Table.Td>
                    <Table.Td><Code>creado_en fecha_hora</Code></Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td><Code>fecha_hora_zona</Code></Table.Td>
                    <Table.Td>Fecha y hora con zona horaria</Table.Td>
                    <Table.Td><Code>modificado_en fecha_hora_zona</Code></Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td><Code>json</Code></Table.Td>
                    <Table.Td>Datos JSON</Table.Td>
                    <Table.Td><Code>metadata json</Code></Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td><Code>jsonb</Code></Table.Td>
                    <Table.Td>Datos JSON binario (PostgreSQL)</Table.Td>
                    <Table.Td><Code>config jsonb</Code></Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td><Code>uuid</Code></Table.Td>
                    <Table.Td>Identificador único universal</Table.Td>
                    <Table.Td><Code>id uuid</Code></Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </SubSeccion>

            <SubSeccion titulo="Tipos parametrizados">
              <Text mb="sm">
                Algunos tipos aceptan parámetros entre paréntesis para especificar longitud o precisión:
              </Text>
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Tipo es-ldmd</Table.Th>
                    <Table.Th>Resultado SQL</Table.Th>
                    <Table.Th>Ejemplo</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td><Code>texto(n)</Code></Table.Td>
                    <Table.Td><Code>VARCHAR(n)</Code></Table.Td>
                    <Table.Td><Code>nombre texto(100)</Code></Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td><Code>caracter(n)</Code></Table.Td>
                    <Table.Td><Code>CHAR(n)</Code></Table.Td>
                    <Table.Td><Code>codigo caracter(3)</Code></Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
              <Text mt="sm" size="sm" c="dimmed">
                Nota: <Code>texto</Code> sin parámetros se convierte a <Code>TEXT</Code>, pero <Code>texto(n)</Code> se convierte a <Code>VARCHAR(n)</Code>.
              </Text>
            </SubSeccion>

            <SubSeccion titulo="Tipos especiales">
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Tipo es-ldmd</Table.Th>
                    <Table.Th>PostgreSQL</Table.Th>
                    <Table.Th>MariaDB</Table.Th>
                    <Table.Th>Ejemplo</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td><Code>{'listado(tipo)'}</Code></Table.Td>
                    <Table.Td><Code>TIPO[]</Code></Table.Td>
                    <Table.Td><Code>JSON</Code></Table.Td>
                    <Table.Td><Code>{'etiquetas listado(texto)'}</Code></Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td><Code>{'mapa(clave, valor)'}</Code></Table.Td>
                    <Table.Td><Code>JSON</Code></Table.Td>
                    <Table.Td><Code>JSON</Code></Table.Td>
                    <Table.Td><Code>{'propiedades mapa(texto, texto)'}</Code></Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td><Code>{"enum('v1','v2')"}</Code></Table.Td>
                    <Table.Td><Code>{"ENUM('v1','v2')"}</Code></Table.Td>
                    <Table.Td><Code>{"ENUM('v1','v2')"}</Code></Table.Td>
                    <Table.Td><Code>{"estado enum('activo','inactivo')"}</Code></Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </SubSeccion>

            <SubSeccion titulo="Tipos no reconocidos (passthrough)">
              <Text mb="sm">
                Si utilizas un tipo que no está en el diccionario de conversión, se preservará exactamente
                igual en la salida SQL. Esto te permite usar tipos específicos de tu motor de base de datos:
              </Text>
              <BloqueCodigo codigo={`Tabla ejemplo {
    datos bytea        // Se conserva como "bytea" en SQL
    punto geometry     // Se conserva como "geometry" en SQL
}`} />
            </SubSeccion>
          </SeccionDocumento>

          <Divider my="xl" />

          {/* ── Opciones de Columna ── */}
          <SeccionDocumento id="opciones" titulo="Opciones de Columna">
            <Text mb="sm">
              Las opciones de columna se definen entre corchetes <Code>[ ]</Code> después del tipo de dato.
              Puedes combinar múltiples opciones separándolas con comas:
            </Text>

            <Table striped highlightOnHover withTableBorder mb="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Opción</Table.Th>
                  <Table.Th>Descripción</Table.Th>
                  <Table.Th>SQL generado</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td><Code>no nulo</Code></Table.Td>
                  <Table.Td>La columna no acepta valores nulos</Table.Td>
                  <Table.Td><Code>NOT NULL</Code></Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td><Code>incremento</Code></Table.Td>
                  <Table.Td>Auto-incremento para columnas enteras. En PostgreSQL convierte el tipo a <Code>SERIAL</Code>/<Code>BIGSERIAL</Code>/<Code>SMALLSERIAL</Code>. En MariaDB agrega <Code>AUTO_INCREMENT</Code>.</Table.Td>
                  <Table.Td><Code>SERIAL</Code> / <Code>AUTO_INCREMENT</Code></Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td><Code>{'por_defecto: `expr`'}</Code></Table.Td>
                  <Table.Td>Valor por defecto. La expresión SQL entre backticks se pasa literalmente como cláusula DEFAULT.</Table.Td>
                  <Table.Td><Code>{'DEFAULT expr'}</Code></Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td><Code>{"nota: 'texto'"}</Code></Table.Td>
                  <Table.Td>Comentario descriptivo de la columna</Table.Td>
                  <Table.Td><Code>{'COMMENT ON COLUMN ...'}</Code></Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>

            <BloqueCodigo codigo={`Tabla productos {
    id entero [incremento]
    nombre texto(200) [no nulo]
    precio decimal [no nulo]
    descripcion texto [nota: 'Descripción del producto para el catálogo']
    disponible lógico [no nulo, por_defecto: \`true\`]
    creado_en fecha_hora_zona [no nulo, por_defecto: \`NOW()\`]

    primaria {
        id
    }
}`} />
          </SeccionDocumento>

          <Divider my="xl" />

          {/* ── Llaves Primarias ── */}
          <SeccionDocumento id="primaria" titulo="Llaves Primarias">
            <Text mb="sm">
              Las llaves primarias se definen usando el bloque <Code>primaria</Code> dentro de la tabla.
              Este bloque soporta tanto llaves simples (una columna) como compuestas (múltiples columnas):
            </Text>

            <SubSeccion titulo="Llave primaria simple">
              <Text mb="sm">
                Define la llave primaria usando el bloque <Code>primaria</Code> dentro de la tabla:
              </Text>
              <BloqueCodigo codigo={`Tabla usuarios {
    id entero [incremento]
    nombre texto(100)

    primaria {
        id
    }
}`} />
            </SubSeccion>

            <SubSeccion titulo="Llave primaria compuesta">
              <Text mb="sm">
                Para llaves primarias compuestas (más de una columna), usa el bloque <Code>primaria</Code>:
              </Text>
              <BloqueCodigo codigo={`Tabla inscripciones {
    id_estudiante entero [no nulo]
    id_curso entero [no nulo]
    fecha_inscripcion fecha [no nulo]

    primaria {
        id_estudiante
        id_curso
    }
}`} />
              <Text mt="sm" size="sm" c="dimmed">
                Esto genera: <Code>PRIMARY KEY (id_estudiante, id_curso)</Code>
              </Text>
            </SubSeccion>
          </SeccionDocumento>

          <Divider my="xl" />

          {/* ── Índices ── */}
          <SeccionDocumento id="indices" titulo="Índices">
            <Text mb="sm">
              El bloque <Code>indices</Code> permite definir índices en una o más columnas:
            </Text>
            <BloqueCodigo codigo={`Tabla pedidos {
    id entero [incremento]
    id_cliente entero [no nulo]
    fecha fecha [no nulo, por_defecto: \`CURRENT_DATE\`]
    estado texto(20) [no nulo]

    primaria {
        id
    }

    indices {
        id_cliente
        fecha
        estado
    }
}`} />
            <Text mt="sm" size="sm" c="dimmed">
              Cada columna listada en el bloque genera un índice individual: <Code>CREATE INDEX ... ON pedidos (id_cliente)</Code>, etc.
            </Text>
          </SeccionDocumento>

          <Divider my="xl" />

          {/* ── Llaves Foráneas ── */}
          <SeccionDocumento id="foraneas" titulo="Llaves Foráneas">
            <Text mb="sm">
              El bloque <Code>foranea</Code> define relaciones entre tablas. La sintaxis es:
            </Text>
            <BloqueCodigo codigo={`foranea {
    columna_local tabla_referenciada(columna_referenciada)
}`} />

            <SubSeccion titulo="Ejemplo básico">
              <BloqueCodigo codigo={`Tabla pedidos {
    id entero [incremento]
    id_cliente entero [no nulo]

    primaria {
        id
    }

    foranea {
        id_cliente clientes(id)
    }
}`} />
            </SubSeccion>

            <SubSeccion titulo="Con acciones de cascada">
              <Text mb="sm">
                Puedes especificar acciones de eliminación y actualización en cascada usando corchetes:
              </Text>
              <BloqueCodigo codigo={`Tabla pedidos {
    id entero [incremento]
    id_cliente entero [no nulo]

    primaria {
        id
    }

    foranea {
        id_cliente clientes(id) [eliminación en cascada, actualización en cascada]
    }
}`} />
              <Text mt="sm" size="sm" c="dimmed">
                Esto genera: <Code>ON DELETE CASCADE ON UPDATE CASCADE</Code>
              </Text>
            </SubSeccion>

            <SubSeccion titulo="Múltiples columnas referenciadas">
              <Text mb="sm">
                Puedes referenciar múltiples columnas de la tabla destino:
              </Text>
              <BloqueCodigo codigo={`foranea {
    fk_col tabla_destino(col1, col2, col3)
}`} />
            </SubSeccion>
          </SeccionDocumento>

          <Divider my="xl" />

          {/* ── Notas de Tabla ── */}
          <SeccionDocumento id="notas" titulo="Notas de Tabla">
            <Text mb="sm">
              Puedes agregar una nota descriptiva a cualquier tabla usando la palabra clave <Code>Nota</Code>
              al final del bloque de la tabla:
            </Text>
            <BloqueCodigo codigo={`Tabla clientes {
    id entero [incremento]
    nombre texto(100) [no nulo]
    email texto(255) [no nulo]

    primaria {
        id
    }

    Nota: 'Tabla principal de clientes del sistema de ventas'
}`} />
            <Text mt="sm" size="sm" c="dimmed">
              Las notas se incluyen como comentarios <Code>COMMENT ON TABLE</Code> en la salida SQL.
            </Text>
          </SeccionDocumento>

          <Divider my="xl" />

          {/* ── Grupos ── */}
          <SeccionDocumento id="grupos" titulo="Grupos">
            <Text mb="sm">
              Los grupos permiten organizar visualmente las tablas en el diagrama. No afectan la
              estructura de la base de datos, solo la presentación:
            </Text>
            <BloqueCodigo codigo={`Tabla usuarios {
    id entero [incremento]
    nombre texto(100) [no nulo]

    primaria {
        id
    }
}

Tabla roles {
    id entero [incremento]
    nombre texto(50) [no nulo]

    primaria {
        id
    }
}

Tabla permisos {
    id entero [incremento]
    descripcion texto(200)

    primaria {
        id
    }
}

Grupo autenticacion {
    usuarios
    roles
    permisos
}`} />
            <Text mt="sm">
              En el diagrama, las tablas agrupadas se muestran dentro de un rectángulo con el nombre del
              grupo, y se les asigna automáticamente un color distintivo.
            </Text>
          </SeccionDocumento>

          <Divider my="xl" />

          {/* ── Comentarios ── */}
          <SeccionDocumento id="comentarios" titulo="Comentarios">
            <Text mb="sm">
              Puedes agregar comentarios de una línea usando <Code>//</Code>:
            </Text>
            <BloqueCodigo codigo={`// Este es un comentario
// Los comentarios se ignoran durante el análisis

Tabla usuarios {
    id entero [incremento]      // Identificador único
    nombre texto(100)           // Nombre completo del usuario

    primaria {
        id
    }
}

// Fin del modelo`} />
          </SeccionDocumento>

          <Divider my="xl" />

          {/* ── Conversión a SQL ── */}
          <SeccionDocumento id="conversion-sql" titulo="Conversión de Tipos a SQL">
            <Text mb="sm">
              Al exportar tu modelo a SQL, cada tipo del lenguaje es-ldmd se convierte automáticamente
              al tipo correspondiente del motor de base de datos seleccionado:
            </Text>

            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tipo es-ldmd</Table.Th>
                  <Table.Th>PostgreSQL</Table.Th>
                  <Table.Th>MariaDB</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr><Table.Td><Code>entero</Code></Table.Td><Table.Td>INTEGER</Table.Td><Table.Td>INTEGER</Table.Td></Table.Tr>
                <Table.Tr><Table.Td><Code>texto</Code></Table.Td><Table.Td>TEXT</Table.Td><Table.Td>TEXT</Table.Td></Table.Tr>
                <Table.Tr><Table.Td><Code>texto(n)</Code></Table.Td><Table.Td>VARCHAR(n)</Table.Td><Table.Td>VARCHAR(n)</Table.Td></Table.Tr>
                <Table.Tr><Table.Td><Code>caracter(n)</Code></Table.Td><Table.Td>CHAR(n)</Table.Td><Table.Td>CHAR(n)</Table.Td></Table.Tr>
                <Table.Tr><Table.Td><Code>entero_grande</Code></Table.Td><Table.Td>BIGINT</Table.Td><Table.Td>BIGINT</Table.Td></Table.Tr>
                <Table.Tr><Table.Td><Code>entero_pequeño</Code></Table.Td><Table.Td>SMALLINT</Table.Td><Table.Td>SMALLINT</Table.Td></Table.Tr>
                <Table.Tr><Table.Td><Code>decimal</Code></Table.Td><Table.Td>DECIMAL</Table.Td><Table.Td>DECIMAL</Table.Td></Table.Tr>
                <Table.Tr><Table.Td><Code>flotante</Code></Table.Td><Table.Td>FLOAT</Table.Td><Table.Td>FLOAT</Table.Td></Table.Tr>
                <Table.Tr><Table.Td><Code>lógico</Code> / <Code>logico</Code> / <Code>log</Code></Table.Td><Table.Td>BOOLEAN</Table.Td><Table.Td>BOOLEAN</Table.Td></Table.Tr>
                <Table.Tr><Table.Td><Code>fecha</Code></Table.Td><Table.Td>DATE</Table.Td><Table.Td>DATE</Table.Td></Table.Tr>
                <Table.Tr><Table.Td><Code>hora</Code></Table.Td><Table.Td>TIME</Table.Td><Table.Td>TIME</Table.Td></Table.Tr>
                <Table.Tr><Table.Td><Code>fecha_hora</Code></Table.Td><Table.Td>TIMESTAMP</Table.Td><Table.Td>TIMESTAMP</Table.Td></Table.Tr>
                <Table.Tr><Table.Td><Code>fecha_hora_zona</Code></Table.Td><Table.Td>TIMESTAMPTZ</Table.Td><Table.Td>TIMESTAMPTZ</Table.Td></Table.Tr>
                <Table.Tr><Table.Td><Code>json</Code></Table.Td><Table.Td>JSON</Table.Td><Table.Td>JSON</Table.Td></Table.Tr>
                <Table.Tr><Table.Td><Code>jsonb</Code></Table.Td><Table.Td>JSONB</Table.Td><Table.Td>JSON</Table.Td></Table.Tr>
                <Table.Tr><Table.Td><Code>uuid</Code></Table.Td><Table.Td>UUID</Table.Td><Table.Td>UUID</Table.Td></Table.Tr>
                <Table.Tr><Table.Td><Code>{'listado(tipo)'}</Code></Table.Td><Table.Td>TIPO[]</Table.Td><Table.Td>JSON</Table.Td></Table.Tr>
                <Table.Tr><Table.Td><Code>{'mapa(c, v)'}</Code></Table.Td><Table.Td>JSON</Table.Td><Table.Td>JSON</Table.Td></Table.Tr>
                <Table.Tr><Table.Td><Code>{"enum('a','b')"}</Code></Table.Td><Table.Td>{"ENUM('a','b')"}</Table.Td><Table.Td>{"ENUM('a','b')"}</Table.Td></Table.Tr>
              </Table.Tbody>
            </Table>

            <Text mt="md" size="sm" c="dimmed">
              <strong>Importante:</strong> Si un tipo no está en esta tabla, se preserva exactamente igual en la salida
              SQL (passthrough). Esto permite usar tipos nativos de tu motor como <Code>bytea</Code>,{' '}
              <Code>geometry</Code>, <Code>cidr</Code>, etc.
            </Text>
          </SeccionDocumento>

          <Divider my="xl" />

          {/* ── Exportación ── */}
          <SeccionDocumento id="exportacion" titulo="Exportación">
            <SubSeccion titulo="Exportar a SQL">
              <Text mb="sm">
                La exportación a SQL genera código DDL (<Code>CREATE TABLE</Code>) listo para ejecutar en tu
                motor de base de datos. Las opciones disponibles son:
              </Text>
              <List spacing="xs">
                <List.Item><strong>Motor de base de datos</strong> — PostgreSQL o MariaDB (afecta la conversión de tipos)</List.Item>
                <List.Item><strong>IF NOT EXISTS</strong> — Agrega <Code>IF NOT EXISTS</Code> a cada <Code>CREATE TABLE</Code></List.Item>
                <List.Item><strong>DROP TABLE</strong> — Agrega <Code>DROP TABLE IF EXISTS</Code> antes de cada tabla</List.Item>
                <List.Item><strong>Esquema</strong> — Incluye el nombre del esquema si fue definido</List.Item>
              </List>
              <Text mt="sm">
                El SQL generado incluye:
              </Text>
              <List spacing="xs">
                <List.Item>Definiciones de columnas con tipos convertidos</List.Item>
                <List.Item>Restricciones <Code>PRIMARY KEY</Code>, <Code>NOT NULL</Code>, <Code>UNIQUE</Code></List.Item>
                <List.Item>Llaves foráneas con acciones de cascada</List.Item>
                <List.Item>Índices</List.Item>
                <List.Item>Comentarios (notas de tabla y columna)</List.Item>
              </List>
            </SubSeccion>

            <SubSeccion titulo="Exportar como imagen">
              <Text mb="sm">
                Descarga el diagrama como imagen PNG directamente desde el canvas. La imagen incluye
                todas las tablas, relaciones y grupos visibles en el diagrama.
              </Text>
            </SubSeccion>

            <SubSeccion titulo="Archivo .esldmd">
              <Text mb="sm">
                Puedes guardar y compartir tus modelos como archivos <Code>.esldmd</Code>:
              </Text>
              <List spacing="xs">
                <List.Item><strong>Descargar</strong> (<Code>Ctrl + E</Code>) — Guarda el contenido actual como un archivo .esldmd en tu computadora</List.Item>
                <List.Item><strong>Importar</strong> (<Code>Ctrl + Shift + U</Code>) — Carga un archivo .esldmd desde tu computadora al editor</List.Item>
              </List>
            </SubSeccion>
          </SeccionDocumento>

          <Divider my="xl" />

          {/* ── Gestión de Archivos ── */}
          <SeccionDocumento id="archivos" titulo="Gestión de Archivos">
            <Text mb="sm">
              La aplicación guarda tus archivos en el <strong>almacenamiento local del navegador</strong> (localStorage).
              Esto significa que tus datos persisten entre sesiones sin necesidad de un servidor.
            </Text>

            <SubSeccion titulo="Operaciones disponibles">
              <List spacing="xs">
                <List.Item><strong>Crear</strong> — Crea un nuevo archivo vacío con nombre personalizado</List.Item>
                <List.Item><strong>Guardar</strong> — Guarda los cambios del archivo actual (genera una nueva versión)</List.Item>
                <List.Item><strong>Abrir</strong> — Lista todos los archivos guardados y permite seleccionar uno</List.Item>
                <List.Item><strong>Renombrar</strong> — Cambia el nombre de un archivo existente</List.Item>
                <List.Item><strong>Eliminar</strong> — Elimina permanentemente un archivo y todas sus versiones</List.Item>
              </List>
            </SubSeccion>

            <SubSeccion titulo="Sistema de versiones">
              <Text mb="sm">
                Cada vez que guardas, se crea una nueva versión con marca de tiempo. Puedes consultar
                el historial de versiones de cada archivo. Las versiones se almacenan como snapshots
                completos del contenido.
              </Text>
            </SubSeccion>

            <SubSeccion titulo="Preferencias">
              <Text>
                La aplicación recuerda tu último archivo abierto y tu preferencia de tema (oscuro/claro)
                entre sesiones.
              </Text>
            </SubSeccion>
          </SeccionDocumento>

          <Divider my="xl" />

          {/* ── Chat IA ── */}
          <SeccionDocumento id="chat-ia" titulo="Chat IA">
            <Text mb="sm">
              La aplicación incluye un asistente de inteligencia artificial que ejecuta un modelo de
              lenguaje <strong>directamente en tu navegador</strong> usando la tecnología WebLLM.
            </Text>

            <SubSeccion titulo="Características">
              <List spacing="xs">
                <List.Item><strong>100% local</strong> — El modelo se ejecuta en tu dispositivo, ningún dato sale de tu navegador</List.Item>
                <List.Item><strong>Sin servidor</strong> — No requiere conexión a internet ni APIs externas después de la carga inicial del modelo</List.Item>
                <List.Item><strong>Contexto del código</strong> — El asistente tiene acceso al código actual del editor para dar respuestas contextuales</List.Item>
              </List>
            </SubSeccion>

            <SubSeccion titulo="Cómo usarlo">
              <List type="ordered" spacing="xs">
                <List.Item>Abre la pestaña <strong>Chat IA</strong> en el panel de herramientas (derecha)</List.Item>
                <List.Item>Espera a que el modelo se cargue (solo la primera vez puede tomar unos segundos)</List.Item>
                <List.Item>Escribe tu pregunta o indicación en el campo de texto</List.Item>
                <List.Item>El asistente puede ayudarte a generar código es-ldmd, explicar errores o sugerir mejoras</List.Item>
              </List>
            </SubSeccion>
          </SeccionDocumento>

          <Divider my="xl" />

          {/* ── Ejemplo completo ── */}
          <SeccionDocumento id="ejemplo" titulo="Ejemplo Completo">
            <Text mb="sm">
              A continuación se muestra un modelo completo de una tienda en línea que utiliza todas las
              características del lenguaje:
            </Text>
            <BloqueCodigo codigo={`// ─────────────────────────────────────
// Modelo: Tienda en línea
// ─────────────────────────────────────

Tabla clientes {
    id entero [incremento]
    nombre texto(100) [no nulo]
    email texto(255) [no nulo]
    telefono texto(20)
    activo lógico [no nulo, por_defecto: \`true\`]
    creado_en fecha_hora_zona [no nulo, por_defecto: \`NOW()\`]

    primaria {
        id
    }

    indices {
        email
    }

    Nota: 'Clientes registrados en la tienda'
}

Tabla productos {
    id entero [incremento]
    nombre texto(200) [no nulo]
    precio decimal [no nulo]
    stock entero [no nulo, por_defecto: \`0\`]
    categoria texto(50)

    primaria {
        id
    }

    indices {
        nombre
        categoria
    }

    Nota: 'Catálogo de productos disponibles'
}

Tabla pedidos {
    id entero [incremento]
    id_cliente entero [no nulo]
    fecha fecha_hora_zona [no nulo, por_defecto: \`NOW()\`]
    total decimal [no nulo]
    estado enum('pendiente','enviado','entregado') [no nulo, por_defecto: \`'pendiente'\`]

    primaria {
        id
    }

    foranea {
        id_cliente clientes(id) [eliminación en cascada]
    }

    indices {
        id_cliente
        fecha
    }
}

Tabla detalle_pedidos {
    id entero [incremento]
    id_pedido entero [no nulo]
    id_producto entero [no nulo]
    cantidad entero [no nulo, por_defecto: \`1\`]
    precio_unitario decimal [no nulo]

    primaria {
        id
    }

    foranea {
        id_pedido pedidos(id) [eliminación en cascada]
        id_producto productos(id)
    }
}

// ─── Organización visual ───

Grupo tienda {
    productos
    clientes
}

Grupo ventas {
    pedidos
    detalle_pedidos
}`} />
          </SeccionDocumento>

          {/* ── Footer ── */}
          <Divider my="xl" />
          <Box py="lg" ta="center">
            <Text size="sm" c="dimmed">
              es-ldmd v{VERSION_APLICACION} — Editor de Diagramas Entidad Relación
            </Text>
            <Anchor component={Link} href="/" size="sm" mt="xs" style={{ display: 'inline-block' }}>
              ← Volver al editor
            </Anchor>
          </Box>
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}
