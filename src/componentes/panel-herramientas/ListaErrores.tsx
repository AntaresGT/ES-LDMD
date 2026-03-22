/**
 * @archivo ListaErrores.tsx
 * @descripcion Componente que muestra la lista de errores/diagnósticos del código DSL.
 * Permite navegar al error haciendo click en cada item.
 */
'use client';

import { Box, Text, Stack, Center, UnstyledButton, Badge, Group } from '@mantine/core';
import { VscError, VscWarning, VscInfo, VscCheck } from 'react-icons/vsc';

/**
 * Interfaz para un error/diagnóstico individual.
 */
interface ErrorDiagnostico {
  /** Mensaje descriptivo del error */
  mensaje: string;
  /** Número de línea donde ocurre el error */
  linea: number;
  /** Número de columna donde ocurre el error */
  columna: number;
  /** Severidad: 'error' | 'advertencia' | 'informacion' */
  severidad: string;
}

/**
 * Propiedades del componente ListaErrores.
 */
interface PropiedadesListaErrores {
  /** Lista de errores a mostrar */
  errores?: ErrorDiagnostico[];
  /** Callback cuando se hace click en un error para navegar al código */
  al_click_error?: (linea: number, columna: number) => void;
}

/**
 * Retorna el icono correspondiente a la severidad del error.
 * @param {string} severidad - Severidad del error
 * @returns {JSX.Element} Icono correspondiente
 */
function obtener_icono_severidad(severidad: string) {
  switch (severidad) {
    case 'error':
      return <VscError size={14} color="var(--mantine-color-red-6)" />;
    case 'advertencia':
      return <VscWarning size={14} color="var(--mantine-color-yellow-6)" />;
    case 'informacion':
      return <VscInfo size={14} color="var(--mantine-color-blue-6)" />;
    default:
      return <VscInfo size={14} color="var(--mantine-color-dimmed)" />;
  }
}

/**
 * Retorna el color del badge según la severidad.
 * @param {string} severidad - Severidad del error
 * @returns {string} Nombre del color de Mantine
 */
function obtener_color_severidad(severidad: string): string {
  switch (severidad) {
    case 'error':
      return 'red';
    case 'advertencia':
      return 'yellow';
    case 'informacion':
      return 'blue';
    default:
      return 'gray';
  }
}

/**
 * Lista de errores/diagnósticos del código DSL.
 * Muestra cada error con su severidad, posición y mensaje.
 * Al hacer click en un error, navega a la línea correspondiente en el editor.
 *
 * @param {PropiedadesListaErrores} props - Propiedades del componente
 * @returns {JSX.Element} Lista de errores renderizada
 */
export function ListaErrores({ errores = [], al_click_error }: PropiedadesListaErrores) {
  if (errores.length === 0) {
    return (
      <Center p="xl">
        <Stack align="center" gap="xs">
          <VscCheck size={32} color="var(--mantine-color-green-6)" />
          <Text size="sm" c="dimmed">
            No se encontraron errores
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap={0} role="list" aria-label="Lista de errores del código">
      {errores.map((error, indice) => (
        <UnstyledButton
          key={`${error.linea}-${error.columna}-${indice}`}
          onClick={() => al_click_error?.(error.linea, error.columna)}
          role="listitem"
          aria-label={`${error.severidad}: ${error.mensaje} en línea ${error.linea}, columna ${error.columna}`}
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid var(--mantine-color-default-border)',
            display: 'block',
            width: '100%',
            transition: 'background-color 150ms ease',
          }}
          className="lista-errores-item"
        >
          <Group gap="xs" wrap="nowrap">
            {obtener_icono_severidad(error.severidad)}
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="xs" lineClamp={2}>
                {error.mensaje}
              </Text>
            </Box>
            <Badge
              size="xs"
              variant="light"
              color={obtener_color_severidad(error.severidad)}
              style={{ flexShrink: 0 }}
            >
              Ln {error.linea}, Col {error.columna}
            </Badge>
          </Group>
        </UnstyledButton>
      ))}
    </Stack>
  );
}
