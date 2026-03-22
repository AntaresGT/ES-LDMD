/**
 * @archivo validador-semantico.test.ts
 * @descripcion Pruebas unitarias del validador semántico.
 */

import { describe, it, expect } from 'vitest';
import { tokenizar } from '@/parser/tokenizador';
import { analizar } from '@/parser/analizador';
import { validar_semantica } from '@/validacion/validador-semantico';
import { Severidad } from '@/dominio/tipos';

function obtener_diagnosticos_semanticos(codigo: string) {
  const tokens = tokenizar(codigo);
  const { ast } = analizar(tokens);
  return validar_semantica(ast);
}

describe('Validador Semántico', () => {
  it('no debe reportar errores en código válido', () => {
    const diagnosticos = obtener_diagnosticos_semanticos(`
Tabla usuarios {
    id entero
    nombre texto

    indices {
        id
    }

    primaria {
        id
    }
}
`);
    const errores = diagnosticos.filter((d) => d.severidad === Severidad.ERROR);
    expect(errores).toHaveLength(0);
  });

  it('debe detectar columna inexistente en primaria', () => {
    const diagnosticos = obtener_diagnosticos_semanticos(`
Tabla t {
    id entero

    primaria {
        columna_inexistente
    }
}
`);
    const errores = diagnosticos.filter((d) => d.severidad === Severidad.ERROR);
    expect(errores.length).toBeGreaterThan(0);
    expect(errores[0].mensaje).toContain('columna_inexistente');
  });

  it('debe detectar columna inexistente en indices', () => {
    const diagnosticos = obtener_diagnosticos_semanticos(`
Tabla t {
    id entero

    indices {
        columna_inexistente
    }
}
`);
    const errores = diagnosticos.filter((d) => d.severidad === Severidad.ERROR);
    expect(errores.length).toBeGreaterThan(0);
    expect(errores[0].mensaje).toContain('columna_inexistente');
  });

  it('debe detectar tabla referenciada inexistente en foránea', () => {
    const diagnosticos = obtener_diagnosticos_semanticos(`
Tabla t {
    id entero
    ref_id entero

    foranea {
        ref_id tabla_inexistente(id)
    }
}
`);
    const errores = diagnosticos.filter((d) => d.severidad === Severidad.ERROR);
    expect(errores.length).toBeGreaterThan(0);
    expect(errores[0].mensaje).toContain('tabla_inexistente');
  });

  it('debe detectar columna local inexistente en foránea', () => {
    const diagnosticos = obtener_diagnosticos_semanticos(`
Tabla ref { id entero }
Tabla t {
    id entero

    foranea {
        columna_inexistente ref(id)
    }
}
`);
    const errores = diagnosticos.filter((d) => d.severidad === Severidad.ERROR);
    expect(errores.length).toBeGreaterThan(0);
    expect(errores[0].mensaje).toContain('columna_inexistente');
  });

  it('debe detectar tabla inexistente en grupo', () => {
    const diagnosticos = obtener_diagnosticos_semanticos(`
Tabla t1 { id entero }
Grupo g1 {
    t1
    tabla_inexistente
}
`);
    const errores = diagnosticos.filter((d) => d.severidad === Severidad.ERROR);
    expect(errores.length).toBeGreaterThan(0);
    expect(errores[0].mensaje).toContain('tabla_inexistente');
  });

  it('debe advertir sobre tipos no reconocidos', () => {
    const diagnosticos = obtener_diagnosticos_semanticos(`
Tabla t {
    id nchar(10)
}
`);
    const informaciones = diagnosticos.filter((d) => d.severidad === Severidad.INFORMACION);
    expect(informaciones.length).toBeGreaterThan(0);
    expect(informaciones[0].mensaje).toContain('nchar');
  });

  it('no debe advertir sobre tipos reconocidos', () => {
    const diagnosticos = obtener_diagnosticos_semanticos(`
Tabla t {
    id entero
    nombre texto
    activo lógico
    fecha fecha_hora
}
`);
    const informaciones = diagnosticos.filter((d) => d.severidad === Severidad.INFORMACION);
    expect(informaciones).toHaveLength(0);
  });

  it('debe validar foránea con tabla referenciada existente', () => {
    const diagnosticos = obtener_diagnosticos_semanticos(`
Tabla usuarios {
    id entero
    primaria { id }
}
Tabla pedidos {
    id entero
    usuario_id entero
    foranea {
        usuario_id usuarios(id)
    }
}
`);
    const errores = diagnosticos.filter((d) => d.severidad === Severidad.ERROR);
    expect(errores).toHaveLength(0);
  });
});
