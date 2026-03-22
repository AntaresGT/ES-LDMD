/**
 * @archivo analizador.test.ts
 * @descripcion Pruebas unitarias del analizador (parser) del lenguaje es-ldmd.
 */

import { describe, it, expect } from 'vitest';
import { tokenizar } from '@/parser/tokenizador';
import { analizar } from '@/parser/analizador';

/**
 * Función auxiliar para parsear código fuente directamente.
 */
function parsear(codigo: string) {
  const tokens = tokenizar(codigo);
  return analizar(tokens);
}

describe('Analizador', () => {
  describe('tablas simples', () => {
    it('debe analizar una tabla vacía', () => {
      const { ast, diagnosticos } = parsear('Tabla usuarios { }');
      expect(ast.tablas).toHaveLength(1);
      expect(ast.tablas[0].nombre).toBe('usuarios');
      expect(ast.tablas[0].esquema).toBeNull();
      expect(ast.tablas[0].columnas).toHaveLength(0);
    });

    it('debe analizar una tabla con columnas', () => {
      const { ast } = parsear(`Tabla usuarios {
    id entero
    nombre texto
}`);
      expect(ast.tablas).toHaveLength(1);
      expect(ast.tablas[0].columnas).toHaveLength(2);
      expect(ast.tablas[0].columnas[0].nombre).toBe('id');
      expect(ast.tablas[0].columnas[0].tipo).toBe('entero');
      expect(ast.tablas[0].columnas[1].nombre).toBe('nombre');
      expect(ast.tablas[0].columnas[1].tipo).toBe('texto');
    });

    it('debe analizar una tabla con esquema', () => {
      const { ast } = parsear('Tabla publico.usuarios { id entero }');
      expect(ast.tablas[0].esquema).toBe('publico');
      expect(ast.tablas[0].nombre).toBe('usuarios');
    });

    it('debe analizar columna con tipo parametrizado', () => {
      const { ast } = parsear('Tabla t { nombre texto(100) }');
      expect(ast.tablas[0].columnas[0].tipo).toBe('texto');
      expect(ast.tablas[0].columnas[0].parametros_tipo).toEqual(['100']);
    });
  });

  describe('opciones de columna', () => {
    it('debe analizar opción no nulo', () => {
      const { ast } = parsear('Tabla t { id entero [no nulo] }');
      expect(ast.tablas[0].columnas[0].opciones.no_nulo).toBe(true);
    });

    it('debe analizar opción nota', () => {
      const { ast } = parsear("Tabla t { id entero [nota: 'Identificador único'] }");
      expect(ast.tablas[0].columnas[0].opciones.nota).toBe('Identificador único');
    });

    it('debe analizar múltiples opciones', () => {
      const { ast } = parsear("Tabla t { id entero [no nulo, nota: 'ID'] }");
      expect(ast.tablas[0].columnas[0].opciones.no_nulo).toBe(true);
      expect(ast.tablas[0].columnas[0].opciones.nota).toBe('ID');
    });
  });

  describe('bloques internos', () => {
    it('debe analizar bloque de índices', () => {
      const { ast } = parsear(`Tabla t {
    id entero
    nombre texto

    indices {
        id
        nombre
    }
}`);
      expect(ast.tablas[0].indices).not.toBeNull();
      expect(ast.tablas[0].indices!.columnas).toEqual(['id', 'nombre']);
    });

    it('debe analizar bloque de llave primaria', () => {
      const { ast } = parsear(`Tabla t {
    id entero

    primaria {
        id
    }
}`);
      expect(ast.tablas[0].primaria).not.toBeNull();
      expect(ast.tablas[0].primaria!.columnas).toEqual(['id']);
    });

    it('debe analizar llave primaria compuesta', () => {
      const { ast } = parsear(`Tabla t {
    col1 entero
    col2 entero

    primaria {
        col1
        col2
    }
}`);
      expect(ast.tablas[0].primaria!.columnas).toEqual(['col1', 'col2']);
    });

    it('debe analizar bloque de foráneas', () => {
      const { ast } = parsear(`Tabla t {
    id entero
    usuario_id entero

    foranea {
        usuario_id usuarios(id)
    }
}`);
      expect(ast.tablas[0].foranea).not.toBeNull();
      expect(ast.tablas[0].foranea!.referencias).toHaveLength(1);
      expect(ast.tablas[0].foranea!.referencias[0].columna_local).toBe('usuario_id');
      expect(ast.tablas[0].foranea!.referencias[0].tabla_referencia).toBe('usuarios');
      expect(ast.tablas[0].foranea!.referencias[0].columnas_referencia).toEqual(['id']);
    });

    it('debe analizar foránea con esquema', () => {
      const { ast } = parsear(`Tabla t {
    id entero
    ref_id entero

    foranea {
        ref_id esquema.otra_tabla(id)
    }
}`);
      const ref = ast.tablas[0].foranea!.referencias[0];
      expect(ref.esquema_referencia).toBe('esquema');
      expect(ref.tabla_referencia).toBe('otra_tabla');
    });

    it('debe analizar foránea con múltiples columnas referenciadas', () => {
      const { ast } = parsear(`Tabla t {
    id entero
    ref_id entero

    foranea {
        ref_id otra_tabla(col1, col2, col3)
    }
}`);
      const ref = ast.tablas[0].foranea!.referencias[0];
      expect(ref.columnas_referencia).toEqual(['col1', 'col2', 'col3']);
    });

    it('debe analizar cascadas en foráneas', () => {
      const { ast } = parsear(`Tabla t {
    ref_id entero

    foranea {
        ref_id otra(id) [eliminación en cascada, actualización en cascada]
    }
}`);
      const ref = ast.tablas[0].foranea!.referencias[0];
      expect(ref.opciones.eliminacion_cascada).toBe(true);
      expect(ref.opciones.actualizacion_cascada).toBe(true);
    });

    it('debe analizar múltiples foráneas', () => {
      const { ast } = parsear(`Tabla t {
    a entero
    b entero

    foranea {
        a tabla1(id)
        b tabla2(id) [eliminación en cascada]
    }
}`);
      expect(ast.tablas[0].foranea!.referencias).toHaveLength(2);
      expect(ast.tablas[0].foranea!.referencias[1].opciones.eliminacion_cascada).toBe(true);
    });
  });

  describe('nota de tabla', () => {
    it('debe analizar nota de tabla', () => {
      const { ast } = parsear(`Tabla t {
    id entero
    Nota: 'Esta es una nota de la tabla'
}`);
      expect(ast.tablas[0].nota).toBe('Esta es una nota de la tabla');
    });
  });

  describe('grupos', () => {
    it('debe analizar un grupo', () => {
      const { ast } = parsear(`Grupo ventas {
    pedidos
    facturas
}`);
      expect(ast.grupos).toHaveLength(1);
      expect(ast.grupos[0].nombre).toBe('ventas');
      expect(ast.grupos[0].tablas).toEqual(['pedidos', 'facturas']);
    });
  });

  describe('documento completo', () => {
    it('debe analizar múltiples tablas y grupos', () => {
      const { ast, diagnosticos } = parsear(`
Tabla usuarios {
    id entero [no nulo]
    nombre texto(100)

    primaria {
        id
    }
}

Tabla pedidos {
    id entero [no nulo]
    usuario_id entero

    primaria {
        id
    }

    foranea {
        usuario_id usuarios(id) [eliminación en cascada]
    }
}

Grupo sistema {
    usuarios
    pedidos
}
`);
      expect(ast.tablas).toHaveLength(2);
      expect(ast.grupos).toHaveLength(1);
      expect(diagnosticos).toHaveLength(0);
    });
  });

  describe('tolerancia a errores', () => {
    it('debe reportar error cuando falta llave de apertura', () => {
      const { diagnosticos } = parsear('Tabla usuarios id entero }');
      expect(diagnosticos.length).toBeGreaterThan(0);
    });

    it('debe reportar error en token inesperado al nivel superior', () => {
      const { diagnosticos } = parsear('algo_raro { }');
      expect(diagnosticos.length).toBeGreaterThan(0);
    });

    it('debe continuar después de un error', () => {
      const { ast } = parsear(`
Tabla tabla_con_error {
Tabla usuarios {
    id entero
}`);
      // Debe haber parseado al menos algo
      expect(ast.tablas.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('comentarios', () => {
    it('debe ignorar comentarios al parsear', () => {
      const { ast, diagnosticos } = parsear(`
// Esto es un comentario
Tabla usuarios {
    // Columna de ID
    id entero [no nulo]

    primaria {
        id
    }
}
`);
      expect(ast.tablas).toHaveLength(1);
      expect(ast.tablas[0].columnas).toHaveLength(1);
      expect(diagnosticos).toHaveLength(0);
    });
  });
});
