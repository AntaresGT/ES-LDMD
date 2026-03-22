/**
 * @archivo tokenizador.test.ts
 * @descripcion Pruebas unitarias del tokenizador del lenguaje es-ldmd.
 */

import { describe, it, expect } from 'vitest';
import { tokenizar } from '@/parser/tokenizador';
import { TipoToken } from '@/dominio/tipos';

describe('Tokenizador', () => {
  describe('tokens básicos', () => {
    it('debe tokenizar un documento vacío', () => {
      const tokens = tokenizar('');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].tipo).toBe(TipoToken.FIN_DE_ARCHIVO);
    });

    it('debe tokenizar delimitadores', () => {
      const tokens = tokenizar('{}()[],:.');
      const tipos = tokens.map((t) => t.tipo);
      expect(tipos).toContain(TipoToken.LLAVE_ABIERTA);
      expect(tipos).toContain(TipoToken.LLAVE_CERRADA);
      expect(tipos).toContain(TipoToken.PARENTESIS_ABIERTO);
      expect(tipos).toContain(TipoToken.PARENTESIS_CERRADO);
      expect(tipos).toContain(TipoToken.CORCHETE_ABIERTO);
      expect(tipos).toContain(TipoToken.CORCHETE_CERRADO);
      expect(tipos).toContain(TipoToken.COMA);
      expect(tipos).toContain(TipoToken.DOS_PUNTOS);
      expect(tipos).toContain(TipoToken.PUNTO);
    });

    it('debe tokenizar números', () => {
      const tokens = tokenizar('42 100');
      const numeros = tokens.filter((t) => t.tipo === TipoToken.NUMERO);
      expect(numeros).toHaveLength(2);
      expect(numeros[0].valor).toBe('42');
      expect(numeros[1].valor).toBe('100');
    });

    it('debe tokenizar cadenas', () => {
      const tokens = tokenizar("'Hola mundo'");
      const cadenas = tokens.filter((t) => t.tipo === TipoToken.CADENA);
      expect(cadenas).toHaveLength(1);
      expect(cadenas[0].valor).toBe('Hola mundo');
    });

    it('debe tokenizar comentarios', () => {
      const tokens = tokenizar('// Este es un comentario');
      const comentarios = tokens.filter((t) => t.tipo === TipoToken.COMENTARIO);
      expect(comentarios).toHaveLength(1);
      expect(comentarios[0].valor).toContain('Este es un comentario');
    });
  });

  describe('palabras clave', () => {
    it('debe reconocer Tabla como palabra clave', () => {
      const tokens = tokenizar('Tabla');
      expect(tokens[0].tipo).toBe(TipoToken.TABLA);
    });

    it('debe reconocer Grupo como palabra clave', () => {
      const tokens = tokenizar('Grupo');
      expect(tokens[0].tipo).toBe(TipoToken.GRUPO);
    });

    it('debe reconocer Nota como palabra clave', () => {
      const tokens = tokenizar('Nota');
      expect(tokens[0].tipo).toBe(TipoToken.NOTA);
    });

    it('debe reconocer indices como palabra clave', () => {
      const tokens = tokenizar('indices');
      expect(tokens[0].tipo).toBe(TipoToken.INDICES);
    });

    it('debe reconocer primaria como palabra clave', () => {
      const tokens = tokenizar('primaria');
      expect(tokens[0].tipo).toBe(TipoToken.PRIMARIA);
    });

    it('debe reconocer foranea como palabra clave', () => {
      const tokens = tokenizar('foranea');
      expect(tokens[0].tipo).toBe(TipoToken.FORANEA);
    });
  });

  describe('frases compuestas', () => {
    it('debe reconocer "no nulo"', () => {
      const tokens = tokenizar('no nulo');
      expect(tokens[0].tipo).toBe(TipoToken.NO_NULO);
      expect(tokens[0].valor).toBe('no nulo');
    });

    it('debe reconocer "eliminación en cascada"', () => {
      const tokens = tokenizar('eliminación en cascada');
      expect(tokens[0].tipo).toBe(TipoToken.ELIMINACION_CASCADA);
      expect(tokens[0].valor).toBe('eliminación en cascada');
    });

    it('debe reconocer "actualización en cascada"', () => {
      const tokens = tokenizar('actualización en cascada');
      expect(tokens[0].tipo).toBe(TipoToken.ACTUALIZACION_CASCADA);
      expect(tokens[0].valor).toBe('actualización en cascada');
    });
  });

  describe('posiciones', () => {
    it('debe rastrear posiciones de línea y columna correctamente', () => {
      const tokens = tokenizar('Tabla\nusuarios');
      expect(tokens[0].posicion.linea).toBe(1);
      expect(tokens[0].posicion.columna).toBe(1);
      expect(tokens[1].posicion.linea).toBe(2);
      expect(tokens[1].posicion.columna).toBe(1);
    });
  });

  describe('identificadores con caracteres especiales', () => {
    it('debe aceptar caracteres con acentos', () => {
      const tokens = tokenizar('dirección');
      expect(tokens[0].tipo).toBe(TipoToken.IDENTIFICADOR);
      expect(tokens[0].valor).toBe('dirección');
    });

    it('debe aceptar ñ en identificadores', () => {
      const tokens = tokenizar('año');
      expect(tokens[0].tipo).toBe(TipoToken.IDENTIFICADOR);
      expect(tokens[0].valor).toBe('año');
    });
  });

  describe('tabla completa', () => {
    it('debe tokenizar una definición de tabla simple', () => {
      const codigo = `Tabla usuarios {
    id entero [no nulo]
    nombre texto(100)

    primaria {
        id
    }
}`;
      const tokens = tokenizar(codigo);
      const tipos = tokens.map((t) => t.tipo);

      expect(tipos).toContain(TipoToken.TABLA);
      expect(tipos).toContain(TipoToken.IDENTIFICADOR);
      expect(tipos).toContain(TipoToken.LLAVE_ABIERTA);
      expect(tipos).toContain(TipoToken.NO_NULO);
      expect(tipos).toContain(TipoToken.CORCHETE_ABIERTO);
      expect(tipos).toContain(TipoToken.CORCHETE_CERRADO);
      expect(tipos).toContain(TipoToken.PRIMARIA);
      expect(tipos).toContain(TipoToken.LLAVE_CERRADA);
    });

    it('debe tokenizar una tabla con esquema', () => {
      const codigo = 'Tabla esquema.usuarios { id entero }';
      const tokens = tokenizar(codigo);
      const tipos = tokens.map((t) => t.tipo);

      expect(tipos).toContain(TipoToken.TABLA);
      expect(tipos).toContain(TipoToken.PUNTO);
    });

    it('debe tokenizar foráneas con cascada', () => {
      const codigo = `foranea {
    usuario_id usuarios(id) [eliminación en cascada, actualización en cascada]
}`;
      const tokens = tokenizar(codigo);
      const tipos = tokens.map((t) => t.tipo);

      expect(tipos).toContain(TipoToken.FORANEA);
      expect(tipos).toContain(TipoToken.ELIMINACION_CASCADA);
      expect(tipos).toContain(TipoToken.ACTUALIZACION_CASCADA);
    });
  });

  describe('grupo', () => {
    it('debe tokenizar un grupo', () => {
      const codigo = `Grupo ventas {
    pedidos
    facturas
}`;
      const tokens = tokenizar(codigo);
      expect(tokens[0].tipo).toBe(TipoToken.GRUPO);
      expect(tokens[1].tipo).toBe(TipoToken.IDENTIFICADOR);
      expect(tokens[1].valor).toBe('ventas');
    });
  });
});
