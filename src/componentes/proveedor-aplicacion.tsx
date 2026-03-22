/**
 * @archivo proveedor-aplicacion.tsx
 * @descripcion Componente proveedor principal que envuelve la aplicación
 * con MantineProvider, ModalsProvider y Notifications.
 */
'use client';

import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import {
  CodeHighlightAdapterProvider,
  createHighlightJsAdapter,
} from '@mantine/code-highlight';
import hljs from 'highlight.js/lib/core';
import sqlLang from 'highlight.js/lib/languages/sql';
import { tema_aplicacion } from './tema-aplicacion';

// Registrar lenguaje SQL en highlight.js
hljs.registerLanguage('sql', sqlLang);

const highlightJsAdapter = createHighlightJsAdapter(hljs);

// Estilos necesarios de Mantine
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/code-highlight/styles.css';
import 'highlight.js/styles/atom-one-dark.css';

/**
 * Propiedades del proveedor de aplicación.
 */
interface PropiedadesProveedor {
  /** Elementos hijos de la aplicación */
  children: React.ReactNode;
}

/**
 * Componente que envuelve la aplicación con los proveedores necesarios:
 * - MantineProvider: tema, estilos y componentes de Mantine
 * - ModalsProvider: sistema de modales
 * - Notifications: sistema de notificaciones
 *
 * @param {PropiedadesProveedor} props - Propiedades del componente
 * @returns {JSX.Element} Árbol de proveedores con los hijos envueltos
 */
export function ProveedorAplicacion({ children }: PropiedadesProveedor) {
  return (
    <MantineProvider theme={tema_aplicacion} defaultColorScheme="dark">
      <CodeHighlightAdapterProvider adapter={highlightJsAdapter}>
        <ModalsProvider>
          <Notifications position="top-right" />
          {children}
        </ModalsProvider>
      </CodeHighlightAdapterProvider>
    </MantineProvider>
  );
}


