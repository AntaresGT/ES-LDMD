/**
 * @archivo ast-a-diagrama.test.ts
 * @descripcion Pruebas unitarias para el transformador de AST a modelo de diagrama.
 */

import { describe, it, expect } from 'vitest';
import { ast_a_diagrama, ModeloDiagrama } from '@/transformadores/ast-a-diagrama';
import { DocumentoAST, TablaAST, GrupoAST } from '@/dominio/tipos';

/** Helper para crear un rango ficticio */
function rango_ficticio() {
  return {
    inicio: { linea: 1, columna: 1 },
    fin: { linea: 1, columna: 1 },
  };
}

/** Helper para crear una tabla AST básica */
function crear_tabla(
  nombre: string,
  columnas: Array<{
    nombre: string;
    tipo: string;
    parametros_tipo?: string[];
    no_nulo?: boolean;
    incremento?: boolean;
    nota?: string | null;
    valor_defecto?: string | null;
  }> = [],
  opciones?: {
    esquema?: string | null;
    primaria?: string[];
    foranea?: Array<{
      columna_local: string;
      tabla_referencia: string;
      columnas_referencia: string[];
      eliminacion_cascada?: boolean;
      actualizacion_cascada?: boolean;
    }>;
    nota?: string | null;
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
    indices: null,
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

/** Helper para crear un grupo AST */
function crear_grupo(nombre: string, tablas: string[]): GrupoAST {
  return { nombre, tablas, rango: rango_ficticio() };
}

describe('ast_a_diagrama', () => {
  it('debería retornar modelo vacío para AST vacío', () => {
    const ast: DocumentoAST = { tablas: [], grupos: [] };
    const modelo = ast_a_diagrama(ast);

    expect(modelo.nodos).toHaveLength(0);
    expect(modelo.aristas).toHaveLength(0);
    expect(modelo.grupos).toHaveLength(0);
  });

  it('debería crear un nodo por cada tabla', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('usuarios', [
          { nombre: 'id', tipo: 'entero' },
          { nombre: 'nombre', tipo: 'texto' },
        ]),
        crear_tabla('productos', [
          { nombre: 'id', tipo: 'entero' },
        ]),
      ],
      grupos: [],
    };

    const modelo = ast_a_diagrama(ast);

    expect(modelo.nodos).toHaveLength(2);
    expect(modelo.nodos[0].nombre).toBe('usuarios');
    expect(modelo.nodos[0].columnas).toHaveLength(2);
    expect(modelo.nodos[1].nombre).toBe('productos');
    expect(modelo.nodos[1].columnas).toHaveLength(1);
  });

  it('debería marcar columnas como primaria y foránea correctamente', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla(
          'pedidos',
          [
            { nombre: 'id', tipo: 'entero' },
            { nombre: 'usuario_id', tipo: 'entero' },
            { nombre: 'total', tipo: 'decimal' },
          ],
          {
            primaria: ['id'],
            foranea: [
              {
                columna_local: 'usuario_id',
                tabla_referencia: 'usuarios',
                columnas_referencia: ['id'],
              },
            ],
          },
        ),
        crear_tabla('usuarios', [{ nombre: 'id', tipo: 'entero' }]),
      ],
      grupos: [],
    };

    const modelo = ast_a_diagrama(ast);
    const nodo_pedidos = modelo.nodos.find((n) => n.nombre === 'pedidos')!;

    expect(nodo_pedidos.columnas[0].es_primaria).toBe(true);
    expect(nodo_pedidos.columnas[0].es_foranea).toBe(false);
    expect(nodo_pedidos.columnas[1].es_primaria).toBe(false);
    expect(nodo_pedidos.columnas[1].es_foranea).toBe(true);
    expect(nodo_pedidos.columnas[2].es_primaria).toBe(false);
    expect(nodo_pedidos.columnas[2].es_foranea).toBe(false);
  });

  it('debería generar aristas a partir de foráneas', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla(
          'pedidos',
          [
            { nombre: 'id', tipo: 'entero' },
            { nombre: 'usuario_id', tipo: 'entero' },
          ],
          {
            foranea: [
              {
                columna_local: 'usuario_id',
                tabla_referencia: 'usuarios',
                columnas_referencia: ['id'],
                eliminacion_cascada: true,
                actualizacion_cascada: false,
              },
            ],
          },
        ),
        crear_tabla('usuarios', [{ nombre: 'id', tipo: 'entero' }]),
      ],
      grupos: [],
    };

    const modelo = ast_a_diagrama(ast);

    expect(modelo.aristas).toHaveLength(1);
    expect(modelo.aristas[0].nodo_origen).toBe('pedidos');
    expect(modelo.aristas[0].columna_origen).toBe('usuario_id');
    expect(modelo.aristas[0].nodo_destino).toBe('usuarios');
    expect(modelo.aristas[0].columnas_destino).toEqual(['id']);
    expect(modelo.aristas[0].eliminacion_cascada).toBe(true);
    expect(modelo.aristas[0].actualizacion_cascada).toBe(false);
  });

  it('debería crear grupos con nodos correspondientes', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('usuarios', [{ nombre: 'id', tipo: 'entero' }]),
        crear_tabla('roles', [{ nombre: 'id', tipo: 'entero' }]),
        crear_tabla('productos', [{ nombre: 'id', tipo: 'entero' }]),
      ],
      grupos: [
        crear_grupo('Autenticación', ['usuarios', 'roles']),
        crear_grupo('Tienda', ['productos']),
      ],
    };

    const modelo = ast_a_diagrama(ast);

    expect(modelo.grupos).toHaveLength(2);
    expect(modelo.grupos[0].nombre).toBe('Autenticación');
    expect(modelo.grupos[0].nodos).toEqual(['usuarios', 'roles']);
    expect(modelo.grupos[1].nombre).toBe('Tienda');
    expect(modelo.grupos[1].nodos).toEqual(['productos']);
  });

  it('debería asignar colores diferentes a cada grupo', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('a', [{ nombre: 'id', tipo: 'entero' }]),
        crear_tabla('b', [{ nombre: 'id', tipo: 'entero' }]),
      ],
      grupos: [
        crear_grupo('G1', ['a']),
        crear_grupo('G2', ['b']),
      ],
    };

    const modelo = ast_a_diagrama(ast);

    expect(modelo.grupos[0].color).toBeDefined();
    expect(modelo.grupos[1].color).toBeDefined();
    expect(modelo.grupos[0].color).not.toBe(modelo.grupos[1].color);
  });

  it('debería asignar grupo a nodos cuando pertenecen a uno', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('usuarios', [{ nombre: 'id', tipo: 'entero' }]),
        crear_tabla('productos', [{ nombre: 'id', tipo: 'entero' }]),
      ],
      grupos: [crear_grupo('Auth', ['usuarios'])],
    };

    const modelo = ast_a_diagrama(ast);

    const nodo_usuarios = modelo.nodos.find((n) => n.nombre === 'usuarios')!;
    const nodo_productos = modelo.nodos.find((n) => n.nombre === 'productos')!;

    expect(nodo_usuarios.grupo).toBe('Auth');
    expect(nodo_productos.grupo).toBeNull();
  });

  it('debería calcular dimensiones basadas en el contenido', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('tabla_con_nombre_largo', [
          { nombre: 'id', tipo: 'entero' },
          { nombre: 'nombre_completo', tipo: 'texto', parametros_tipo: ['255'] },
          { nombre: 'email', tipo: 'texto' },
        ]),
      ],
      grupos: [],
    };

    const modelo = ast_a_diagrama(ast);
    const nodo = modelo.nodos[0];

    expect(nodo.ancho).toBeGreaterThanOrEqual(200);
    expect(nodo.alto).toBe(36 + 3 * 28 + 8); // header + 3 columnas + padding
  });

  it('debería formatear tipo con parámetros', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('t', [
          { nombre: 'nombre', tipo: 'texto', parametros_tipo: ['100'] },
          { nombre: 'precio', tipo: 'decimal', parametros_tipo: ['10', '2'] },
          { nombre: 'id', tipo: 'entero' },
        ]),
      ],
      grupos: [],
    };

    const modelo = ast_a_diagrama(ast);
    const columnas = modelo.nodos[0].columnas;

    expect(columnas[0].tipo).toBe('texto(100)');
    expect(columnas[1].tipo).toBe('decimal(10, 2)');
    expect(columnas[2].tipo).toBe('entero');
  });

  it('debería incluir esquema en el nodo si está presente', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('usuarios', [{ nombre: 'id', tipo: 'entero' }], {
          esquema: 'publico',
        }),
      ],
      grupos: [],
    };

    const modelo = ast_a_diagrama(ast);

    expect(modelo.nodos[0].esquema).toBe('publico');
  });

  it('debería marcar no_nulo correctamente en columnas del diagrama', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('t', [
          { nombre: 'a', tipo: 'entero', no_nulo: true },
          { nombre: 'b', tipo: 'texto', no_nulo: false },
        ]),
      ],
      grupos: [],
    };

    const modelo = ast_a_diagrama(ast);

    expect(modelo.nodos[0].columnas[0].no_nulo).toBe(true);
    expect(modelo.nodos[0].columnas[1].no_nulo).toBe(false);
  });

  it('debería incluir nota de la tabla en el nodo', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('usuarios', [{ nombre: 'id', tipo: 'entero' }], {
          nota: 'Tabla principal de usuarios',
        }),
      ],
      grupos: [],
    };

    const modelo = ast_a_diagrama(ast);

    expect(modelo.nodos[0].nota).toBe('Tabla principal de usuarios');
  });

  it('debería filtrar tablas inexistentes de los nodos del grupo', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('usuarios', [{ nombre: 'id', tipo: 'entero' }]),
      ],
      grupos: [crear_grupo('G1', ['usuarios', 'no_existe'])],
    };

    const modelo = ast_a_diagrama(ast);

    // 'no_existe' se filtra porque no hay nodo con ese id
    expect(modelo.grupos[0].nodos).toEqual(['usuarios']);
  });

  it('debería inicializar posiciones X e Y en 0', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla('t', [{ nombre: 'id', tipo: 'entero' }]),
      ],
      grupos: [],
    };

    const modelo = ast_a_diagrama(ast);

    expect(modelo.nodos[0].x).toBe(0);
    expect(modelo.nodos[0].y).toBe(0);
  });

  it('debería manejar múltiples foráneas hacia distintas tablas', () => {
    const ast: DocumentoAST = {
      tablas: [
        crear_tabla(
          'pedido_producto',
          [
            { nombre: 'pedido_id', tipo: 'entero' },
            { nombre: 'producto_id', tipo: 'entero' },
          ],
          {
            foranea: [
              {
                columna_local: 'pedido_id',
                tabla_referencia: 'pedidos',
                columnas_referencia: ['id'],
              },
              {
                columna_local: 'producto_id',
                tabla_referencia: 'productos',
                columnas_referencia: ['id'],
              },
            ],
          },
        ),
        crear_tabla('pedidos', [{ nombre: 'id', tipo: 'entero' }]),
        crear_tabla('productos', [{ nombre: 'id', tipo: 'entero' }]),
      ],
      grupos: [],
    };

    const modelo = ast_a_diagrama(ast);

    expect(modelo.aristas).toHaveLength(2);
    expect(modelo.aristas[0].nodo_destino).toBe('pedidos');
    expect(modelo.aristas[1].nodo_destino).toBe('productos');
  });
});
