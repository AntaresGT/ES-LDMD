/**
 * @archivo ExportarImagen.tsx
 * @descripcion Panel de exportación de imagen del diagrama.
 * Permite seleccionar formato (PNG/SVG/WEBP), color de fondo,
 * escala y previsualizar antes de descargar.
 */
'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Text,
  Select,
  Button,
  Switch,
  Group,
  Stack,
  ColorInput,
  SegmentedControl,
  Center,
  Image,
  Loader,
} from '@mantine/core';
import { VscDesktopDownload, VscFileMedia } from 'react-icons/vsc';
import { UsarTema } from '@/hooks/UsarTema';
import { ModeloDiagrama } from '@/transformadores/ast-a-diagrama';
import {
  exportar_imagen,
  generar_previsualizacion,
  descargar_blob,
  FormatoImagen,
  OpcionesExportarImagen,
} from '@/exportacion/exportar-imagen';

/**
 * Propiedades del componente ExportarImagen.
 */
interface PropiedadesExportarImagen {
  /** Modelo del diagrama a exportar */
  modelo: ModeloDiagrama | null;
}

/**
 * Panel de exportación de imagen con opciones de formato,
 * color de fondo, escala y previsualización.
 *
 * @param {PropiedadesExportarImagen} props - Propiedades del componente
 * @returns {JSX.Element} Panel de exportación de imagen
 */
export function ExportarImagen({ modelo }: PropiedadesExportarImagen) {
  const { es_oscuro } = UsarTema();
  const [formato, fijarFormato] = useState<FormatoImagen>('png');
  const [fondo_transparente, fijarFondoTransparente] = useState(false);
  const [color_fondo, fijarColorFondo] = useState(es_oscuro ? '#1a1b1e' : '#f8f9fa');
  const [escala, fijarEscala] = useState('2');
  const [url_preview, fijarUrlPreview] = useState<string | null>(null);
  const [exportando, fijarExportando] = useState(false);
  const [generando_preview, fijarGenerandoPreview] = useState(false);
  const temporizador_ref = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tiene_contenido = modelo !== null && modelo.nodos.length > 0;

  /**
   * Opciones de exportación actuales.
   */
  const opciones_actuales: OpcionesExportarImagen = useMemo(() => ({
    formato,
    color_fondo: fondo_transparente ? null : color_fondo,
    escala: parseInt(escala, 10),
    tema_oscuro: es_oscuro,
  }), [formato, fondo_transparente, color_fondo, escala, es_oscuro]);

  /**
   * Genera la previsualización del diagrama.
   */
  const actualizar_preview = useCallback(async () => {
    if (!modelo || !tiene_contenido) {
      fijarUrlPreview(null);
      return;
    }

    fijarGenerandoPreview(true);
    try {
      const url = await generar_previsualizacion(modelo, opciones_actuales);
      fijarUrlPreview(url);
    } catch {
      fijarUrlPreview(null);
    } finally {
      fijarGenerandoPreview(false);
    }
  }, [modelo, opciones_actuales, tiene_contenido]);

  /**
   * Actualiza la previsualización con debounce al cambiar opciones.
   */
  useEffect(() => {
    if (temporizador_ref.current) {
      clearTimeout(temporizador_ref.current);
    }

    temporizador_ref.current = setTimeout(() => {
      actualizar_preview();
    }, 200);

    return () => {
      if (temporizador_ref.current) {
        clearTimeout(temporizador_ref.current);
      }
    };
  }, [actualizar_preview]);

  /**
   * Descarga la imagen con las opciones actuales.
   */
  const manejar_descargar = useCallback(async () => {
    if (!modelo || !tiene_contenido) return;

    fijarExportando(true);
    try {
      const resultado = await exportar_imagen(modelo, opciones_actuales);
      descargar_blob(resultado.blob, resultado.nombre_archivo);
      URL.revokeObjectURL(resultado.url);
    } catch {
      // Error silencioso - se podría mejorar con notificaciones
    } finally {
      fijarExportando(false);
    }
  }, [modelo, opciones_actuales, tiene_contenido]);

  /**
   * Maneja el cambio de formato.
   */
  const manejar_cambio_formato = useCallback((valor: string | null) => {
    if (valor === 'png' || valor === 'svg' || valor === 'webp') {
      fijarFormato(valor);
    }
  }, []);

  return (
    <Stack gap="md" p="md" style={{ height: '100%' }}>
      {/* Selector de formato */}
      <Select
        label="Formato de imagen"
        data={[
          { value: 'png', label: 'PNG' },
          { value: 'webp', label: 'WEBP' },
          { value: 'svg', label: 'SVG (bitmap)' },
        ]}
        value={formato}
        onChange={manejar_cambio_formato}
        size="sm"
        allowDeselect={false}
      />

      {/* Escala */}
      <Box>
        <Text size="sm" fw={500} mb={4}>
          Escala
        </Text>
        <SegmentedControl
          value={escala}
          onChange={fijarEscala}
          data={[
            { label: '1x', value: '1' },
            { label: '2x', value: '2' },
            { label: '3x', value: '3' },
          ]}
          size="sm"
          fullWidth
        />
      </Box>

      {/* Color de fondo */}
      <Stack gap="xs">
        <Switch
          label="Fondo transparente"
          checked={fondo_transparente}
          onChange={(evento) => fijarFondoTransparente(evento.currentTarget.checked)}
          size="sm"
        />

        {!fondo_transparente && (
          <ColorInput
            label="Color de fondo"
            value={color_fondo}
            onChange={fijarColorFondo}
            size="sm"
            swatches={[
              '#1a1b1e', '#25262b', '#2c2e33',
              '#ffffff', '#f8f9fa', '#f1f3f5',
              '#228be6', '#1c7ed6', '#1864ab',
            ]}
          />
        )}
      </Stack>

      {/* Previsualización */}
      <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Text size="xs" fw={600} c="dimmed" mb="xs">
          PREVISUALIZACIÓN
        </Text>
        <Box
          style={{
            flex: 1,
            border: '1px solid var(--mantine-color-default-border)',
            borderRadius: 'var(--mantine-radius-sm)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: fondo_transparente
              ? 'repeating-conic-gradient(#80808020 0% 25%, transparent 0% 50%) 50% / 16px 16px'
              : color_fondo,
            minHeight: 150,
          }}
        >
          {generando_preview ? (
            <Loader size="sm" />
          ) : url_preview && tiene_contenido ? (
            <Image
              src={url_preview}
              alt="Previsualización del diagrama"
              fit="contain"
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
          ) : (
            <Center>
              <Stack align="center" gap="xs">
                <VscFileMedia size={32} color="var(--mantine-color-dimmed)" />
                <Text size="xs" c="dimmed">
                  Sin diagrama para previsualizar
                </Text>
              </Stack>
            </Center>
          )}
        </Box>
      </Box>

      {/* Botón de descarga */}
      <Button
        fullWidth
        leftSection={<VscDesktopDownload size={16} />}
        onClick={manejar_descargar}
        loading={exportando}
        disabled={!tiene_contenido}
      >
        Descargar {formato.toUpperCase()}
      </Button>
    </Stack>
  );
}
