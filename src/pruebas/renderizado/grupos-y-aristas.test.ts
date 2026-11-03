/**
 * @archivo grupos-y-aristas.test.ts
 * @descripcion Integración: muchos grupos no se montan y las FK quedan fuera de las tablas.
 */

import { describe, it, expect } from 'vitest';
import { tokenizar } from '@/parser/tokenizador';
import { analizar } from '@/parser/analizador';
import { ast_a_diagrama } from '@/transformadores/ast-a-diagrama';
import { aplicar_auto_layout } from '@/renderizado/auto-layout';
import {
  asignacion_exclusiva_grupos,
  calcular_caja_grupo,
  calcular_geometrias_aristas,
  CajaGrupo,
  nodos_del_grupo,
} from '@/renderizado/geometria-arista';
import { NodoDiagrama } from '@/transformadores/ast-a-diagrama';

const ESQUEMA_MUCHOS_GRUPOS = `
Tabla planetas {
    za_planeta entero
    nombre texto(60) [no nulo]
    primaria { za_planeta }
}

Tabla paises {
    za_pais entero
    za_planeta entero [no nulo]
    nombre texto(80) [no nulo]
    primaria { za_pais }
    foranea { za_planeta planetas(za_planeta) }
}

Tabla estados {
    za_estado entero
    za_pais entero [no nulo]
    nombre texto(80) [no nulo]
    primaria { za_estado }
    foranea { za_pais paises(za_pais) }
}

Tabla miembros {
    za_miembro uuid
    za_cliente uuid
    nombre texto
    pais entero
    primaria { za_miembro }
    foranea { pais paises(za_pais) }
}

Tabla contactos {
    za_contacto uuid
    nombre texto
    za_pais entero
    primaria { za_contacto }
    foranea { za_pais paises(za_pais) }
}

Grupo catalogo {
    planetas
}

Grupo geografico {
    paises
    estados
}

Grupo personas {
    miembros
}

Grupo landing {
    contactos
}
`;

function modelo_con_layout(fuente: string) {
  const { ast } = analizar(tokenizar(fuente));
  const modelo = ast_a_diagrama(ast);
  const nodos = aplicar_auto_layout(modelo.nodos, modelo.aristas, modelo.grupos);
  return { ...modelo, nodos };
}

function cajas_solapan(a: CajaGrupo, b: CajaGrupo): boolean {
  return a.min_x < b.max_x && b.min_x < a.max_x && a.barra_y < b.max_y && b.barra_y < a.max_y;
}

function punto_en_nodo(x: number, y: number, nodo: NodoDiagrama): boolean {
  return x > nodo.x && x < nodo.x + nodo.ancho && y > nodo.y && y < nodo.y + nodo.alto;
}

function bezier(
  t: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
): { x: number; y: number } {
  const mt = 1 - t;
  return {
    x: mt * mt * mt * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3,
    y: mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3,
  };
}

describe('grupos y aristas en un esquema con varias capas', () => {
  it('no monta las cajas de grupo unas sobre otras', () => {
    const modelo = modelo_con_layout(ESQUEMA_MUCHOS_GRUPOS);
    const asignacion = asignacion_exclusiva_grupos(modelo.grupos);
    const cajas = modelo.grupos
      .map((grupo) => calcular_caja_grupo(nodos_del_grupo(grupo, modelo.nodos, asignacion)))
      .filter((caja): caja is CajaGrupo => caja !== null);

    expect(cajas.length).toBe(4);

    for (let i = 0; i < cajas.length; i++) {
      for (let j = i + 1; j < cajas.length; j++) {
        expect(cajas_solapan(cajas[i], cajas[j])).toBe(false);
      }
    }
  });

  it('deja anclas y controles de FK fuera de las tablas', () => {
    const modelo = modelo_con_layout(ESQUEMA_MUCHOS_GRUPOS);
    const geometrias = calcular_geometrias_aristas(modelo.aristas, modelo.nodos);

    expect(modelo.aristas.length).toBeGreaterThan(0);

    for (const arista of modelo.aristas) {
      const geo = geometrias.get(arista.id)!;
      const origen = modelo.nodos.find((n) => n.id === arista.nodo_origen)!;
      const destino = modelo.nodos.find((n) => n.id === arista.nodo_destino)!;

      expect(punto_en_nodo(geo.origen_x, geo.origen_y, origen)).toBe(false);
      expect(punto_en_nodo(geo.destino_x, geo.destino_y, destino)).toBe(false);
      expect(punto_en_nodo(geo.cp1x, geo.cp1y, origen)).toBe(false);
      expect(punto_en_nodo(geo.cp2x, geo.cp2y, destino)).toBe(false);
    }
  });

  it('no cruza el interior de tablas ajenas con la curva', () => {
    const modelo = modelo_con_layout(ESQUEMA_MUCHOS_GRUPOS);
    const geometrias = calcular_geometrias_aristas(modelo.aristas, modelo.nodos);

    for (const arista of modelo.aristas) {
      const geo = geometrias.get(arista.id)!;
      const ajenas = modelo.nodos.filter(
        (n) => n.id !== arista.nodo_origen && n.id !== arista.nodo_destino,
      );

      for (let i = 1; i < 20; i++) {
        const t = i / 20;
        const p = bezier(
          t,
          geo.origen_x,
          geo.origen_y,
          geo.cp1x,
          geo.cp1y,
          geo.cp2x,
          geo.cp2y,
          geo.destino_x,
          geo.destino_y,
        );
        for (const nodo of ajenas) {
          expect(punto_en_nodo(p.x, p.y, nodo), `${arista.id} cruza ${nodo.id}`).toBe(false);
        }
      }
    }
  });
});
