/**
 * @archivo validador-sintactico.ts
 * @descripcion Validador sintáctico del lenguaje es-ldmd.
 * Detecta errores de estructura como tablas duplicadas,
 * bloques duplicados y otros problemas de forma.
 */

import {
  DocumentoAST,
  Diagnostico,
  Severidad,
} from '@/dominio/tipos';
import { MENSAJES_SINTACTICOS } from './mensajes';

/**
 * Ejecuta validaciones sintácticas sobre el AST.
 *
 * Detecta:
 * - Tablas con nombres duplicados
 * - Grupos con nombres duplicados
 * - Tablas sin columnas (advertencia)
 *
 * @param {DocumentoAST} ast - AST del documento a validar
 * @returns {Diagnostico[]} Lista de diagnósticos encontrados
 */
export function validar_sintaxis(ast: DocumentoAST): Diagnostico[] {
  const diagnosticos: Diagnostico[] = [];

  // Verificar tablas duplicadas
  verificar_tablas_duplicadas(ast, diagnosticos);

  // Verificar grupos duplicados
  verificar_grupos_duplicados(ast, diagnosticos);

  // Verificar tablas sin columnas
  verificar_tablas_vacias(ast, diagnosticos);

  return diagnosticos;
}

/**
 * Verifica si hay tablas con nombres duplicados.
 *
 * @param {DocumentoAST} ast - AST del documento
 * @param {Diagnostico[]} diagnosticos - Lista donde agregar diagnósticos
 */
function verificar_tablas_duplicadas(ast: DocumentoAST, diagnosticos: Diagnostico[]): void {
  const nombres_vistos = new Map<string, number>();

  for (const tabla of ast.tablas) {
    const nombre_completo = tabla.esquema ? `${tabla.esquema}.${tabla.nombre}` : tabla.nombre;

    if (nombres_vistos.has(nombre_completo)) {
      diagnosticos.push({
        mensaje: MENSAJES_SINTACTICOS.tabla_duplicada(nombre_completo),
        severidad: Severidad.ERROR,
        rango: tabla.rango,
      });
    } else {
      nombres_vistos.set(nombre_completo, 1);
    }
  }
}

/**
 * Verifica si hay grupos con nombres duplicados.
 *
 * @param {DocumentoAST} ast - AST del documento
 * @param {Diagnostico[]} diagnosticos - Lista donde agregar diagnósticos
 */
function verificar_grupos_duplicados(ast: DocumentoAST, diagnosticos: Diagnostico[]): void {
  const nombres_vistos = new Set<string>();

  for (const grupo of ast.grupos) {
    if (nombres_vistos.has(grupo.nombre)) {
      diagnosticos.push({
        mensaje: MENSAJES_SINTACTICOS.grupo_duplicado(grupo.nombre),
        severidad: Severidad.ERROR,
        rango: grupo.rango,
      });
    } else {
      nombres_vistos.add(grupo.nombre);
    }
  }
}

/**
 * Verifica si hay tablas sin columnas (advertencia informativa).
 *
 * @param {DocumentoAST} ast - AST del documento
 * @param {Diagnostico[]} diagnosticos - Lista donde agregar diagnósticos
 */
function verificar_tablas_vacias(ast: DocumentoAST, diagnosticos: Diagnostico[]): void {
  for (const tabla of ast.tablas) {
    if (tabla.columnas.length === 0) {
      diagnosticos.push({
        mensaje: `La tabla '${tabla.nombre}' no tiene columnas definidas.`,
        severidad: Severidad.ADVERTENCIA,
        rango: tabla.rango,
      });
    }
  }
}
