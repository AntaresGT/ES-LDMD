/**
 * @archivo archivo-esldmd.ts
 * @descripcion Utilidades para importar/exportar archivos .esldmd.
 * Permite descargar el contenido del editor como archivo .esldmd
 * y cargar archivos .esldmd con validación del contenido.
 */

import { ejecutar_pipeline } from '@/dominio/pipeline-analisis';

/** Extensión del archivo del DSL */
const EXTENSION_ARCHIVO = '.esldmd';

/** Tipo MIME para archivos de texto plano */
const TIPO_MIME = 'text/plain';

/** Tamaño máximo permitido para importar (1 MB) */
const TAMANO_MAXIMO_BYTES = 1_048_576;

/**
 * Resultado de la validación de un archivo importado.
 */
export interface ResultadoValidacion {
  /** Si el contenido es válido (parseable) */
  valido: true;
  /** Contenido del archivo */
  contenido: string;
  /** Nombre del archivo (sin extensión) */
  nombre: string;
  /** Cantidad de errores encontrados */
  cantidad_errores: number;
  /** Cantidad de advertencias encontradas */
  cantidad_advertencias: number;
  /** Mensajes de error/advertencia */
  mensajes: string[];
}

/**
 * Resultado de un error de importación.
 */
export interface ErrorImportacion {
  /** Si el contenido es válido */
  valido: false;
  /** Mensaje de error */
  error: string;
}

/**
 * Descarga el contenido proporcionado como un archivo .esldmd.
 *
 * @param {string} contenido - Contenido del código fuente a descargar
 * @param {string} nombre_archivo - Nombre del archivo (sin extensión)
 */
export function descargar_archivo_esldmd(contenido: string, nombre_archivo: string): void {
  const nombre_limpio = nombre_archivo.trim() || 'diagrama';
  const nombre_final = nombre_limpio.endsWith(EXTENSION_ARCHIVO)
    ? nombre_limpio
    : `${nombre_limpio}${EXTENSION_ARCHIVO}`;

  const blob = new Blob([contenido], { type: TIPO_MIME });
  const url = URL.createObjectURL(blob);

  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre_final;
  enlace.style.display = 'none';

  document.body.appendChild(enlace);
  enlace.click();

  // Limpiar
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

/**
 * Lee un archivo del sistema de archivos del usuario.
 * Valida la extensión y el tamaño antes de leer.
 *
 * @param {File} archivo - Archivo seleccionado por el usuario
 * @returns {Promise<ResultadoValidacion | ErrorImportacion>} Resultado de la validación
 */
export async function importar_archivo_esldmd(
  archivo: File,
): Promise<ResultadoValidacion | ErrorImportacion> {
  // Validar extensión
  if (!archivo.name.toLowerCase().endsWith(EXTENSION_ARCHIVO)) {
    return {
      valido: false,
      error: `El archivo debe tener extensión ${EXTENSION_ARCHIVO}. Archivo recibido: "${archivo.name}"`,
    };
  }

  // Validar tamaño
  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    const tamano_mb = (archivo.size / 1_048_576).toFixed(2);
    return {
      valido: false,
      error: `El archivo es demasiado grande (${tamano_mb} MB). El tamaño máximo es 1 MB.`,
    };
  }

  // Validar que no esté vacío
  if (archivo.size === 0) {
    return {
      valido: false,
      error: 'El archivo está vacío.',
    };
  }

  // Leer contenido
  let contenido: string;
  try {
    contenido = await archivo.text();
  } catch {
    return {
      valido: false,
      error: 'No se pudo leer el contenido del archivo.',
    };
  }

  // Validar contenido con el pipeline
  return validar_contenido_esldmd(contenido, archivo.name);
}

/**
 * Valida el contenido de un archivo .esldmd usando el pipeline de análisis.
 *
 * @param {string} contenido - Contenido del archivo
 * @param {string} nombre_archivo - Nombre del archivo original
 * @returns {ResultadoValidacion} Resultado de la validación
 */
export function validar_contenido_esldmd(
  contenido: string,
  nombre_archivo: string,
): ResultadoValidacion {
  // Extraer nombre sin extensión
  const nombre = nombre_archivo.replace(/\.esldmd$/i, '');

  // Si el contenido está vacío o solo tiene whitespace, es válido pero vacío
  if (!contenido.trim()) {
    return {
      valido: true,
      contenido,
      nombre,
      cantidad_errores: 0,
      cantidad_advertencias: 0,
      mensajes: [],
    };
  }

  try {
    const resultado = ejecutar_pipeline(contenido);

    const errores = resultado.diagnosticos.filter((d) => d.severidad === 'error');
    const advertencias = resultado.diagnosticos.filter((d) => d.severidad === 'advertencia');

    const mensajes = resultado.diagnosticos.map(
      (d) => `[${d.severidad}] Línea ${d.rango.inicio.linea}: ${d.mensaje}`,
    );

    return {
      valido: true, // El archivo se puede cargar aunque tenga errores de sintaxis
      contenido,
      nombre,
      cantidad_errores: errores.length,
      cantidad_advertencias: advertencias.length,
      mensajes,
    };
  } catch {
    return {
      valido: true, // Permitir cargar incluso si el pipeline falla
      contenido,
      nombre,
      cantidad_errores: 0,
      cantidad_advertencias: 0,
      mensajes: ['No se pudo analizar el contenido del archivo.'],
    };
  }
}

/**
 * Abre un diálogo de selección de archivo .esldmd.
 * Retorna una promesa que se resuelve con el archivo seleccionado o null.
 *
 * @returns {Promise<File | null>} Archivo seleccionado o null si se canceló
 */
export function abrir_selector_archivo(): Promise<File | null> {
  return new Promise((resolver) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = EXTENSION_ARCHIVO;
    input.style.display = 'none';

    input.addEventListener('change', () => {
      const archivo = input.files?.[0] ?? null;
      resolver(archivo);
      document.body.removeChild(input);
    });

    // Manejar cancelación
    input.addEventListener('cancel', () => {
      resolver(null);
      document.body.removeChild(input);
    });

    document.body.appendChild(input);
    input.click();
  });
}
