/**
 * @archivo tipos.ts
 * @descripcion Definiciones de tipos e interfaces del dominio del lenguaje es-ldmd.
 * Contiene todas las estructuras del AST, modelo de datos y diagnósticos.
 */

// ============================================================
// Tokens
// ============================================================

/**
 * Posición en el código fuente (línea y columna).
 */
export interface Posicion {
  /** Número de línea (1-indexado) */
  linea: number;
  /** Número de columna (1-indexado) */
  columna: number;
}

/**
 * Rango en el código fuente (inicio y fin).
 */
export interface Rango {
  /** Posición de inicio */
  inicio: Posicion;
  /** Posición de fin */
  fin: Posicion;
}

/**
 * Token producido por el tokenizador.
 */
export interface Token {
  /** Tipo del token */
  tipo: TipoToken;
  /** Valor textual del token */
  valor: string;
  /** Posición del token en el código fuente */
  posicion: Posicion;
}

/**
 * Tipos de token del lenguaje es-ldmd.
 */
export enum TipoToken {
  // Palabras clave
  TABLA = 'TABLA',
  GRUPO = 'GRUPO',
  NOTA = 'NOTA',
  INDICES = 'INDICES',
  PRIMARIA = 'PRIMARIA',
  FORANEA = 'FORANEA',

  // Opciones
  NO_NULO = 'NO_NULO',
  INCREMENTO = 'INCREMENTO',
  POR_DEFECTO = 'POR_DEFECTO',
  ELIMINACION_CASCADA = 'ELIMINACION_CASCADA',
  ACTUALIZACION_CASCADA = 'ACTUALIZACION_CASCADA',

  // Literales
  IDENTIFICADOR = 'IDENTIFICADOR',
  CADENA = 'CADENA',
  EXPRESION = 'EXPRESION',
  NUMERO = 'NUMERO',

  // Delimitadores
  LLAVE_ABIERTA = 'LLAVE_ABIERTA',
  LLAVE_CERRADA = 'LLAVE_CERRADA',
  PARENTESIS_ABIERTO = 'PARENTESIS_ABIERTO',
  PARENTESIS_CERRADO = 'PARENTESIS_CERRADO',
  CORCHETE_ABIERTO = 'CORCHETE_ABIERTO',
  CORCHETE_CERRADO = 'CORCHETE_CERRADO',
  DOS_PUNTOS = 'DOS_PUNTOS',
  COMA = 'COMA',
  PUNTO = 'PUNTO',

  // Especiales
  COMENTARIO = 'COMENTARIO',
  FIN_DE_ARCHIVO = 'FIN_DE_ARCHIVO',
  DESCONOCIDO = 'DESCONOCIDO',
}

// ============================================================
// AST (Árbol de Sintaxis Abstracta)
// ============================================================

/**
 * Opción de una columna (entre corchetes).
 * Ejemplo: [no nulo, nota: 'descripción']
 */
export interface OpcionColumna {
  /** Indica si la columna tiene restricción NOT NULL */
  no_nulo: boolean;
  /** Indica si la columna es auto-incremental (SERIAL en PostgreSQL, AUTO_INCREMENT en MariaDB) */
  incremento: boolean;
  /** Expresión SQL para el valor por defecto (se copia verbatim al SQL generado) */
  valor_defecto: string | null;
  /** Nota descriptiva de la columna */
  nota: string | null;
}

/**
 * Opción de una llave foránea (entre corchetes).
 * Ejemplo: [eliminación en cascada, actualización en cascada]
 */
export interface OpcionForanea {
  /** Indica si la eliminación es en cascada (ON DELETE CASCADE) */
  eliminacion_cascada: boolean;
  /** Indica si la actualización es en cascada (ON UPDATE CASCADE) */
  actualizacion_cascada: boolean;
}

/**
 * Columna de una tabla en el AST.
 */
export interface ColumnaAST {
  /** Nombre de la columna */
  nombre: string;
  /** Tipo de dato (puede incluir parámetros como texto(100)) */
  tipo: string;
  /** Parámetros del tipo (ej: '100' en texto(100)) */
  parametros_tipo: string[];
  /** Opciones de la columna */
  opciones: OpcionColumna;
  /** Rango en el código fuente */
  rango: Rango;
}

/**
 * Definición de índice en el AST.
 */
export interface IndiceAST {
  /** Columnas incluidas en el índice */
  columnas: string[];
  /** Rango en el código fuente */
  rango: Rango;
}

/**
 * Definición de llave primaria en el AST.
 */
export interface PrimariaAST {
  /** Columnas de la llave primaria */
  columnas: string[];
  /** Rango en el código fuente */
  rango: Rango;
}

/**
 * Referencia foránea individual en el AST.
 */
export interface ReferenciaForanea {
  /** Columna local que es llave foránea */
  columna_local: string;
  /** Esquema de la tabla referenciada (opcional) */
  esquema_referencia: string | null;
  /** Tabla referenciada */
  tabla_referencia: string;
  /** Columnas referenciadas */
  columnas_referencia: string[];
  /** Opciones de cascada */
  opciones: OpcionForanea;
  /** Rango en el código fuente */
  rango: Rango;
}

/**
 * Bloque de llaves foráneas en el AST.
 */
export interface ForaneaAST {
  /** Lista de referencias foráneas */
  referencias: ReferenciaForanea[];
  /** Rango en el código fuente */
  rango: Rango;
}

/**
 * Tabla en el AST.
 */
export interface TablaAST {
  /** Nombre de la tabla */
  nombre: string;
  /** Esquema de la tabla (opcional) */
  esquema: string | null;
  /** Columnas de la tabla */
  columnas: ColumnaAST[];
  /** Definición de índices */
  indices: IndiceAST | null;
  /** Definición de llave primaria */
  primaria: PrimariaAST | null;
  /** Definición de llaves foráneas */
  foranea: ForaneaAST | null;
  /** Nota de la tabla */
  nota: string | null;
  /** Rango en el código fuente */
  rango: Rango;
}

/**
 * Grupo de tablas en el AST.
 */
export interface GrupoAST {
  /** Nombre del grupo */
  nombre: string;
  /** Nombres de las tablas en el grupo */
  tablas: string[];
  /** Rango en el código fuente */
  rango: Rango;
}

/**
 * Documento completo del AST (nodo raíz).
 */
export interface DocumentoAST {
  /** Tablas definidas en el documento */
  tablas: TablaAST[];
  /** Grupos definidos en el documento */
  grupos: GrupoAST[];
}

// ============================================================
// Diagnósticos
// ============================================================

/**
 * Severidad de un diagnóstico.
 */
export enum Severidad {
  ERROR = 'error',
  ADVERTENCIA = 'advertencia',
  INFORMACION = 'informacion',
}

/**
 * Diagnóstico (error, advertencia o información) del análisis.
 */
export interface Diagnostico {
  /** Mensaje descriptivo del diagnóstico */
  mensaje: string;
  /** Severidad del diagnóstico */
  severidad: Severidad;
  /** Rango en el código fuente */
  rango: Rango;
}

// ============================================================
// Resultado del análisis
// ============================================================

/**
 * Resultado completo del pipeline de análisis.
 * Contiene el AST y los diagnósticos encontrados.
 */
export interface ResultadoAnalisis {
  /** AST del documento analizado */
  ast: DocumentoAST;
  /** Lista de diagnósticos (errores, advertencias) */
  diagnosticos: Diagnostico[];
  /** Indica si el análisis encontró errores críticos */
  tiene_errores: boolean;
}
