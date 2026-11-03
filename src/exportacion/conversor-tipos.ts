/**
 * @archivo conversor-tipos.ts
 * @descripcion Conversor de tipos de datos del DSL es-ldmd a SQL.
 * Implementa el mapa oficial de conversión por motor de base de datos.
 */

import { MAPA_TIPOS_SQL, MAPA_TIPOS_PARAMETRIZADOS } from '@/dominio/constantes';

/**
 * Motores de base de datos soportados.
 */
export type MotorBD = 'postgresql' | 'mariadb' | 'mysql' | 'sqlserver' | 'sqlite';

/**
 * Identificadores de motor en el orden del selector de exportación.
 */
export const MOTORES_BD: readonly MotorBD[] = [
  'postgresql',
  'mariadb',
  'sqlserver',
  'mysql',
  'sqlite',
] as const;

const NOMBRES_MOTOR: Record<MotorBD, string> = {
  postgresql: 'PostgreSQL',
  mariadb: 'MariaDB',
  mysql: 'MySQL',
  sqlserver: 'SQL Server',
  sqlite: 'SQLite',
};

/**
 * Indica si el valor es un motor de base de datos soportado.
 *
 * @param {string} valor - Valor a comprobar
 * @returns {boolean} true si es un MotorBD
 */
export function es_motor_bd(valor: string): valor is MotorBD {
  return (MOTORES_BD as readonly string[]).includes(valor);
}

/**
 * Nombre visible del motor de base de datos.
 *
 * @param {MotorBD} motor - Motor de base de datos
 * @returns {string} Nombre para UI y comentarios SQL
 */
export function nombre_motor(motor: MotorBD): string {
  return NOMBRES_MOTOR[motor];
}

const MAPA_TIPOS_MYSQL: Record<string, string> = {
  ...MAPA_TIPOS_SQL,
  jsonb: 'JSON',
  uuid: 'CHAR(36)',
  fecha_hora: 'DATETIME',
  fecha_hora_zona: 'TIMESTAMP',
};

const MAPA_TIPOS_SQLSERVER: Record<string, string> = {
  entero: 'INT',
  texto: 'NVARCHAR(MAX)',
  fecha: 'DATE',
  'lógico': 'BIT',
  logico: 'BIT',
  log: 'BIT',
  decimal: 'DECIMAL',
  entero_grande: 'BIGINT',
  entero_pequeño: 'SMALLINT',
  flotante: 'FLOAT',
  fecha_hora: 'DATETIME2',
  hora: 'TIME',
  fecha_hora_zona: 'DATETIMEOFFSET',
  json: 'NVARCHAR(MAX)',
  jsonb: 'NVARCHAR(MAX)',
  uuid: 'UNIQUEIDENTIFIER',
};

const MAPA_TIPOS_SQLITE: Record<string, string> = {
  entero: 'INTEGER',
  texto: 'TEXT',
  fecha: 'TEXT',
  'lógico': 'INTEGER',
  logico: 'INTEGER',
  log: 'INTEGER',
  decimal: 'DECIMAL',
  entero_grande: 'BIGINT',
  entero_pequeño: 'SMALLINT',
  flotante: 'REAL',
  fecha_hora: 'TEXT',
  hora: 'TEXT',
  fecha_hora_zona: 'TEXT',
  json: 'TEXT',
  jsonb: 'TEXT',
  uuid: 'TEXT',
};

const MAPA_PARAMETRIZADOS_SQLSERVER: Record<string, string> = {
  texto: 'NVARCHAR',
  caracter: 'NCHAR',
};

/**
 * Convierte un tipo de dato del DSL es-ldmd a su equivalente SQL.
 *
 * Reglas de conversión:
 * 1. Tipos simples: se buscan en el mapa del motor (ej: entero → INTEGER)
 * 2. Tipos parametrizados: texto(n) → VARCHAR(n) o NVARCHAR(n)
 * 3. Tipo listado: listado(tipo) → TIPO[] (PostgreSQL), JSON, NVARCHAR(MAX) o TEXT
 * 4. Tipo mapa: mapa(clave, valor) → JSON, NVARCHAR(MAX) o TEXT
 * 5. Tipo enum: enum('v1','v2') → ENUM nativo, NVARCHAR(255) o TEXT
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

  const mapa = mapa_tipos(motor);

  // Tipo simple del mapa
  if (mapa[tipo]) {
    return mapa[tipo];
  }

  // Tipo no reconocido → passthrough
  return tipo;
}

/**
 * Indica si el motor expresa enum como CHECK y no como tipo ENUM nativo.
 *
 * @param {MotorBD} motor - Motor de base de datos
 * @returns {boolean} true para SQL Server y SQLite
 */
export function enum_usa_check(motor: MotorBD): boolean {
  return motor === 'sqlserver' || motor === 'sqlite';
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
  const parametrizados = mapa_parametrizados(motor);

  // Tipos parametrizados estándar: texto(n) → VARCHAR(n) / NVARCHAR(n)
  if (parametrizados[tipo]) {
    return `${parametrizados[tipo]}(${parametros.join(', ')})`;
  }

  // Tipo especial: listado(tipo)
  if (tipo === 'listado') {
    return convertir_listado(parametros, motor);
  }

  // Tipo especial: mapa(clave, valor)
  if (tipo === 'mapa') {
    return convertir_mapa(motor);
  }

  // Tipo especial: enum('v1', 'v2', ...)
  if (tipo === 'enum') {
    return convertir_enum(parametros, motor);
  }

  // Tipo con parámetros pero sin conversión especial → passthrough
  const mapa = mapa_tipos(motor);
  if (mapa[tipo]) {
    return `${mapa[tipo]}(${parametros.join(', ')})`;
  }

  // Passthrough completo: conservar tal cual
  return `${tipo}(${parametros.join(', ')})`;
}

/**
 * Mapa de tipos simples según el motor.
 *
 * @param {MotorBD} motor - Motor de base de datos
 * @returns {Record<string, string>} Mapa DSL → SQL
 */
function mapa_tipos(motor: MotorBD): Record<string, string> {
  switch (motor) {
    case 'mysql':
      return MAPA_TIPOS_MYSQL;
    case 'sqlserver':
      return MAPA_TIPOS_SQLSERVER;
    case 'sqlite':
      return MAPA_TIPOS_SQLITE;
    default:
      return MAPA_TIPOS_SQL;
  }
}

/**
 * Mapa de tipos parametrizados según el motor.
 *
 * @param {MotorBD} motor - Motor de base de datos
 * @returns {Record<string, string>} Mapa DSL → SQL
 */
function mapa_parametrizados(motor: MotorBD): Record<string, string> {
  if (motor === 'sqlserver') {
    return MAPA_PARAMETRIZADOS_SQLSERVER;
  }
  return MAPA_TIPOS_PARAMETRIZADOS;
}

/**
 * Convierte el tipo listado a su equivalente SQL.
 *
 * @param {string[]} parametros - Tipo interno del listado
 * @param {MotorBD} motor - Motor de base de datos destino
 * @returns {string} Tipo SQL para arrays
 */
function convertir_listado(parametros: string[], motor: MotorBD): string {
  if (motor === 'sqlserver') {
    return 'NVARCHAR(MAX)';
  }

  if (motor === 'sqlite') {
    return 'TEXT';
  }

  if (motor === 'mariadb' || motor === 'mysql') {
    return 'JSON';
  }

  // PostgreSQL: tipo[] — convertir el tipo interno
  const tipo_interno = parametros[0] || 'TEXT';
  const tipo_sql = MAPA_TIPOS_SQL[tipo_interno] || tipo_interno;
  return `${tipo_sql}[]`;
}

/**
 * Convierte el tipo mapa a su equivalente SQL.
 *
 * @param {MotorBD} motor - Motor de base de datos destino
 * @returns {string} Tipo SQL para mapas
 */
function convertir_mapa(motor: MotorBD): string {
  if (motor === 'sqlserver') {
    return 'NVARCHAR(MAX)';
  }
  if (motor === 'sqlite') {
    return 'TEXT';
  }
  return 'JSON';
}

/**
 * Convierte el tipo enum a su equivalente SQL.
 *
 * SQL Server y SQLite no tienen ENUM nativo: el CHECK se genera en el DDL.
 *
 * @param {string[]} parametros - Valores del enum
 * @param {MotorBD} motor - Motor de base de datos destino
 * @returns {string} Tipo SQL para enum
 */
function convertir_enum(parametros: string[], motor: MotorBD): string {
  if (motor === 'sqlserver') {
    return 'NVARCHAR(255)';
  }
  if (motor === 'sqlite') {
    return 'TEXT';
  }
  return `ENUM(${parametros.join(', ')})`;
}
