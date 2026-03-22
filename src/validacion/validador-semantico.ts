/**
 * @archivo validador-semantico.ts
 * @descripcion Validador semántico del lenguaje es-ldmd.
 * Verifica referencias cruzadas: columnas en primaria/indices que existen,
 * tablas referenciadas en foráneas, tablas en grupos, etc.
 */

import {
  DocumentoAST,
  Diagnostico,
  Severidad,
} from '@/dominio/tipos';
import { MAPA_TIPOS_SQL, MAPA_TIPOS_PARAMETRIZADOS, TIPOS_ESPECIALES } from '@/dominio/constantes';
import { MENSAJES_SEMANTICOS } from './mensajes';

/**
 * Ejecuta validaciones semánticas sobre el AST.
 *
 * Detecta:
 * - Columnas referenciadas en primaria/indices que no existen en la tabla
 * - Columnas locales de foráneas que no existen en la tabla
 * - Tablas referenciadas en foráneas que no existen en el documento
 * - Tablas referenciadas en grupos que no existen en el documento
 * - Tipos de datos no reconocidos (advertencia)
 *
 * @param {DocumentoAST} ast - AST del documento a validar
 * @returns {Diagnostico[]} Lista de diagnósticos encontrados
 */
export function validar_semantica(ast: DocumentoAST): Diagnostico[] {
  const diagnosticos: Diagnostico[] = [];

  // Construir mapa de tablas para búsqueda rápida
  const mapa_tablas = construir_mapa_tablas(ast);

  // Validar cada tabla
  for (const tabla of ast.tablas) {
    const nombres_columnas = new Set(tabla.columnas.map((c) => c.nombre));
    const nombre_completo = tabla.esquema ? `${tabla.esquema}.${tabla.nombre}` : tabla.nombre;

    // Validar columnas en primaria
    validar_columnas_bloque(
      tabla.primaria?.columnas || [],
      nombres_columnas,
      'primaria',
      nombre_completo,
      tabla.primaria?.rango || tabla.rango,
      diagnosticos,
    );

    // Validar columnas en indices
    validar_columnas_bloque(
      tabla.indices?.columnas || [],
      nombres_columnas,
      'indices',
      nombre_completo,
      tabla.indices?.rango || tabla.rango,
      diagnosticos,
    );

    // Validar foráneas
    if (tabla.foranea) {
      for (const ref of tabla.foranea.referencias) {
        // Verificar que la columna local existe
        if (!nombres_columnas.has(ref.columna_local)) {
          diagnosticos.push({
            mensaje: MENSAJES_SEMANTICOS.columna_foranea_no_existe(ref.columna_local, nombre_completo),
            severidad: Severidad.ERROR,
            rango: ref.rango,
          });
        }

        // Verificar que la tabla referenciada existe
        const nombre_tabla_ref = ref.esquema_referencia
          ? `${ref.esquema_referencia}.${ref.tabla_referencia}`
          : ref.tabla_referencia;

        if (!mapa_tablas.has(nombre_tabla_ref)) {
          diagnosticos.push({
            mensaje: MENSAJES_SEMANTICOS.tabla_referenciada_no_existe(nombre_tabla_ref, nombre_completo),
            severidad: Severidad.ERROR,
            rango: ref.rango,
          });
        }
      }
    }

    // Validar tipos de datos (advertencias)
    for (const columna of tabla.columnas) {
      if (!es_tipo_reconocido(columna.tipo)) {
        diagnosticos.push({
          mensaje: MENSAJES_SEMANTICOS.tipo_no_reconocido(columna.tipo),
          severidad: Severidad.INFORMACION,
          rango: columna.rango,
        });
      }
    }
  }

  // Validar grupos
  for (const grupo of ast.grupos) {
    for (const nombre_tabla of grupo.tablas) {
      if (!mapa_tablas.has(nombre_tabla)) {
        diagnosticos.push({
          mensaje: MENSAJES_SEMANTICOS.tabla_en_grupo_no_existe(nombre_tabla, grupo.nombre),
          severidad: Severidad.ERROR,
          rango: grupo.rango,
        });
      }
    }
  }

  return diagnosticos;
}

/**
 * Construye un mapa de nombres de tablas para búsqueda rápida.
 * Incluye tanto el nombre simple como el nombre con esquema.
 *
 * @param {DocumentoAST} ast - AST del documento
 * @returns {Map<string, boolean>} Mapa de nombres de tablas
 */
function construir_mapa_tablas(ast: DocumentoAST): Map<string, boolean> {
  const mapa = new Map<string, boolean>();

  for (const tabla of ast.tablas) {
    mapa.set(tabla.nombre, true);
    if (tabla.esquema) {
      mapa.set(`${tabla.esquema}.${tabla.nombre}`, true);
    }
  }

  return mapa;
}

/**
 * Valida que las columnas referenciadas en un bloque (primaria/indices) existan.
 *
 * @param {string[]} columnas_bloque - Columnas del bloque a validar
 * @param {Set<string>} columnas_tabla - Set de columnas disponibles en la tabla
 * @param {string} nombre_bloque - Nombre del bloque para mensajes de error
 * @param {string} nombre_tabla - Nombre de la tabla para mensajes de error
 * @param {import('@/dominio/tipos').Rango} rango - Rango del bloque en el código
 * @param {Diagnostico[]} diagnosticos - Lista donde agregar diagnósticos
 */
function validar_columnas_bloque(
  columnas_bloque: string[],
  columnas_tabla: Set<string>,
  nombre_bloque: string,
  nombre_tabla: string,
  rango: import('@/dominio/tipos').Rango,
  diagnosticos: Diagnostico[],
): void {
  for (const columna of columnas_bloque) {
    if (!columnas_tabla.has(columna)) {
      diagnosticos.push({
        mensaje: MENSAJES_SEMANTICOS.columna_no_existe(columna, nombre_bloque, nombre_tabla),
        severidad: Severidad.ERROR,
        rango,
      });
    }
  }
}

/**
 * Verifica si un tipo de dato es reconocido en el diccionario del DSL.
 *
 * @param {string} tipo - Tipo de dato a verificar
 * @returns {boolean} True si el tipo es reconocido
 */
function es_tipo_reconocido(tipo: string): boolean {
  // Tipos simples
  if (MAPA_TIPOS_SQL[tipo]) return true;

  // Tipos parametrizados (texto, caracter)
  if (MAPA_TIPOS_PARAMETRIZADOS[tipo]) return true;

  // Tipos especiales (listado, mapa, enum)
  if ((TIPOS_ESPECIALES as readonly string[]).includes(tipo)) return true;

  return false;
}
