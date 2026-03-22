/**
 * @archivo exportar-imagen.ts
 * @descripcion Utilidades para exportar el diagrama como imagen.
 * Soporta PNG, SVG (como bitmap embebido), y WEBP.
 */

import { ModeloDiagrama } from '@/transformadores/ast-a-diagrama';
import { ColoresTema, COLORES_OSCURO, COLORES_CLARO } from '@/renderizado/utilidades-canvas';
import { renderizar_para_exportacion } from '@/renderizado/motor-diagrama';

/**
 * Formatos de imagen soportados para exportación.
 */
export type FormatoImagen = 'png' | 'svg' | 'webp';

/**
 * Opciones de exportación de imagen.
 */
export interface OpcionesExportarImagen {
  /** Formato de la imagen */
  formato: FormatoImagen;
  /** Color de fondo (null = transparente) */
  color_fondo: string | null;
  /** Factor de escala (1 = normal, 2 = retina) */
  escala: number;
  /** Usar tema oscuro o claro */
  tema_oscuro: boolean;
}

/**
 * Resultado de la exportación de imagen.
 */
export interface ResultadoExportacion {
  /** Blob de la imagen generada */
  blob: Blob;
  /** URL de objeto para previsualización */
  url: string;
  /** Nombre de archivo sugerido */
  nombre_archivo: string;
  /** Ancho de la imagen */
  ancho: number;
  /** Alto de la imagen */
  alto: number;
}

/**
 * Exporta el diagrama como imagen en el formato especificado.
 *
 * @param {ModeloDiagrama} modelo - Modelo del diagrama a exportar
 * @param {OpcionesExportarImagen} opciones - Opciones de exportación
 * @returns {Promise<ResultadoExportacion>} Resultado con blob, URL y metadatos
 */
export async function exportar_imagen(
  modelo: ModeloDiagrama,
  opciones: OpcionesExportarImagen,
): Promise<ResultadoExportacion> {
  const colores: ColoresTema = opciones.tema_oscuro ? COLORES_OSCURO : COLORES_CLARO;

  // Renderizar en canvas offscreen
  const canvas = renderizar_para_exportacion(
    modelo,
    colores,
    opciones.color_fondo,
    opciones.escala,
  );

  // Determinar tipo MIME y extensión
  const { tipo_mime, extension } = obtener_tipo_mime(opciones.formato);

  // Convertir canvas a blob
  const blob = await canvas_a_blob(canvas, tipo_mime);

  const url = URL.createObjectURL(blob);
  const nombre_archivo = `diagrama.${extension}`;

  return {
    blob,
    url,
    nombre_archivo,
    ancho: canvas.width,
    alto: canvas.height,
  };
}

/**
 * Genera una previsualización (thumbnail) del diagrama.
 *
 * @param {ModeloDiagrama} modelo - Modelo del diagrama
 * @param {OpcionesExportarImagen} opciones - Opciones de exportación
 * @returns {Promise<string>} URL de datos de la previsualización
 */
export async function generar_previsualizacion(
  modelo: ModeloDiagrama,
  opciones: OpcionesExportarImagen,
): Promise<string> {
  const colores: ColoresTema = opciones.tema_oscuro ? COLORES_OSCURO : COLORES_CLARO;

  // Renderizar a escala reducida para preview
  const canvas = renderizar_para_exportacion(
    modelo,
    colores,
    opciones.color_fondo,
    1, // Escala 1x para preview
  );

  return canvas.toDataURL('image/png');
}

/**
 * Descarga un blob como archivo.
 *
 * @param {Blob} blob - Blob a descargar
 * @param {string} nombre_archivo - Nombre del archivo
 */
export function descargar_blob(blob: Blob, nombre_archivo: string): void {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre_archivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

/**
 * Obtiene el tipo MIME y extensión para un formato de imagen.
 *
 * @param {FormatoImagen} formato - Formato de imagen
 * @returns {{ tipo_mime: string; extension: string }} Tipo MIME y extensión
 */
function obtener_tipo_mime(formato: FormatoImagen): {
  tipo_mime: string;
  extension: string;
} {
  switch (formato) {
    case 'png':
      return { tipo_mime: 'image/png', extension: 'png' };
    case 'svg':
      return { tipo_mime: 'image/png', extension: 'svg.png' }; // SVG como bitmap embebido
    case 'webp':
      return { tipo_mime: 'image/webp', extension: 'webp' };
    default:
      return { tipo_mime: 'image/png', extension: 'png' };
  }
}

/**
 * Convierte un canvas a un Blob.
 *
 * @param {HTMLCanvasElement} canvas - Canvas a convertir
 * @param {string} tipo_mime - Tipo MIME de la imagen
 * @returns {Promise<Blob>} Blob de la imagen
 */
function canvas_a_blob(canvas: HTMLCanvasElement, tipo_mime: string): Promise<Blob> {
  return new Promise((resolver, rechazar) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolver(blob);
        } else {
          rechazar(new Error('Error al generar la imagen'));
        }
      },
      tipo_mime,
      0.95, // Calidad para WEBP
    );
  });
}
