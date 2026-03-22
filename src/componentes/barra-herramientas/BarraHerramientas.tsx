/**
 * @archivo BarraHerramientas.tsx
 * @descripcion Barra de herramientas superior de la aplicación.
 * Contiene botones de acciones principales: guardar, exportar, tema, archivos.
 */
'use client';

import {
  Group,
  ActionIcon,
  Button,
  Text,
  Tooltip,
  Badge,
  Divider,
  Box,
  Kbd,
} from '@mantine/core';
import {
  VscSave,
  VscExport,
  VscNewFile,
  VscFolderOpened,
  VscCloudDownload,
  VscCloudUpload,
  VscTrash,
  VscBook,
} from 'react-icons/vsc';
import {
  IoSunnyOutline,
  IoMoonOutline,
} from 'react-icons/io5';
import { UsarTema } from '@/hooks/UsarTema';
import { type ReactNode, useState, useEffect } from 'react';

/**
 * Genera el contenido del tooltip con nombre de acción y atajo de teclado.
 */
function EtiquetaAtajo({ nombre, teclas }: { nombre: string; teclas?: string[] }): ReactNode {
  if (!teclas) return nombre;
  return (
    <Group gap={6} wrap="nowrap" align="center">
      <Text size="xs">{nombre}</Text>
      <Divider orientation="vertical" size="sm" style={{ opacity: 0.4, alignSelf: 'stretch' }} />
      <Group gap={3} wrap="nowrap">
        {teclas.map((tecla, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            {i > 0 && <Text size="xs" c="dimmed" component="span">+</Text>}
            <Kbd size="xs">{tecla}</Kbd>
          </span>
        ))}
      </Group>
    </Group>
  );
}

/**
 * Propiedades del componente BarraHerramientas.
 */
interface PropiedadesBarraHerramientas {
  /** Callback al presionar guardar */
  al_guardar?: () => void;
  /** Callback al presionar exportar */
  al_exportar?: () => void;
  /** Callback al presionar descargar .esldmd */
  al_descargar_esldmd?: () => void;
  /** Callback al presionar importar .esldmd */
  al_importar_esldmd?: () => void;
  /** Callback al presionar nuevo archivo */
  al_nuevo_archivo?: () => void;
  /** Callback al presionar borrar contenido */
  al_borrar?: () => void;
  /** Callback al presionar abrir archivo */
  al_abrir_archivo?: () => void;
  /** Nombre del archivo actual */
  nombre_archivo?: string;
}

/**
 * Barra de herramientas superior con acciones principales de la aplicación.
 * Incluye botones de guardar, exportar, gestión de archivos y toggle de tema.
 *
 * @param {PropiedadesBarraHerramientas} props - Propiedades del componente
 * @returns {JSX.Element} Barra de herramientas renderizada
 */
export function BarraHerramientas({
  al_guardar,
  al_exportar,
  al_descargar_esldmd,
  al_importar_esldmd,
  al_nuevo_archivo,
  al_borrar,
  al_abrir_archivo,
  nombre_archivo = 'Sin título',
}: PropiedadesBarraHerramientas) {
  'use no memo';
  const { es_oscuro, alternar_tema } = UsarTema();
  const [montado, fijarMontado] = useState(false);
  useEffect(() => { fijarMontado(true); }, []);

  return (
    <Box
      role="toolbar"
      aria-label="Barra de herramientas principal"
      style={{
        minHeight: 48,
        borderBottom: '1px solid var(--mantine-color-default-border)',
        backgroundColor: 'var(--mantine-color-body)',
        display: 'flex',
        alignItems: 'center',
        padding: '4px 12px',
        flexShrink: 0,
        flexWrap: 'wrap',
        gap: 4,
      }}
    >
      <Group gap="sm" style={{ flex: 1 }}>
        {/* nombre */}
        <Text
          fw={700}
          size="sm"
          c="azul"
          style={{ fontFamily: 'var(--mantine-font-family-monospace)' }}
        >
          es-ldmd
        </Text>

        <Badge variant="light" color="azul" size="xs">
          v0.1.0
        </Badge>

        <Divider orientation="vertical" />

        {/* Grupo: Archivo */}
        <Tooltip label={<EtiquetaAtajo nombre="Nuevo" teclas={['Ctrl', 'N']} />} withArrow>
          <ActionIcon variant="subtle" color="gray" onClick={al_nuevo_archivo} aria-label="Nuevo archivo">
            <VscNewFile size={18} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label={<EtiquetaAtajo nombre="Guardar" teclas={['Ctrl', 'S']} />} withArrow>
          <ActionIcon variant="subtle" color="gray" onClick={al_guardar} aria-label="Guardar archivo">
            <VscSave size={18} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label={<EtiquetaAtajo nombre="Borrar contenido" teclas={['Ctrl', 'Shift', 'D']} />} withArrow>
          <ActionIcon variant="subtle" color="gray" onClick={al_borrar} aria-label="Borrar contenido">
            <VscTrash size={18} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label={<EtiquetaAtajo nombre="Abrir" teclas={['Ctrl', 'O']} />} withArrow>
          <ActionIcon variant="subtle" color="gray" onClick={al_abrir_archivo} aria-label="Abrir archivo">
            <VscFolderOpened size={18} />
          </ActionIcon>
        </Tooltip>

        <Divider orientation="vertical" />

        {/* Grupo: Exportación */}
        <Tooltip label={<EtiquetaAtajo nombre="Exportar" teclas={['Ctrl', 'Shift', 'E']} />} withArrow>
          <ActionIcon variant="subtle" color="gray" onClick={al_exportar} aria-label="Exportar diagrama">
            <VscExport size={18} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label={<EtiquetaAtajo nombre="Descargar .esldmd" teclas={['Ctrl', 'E']} />} withArrow>
          <ActionIcon variant="subtle" color="gray" onClick={al_descargar_esldmd} aria-label="Descargar archivo .esldmd">
            <VscCloudDownload size={18} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label={<EtiquetaAtajo nombre="Importar .esldmd" teclas={['Ctrl', 'Shift', 'U']} />} withArrow>
          <ActionIcon variant="subtle" color="gray" onClick={al_importar_esldmd} aria-label="Importar archivo .esldmd">
            <VscCloudUpload size={18} />
          </ActionIcon>
        </Tooltip>

        <Divider orientation="vertical" />

        {/* Nombre del archivo actual */}
        <Text size="sm" c="dimmed" truncate style={{ maxWidth: 200 }}>
          {nombre_archivo}
        </Text>
      </Group>

      {/* Acciones de la derecha */}
      <Group gap="sm">
        <Button
          component="a"
          href="/documentacion"
          target="_blank"
          rel="noopener noreferrer"
          variant="subtle"
          color="gray"
          size="compact-sm"
          leftSection={<VscBook size={14} />}
        >
          Documentación
        </Button>

        <Tooltip label={<EtiquetaAtajo nombre={es_oscuro ? 'Modo claro' : 'Modo oscuro'} teclas={['Ctrl', 'Shift', 'L']} />} withArrow>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={alternar_tema}
            aria-label="Alternar tema"
          >
            {montado && (es_oscuro ? <IoSunnyOutline size={18} /> : <IoMoonOutline size={18} />)}
          </ActionIcon>
        </Tooltip>
      </Group>
    </Box>
  );
}
