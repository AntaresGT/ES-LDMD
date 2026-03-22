/**
 * @archivo ast-a-sql.ts
 * @descripcion Transformador de AST del DSL es-ldmd a código SQL DDL.
 * Genera sentencias CREATE TABLE con soporte para PostgreSQL y MariaDB.
 */

import { DocumentoAST, TablaAST, ColumnaAST, ReferenciaForanea } from '@/dominio/tipos';
import { convertir_tipo, MotorBD } from './conversor-tipos';

/**
 * Opciones de generación SQL.
 */
export interface OpcionesSQL {
  /** Motor de base de datos destino */
  motor: MotorBD;
  /** Incluir IF NOT EXISTS en CREATE TABLE */
  si_no_existe?: boolean;
  /** Incluir DROP TABLE IF EXISTS antes de cada CREATE */
  incluir_drop?: boolean;
}

/**
 * Transforma un AST del DSL es-ldmd en código SQL DDL.
 *
 * @param {DocumentoAST} ast - AST del documento
 * @param {OpcionesSQL} opciones - Opciones de generación
 * @returns {string} Código SQL generado
 */
export function ast_a_sql(ast: DocumentoAST, opciones: OpcionesSQL): string {
  const { motor, si_no_existe = false, incluir_drop = false } = opciones;
  const sentencias: string[] = [];

  // Header con comentario
  sentencias.push(generar_header(motor));

  for (const tabla of ast.tablas) {
    if (incluir_drop) {
      sentencias.push(generar_drop_table(tabla, motor));
    }
    sentencias.push(generar_create_table(tabla, motor, si_no_existe));
  }

  return sentencias.join('\n\n');
}

/**
 * Genera el header del archivo SQL con comentario informativo.
 *
 * @param {MotorBD} motor - Motor de base de datos
 * @returns {string} Comentario header
 */
function generar_header(motor: MotorBD): string {
  const nombre_motor = motor === 'postgresql' ? 'PostgreSQL' : 'MariaDB';
  return [
    `-- Generado por es-ldmd`,
    `-- Motor: ${nombre_motor}`,
    `-- Fecha: ${new Date().toISOString().split('T')[0]}`,
    '',
  ].join('\n');
}

/**
 * Genera una sentencia DROP TABLE IF EXISTS.
 *
 * @param {TablaAST} tabla - Tabla del AST
 * @param {MotorBD} _motor - Motor de base de datos
 * @returns {string} Sentencia DROP TABLE
 */
function generar_drop_table(tabla: TablaAST, _motor: MotorBD): string {
  const nombre_completo = obtener_nombre_completo(tabla);
  return `DROP TABLE IF EXISTS ${nombre_completo};`;
}

/**
 * Genera una sentencia CREATE TABLE completa.
 *
 * @param {TablaAST} tabla - Tabla del AST
 * @param {MotorBD} motor - Motor de base de datos
 * @param {boolean} si_no_existe - Incluir IF NOT EXISTS
 * @returns {string} Sentencia CREATE TABLE
 */
function generar_create_table(
  tabla: TablaAST,
  motor: MotorBD,
  si_no_existe: boolean,
): string {
  const nombre_completo = obtener_nombre_completo(tabla);
  const partes: string[] = [];

  // Definiciones de columnas
  for (const columna of tabla.columnas) {
    partes.push(generar_columna(columna, motor));
  }

  // Llave primaria
  if (tabla.primaria) {
    partes.push(`  PRIMARY KEY (${tabla.primaria.columnas.join(', ')})`);
  }

  // Llaves foráneas
  if (tabla.foranea) {
    for (const ref of tabla.foranea.referencias) {
      partes.push(generar_foranea(ref, motor));
    }
  }

  // Índices (como comentario, ya que CREATE INDEX es aparte)
  // Los índices se generan después del CREATE TABLE

  const if_not_exists = si_no_existe ? ' IF NOT EXISTS' : '';
  const cuerpo = partes.join(',\n');

  const lineas = [
    `CREATE TABLE${if_not_exists} ${nombre_completo} (`,
    cuerpo,
    `);`,
  ];

  // Agregar nota como comentario
  if (tabla.nota) {
    lineas.push('');
    if (motor === 'postgresql') {
      lineas.push(
        `COMMENT ON TABLE ${nombre_completo} IS '${escapar_cadena(tabla.nota)}';`,
      );
    } else {
      // MariaDB: ALTER TABLE ... COMMENT
      lineas.push(
        `ALTER TABLE ${nombre_completo} COMMENT = '${escapar_cadena(tabla.nota)}';`,
      );
    }
  }

  // Agregar notas de columnas como comentarios
  for (const columna of tabla.columnas) {
    if (columna.opciones.nota) {
      lineas.push('');
      if (motor === 'postgresql') {
        lineas.push(
          `COMMENT ON COLUMN ${nombre_completo}.${columna.nombre} IS '${escapar_cadena(columna.opciones.nota)}';`,
        );
      } else {
        // MariaDB: ALTER TABLE ... MODIFY COLUMN ... COMMENT
        const tipo_sql = convertir_tipo(columna.tipo, columna.parametros_tipo, motor);
        const restricciones_mod: string[] = [];
        if (columna.opciones.incremento) restricciones_mod.push('AUTO_INCREMENT');
        if (columna.opciones.no_nulo) restricciones_mod.push('NOT NULL');
        if (columna.opciones.valor_defecto !== null) restricciones_mod.push(`DEFAULT ${columna.opciones.valor_defecto}`);
        const sufijo = restricciones_mod.length > 0 ? ' ' + restricciones_mod.join(' ') : '';
        lineas.push(
          `ALTER TABLE ${nombre_completo} MODIFY COLUMN ${columna.nombre} ${tipo_sql}${sufijo} COMMENT '${escapar_cadena(columna.opciones.nota)}';`,
        );
      }
    }
  }

  // Generar CREATE INDEX por separado
  if (tabla.indices) {
    lineas.push('');
    for (let i = 0; i < tabla.indices.columnas.length; i++) {
      const columna_idx = tabla.indices.columnas[i];
      const nombre_indice = `idx_${tabla.nombre}_${columna_idx}`;
      lineas.push(
        `CREATE INDEX ${nombre_indice} ON ${nombre_completo} (${columna_idx});`,
      );
    }
  }

  return lineas.join('\n');
}

/**
 * Genera la definición de una columna SQL.
 *
 * @param {ColumnaAST} columna - Columna del AST
 * @param {MotorBD} motor - Motor de base de datos
 * @returns {string} Definición de columna SQL
 */
function generar_columna(columna: ColumnaAST, motor: MotorBD): string {
  let tipo_sql = convertir_tipo(columna.tipo, columna.parametros_tipo, motor);
  const restricciones: string[] = [];

  // Manejar incremento (auto-increment)
  if (columna.opciones.incremento) {
    if (motor === 'postgresql') {
      // PostgreSQL: usar tipos SERIAL
      tipo_sql = convertir_a_serial(tipo_sql);
    } else {
      // MariaDB: agregar AUTO_INCREMENT como restricción
      restricciones.push('AUTO_INCREMENT');
    }
  }

  if (columna.opciones.no_nulo) {
    restricciones.push('NOT NULL');
  }

  if (columna.opciones.valor_defecto !== null) {
    restricciones.push(`DEFAULT ${columna.opciones.valor_defecto}`);
  }

  const partes = [`  ${columna.nombre} ${tipo_sql}`];

  if (restricciones.length > 0) {
    partes.push(restricciones.join(' '));
  }

  return partes.join(' ');
}

/**
 * Convierte un tipo SQL entero a su variante SERIAL para PostgreSQL.
 *
 * @param {string} tipo_sql - Tipo SQL original (ej: INTEGER, BIGINT, SMALLINT)
 * @returns {string} Tipo SERIAL correspondiente o el tipo original con GENERATED ALWAYS
 */
function convertir_a_serial(tipo_sql: string): string {
  const mapa_serial: Record<string, string> = {
    INTEGER: 'SERIAL',
    BIGINT: 'BIGSERIAL',
    SMALLINT: 'SMALLSERIAL',
  };

  return mapa_serial[tipo_sql.toUpperCase()] ?? tipo_sql;
}

/**
 * Genera una restricción FOREIGN KEY.
 *
 * @param {ReferenciaForanea} ref - Referencia foránea del AST
 * @param {MotorBD} _motor - Motor de base de datos
 * @returns {string} Restricción FOREIGN KEY
 */
function generar_foranea(ref: ReferenciaForanea, _motor: MotorBD): string {
  const nombre_fk = `fk_${ref.columna_local}_${ref.tabla_referencia}`;
  const tabla_ref = ref.esquema_referencia
    ? `${ref.esquema_referencia}.${ref.tabla_referencia}`
    : ref.tabla_referencia;

  let sentencia =
    `  CONSTRAINT ${nombre_fk} FOREIGN KEY (${ref.columna_local}) ` +
    `REFERENCES ${tabla_ref} (${ref.columnas_referencia.join(', ')})`;

  if (ref.opciones.eliminacion_cascada) {
    sentencia += ' ON DELETE CASCADE';
  }

  if (ref.opciones.actualizacion_cascada) {
    sentencia += ' ON UPDATE CASCADE';
  }

  return sentencia;
}

/**
 * Obtiene el nombre completo de la tabla (con esquema si existe).
 *
 * @param {TablaAST} tabla - Tabla del AST
 * @returns {string} Nombre completo (esquema.tabla o tabla)
 */
function obtener_nombre_completo(tabla: TablaAST): string {
  return tabla.esquema ? `${tabla.esquema}.${tabla.nombre}` : tabla.nombre;
}

/**
 * Escapa comillas simples en una cadena para SQL.
 *
 * @param {string} cadena - Cadena a escapar
 * @returns {string} Cadena escapada
 */
function escapar_cadena(cadena: string): string {
  return cadena.replace(/'/g, "''");
}
