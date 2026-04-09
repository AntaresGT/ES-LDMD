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
            position: 'relative',
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
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Box
              style={{
                flex: 1,
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
                flexShrink: 0,
                borderTop: '1px solid var(--mantine-color-default-border)',
                backgroundColor: 'var(--mantine-color-body)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
              }}
            >
              <AnuncioCuadrado />
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
