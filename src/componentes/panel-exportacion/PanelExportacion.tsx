/**
 * @archivo PanelExportacion.tsx
 * @descripcion Panel lateral de exportación con pestañas para SQL e Imagen.
 * Se abre como un Drawer desde la derecha al presionar Exportar.
 */
'use client';

import { Drawer, Tabs, Text } from '@mantine/core';
import { VscDatabase, VscFileMedia } from 'react-icons/vsc';
import { DocumentoAST } from '@/dominio/tipos';
import { ModeloDiagrama } from '@/transformadores/ast-a-diagrama';
import { ExportarSQL } from './ExportarSQL';
import { ExportarImagen } from './ExportarImagen';

/**
 * Propiedades del componente PanelExportacion.
 */
interface PropiedadesPanelExportacion {
  /** Indica si el panel está abierto */
  abierto: boolean;
  /** Callback al cerrar el panel */
  al_cerrar: () => void;
  /** AST del documento actual */
  ast: DocumentoAST | null;
  /** Modelo del diagrama actual */
  modelo: ModeloDiagrama | null;
}

/**
 * Panel lateral de exportación con dos pestañas:
 * - SQL: exportar código DDL para PostgreSQL o MariaDB
 * - Imagen: exportar diagrama como PNG, SVG o WEBP
 *
 * @param {PropiedadesPanelExportacion} props - Propiedades del componente
 * @returns {JSX.Element} Panel de exportación
 */
export function PanelExportacion({
  abierto,
  al_cerrar,
  ast,
  modelo,
}: PropiedadesPanelExportacion) {
  return (
    <Drawer
      opened={abierto}
      onClose={al_cerrar}
      title="Exportar"
      position="right"
      size="md"
      overlayProps={{ backgroundOpacity: 0.3 }}
    >
      <Tabs defaultValue="sql" style={{ height: 'calc(100vh - 100px)' }}>
        <Tabs.List>
          <Tabs.Tab value="sql" leftSection={<VscDatabase size={14} />}>
            <Text size="sm" fw={500}>
              SQL
            </Text>
          </Tabs.Tab>
          <Tabs.Tab value="imagen" leftSection={<VscFileMedia size={14} />}>
            <Text size="sm" fw={500}>
              Imagen
            </Text>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="sql" style={{ height: 'calc(100% - 42px)' }}>
          <ExportarSQL ast={ast} />
        </Tabs.Panel>

        <Tabs.Panel value="imagen" style={{ height: 'calc(100% - 42px)' }}>
          <ExportarImagen modelo={modelo} />
        </Tabs.Panel>
      </Tabs>
    </Drawer>
  );
}
