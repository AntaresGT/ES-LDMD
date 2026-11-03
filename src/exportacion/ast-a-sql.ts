/**
 * @archivo ast-a-sql.ts
 * @descripcion Transformador de AST del DSL es-ldmd a código SQL DDL.
 * Genera sentencias CREATE TABLE para PostgreSQL, MariaDB, MySQL, SQL Server y SQLite.
 */

import { DocumentoAST, TablaAST, ColumnaAST, ReferenciaForanea } from '@/dominio/tipos';
import {
  convertir_tipo,
  enum_usa_check,
  MotorBD,
  nombre_motor,
} from './conversor-tipos';

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
  const lineas = [
    `-- Generado por es-ldmd`,
    `-- Motor: ${nombre_motor(motor)}`,
    `-- Fecha: ${new Date().toISOString().split('T')[0]}`,
    '',
  ];

  if (motor === 'sqlite') {
    lineas.push('PRAGMA foreign_keys = ON;', '');
  }

  return lineas.join('\n');
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
  const omitir_pk_tabla = sqlite_omitir_pk_tabla(tabla, motor);

  // Definiciones de columnas
  for (const columna of tabla.columnas) {
    partes.push(generar_columna(columna, tabla, motor));
  }

  // CHECK de enum para motores sin tipo ENUM nativo
  if (enum_usa_check(motor)) {
    for (const columna of tabla.columnas) {
      if (columna.tipo === 'enum') {
        partes.push(generar_check_enum(tabla, columna, motor));
      }
    }
  }

  // Llave primaria
  if (tabla.primaria && !omitir_pk_tabla) {
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

  const if_not_exists =
    si_no_existe && motor !== 'sqlserver' ? ' IF NOT EXISTS' : '';
  const cuerpo = partes.join(',\n');

  const lineas: string[] = [
    `CREATE TABLE${if_not_exists} ${nombre_completo} (`,
    cuerpo,
    `);`,
  ];

  if (motor === 'sqlite' && sqlite_tiene_incremento_invalido(tabla)) {
    lineas.push('');
    lineas.push(
      '-- SQLite: AUTOINCREMENT solo vale en INTEGER PRIMARY KEY de una columna',
    );
  }

  // Agregar nota como comentario
  if (tabla.nota) {
    lineas.push('');
    lineas.push(...generar_comentario_tabla(tabla, motor, nombre_completo));
  }

  // Agregar notas de columnas como comentarios
  for (const columna of tabla.columnas) {
    if (columna.opciones.nota) {
      lineas.push('');
      lineas.push(
        ...generar_comentario_columna(columna, tabla, motor, nombre_completo),
      );
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

  if (motor === 'sqlserver' && si_no_existe) {
    const object_id = nombre_object_id(tabla);
    return [
      `IF OBJECT_ID(N'${object_id}', N'U') IS NULL`,
      'BEGIN',
      ...lineas,
      'END',
    ].join('\n');
  }

  return lineas.join('\n');
}

/**
 * Genera la definición de una columna SQL.
 *
 * @param {ColumnaAST} columna - Columna del AST
 * @param {TablaAST} tabla - Tabla dueña de la columna
 * @param {MotorBD} motor - Motor de base de datos
 * @returns {string} Definición de columna SQL
 */
function generar_columna(
  columna: ColumnaAST,
  tabla: TablaAST,
  motor: MotorBD,
): string {
  let tipo_sql = convertir_tipo(columna.tipo, columna.parametros_tipo, motor);
  const restricciones: string[] = [];

  // Manejar incremento (auto-increment)
  if (columna.opciones.incremento) {
    if (motor === 'postgresql') {
      // PostgreSQL: usar tipos SERIAL
      tipo_sql = convertir_a_serial(tipo_sql);
    } else if (motor === 'sqlserver') {
      tipo_sql = `${tipo_sql} IDENTITY(1,1)`;
    } else if (motor === 'sqlite') {
      if (sqlite_usa_pk_autoincrement(tabla, columna)) {
        tipo_sql = 'INTEGER PRIMARY KEY AUTOINCREMENT';
      }
    } else {
      // MariaDB y MySQL: agregar AUTO_INCREMENT como restricción
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
 * Genera la restricción CHECK de un enum para SQL Server o SQLite.
 *
 * @param {TablaAST} tabla - Tabla dueña de la columna
 * @param {ColumnaAST} columna - Columna enum
 * @param {MotorBD} motor - Motor de base de datos
 * @returns {string} Restricción CHECK
 */
function generar_check_enum(
  tabla: TablaAST,
  columna: ColumnaAST,
  motor: MotorBD,
): string {
  const valores = columna.parametros_tipo.map((valor) =>
    motor === 'sqlserver' ? prefijo_n(valor) : valor,
  );
  const nombre = `ck_${tabla.nombre}_${columna.nombre}`;
  return `  CONSTRAINT ${nombre} CHECK (${columna.nombre} IN (${valores.join(', ')}))`;
}

/**
 * Genera el comentario de tabla según el motor.
 *
 * @param {TablaAST} tabla - Tabla del AST
 * @param {MotorBD} motor - Motor de base de datos
 * @param {string} nombre_completo - Nombre calificado de la tabla
 * @returns {string[]} Líneas SQL del comentario
 */
function generar_comentario_tabla(
  tabla: TablaAST,
  motor: MotorBD,
  nombre_completo: string,
): string[] {
  const nota = escapar_cadena(tabla.nota ?? '');

  if (motor === 'postgresql') {
    return [`COMMENT ON TABLE ${nombre_completo} IS '${nota}';`];
  }

  if (es_familia_mysql(motor)) {
    return [`ALTER TABLE ${nombre_completo} COMMENT = '${nota}';`];
  }

  if (motor === 'sqlserver') {
    return generar_extended_property(tabla, nota);
  }

  return [`-- ${tabla.nombre}: ${tabla.nota}`];
}

/**
 * Genera el comentario de columna según el motor.
 *
 * @param {ColumnaAST} columna - Columna del AST
 * @param {TablaAST} tabla - Tabla dueña de la columna
 * @param {MotorBD} motor - Motor de base de datos
 * @param {string} nombre_completo - Nombre calificado de la tabla
 * @returns {string[]} Líneas SQL del comentario
 */
function generar_comentario_columna(
  columna: ColumnaAST,
  tabla: TablaAST,
  motor: MotorBD,
  nombre_completo: string,
): string[] {
  const nota = escapar_cadena(columna.opciones.nota ?? '');

  if (motor === 'postgresql') {
    return [
      `COMMENT ON COLUMN ${nombre_completo}.${columna.nombre} IS '${nota}';`,
    ];
  }

  if (es_familia_mysql(motor)) {
    const tipo_sql = convertir_tipo(columna.tipo, columna.parametros_tipo, motor);
    const restricciones_mod: string[] = [];
    if (columna.opciones.incremento) restricciones_mod.push('AUTO_INCREMENT');
    if (columna.opciones.no_nulo) restricciones_mod.push('NOT NULL');
    if (columna.opciones.valor_defecto !== null) {
      restricciones_mod.push(`DEFAULT ${columna.opciones.valor_defecto}`);
    }
    const sufijo =
      restricciones_mod.length > 0 ? ' ' + restricciones_mod.join(' ') : '';
    return [
      `ALTER TABLE ${nombre_completo} MODIFY COLUMN ${columna.nombre} ${tipo_sql}${sufijo} COMMENT '${nota}';`,
    ];
  }

  if (motor === 'sqlserver') {
    return generar_extended_property(tabla, nota, columna.nombre);
  }

  return [`-- ${tabla.nombre}.${columna.nombre}: ${columna.opciones.nota}`];
}

/**
 * Genera sp_addextendedproperty para comentarios de SQL Server.
 *
 * @param {TablaAST} tabla - Tabla del AST
 * @param {string} valor - Texto ya escapado
 * @param {string} [columna] - Nombre de columna si aplica
 * @returns {string[]} Sentencia EXEC
 */
function generar_extended_property(
  tabla: TablaAST,
  valor: string,
  columna?: string,
): string[] {
  const esquema = tabla.esquema ?? 'dbo';
  const lineas = [
    `EXEC sys.sp_addextendedproperty`,
    `  @name = N'MS_Description',`,
    `  @value = N'${valor}',`,
    `  @level0type = N'SCHEMA', @level0name = N'${esquema}',`,
    `  @level1type = N'TABLE', @level1name = N'${tabla.nombre}'`,
  ];

  if (columna) {
    lineas[lineas.length - 1] += ',';
    lineas.push(`  @level2type = N'COLUMN', @level2name = N'${columna}'`);
  }

  lineas[lineas.length - 1] += ';';
  return lineas;
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
 * Nombre para OBJECT_ID de SQL Server. Sin esquema usa dbo.
 *
 * @param {TablaAST} tabla - Tabla del AST
 * @returns {string} esquema.tabla
 */
function nombre_object_id(tabla: TablaAST): string {
  const esquema = tabla.esquema ?? 'dbo';
  return `${esquema}.${tabla.nombre}`;
}

/**
 * Indica si MariaDB o MySQL.
 *
 * @param {MotorBD} motor - Motor de base de datos
 * @returns {boolean} true para MariaDB y MySQL
 */
function es_familia_mysql(motor: MotorBD): boolean {
  return motor === 'mariadb' || motor === 'mysql';
}

/**
 * Indica si SQLite debe poner PRIMARY KEY AUTOINCREMENT en la columna
 * y omitir la PRIMARY KEY de tabla.
 *
 * @param {TablaAST} tabla - Tabla del AST
 * @param {MotorBD} motor - Motor de base de datos
 * @returns {boolean} true si la PK de una columna lleva AUTOINCREMENT
 */
function sqlite_omitir_pk_tabla(tabla: TablaAST, motor: MotorBD): boolean {
  if (motor !== 'sqlite' || !tabla.primaria || tabla.primaria.columnas.length !== 1) {
    return false;
  }
  const nombre_pk = tabla.primaria.columnas[0];
  const columna = tabla.columnas.find((c) => c.nombre === nombre_pk);
  return columna?.opciones.incremento === true;
}

/**
 * Indica si la columna SQLite es INTEGER PRIMARY KEY AUTOINCREMENT.
 *
 * @param {TablaAST} tabla - Tabla del AST
 * @param {ColumnaAST} columna - Columna candidata
 * @returns {boolean} true si aplica AUTOINCREMENT
 */
function sqlite_usa_pk_autoincrement(
  tabla: TablaAST,
  columna: ColumnaAST,
): boolean {
  return (
    columna.opciones.incremento &&
    tabla.primaria !== null &&
    tabla.primaria.columnas.length === 1 &&
    tabla.primaria.columnas[0] === columna.nombre
  );
}

/**
 * Indica si hay un [incremento] que SQLite no puede expresar como AUTOINCREMENT.
 *
 * @param {TablaAST} tabla - Tabla del AST
 * @returns {boolean} true si hay que emitir el aviso
 */
function sqlite_tiene_incremento_invalido(tabla: TablaAST): boolean {
  return tabla.columnas.some((columna) => {
    if (!columna.opciones.incremento) {
      return false;
    }
    return !sqlite_usa_pk_autoincrement(tabla, columna);
  });
}

/**
 * Antepone N a un literal de cadena para SQL Server.
 *
 * @param {string} valor - Literal con o sin comillas
 * @returns {string} Literal Unicode N'...'
 */
function prefijo_n(valor: string): string {
  if (valor.startsWith("'") && valor.endsWith("'")) {
    return `N${valor}`;
  }
  return `N'${escapar_cadena(valor)}'`;
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
