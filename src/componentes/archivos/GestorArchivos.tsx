/**
 * @archivo GestorArchivos.tsx
 * @descripcion Componente para gestionar archivos guardados en localStorage.
 * Permite crear, abrir, renombrar, eliminar archivos y gestionar versiones.
 */
'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Modal,
  Box,
  Text,
  Button,
  TextInput,
  Stack,
  Group,
  ScrollArea,
  Badge,
  ActionIcon,
  Tooltip,
  Menu,
  Divider,
  Center,
} from '@mantine/core';
import {
  VscFile,
  VscTrash,
  VscEdit,
  VscHistory,
  VscAdd,
  VscFolderOpened,
  VscEllipsis,
} from 'react-icons/vsc';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import {
  ArchivoGuardado,
  obtener_archivos,
  crear_archivo,
  eliminar_archivo,
  renombrar_archivo,
  obtener_contenido_version,
  eliminar_version,
  limpiar_versiones,
} from '@/persistencia/gestor-almacenamiento';

dayjs.locale('es');

/**
 * Propiedades del componente GestorArchivos.
 */
interface PropiedadesGestorArchivos {
  /** Si el modal está abierto */
  abierto: boolean;
  /** Callback al cerrar el modal */
  al_cerrar: () => void;
  /** Callback al seleccionar un archivo */
  al_abrir_archivo: (id: string, nombre: string, contenido: string) => void;
  /** Contenido actual del editor (para guardar como nuevo) */
  contenido_actual?: string;
}

/**
 * Modal de gestión de archivos guardados.
 * Muestra la lista de archivos con opciones de CRUD y gestión de versiones.
 *
 * @param {PropiedadesGestorArchivos} props - Propiedades del componente
 * @returns {JSX.Element} Modal de gestión de archivos
 */
export function GestorArchivos({
  abierto,
  al_cerrar,
  al_abrir_archivo,
  contenido_actual = '',
}: PropiedadesGestorArchivos) {
  const [archivos, fijarArchivos] = useState<ArchivoGuardado[]>([]);
  const [nombre_nuevo, fijarNombreNuevo] = useState('');
  const [creando, fijarCreando] = useState(false);
  const [editando_id, fijarEditandoId] = useState<string | null>(null);
  const [nombre_edicion, fijarNombreEdicion] = useState('');
  const [versiones_id, fijarVersionesId] = useState<string | null>(null);

  /**
   * Carga la lista de archivos desde localStorage.
   */
  const cargar_archivos = useCallback(() => {
    fijarArchivos(obtener_archivos());
  }, []);

  useEffect(() => {
    if (abierto) {
      cargar_archivos();
    }
  }, [abierto, cargar_archivos]);

  /**
   * Crea un nuevo archivo.
   */
  const manejar_crear = useCallback(() => {
    if (!nombre_nuevo.trim()) return;

    const archivo = crear_archivo(nombre_nuevo.trim(), contenido_actual);
    fijarNombreNuevo('');
    fijarCreando(false);
    cargar_archivos();

    // Abrir el archivo recién creado
    al_abrir_archivo(archivo.id, archivo.nombre, contenido_actual);
  }, [nombre_nuevo, contenido_actual, cargar_archivos, al_abrir_archivo]);

  /**
   * Abre un archivo existente (carga la versión más reciente).
   */
  const manejar_abrir = useCallback(
    (archivo: ArchivoGuardado) => {
      const contenido = archivo.versiones[0]?.contenido ?? '';
      al_abrir_archivo(archivo.id, archivo.nombre, contenido);
      al_cerrar();
    },
    [al_abrir_archivo, al_cerrar],
  );

  /**
   * Elimina un archivo.
   */
  const manejar_eliminar = useCallback(
    (id: string) => {
      eliminar_archivo(id);
      cargar_archivos();
    },
    [cargar_archivos],
  );

  /**
   * Confirma el renombramiento de un archivo.
   */
  const manejar_renombrar = useCallback(
    (id: string) => {
      if (!nombre_edicion.trim()) return;
      renombrar_archivo(id, nombre_edicion.trim());
      fijarEditandoId(null);
      cargar_archivos();
    },
    [nombre_edicion, cargar_archivos],
  );

  /**
   * Recupera una versión específica.
   */
  const manejar_recuperar_version = useCallback(
    (archivo_id: string, version_id: string) => {
      const contenido = obtener_contenido_version(archivo_id, version_id);
      if (contenido === null) return;

      const archivo = archivos.find((a) => a.id === archivo_id);
      if (!archivo) return;

      al_abrir_archivo(archivo.id, archivo.nombre, contenido);
      fijarVersionesId(null);
      al_cerrar();
    },
    [archivos, al_abrir_archivo, al_cerrar],
  );

  /**
   * Elimina una versión específica.
   */
  const manejar_eliminar_version = useCallback(
    (archivo_id: string, version_id: string) => {
      eliminar_version(archivo_id, version_id);
      cargar_archivos();
    },
    [cargar_archivos],
  );

  /**
   * Limpia todas las versiones excepto la más reciente.
   */
  const manejar_limpiar_versiones = useCallback(
    (archivo_id: string) => {
      limpiar_versiones(archivo_id);
      cargar_archivos();
    },
    [cargar_archivos],
  );

  const archivo_con_versiones = archivos.find((a) => a.id === versiones_id);

  return (
    <Modal
      opened={abierto}
      onClose={al_cerrar}
      title="Archivos guardados"
      size="lg"
    >
      <Stack gap="md">
        {/* Botón de nuevo archivo */}
        {creando ? (
          <Group gap="sm">
            <TextInput
              placeholder="Nombre del archivo"
              value={nombre_nuevo}
              onChange={(e) => fijarNombreNuevo(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && manejar_crear()}
              size="sm"
              style={{ flex: 1 }}
              autoFocus
            />
            <Button size="sm" onClick={manejar_crear} disabled={!nombre_nuevo.trim()}>
              Crear
            </Button>
            <Button
              size="sm"
              variant="subtle"
              color="gray"
              onClick={() => fijarCreando(false)}
            >
              Cancelar
            </Button>
          </Group>
        ) : (
          <Button
            leftSection={<VscAdd size={16} />}
            variant="light"
            onClick={() => fijarCreando(true)}
            fullWidth
          >
            Guardar como nuevo archivo
          </Button>
        )}

        <Divider />

        {/* Vista de versiones */}
        {versiones_id && archivo_con_versiones ? (
          <Stack gap="sm">
            <Group justify="space-between">
              <Group gap="xs">
                <VscHistory size={16} />
                <Text size="sm" fw={600}>
                  Versiones de &quot;{archivo_con_versiones.nombre}&quot;
                </Text>
              </Group>
              <Group gap="xs">
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="red"
                  onClick={() => manejar_limpiar_versiones(versiones_id)}
                  disabled={archivo_con_versiones.versiones.length <= 1}
                >
                  Limpiar antiguas
                </Button>
                <Button
                  size="compact-xs"
                  variant="subtle"
                  onClick={() => fijarVersionesId(null)}
                >
                  Volver
                </Button>
              </Group>
            </Group>

            <ScrollArea style={{ maxHeight: 400 }}>
              <Stack gap={0}>
                {archivo_con_versiones.versiones.map((version, indice) => (
                  <Box
                    key={version.id}
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--mantine-color-default-border)',
                      display: 'block',
                      width: '100%',
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Box>
                        <Group gap="xs">
                          <Text size="sm">
                            {dayjs(version.fecha).format('DD/MM/YYYY HH:mm:ss')}
                          </Text>
                          {indice === 0 && (
                            <Badge size="xs" variant="light" color="blue">
                              Actual
                            </Badge>
                          )}
                        </Group>
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {version.contenido.substring(0, 80)}...
                        </Text>
                      </Box>
                      <Group gap={4}>
                        <Tooltip label="Recuperar esta versión" withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            size="sm"
                            onClick={() =>
                              manejar_recuperar_version(versiones_id, version.id)
                            }
                          >
                            <VscFolderOpened size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Eliminar versión" withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            onClick={() =>
                              manejar_eliminar_version(versiones_id, version.id)
                            }
                            disabled={archivo_con_versiones.versiones.length <= 1}
                          >
                            <VscTrash size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>
                  </Box>
                ))}
              </Stack>
            </ScrollArea>
          </Stack>
        ) : (
          /* Lista de archivos */
          <ScrollArea style={{ maxHeight: 400 }}>
            {archivos.length === 0 ? (
              <Center p="xl">
                <Stack align="center" gap="xs">
                  <VscFile size={32} color="var(--mantine-color-dimmed)" />
                  <Text size="sm" c="dimmed">
                    No hay archivos guardados
                  </Text>
                  <Text size="xs" c="dimmed">
                    Crea un nuevo archivo para empezar
                  </Text>
                </Stack>
              </Center>
            ) : (
              <Stack gap={0}>
                {archivos.map((archivo) => (
                  <Box
                    key={archivo.id}
                    onClick={() => manejar_abrir(archivo)}
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--mantine-color-default-border)',
                      display: 'block',
                      width: '100%',
                      cursor: 'pointer',
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        {editando_id === archivo.id ? (
                          <TextInput
                            value={nombre_edicion}
                            onChange={(e) => fijarNombreEdicion(e.currentTarget.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') manejar_renombrar(archivo.id);
                              if (e.key === 'Escape') fijarEditandoId(null);
                            }}
                            onBlur={() => manejar_renombrar(archivo.id)}
                            size="xs"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <>
                            <Group gap="xs">
                              <VscFile size={14} />
                              <Text size="sm" fw={500} truncate>
                                {archivo.nombre}
                              </Text>
                              <Badge size="xs" variant="light" color="gray">
                                {archivo.versiones.length} ver.
                              </Badge>
                            </Group>
                            <Text size="xs" c="dimmed">
                              Modificado: {dayjs(archivo.fecha_modificacion).format('DD/MM/YYYY HH:mm')}
                            </Text>
                          </>
                        )}
                      </Box>

                      <Menu shadow="md" width={180} position="bottom-end">
                        <Menu.Target>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <VscEllipsis size={14} />
                          </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<VscEdit size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              fijarEditandoId(archivo.id);
                              fijarNombreEdicion(archivo.nombre);
                            }}
                          >
                            Renombrar
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<VscHistory size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              fijarVersionesId(archivo.id);
                            }}
                          >
                            Versiones ({archivo.versiones.length})
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            leftSection={<VscTrash size={14} />}
                            color="red"
                            onClick={(e) => {
                              e.stopPropagation();
                              manejar_eliminar(archivo.id);
                            }}
                          >
                            Eliminar
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Box>
                ))}
              </Stack>
            )}
          </ScrollArea>
        )}
      </Stack>
    </Modal>
  );
}
