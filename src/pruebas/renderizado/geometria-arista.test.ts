/**
 * @archivo geometria-arista.test.ts
 * @descripcion Pruebas de anclas, lados y controles de las aristas FK.
 */

import { describe, it, expect } from 'vitest';
import { AristaDiagrama } from '@/transformadores/ast-a-diagrama';
import {
  ALTO_FILA,
  ALTO_HEADER,
  SALIENTE_ANCLA,
} from '@/renderizado/constantes-diagrama';
import {
  CajaNodo,
  calcular_geometria_arista,
  calcular_geometrias_aristas,
} from '@/renderizado/geometria-arista';

function crear_arista(
  origen: string,
  columna_origen: string,
  destino: string,
  columnas_destino: string[] = ['id'],
): AristaDiagrama {
  return {
    id: `${origen}.${columna_origen}->${destino}`,
    nodo_origen: origen,
    columna_origen,
    nodo_destino: destino,
    columnas_destino,
    eliminacion_cascada: false,
    actualizacion_cascada: false,
    cardinalidad: '1:N',
  };
}

function crear_caja(
  id: string,
  x: number,
  y: number,
  columnas: string[],
  ancho = 200,
  alto = 120,
): CajaNodo {
  return {
    id,
    x,
    y,
    ancho,
    alto,
    columnas: columnas.map((nombre) => ({ nombre })),
  };
}

function punto_dentro(
  x: number,
  y: number,
  caja: CajaNodo,
): boolean {
  return x >= caja.x && x <= caja.x + caja.ancho && y >= caja.y && y <= caja.y + caja.alto;
}

describe('calcular_geometria_arista', () => {
  it('ancla arriba y abajo cuando las tablas están apiladas', () => {
    const origen = crear_caja('pedidos', 40, 200, ['usuario_id']);
    const destino = crear_caja('usuarios', 40, 0, ['id']);
    const arista = crear_arista('pedidos', 'usuario_id', 'usuarios');

    const geo = calcular_geometria_arista(arista, origen, destino);

    expect(geo.lado_origen).toBe('arriba');
    expect(geo.lado_destino).toBe('abajo');
    expect(geo.origen_y).toBe(origen.y - SALIENTE_ANCLA);
    expect(geo.destino_y).toBe(destino.y + destino.alto + SALIENTE_ANCLA);
  });

  it('ancla a los lados cuando las tablas están en la misma fila', () => {
    const origen = crear_caja('pedidos', 0, 0, ['usuario_id']);
    const destino = crear_caja('usuarios', 400, 0, ['id']);
    const arista = crear_arista('pedidos', 'usuario_id', 'usuarios');

    const geo = calcular_geometria_arista(arista, origen, destino);

    expect(geo.lado_origen).toBe('derecha');
    expect(geo.lado_destino).toBe('izquierda');
    expect(geo.origen_x).toBe(origen.x + origen.ancho + SALIENTE_ANCLA);
    expect(geo.destino_x).toBe(destino.x - SALIENTE_ANCLA);
  });

  it('fuerza anclas verticales cuando los rangos X se solapan', () => {
    const origen = crear_caja('pedidos', 0, 300, ['usuario_id']);
    const destino = crear_caja('usuarios', 50, 0, ['id']);
    const arista = crear_arista('pedidos', 'usuario_id', 'usuarios');

    const geo = calcular_geometria_arista(arista, origen, destino);

    expect(geo.lado_origen).toBe('arriba');
    expect(geo.lado_destino).toBe('abajo');
  });

  it('ancla el destino en la columna referenciada', () => {
    const origen = crear_caja('pedidos', 0, 0, ['usuario_id']);
    const destino = crear_caja('usuarios', 400, 0, ['id', 'nombre']);
    const arista = crear_arista('pedidos', 'usuario_id', 'usuarios', ['nombre']);

    const geo = calcular_geometria_arista(arista, origen, destino);
    const y_nombre = destino.y + ALTO_HEADER + 1 * ALTO_FILA + ALTO_FILA / 2;

    expect(geo.destino_y).toBe(y_nombre);
    expect(geo.origen_y).toBe(origen.y + ALTO_HEADER + ALTO_FILA / 2);
  });

  it('usa el centro del header si la columna no existe', () => {
    const origen = crear_caja('pedidos', 0, 0, ['usuario_id']);
    const destino = crear_caja('usuarios', 400, 0, ['id']);
    const arista = crear_arista('pedidos', 'no_existe', 'usuarios', ['tampoco']);

    const geo = calcular_geometria_arista(arista, origen, destino);

    expect(geo.origen_y).toBe(origen.y + ALTO_HEADER / 2);
    expect(geo.destino_y).toBe(destino.y + ALTO_HEADER / 2);
  });

  it('desvía por el mismo lado si hay una tabla en el corredor vertical', () => {
    const origen = crear_caja('miembros', 40, 400, ['pais']);
    const medio = crear_caja('estados', 40, 200, ['id']);
    const destino = crear_caja('paises', 40, 0, ['za_pais']);
    const arista = crear_arista('miembros', 'pais', 'paises', ['za_pais']);

    const geo = calcular_geometrias_aristas([arista], [origen, medio, destino]).get(arista.id)!;

    expect(geo.lado_origen).toBe(geo.lado_destino);
    expect(['izquierda', 'derecha']).toContain(geo.lado_origen);
    expect(punto_dentro(geo.cp1x, geo.cp1y, medio)).toBe(false);
    expect(punto_dentro(geo.cp2x, geo.cp2y, medio)).toBe(false);
  });

  it('saca los controles de una autorrelación fuera de la tabla', () => {
    const nodo = crear_caja('empleados', 100, 80, ['id', 'jefe_id']);
    const arista = crear_arista('empleados', 'jefe_id', 'empleados', ['id']);

    const geo = calcular_geometria_arista(arista, nodo, nodo);

    expect(geo.lado_origen).toBe('derecha');
    expect(geo.lado_destino).toBe('derecha');
    expect(punto_dentro(geo.cp1x, geo.cp1y, nodo)).toBe(false);
    expect(punto_dentro(geo.cp2x, geo.cp2y, nodo)).toBe(false);
    expect(geo.cp1x).toBeGreaterThan(nodo.x + nodo.ancho);
    expect(geo.cp2x).toBeGreaterThan(nodo.x + nodo.ancho);
  });
});
