/**
 * @archivo tema-aplicacion.ts
 * @descripcion Definición del tema personalizado de Mantine para es-ldmd.
 * Paleta principal azul, dark mode por defecto, diseño moderno.
 */
import { createTheme, MantineColorsTuple } from '@mantine/core';

/**
 * Paleta azul personalizada para la aplicación.
 * Tonos del 0 (más claro) al 9 (más oscuro).
 */
const azul_principal: MantineColorsTuple = [
  '#e7f5ff',
  '#d0ebff',
  '#a5d8ff',
  '#74c0fc',
  '#4dabf7',
  '#339af0',
  '#228be6',
  '#1c7ed6',
  '#1971c2',
  '#1864ab',
];

/**
 * Tema personalizado de la aplicación es-ldmd.
 * Utiliza una paleta azul como color principal con diseño profesional.
 */
export const tema_aplicacion = createTheme({
  primaryColor: 'azul',
  colors: {
    azul: azul_principal,
  },
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontFamilyMonospace: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, "Courier New", monospace',
  defaultRadius: 'md',
  cursorType: 'pointer',
  headings: {
    fontWeight: '600',
  },
  other: {
    nombre_aplicacion: 'es-ldmd',
    version: '0.1.0',
  },
});
