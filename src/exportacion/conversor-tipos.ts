/**
 * @archivo conversor-tipos.ts
 * @descripcion Conversor de tipos de datos del DSL es-ldmd a SQL.
 * Implementa el mapa oficial de conversión para PostgreSQL y MariaDB.
 */

import { MAPA_TIPOS_SQL, MAPA_TIPOS_PARAMETRIZADOS } from '@/dominio/constantes';

/**
 * Motores de base de datos soportados.
 */
export type MotorBD = 'postgresql' | 'mariadb';

/**
 * Convierte un tipo de dato del DSL es-ldmd a su equivalente SQL.
 *
 * Reglas de conversión:
 * 1. Tipos simples: se buscan en MAPA_TIPOS_SQL (ej: entero → INTEGER)
 * 2. Tipos parametrizados: texto(n) → VARCHAR(n), caracter(n) → CHAR(n)
 * 3. Tipo listado: listado(tipo) → TIPO[] (PostgreSQL) o JSON (MariaDB)
 * 4. Tipo mapa: mapa(clave, valor) → JSON
 * 5. Tipo enum: enum('v1','v2') → tipo ENUM
 * 6. Passthrough: si no existe en el diccionario, se conserva tal cual
 *
 * @param {string} tipo - Tipo de dato en español
 * @param {string[]} parametros - Parámetros del tipo (ej: ['100'] para texto(100))
 * @param {MotorBD} motor - Motor de base de datos destino
 * @returns {string} Tipo de dato SQL equivalente
 */
export function convertir_tipo(
  tipo: string,
  parametros: string[],
  motor: MotorBD,
): string {
  // Tipos especiales que se procesan siempre (con o sin parámetros)
  if (tipo === 'listado' || tipo === 'mapa' || tipo === 'enum') {
    return convertir_tipo_parametrizado(tipo, parametros, motor);
  }

  // Tipo con parámetros
  if (parametros.length > 0) {
    return convertir_tipo_parametrizado(tipo, parametros, motor);
  }

  // Tipo simple del mapa
  if (MAPA_TIPOS_SQL[tipo]) {
    return MAPA_TIPOS_SQL[tipo];
  }

  // Tipo no reconocido → passthrough
  return tipo;
}

/**
 * Convierte un tipo parametrizado del DSL a SQL.
 *
 * @param {string} tipo - Nombre del tipo base
 * @param {string[]} parametros - Parámetros del tipo
 * @param {MotorBD} motor - Motor de base de datos destino
 * @returns {string} Tipo SQL parametrizado
 */
function convertir_tipo_parametrizado(
  tipo: string,
  parametros: string[],
  motor: MotorBD,
): string {
  // Tipos parametrizados estándar: texto(n) → VARCHAR(n), caracter(n) → CHAR(n)
  if (MAPA_TIPOS_PARAMETRIZADOS[tipo]) {
    return `${MAPA_TIPOS_PARAMETRIZADOS[tipo]}(${parametros.join(', ')})`;
  }

  // Tipo especial: listado(tipo) → TIPO[] (PostgreSQL) o JSON (MariaDB)
  if (tipo === 'listado') {
    return convertir_listado(parametros, motor);
  }

  // Tipo especial: mapa(clave, valor) → JSON
  if (tipo === 'mapa') {
    return 'JSON';
  }

  // Tipo especial: enum('v1', 'v2', ...)
  if (tipo === 'enum') {
    return `ENUM(${parametros.join(', ')})`;
  }

  // Tipo con parámetros pero sin conversión especial → passthrough
  // Buscar si el tipo base tiene conversión
  if (MAPA_TIPOS_SQL[tipo]) {
    return `${MAPA_TIPOS_SQL[tipo]}(${parametros.join(', ')})`;
  }

  // Passthrough completo: conservar tal cual
  return `${tipo}(${parametros.join(', ')})`;
}

/**
 * Convierte el tipo listado a su equivalente SQL.
 *
 * @param {string[]} parametros - Tipo interno del listado
 * @param {MotorBD} motor - Motor de base de datos destino
 * @returns {string} Tipo SQL para arrays
 */
function convertir_listado(parametros: string[], motor: MotorBD): string {
  if (motor === 'mariadb') {
    // MariaDB no soporta arrays nativos
    return 'JSON';
  }

  // PostgreSQL: tipo[] — convertir el tipo interno
  const tipo_interno = parametros[0] || 'TEXT';
  const tipo_sql = MAPA_TIPOS_SQL[tipo_interno] || tipo_interno;
  return `${tipo_sql}[]`;
}
