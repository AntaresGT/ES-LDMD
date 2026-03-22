/**
 * @archivo UsarTema.ts
 * @descripcion Hook personalizado para gestionar el tema de la aplicación (oscuro/claro).
 * Utiliza useMantineColorScheme de Mantine para la gestión del esquema de color.
 */
'use client';

import { useMantineColorScheme, useComputedColorScheme } from '@mantine/core';

/**
 * Interfaz que retorna el hook UsarTema.
 */
interface ResultadoTema {
  /** Esquema de color actual ('light' | 'dark') */
  esquema_color: 'light' | 'dark';
  /** Indica si el tema actual es oscuro */
  es_oscuro: boolean;
  /** Alterna entre tema oscuro y claro */
  alternar_tema: () => void;
  /** Establece el tema a oscuro */
  fijar_oscuro: () => void;
  /** Establece el tema a claro */
  fijar_claro: () => void;
}

/**
 * Hook personalizado para gestionar el tema de la aplicación.
 * Proporciona funciones para alternar, leer y fijar el esquema de color.
 *
 * @returns {ResultadoTema} Objeto con el estado y funciones del tema
 *
 * @ejemplo
 * ```tsx
 * const { es_oscuro, alternar_tema } = UsarTema();
 * ```
 */
export function UsarTema(): ResultadoTema {
  'use no memo';
  const { setColorScheme, toggleColorScheme } = useMantineColorScheme();
  const esquema_computado = useComputedColorScheme('dark', { getInitialValueInEffect: true });

  return {
    esquema_color: esquema_computado,
    es_oscuro: esquema_computado === 'dark',
    alternar_tema: () => toggleColorScheme(),
    fijar_oscuro: () => setColorScheme('dark'),
    fijar_claro: () => setColorScheme('light'),
  };
}
