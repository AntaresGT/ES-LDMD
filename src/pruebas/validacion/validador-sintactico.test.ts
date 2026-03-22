/**
 * @archivo validador-sintactico.test.ts
 * @descripcion Pruebas unitarias del validador sintáctico.
 */

import { describe, it, expect } from 'vitest';
import { tokenizar } from '@/parser/tokenizador';
import { analizar } from '@/parser/analizador';
import { validar_sintaxis } from '@/validacion/validador-sintactico';
import { Severidad } from '@/dominio/tipos';

function obtener_diagnosticos_sintacticos(codigo: string) {
  const tokens = tokenizar(codigo);
  const { ast } = analizar(tokens);
  return validar_sintaxis(ast);
}

describe('Validador Sintáctico', () => {
  it('no debe reportar errores en código válido', () => {
    const diagnosticos = obtener_diagnosticos_sintacticos(`
Tabla usuarios {
    id entero
    nombre texto
}
`);
    const errores = diagnosticos.filter((d) => d.severidad === Severidad.ERROR);
    expect(errores).toHaveLength(0);
  });

  it('debe detectar tablas con nombres duplicados', () => {
    const diagnosticos = obtener_diagnosticos_sintacticos(`
Tabla usuarios {
    id entero
}
Tabla usuarios {
    id entero
}
`);
    const errores = diagnosticos.filter((d) => d.severidad === Severidad.ERROR);
    expect(errores.length).toBeGreaterThan(0);
    expect(errores[0].mensaje).toContain('usuarios');
  });

  it('debe detectar grupos con nombres duplicados', () => {
    const diagnosticos = obtener_diagnosticos_sintacticos(`
Tabla t1 { id entero }
Tabla t2 { id entero }
Grupo g1 { t1 }
Grupo g1 { t2 }
`);
    const errores = diagnosticos.filter((d) => d.severidad === Severidad.ERROR);
    expect(errores.length).toBeGreaterThan(0);
    expect(errores[0].mensaje).toContain('g1');
  });

  it('debe advertir sobre tablas vacías', () => {
    const diagnosticos = obtener_diagnosticos_sintacticos('Tabla vacia { }');
    const advertencias = diagnosticos.filter((d) => d.severidad === Severidad.ADVERTENCIA);
    expect(advertencias.length).toBeGreaterThan(0);
    expect(advertencias[0].mensaje).toContain('no tiene columnas');
  });
});
