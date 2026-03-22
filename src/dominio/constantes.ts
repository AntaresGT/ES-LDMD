/**
 * @archivo constantes.ts
 * @descripcion Constantes del lenguaje de modelado es-ldmd.
 * Incluye palabras clave, mapeo de tipos y configuración del DSL.
 */

/**
 * Palabras clave del lenguaje que inician declaraciones de nivel superior.
 */
export const PALABRAS_CLAVE_NIVEL_SUPERIOR = ['Tabla', 'Grupo'] as const;

/**
 * Palabras clave de bloques internos de una tabla.
 */
export const PALABRAS_CLAVE_BLOQUES = ['indices', 'primaria', 'foranea'] as const;

/**
 * Palabra clave para notas.
 */
export const PALABRA_CLAVE_NOTA = 'Nota';

/**
 * Mapeo de tipos de datos del DSL en español a SQL.
 * Los tipos que no estén en este mapa se conservan tal cual (passthrough).
 */
export const MAPA_TIPOS_SQL: Record<string, string> = {
  entero: 'INTEGER',
  texto: 'TEXT',
  fecha: 'DATE',
  'lógico': 'BOOLEAN',
  logico: 'BOOLEAN',
  log: 'BOOLEAN',
  decimal: 'DECIMAL',
  entero_grande: 'BIGINT',
  entero_pequeño: 'SMALLINT',
  flotante: 'FLOAT',
  fecha_hora: 'TIMESTAMP',
  hora: 'TIME',
  fecha_hora_zona: 'TIMESTAMPTZ',
  json: 'JSON',
  jsonb: 'JSONB',
  uuid: 'UUID',
};

/**
 * Tipos parametrizados que requieren conversión especial.
 * Ejemplo: texto(100) → VARCHAR(100), caracter(10) → CHAR(10)
 */
export const MAPA_TIPOS_PARAMETRIZADOS: Record<string, string> = {
  texto: 'VARCHAR',
  caracter: 'CHAR',
};

/**
 * Tipos especiales que manejan sus parámetros de forma diferente.
 */
export const TIPOS_ESPECIALES = ['listado', 'mapa', 'enum'] as const;

/**
 * Versión de la aplicación.
 */
export const VERSION_APLICACION = '0.1.0';

/**
 * Nombre de la aplicación.
 */
export const NOMBRE_APLICACION = 'es-ldmd';

/**
 * Extensión de archivo del DSL.
 */
export const EXTENSION_ARCHIVO = '.esldmd';
