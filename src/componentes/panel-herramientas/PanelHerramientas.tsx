/**
 * @archivo PanelHerramientas.tsx
 * @descripcion Panel de herramientas con pestañas para Errores e IA.
 * Muestra diagnósticos del código y acceso al chat de IA local.
 */
'use client';

import { Box, Tabs, Text } from '@mantine/core';
import { VscWarning, VscRobot } from 'react-icons/vsc';
import { AnuncioCuadrado } from '@/componentes/anuncios/AnuncioCuadrado';
import { ListaErrores } from './ListaErrores';
import { ChatIA } from './ChatIA';

/**
 * Propiedades del componente PanelHerramientas.
 */
interface PropiedadesPanelHerramientas {
  /** Lista de errores/diagnósticos para mostrar */
  errores?: Array<{ mensaje: string; linea: number; columna: number; severidad: string }>;
  /** Callback cuando se hace click en un error */
  al_click_error?: (linea: number, columna: number) => void;
  /** Callback para insertar código DSL generado por IA en el editor */
  al_insertar_codigo?: (codigo: string) => void;
}

/**
 * Panel de herramientas con dos pestañas: Errores e IA.
 * - Errores: muestra diagnósticos del código DSL
 * - IA: chat con LLM local mediante web-llm
 *
 * @param {PropiedadesPanelHerramientas} props - Propiedades del componente
 * @returns {JSX.Element} Panel de herramientas renderizado
 */
export function PanelHerramientas({ errores = [], al_click_error, al_insertar_codigo }: PropiedadesPanelHerramientas) {
  return (
    <Box
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--mantine-color-body)',
      }}
      role="complementary"
      aria-label="Panel de herramientas"
    >
      <Tabs
        defaultValue="errores"
        styles={{
          root: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          },
          list: { flexShrink: 0 },
          panel: {
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        }}
      >
        <Tabs.List>
          <Tabs.Tab
            value="errores"
            leftSection={<VscWarning size={14} />}
          >
            <Text size="xs" fw={600}>
              Errores {errores.length > 0 && `(${errores.length})`}
            </Text>
          </Tabs.Tab>
          <Tabs.Tab
            value="ia"
            leftSection={<VscRobot size={14} />}
          >
            <Text size="xs" fw={600}>
              IA
            </Text>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="errores">
          <Box
            style={{
              flex: 1,
              minHeight: 0,
              height: '100%',
              display: 'grid',
              gridTemplateRows: 'minmax(0, 8fr) minmax(104px, 2fr)',
              overflow: 'hidden',
            }}
          >
            <Box
              style={{
                minHeight: 0,
                overflow: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <ListaErrores errores={errores} al_click_error={al_click_error} />
            </Box>
            <Box
              px="xs"
              pb="xs"
              pt="xs"
              style={{
                minHeight: 0,
                overflow: 'hidden',
                borderTop: '1px solid var(--mantine-color-default-border)',
                backgroundColor: 'var(--mantine-color-body)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
              }}
            >
              {/*
                Franja ~20%: un solo anuncio (un slot por instancia; ver comentarios en CargarScriptAdSense).
              */}
              <Box
                p={4}
                style={{
                  flex: 1,
                  minHeight: 0,
                  minWidth: 0,
                  width: '100%',
                  border: '1px solid var(--mantine-color-default-border)',
                  borderRadius: 6,
                  overflow: 'hidden',
                  backgroundColor: 'var(--mantine-color-default-hover)',
                }}
              >
                <AnuncioCuadrado />
              </Box>
            </Box>
          </Box>
        </Tabs.Panel>

        <Tabs.Panel value="ia">
          <ChatIA al_insertar_codigo={al_insertar_codigo} />
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}
