/**
 * @archivo mensajes.ts
 * @descripcion Catálogo de mensajes de error y advertencia en español
 * para la validación del lenguaje es-ldmd.
 */

/**
 * Mensajes de error sintáctico en español.
 */
export const MENSAJES_SINTACTICOS = {
  /**
   * Error cuando falta la llave de cierre de un bloque.
   * @param {string} bloque - Nombre del bloque (tabla, indices, etc.)
   * @returns {string} Mensaje de error
   */
  llave_sin_cerrar: (bloque: string): string =>
    `Falta la llave de cierre '}' para el bloque '${bloque}'.`,

  /**
   * Error cuando se encuentra un bloque duplicado.
   * @param {string} bloque - Nombre del bloque duplicado
   * @param {string} tabla - Nombre de la tabla
   * @returns {string} Mensaje de error
   */
  bloque_duplicado: (bloque: string, tabla: string): string =>
    `El bloque '${bloque}' ya fue definido en la tabla '${tabla}'. Solo se permite uno por tabla.`,

  /**
   * Error cuando se encuentra un identificador inválido.
   * @param {string} identificador - El identificador inválido
   * @returns {string} Mensaje de error
   */
  identificador_invalido: (identificador: string): string =>
    `El identificador '${identificador}' no es válido. Use letras, números y guiones bajos.`,

  /**
   * Error cuando se espera un token pero se encuentra otro.
   * @param {string} esperado - Lo que se esperaba
   * @param {string} encontrado - Lo que se encontró
   * @returns {string} Mensaje de error
   */
  token_inesperado: (esperado: string, encontrado: string): string =>
    `Se esperaba ${esperado}, pero se encontró '${encontrado}'.`,

  /**
   * Error cuando se define una tabla con nombre duplicado.
   * @param {string} nombre - Nombre de la tabla duplicada
   * @returns {string} Mensaje de error
   */
  tabla_duplicada: (nombre: string): string =>
    `La tabla '${nombre}' ya fue definida. Los nombres de tabla deben ser únicos.`,

  /**
   * Error cuando se define un grupo con nombre duplicado.
   * @param {string} nombre - Nombre del grupo duplicado
   * @returns {string} Mensaje de error
   */
  grupo_duplicado: (nombre: string): string =>
    `El grupo '${nombre}' ya fue definido. Los nombres de grupo deben ser únicos.`,
} as const;

/**
 * Mensajes de error semántico en español.
 */
export const MENSAJES_SEMANTICOS = {
  /**
   * Error cuando una columna en primaria/indices no existe en la tabla.
   * @param {string} columna - Nombre de la columna no encontrada
   * @param {string} bloque - Nombre del bloque (primaria, indices)
   * @param {string} tabla - Nombre de la tabla
   * @returns {string} Mensaje de error
   */
  columna_no_existe: (columna: string, bloque: string, tabla: string): string =>
    `La columna '${columna}' referenciada en '${bloque}' no existe en la tabla '${tabla}'.`,

  /**
   * Error cuando una foránea referencia una tabla inexistente.
   * @param {string} tabla - Nombre de la tabla referenciada
   * @param {string} tabla_origen - Nombre de la tabla que contiene la foránea
   * @returns {string} Mensaje de error
   */
  tabla_referenciada_no_existe: (tabla: string, tabla_origen: string): string =>
    `La tabla '${tabla}' referenciada en una llave foránea de '${tabla_origen}' no existe.`,

  /**
   * Error cuando la columna local de una foránea no existe.
   * @param {string} columna - Nombre de la columna local
   * @param {string} tabla - Nombre de la tabla
   * @returns {string} Mensaje de error
   */
  columna_foranea_no_existe: (columna: string, tabla: string): string =>
    `La columna '${columna}' usada como llave foránea no existe en la tabla '${tabla}'.`,

  /**
   * Error cuando un grupo referencia una tabla inexistente.
   * @param {string} tabla - Nombre de la tabla referenciada
   * @param {string} grupo - Nombre del grupo
   * @returns {string} Mensaje de error
   */
  tabla_en_grupo_no_existe: (tabla: string, grupo: string): string =>
    `La tabla '${tabla}' referenciada en el grupo '${grupo}' no existe.`,

  /**
   * Advertencia sobre un tipo de dato no reconocido.
   * @param {string} tipo - Tipo de dato no reconocido
   * @returns {string} Mensaje de advertencia
   */
  tipo_no_reconocido: (tipo: string): string =>
    `El tipo de dato '${tipo}' no es un tipo estándar del DSL. Se conservará tal cual en la exportación SQL.`,
} as const;
