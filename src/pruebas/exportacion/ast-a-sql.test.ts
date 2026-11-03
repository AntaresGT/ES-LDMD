/**
 * @archivo ast-a-sql.test.ts
 * @descripcion Pruebas unitarias para el transformador de AST a SQL DDL.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ast_a_sql } from '@/exportacion/ast-a-sql';
import { DocumentoAST, TablaAST } from '@/dominio/tipos';

/** Helper para crear un rango ficticio */
function rango_ficticio() {
  return {
    inicio: { linea: 1, columna: 1 },
    fin: { linea: 1, columna: 1 },
  };
}

/** Helper para crear una tabla AST */
function crear_tabla(
  nombre: string,
  columnas: Array<{
    nombre: string;
    tipo: string;
    parametros_tipo?: string[];
    no_nulo?: boolean;
    incremento?: boolean;
    nota?: string;
    valor_defecto?: string;
  }>,
  opciones?: {
    esquema?: string;
    primaria?: string[];
    foranea?: Array<{
      columna_local: string;
      tabla_referencia: string;
      columnas_referencia: string[];
      eliminacion_cascada?: boolean;
      actualizacion_cascada?: boolean;
    }>;
    nota?: string;
    indices?: string[];
  },
): TablaAST {
  return {
    nombre,
    esquema: opciones?.esquema ?? null,
    columnas: columnas.map((col) => ({
      nombre: col.nombre,
      tipo: col.tipo,
      parametros_tipo: col.parametros_tipo ?? [],
      opciones: {
        no_nulo: col.no_nulo ?? false,
        incremento: col.incremento ?? false,
        nota: col.nota ?? null,
        valor_defecto: col.valor_defecto ?? null,
      },
      rango: rango_ficticio(),
    })),
    indices: opciones?.indices
      ? { columnas: opciones.indices, rango: rango_ficticio() }
      : null,
    primaria: opciones?.primaria
      ? { columnas: opciones.primaria, rango: rango_ficticio() }
      : null,
    foranea: opciones?.foranea
      ? {
          referencias: opciones.foranea.map((fk) => ({
            columna_local: fk.columna_local,
            esquema_referencia: null,
            tabla_referencia: fk.tabla_referencia,
            columnas_referencia: fk.columnas_referencia,
            opciones: {
              eliminacion_cascada: fk.eliminacion_cascada ?? false,
              actualizacion_cascada: fk.actualizacion_cascada ?? false,
            },
            rango: rango_ficticio(),
          })),
          rango: rango_ficticio(),
        }
      : null,
    nota: opciones?.nota ?? null,
    rango: rango_ficticio(),
  };
}

/** Fijar fecha para tests determinísticos */
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-03-20'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ast_a_sql', () => {
  it('debería generar SQL vacío para AST vacío', () => {
    const ast: DocumentoAST = { tablas: [], grupos: [] };
    const sql = ast_a_sql(ast, { motor: 'postgresql' });

    expect(sql).toContain('Generado por es-ldmd');
    expect(sql).toContain('PostgreSQL');
    expect(sql).not.toContain('CREATE TABLE');
  });

  it('debería generar CREATE TABLE básico', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('usuarios', [
          { nombre: 'id', tipo: 'entero' },
          { nombre: 'nombre', tipo: 'texto', parametros_tipo: ['100'] },
          { nombre: 'email', tipo: 'texto' },
        ]),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'postgresql' });

    expect(sql).toContain('CREATE TABLE usuarios');
    expect(sql).toContain('id INTEGER');
    expect(sql).toContain('nombre VARCHAR(100)');
    expect(sql).toContain('email TEXT');
  });

  it('debería incluir NOT NULL para columnas con no_nulo', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('t', [
          { nombre: 'id', tipo: 'entero', no_nulo: true },
          { nombre: 'nombre', tipo: 'texto', no_nulo: false },
        ]),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'postgresql' });

    expect(sql).toContain('id INTEGER NOT NULL');
    expect(sql).toMatch(/nombre TEXT[^N]*$/m);
  });

  it('debería generar PRIMARY KEY', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('usuarios', [
          { nombre: 'id', tipo: 'entero' },
        ], {
          primaria: ['id'],
        }),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'postgresql' });

    expect(sql).toContain('PRIMARY KEY (id)');
  });

  it('debería generar PRIMARY KEY compuesta', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('pedido_producto', [
          { nombre: 'pedido_id', tipo: 'entero' },
          { nombre: 'producto_id', tipo: 'entero' },
        ], {
          primaria: ['pedido_id', 'producto_id'],
        }),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'postgresql' });

    expect(sql).toContain('PRIMARY KEY (pedido_id, producto_id)');
  });

  it('debería generar FOREIGN KEY', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('pedidos', [
          { nombre: 'id', tipo: 'entero' },
          { nombre: 'usuario_id', tipo: 'entero' },
        ], {
          foranea: [{
            columna_local: 'usuario_id',
            tabla_referencia: 'usuarios',
            columnas_referencia: ['id'],
          }],
        }),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'postgresql' });

    expect(sql).toContain('CONSTRAINT fk_usuario_id_usuarios');
    expect(sql).toContain('FOREIGN KEY (usuario_id)');
    expect(sql).toContain('REFERENCES usuarios (id)');
  });

  it('debería generar ON DELETE CASCADE', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('pedidos', [
          { nombre: 'usuario_id', tipo: 'entero' },
        ], {
          foranea: [{
            columna_local: 'usuario_id',
            tabla_referencia: 'usuarios',
            columnas_referencia: ['id'],
            eliminacion_cascada: true,
          }],
        }),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'postgresql' });

    expect(sql).toContain('ON DELETE CASCADE');
    expect(sql).not.toContain('ON UPDATE CASCADE');
  });

  it('debería generar ON UPDATE CASCADE', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('pedidos', [
          { nombre: 'usuario_id', tipo: 'entero' },
        ], {
          foranea: [{
            columna_local: 'usuario_id',
            tabla_referencia: 'usuarios',
            columnas_referencia: ['id'],
            actualizacion_cascada: true,
          }],
        }),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'postgresql' });

    expect(sql).toContain('ON UPDATE CASCADE');
  });

  it('debería generar ambas cascadas', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('pedidos', [
          { nombre: 'usuario_id', tipo: 'entero' },
        ], {
          foranea: [{
            columna_local: 'usuario_id',
            tabla_referencia: 'usuarios',
            columnas_referencia: ['id'],
            eliminacion_cascada: true,
            actualizacion_cascada: true,
          }],
        }),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'postgresql' });

    expect(sql).toContain('ON DELETE CASCADE');
    expect(sql).toContain('ON UPDATE CASCADE');
  });

  it('debería incluir esquema en el nombre de la tabla', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('usuarios', [
          { nombre: 'id', tipo: 'entero' },
        ], {
          esquema: 'publico',
        }),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'postgresql' });

    expect(sql).toContain('CREATE TABLE publico.usuarios');
  });

  it('debería incluir IF NOT EXISTS cuando se solicita', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('t', [{ nombre: 'id', tipo: 'entero' }]),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'postgresql', si_no_existe: true });

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS t');
  });

  it('debería incluir DROP TABLE cuando se solicita', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('t', [{ nombre: 'id', tipo: 'entero' }]),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'postgresql', incluir_drop: true });

    expect(sql).toContain('DROP TABLE IF EXISTS t;');
    expect(sql).toContain('CREATE TABLE t');
  });

  it('debería generar COMMENT ON TABLE para PostgreSQL', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('usuarios', [
          { nombre: 'id', tipo: 'entero' },
        ], {
          nota: 'Tabla de usuarios del sistema',
        }),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'postgresql' });

    expect(sql).toContain("COMMENT ON TABLE usuarios IS 'Tabla de usuarios del sistema'");
  });

  it('debería generar ALTER TABLE COMMENT para MariaDB', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('usuarios', [
          { nombre: 'id', tipo: 'entero' },
        ], {
          nota: 'Tabla de usuarios del sistema',
        }),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'mariadb' });

    expect(sql).toContain("ALTER TABLE usuarios COMMENT = 'Tabla de usuarios del sistema'");
  });

  it('debería generar CREATE INDEX', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('usuarios', [
          { nombre: 'id', tipo: 'entero' },
          { nombre: 'email', tipo: 'texto' },
        ], {
          indices: ['email'],
        }),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'postgresql' });

    expect(sql).toContain('CREATE INDEX idx_usuarios_email ON usuarios (email)');
  });

  it('debería generar header con motor MariaDB', () => {
    const ast: DocumentoAST = { tablas: [], grupos: [] };
    const sql = ast_a_sql(ast, { motor: 'mariadb' });

    expect(sql).toContain('MariaDB');
  });

  it('debería generar múltiples tablas', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('usuarios', [
          { nombre: 'id', tipo: 'entero' },
          { nombre: 'nombre', tipo: 'texto' },
        ]),
        crear_tabla('pedidos', [
          { nombre: 'id', tipo: 'entero' },
          { nombre: 'usuario_id', tipo: 'entero' },
        ]),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'postgresql' });

    expect(sql).toContain('CREATE TABLE usuarios');
    expect(sql).toContain('CREATE TABLE pedidos');
  });

  it('debería escapar comillas simples en notas', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('t', [
          { nombre: 'id', tipo: 'entero' },
        ], {
          nota: "Tabla d'ejemplo con comilla's",
        }),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'postgresql' });

    expect(sql).toContain("Tabla d''ejemplo con comilla''s");
  });

  it('debería usar conversión de tipos correcta para MariaDB', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('t', [
          { nombre: 'tags', tipo: 'listado', parametros_tipo: ['entero'] },
          { nombre: 'meta', tipo: 'json' },
        ]),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'mariadb' });

    // listado → JSON en MariaDB (no soporta arrays nativos)
    expect(sql).toContain('tags JSON');
    expect(sql).toContain('meta JSON');
  });

  it('debería usar conversión de tipos correcta para PostgreSQL', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('t', [
          { nombre: 'tags', tipo: 'listado', parametros_tipo: ['entero'] },
        ]),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'postgresql' });

    // listado → INTEGER[] en PostgreSQL
    expect(sql).toContain('tags INTEGER[]');
  });

  it('debería generar COMMENT ON COLUMN para notas de columna en PostgreSQL', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('usuarios', [
          { nombre: 'id', tipo: 'entero', nota: 'Identificador único' },
          { nombre: 'email', tipo: 'texto', nota: 'Correo electrónico del usuario' },
          { nombre: 'nombre', tipo: 'texto' },
        ]),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'postgresql' });

    expect(sql).toContain("COMMENT ON COLUMN usuarios.id IS 'Identificador único';");
    expect(sql).toContain("COMMENT ON COLUMN usuarios.email IS 'Correo electrónico del usuario';");
    expect(sql).not.toContain('COMMENT ON COLUMN usuarios.nombre');
  });

  it('debería generar ALTER TABLE MODIFY COLUMN COMMENT para notas de columna en MariaDB', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('usuarios', [
          { nombre: 'id', tipo: 'entero', no_nulo: true, nota: 'Identificador único' },
          { nombre: 'nombre', tipo: 'texto' },
        ]),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'mariadb' });

    expect(sql).toContain("ALTER TABLE usuarios MODIFY COLUMN id INTEGER NOT NULL COMMENT 'Identificador único';");
    expect(sql).not.toContain('MODIFY COLUMN nombre');
  });

  it('debería generar COMMENT ON COLUMN con esquema en PostgreSQL', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('usuarios', [
          { nombre: 'id', tipo: 'entero', nota: 'PK' },
        ], { esquema: 'public' }),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'postgresql' });

    expect(sql).toContain("COMMENT ON COLUMN public.usuarios.id IS 'PK';");
  });

  it('debería escapar comillas simples en notas de columna', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('t', [
          { nombre: 'col', tipo: 'texto', nota: "Nota con comilla's" },
        ]),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'postgresql' });

    expect(sql).toContain("COMMENT ON COLUMN t.col IS 'Nota con comilla''s';");
  });

  it('debería generar AUTO_INCREMENT para MySQL', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('usuarios', [
          { nombre: 'id', tipo: 'entero', incremento: true },
        ]),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'mysql' });

    expect(sql).toContain('id INTEGER AUTO_INCREMENT');
    expect(sql).toContain('-- Motor: MySQL');
  });

  it('debería generar ALTER TABLE COMMENT para MySQL', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('usuarios', [
          { nombre: 'id', tipo: 'entero', no_nulo: true, nota: 'Identificador único' },
        ], { nota: 'Tabla de usuarios' }),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'mysql' });

    expect(sql).toContain("ALTER TABLE usuarios COMMENT = 'Tabla de usuarios'");
    expect(sql).toContain("ALTER TABLE usuarios MODIFY COLUMN id INTEGER NOT NULL COMMENT 'Identificador único';");
  });

  it('debería generar IDENTITY para SQL Server', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('usuarios', [
          { nombre: 'id', tipo: 'entero', incremento: true, no_nulo: true },
        ], { primaria: ['id'] }),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'sqlserver' });

    expect(sql).toContain('id INT IDENTITY(1,1) NOT NULL');
    expect(sql).toContain('-- Motor: SQL Server');
  });

  it('debería generar sp_addextendedproperty para notas en SQL Server', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('usuarios', [
          { nombre: 'id', tipo: 'entero', nota: 'Identificador único' },
        ], { nota: 'Tabla de usuarios' }),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'sqlserver' });

    expect(sql).toContain('EXEC sys.sp_addextendedproperty');
    expect(sql).toContain("@name = N'MS_Description'");
    expect(sql).toContain("@value = N'Tabla de usuarios'");
    expect(sql).toContain("@level0name = N'dbo'");
    expect(sql).toContain("@level1name = N'usuarios'");
    expect(sql).toContain("@value = N'Identificador único'");
    expect(sql).toContain("@level2name = N'id'");
  });

  it('debería envolver CREATE TABLE con OBJECT_ID en SQL Server', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('t', [
          { nombre: 'id', tipo: 'entero' },
        ]),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'sqlserver', si_no_existe: true });

    expect(sql).toContain("IF OBJECT_ID(N'dbo.t', N'U') IS NULL");
    expect(sql).toContain('BEGIN');
    expect(sql).toContain('CREATE TABLE t');
    expect(sql).toContain('END');
    expect(sql).not.toContain('CREATE TABLE IF NOT EXISTS');
  });

  it('debería generar CHECK de enum para SQL Server', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('usuarios', [
          { nombre: 'estado', tipo: 'enum', parametros_tipo: ["'activo'", "'inactivo'"] },
        ]),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'sqlserver' });

    expect(sql).toContain('estado NVARCHAR(255)');
    expect(sql).toContain("CONSTRAINT ck_usuarios_estado CHECK (estado IN (N'activo', N'inactivo'))");
  });

  it('debería generar PRAGMA foreign_keys para SQLite', () => {
    const ast: DocumentoAST = { tablas: [], grupos: [] };
    const sql = ast_a_sql(ast, { motor: 'sqlite' });

    expect(sql).toContain('-- Motor: SQLite');
    expect(sql).toContain('PRAGMA foreign_keys = ON;');
  });

  it('debería generar INTEGER PRIMARY KEY AUTOINCREMENT en SQLite', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('usuarios', [
          { nombre: 'id', tipo: 'entero', incremento: true },
          { nombre: 'nombre', tipo: 'texto' },
        ], { primaria: ['id'] }),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'sqlite' });

    expect(sql).toContain('id INTEGER PRIMARY KEY AUTOINCREMENT');
    expect(sql).not.toContain('PRIMARY KEY (id)');
  });

  it('debería avisar si AUTOINCREMENT no aplica en SQLite', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('pedido_producto', [
          { nombre: 'pedido_id', tipo: 'entero', incremento: true },
          { nombre: 'producto_id', tipo: 'entero' },
        ], { primaria: ['pedido_id', 'producto_id'] }),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'sqlite' });

    expect(sql).toContain('pedido_id INTEGER');
    expect(sql).not.toContain('PRIMARY KEY AUTOINCREMENT');
    expect(sql).toContain('PRIMARY KEY (pedido_id, producto_id)');
    expect(sql).toContain(
      '-- SQLite: AUTOINCREMENT solo vale en INTEGER PRIMARY KEY de una columna',
    );
  });

  it('debería generar comentarios SQL de notas en SQLite', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('usuarios', [
          { nombre: 'id', tipo: 'entero', nota: 'Identificador único' },
        ], { nota: 'Tabla de usuarios' }),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'sqlite' });

    expect(sql).toContain('-- usuarios: Tabla de usuarios');
    expect(sql).toContain('-- usuarios.id: Identificador único');
    expect(sql).not.toContain('COMMENT ON');
    expect(sql).not.toContain('ALTER TABLE usuarios COMMENT');
  });

  it('debería generar CHECK de enum para SQLite', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('usuarios', [
          { nombre: 'estado', tipo: 'enum', parametros_tipo: ["'activo'", "'inactivo'"] },
        ]),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'sqlite' });

    expect(sql).toContain('estado TEXT');
    expect(sql).toContain("CONSTRAINT ck_usuarios_estado CHECK (estado IN ('activo', 'inactivo'))");
  });

  it('debería usar esquema en OBJECT_ID de SQL Server', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('usuarios', [
          { nombre: 'id', tipo: 'entero' },
        ], { esquema: 'publico' }),
      ],
      grupos: [],
    };

    const sql = ast_a_sql(ast, { motor: 'sqlserver', si_no_existe: true });

    expect(sql).toContain("IF OBJECT_ID(N'publico.usuarios', N'U') IS NULL");
    expect(sql).toContain('CREATE TABLE publico.usuarios');
  });
});
