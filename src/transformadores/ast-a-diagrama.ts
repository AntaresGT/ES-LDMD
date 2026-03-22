/**
 * @archivo ast-a-diagrama.ts
 * @descripcion Transformador de AST a modelo de renderizado de diagrama.
 * Convierte las tablas y relaciones del AST en nodos y aristas visuales.
 */

import { DocumentoAST, TablaAST, ReferenciaForanea } from '@/dominio/tipos';

// ============================================================
// Tipos del modelo de diagrama
// ============================================================

/**
 * Columna visual de un nodo de tabla.
 */
export interface ColumnaDiagrama {
  /** Nombre de la columna */
  nombre: string;
  /** Tipo de dato (en español) */
  tipo: string;
  /** Indica si es parte de la llave primaria */
  es_primaria: boolean;
  /** Indica si es llave foránea */
  es_foranea: boolean;
  /** Indica si tiene restricción NOT NULL */
  no_nulo: boolean;
  /** Nota de la columna */
  nota: string | null;
}

/**
 * Nodo visual que representa una tabla en el diagrama.
 */
export interface NodoDiagrama {
  /** ID único del nodo */
  id: string;
  /** Nombre de la tabla */
  nombre: string;
  /** Esquema de la tabla */
  esquema: string | null;
  /** Columnas de la tabla */
  columnas: ColumnaDiagrama[];
  /** Nota de la tabla */
  nota: string | null;
  /** Grupo al que pertenece (si existe) */
  grupo: string | null;
  /** Posición X en el canvas */
  x: number;
  /** Posición Y en el canvas */
  y: number;
  /** Ancho calculado */
  ancho: number;
  /** Alto calculado */
  alto: number;
}

/**
 * Tipo de cardinalidad de una relación.
 * - '1:1' — uno a uno (FK es también PK)
 * - '1:N' — uno a muchos (relación FK estándar)
 * - 'N:N' — muchos a muchos (tabla puente con PKs compuestas que son FKs)
 */
export type TipoCardinalidad = '1:1' | '1:N' | 'N:N';

/**
 * Arista que representa una relación foránea entre tablas.
 */
export interface AristaDiagrama {
  /** ID único de la arista */
  id: string;
  /** ID del nodo origen (tabla que contiene la FK) */
  nodo_origen: string;
  /** Nombre de la columna origen (FK) */
  columna_origen: string;
  /** ID del nodo destino (tabla referenciada) */
  nodo_destino: string;
  /** Nombre(s) de la(s) columna(s) destino */
  columnas_destino: string[];
  /** Tiene eliminación en cascada */
  eliminacion_cascada: boolean;
  /** Tiene actualización en cascada */
  actualizacion_cascada: boolean;
  /** Tipo de cardinalidad de la relación */
  cardinalidad: TipoCardinalidad;
}

/**
 * Grupo visual en el diagrama.
 */
export interface GrupoDiagrama {
  /** Nombre del grupo */
  nombre: string;
  /** IDs de nodos que pertenecen al grupo */
  nodos: string[];
  /** Color del grupo (se asigna automáticamente) */
  color: string;
}

/**
 * Modelo completo del diagrama para renderizado.
 */
export interface ModeloDiagrama {
  /** Nodos (tablas) del diagrama */
  nodos: NodoDiagrama[];
  /** Aristas (relaciones) del diagrama */
  aristas: AristaDiagrama[];
  /** Grupos del diagrama */
  grupos: GrupoDiagrama[];
}

/** Colores disponibles para grupos */
const COLORES_GRUPOS = [
  '#228be640', '#40c05740', '#fab00540', '#fa525240',
  '#be4bdb40', '#7950f240', '#15aabf40', '#82c91e40',
];

/**
 * Transforma un AST del DSL es-ldmd en un modelo de diagrama renderizable.
 *
 * @param {DocumentoAST} ast - AST del documento
 * @returns {ModeloDiagrama} Modelo de diagrama listo para renderizar
 */
export function ast_a_diagrama(ast: DocumentoAST): ModeloDiagrama {
  const nodos: NodoDiagrama[] = [];
  const aristas: AristaDiagrama[] = [];
  const grupos: GrupoDiagrama[] = [];

  // Mapa de grupo → tabla para asignación rápida
  const mapa_grupo_tabla = new Map<string, string>();
  for (const grupo of ast.grupos) {
    for (const tabla of grupo.tablas) {
      mapa_grupo_tabla.set(tabla, grupo.nombre);
    }
  }

  // Crear nodos a partir de tablas
  for (const tabla of ast.tablas) {
    const nodo = crear_nodo_desde_tabla(tabla, mapa_grupo_tabla);
    nodos.push(nodo);
  }

  // Crear aristas a partir de foráneas
  const mapa_nodos = new Map(nodos.map((n) => [n.nombre, n]));

  for (const tabla of ast.tablas) {
    if (tabla.foranea) {
      for (const ref of tabla.foranea.referencias) {
        const cardinalidad = determinar_cardinalidad(tabla, ref);
        const arista = crear_arista_desde_referencia(tabla, ref, mapa_nodos, cardinalidad);
        if (arista) aristas.push(arista);
      }
    }
  }

  // Crear grupos
  for (let i = 0; i < ast.grupos.length; i++) {
    const grupo_ast = ast.grupos[i];
    grupos.push({
      nombre: grupo_ast.nombre,
      nodos: grupo_ast.tablas.filter((t) => mapa_nodos.has(t)),
      color: COLORES_GRUPOS[i % COLORES_GRUPOS.length],
    });
  }

  return { nodos, aristas, grupos };
}

/**
 * Crea un nodo de diagrama a partir de una tabla del AST.
 */
function crear_nodo_desde_tabla(
  tabla: TablaAST,
  mapa_grupo_tabla: Map<string, string>,
): NodoDiagrama {
  const columnas_primaria = new Set(tabla.primaria?.columnas || []);
  const columnas_foranea = new Set(
    tabla.foranea?.referencias.map((r) => r.columna_local) || [],
  );

  const columnas: ColumnaDiagrama[] = tabla.columnas.map((col) => ({
    nombre: col.nombre,
    tipo: col.parametros_tipo.length > 0
      ? `${col.tipo}(${col.parametros_tipo.join(', ')})`
      : col.tipo,
    es_primaria: columnas_primaria.has(col.nombre),
    es_foranea: columnas_foranea.has(col.nombre),
    no_nulo: col.opciones.no_nulo,
    nota: col.opciones.nota,
  }));

  // Calcular dimensiones basadas en el contenido
  const ancho_nombre = Math.max(tabla.nombre.length * 9 + 40, 200);
  const ancho_columnas = columnas.reduce((max, col) => {
    const ancho_col = (col.nombre.length + col.tipo.length + 6) * 8 + 60;
    return Math.max(max, ancho_col);
  }, 0);
  const ancho = Math.max(ancho_nombre, ancho_columnas, 200);
  const alto = 36 + columnas.length * 28 + 8;

  return {
    id: tabla.nombre,
    nombre: tabla.nombre,
    esquema: tabla.esquema,
    columnas,
    nota: tabla.nota,
    grupo: mapa_grupo_tabla.get(tabla.nombre) || null,
    x: 0,
    y: 0,
    ancho,
    alto,
  };
}

/**
 * Determina el tipo de cardinalidad de una relación foránea.
 *
 * - 1:1 → la columna FK es también PK de la tabla origen
 * - N:N → la tabla es una tabla puente (todas las PKs son FKs)
 * - 1:N → relación estándar (caso por defecto)
 */
function determinar_cardinalidad(
  tabla: TablaAST,
  ref: ReferenciaForanea,
): TipoCardinalidad {
  const columnas_primaria = new Set(tabla.primaria?.columnas || []);

  // Si la FK no es parte de la PK → relación estándar 1:N
  if (!columnas_primaria.has(ref.columna_local)) {
    return '1:N';
  }

  // La FK es parte de la PK. ¿Es tabla puente (N:N)?
  if (tabla.foranea && columnas_primaria.size > 1) {
    const columnas_fk = new Set(
      tabla.foranea.referencias.map((r) => r.columna_local),
    );
    const todas_pk_son_fk = [...columnas_primaria].every((col) =>
      columnas_fk.has(col),
    );
    if (todas_pk_son_fk) {
      return 'N:N';
    }
  }

  // FK es PK pero no es tabla puente → 1:1
  return '1:1';
}

/**
 * Crea una arista de diagrama a partir de una referencia foránea.
 */
function crear_arista_desde_referencia(
  tabla: TablaAST,
  ref: ReferenciaForanea,
  mapa_nodos: Map<string, NodoDiagrama>,
  cardinalidad: TipoCardinalidad,
): AristaDiagrama | null {
  const tabla_destino = ref.tabla_referencia;
  if (!mapa_nodos.has(tabla_destino) && !mapa_nodos.has(tabla.nombre)) {
    return null;
  }

  return {
    id: `${tabla.nombre}.${ref.columna_local}->${tabla_destino}`,
    nodo_origen: tabla.nombre,
    columna_origen: ref.columna_local,
    nodo_destino: tabla_destino,
    columnas_destino: ref.columnas_referencia,
    eliminacion_cascada: ref.opciones.eliminacion_cascada,
    actualizacion_cascada: ref.opciones.actualizacion_cascada,
    cardinalidad,
  };
}
