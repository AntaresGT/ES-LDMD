/**
 * @archivo utilidades-canvas.test.ts
 * @descripcion Pruebas de zoom y ajuste al contenido.
 */

import { describe, it, expect } from 'vitest';
import {
  ajustar_al_contenido,
  ZOOM_MINIMO_AJUSTE,
} from '@/renderizado/utilidades-canvas';

describe('ajustar_al_contenido', () => {
  it('usa el mismo zoom para el desplazamiento y el factor de escala', () => {
    const nodos = [
      { x: 0, y: 0, ancho: 20_000, alto: 20_000 },
    ];

    const vista = ajustar_al_contenido(nodos, 800, 600);
    const padding = 40;
    const ancho_contenido = 20_000 + padding * 2;
    const zoom_esperado = Math.min(
      Math.max(Math.min(800 / ancho_contenido, 600 / (20_000 + padding * 2)), ZOOM_MINIMO_AJUSTE),
      1.5,
    );

    expect(vista.zoom).toBe(zoom_esperado);
    expect(Number.isFinite(vista.desplazamiento_x)).toBe(true);
    expect(Number.isFinite(vista.desplazamiento_y)).toBe(true);

    const screen_x = nodos[0].x * vista.zoom + vista.desplazamiento_x;
    const screen_y = nodos[0].y * vista.zoom + vista.desplazamiento_y;
    expect(screen_x).toBeGreaterThanOrEqual(0);
    expect(screen_y).toBeGreaterThanOrEqual(0);
    expect(screen_x).toBeLessThan(800);
    expect(screen_y).toBeLessThan(600);
  });

  it('mantiene visibles las tablas de un diagrama grande', () => {
    const nodos = [
      { x: 40, y: 40, ancho: 220, alto: 160 },
      { x: 8000, y: 8000, ancho: 220, alto: 160 },
    ];

    const vista = ajustar_al_contenido(nodos, 900, 700);
    const dentro = (x: number, y: number) => {
      const sx = x * vista.zoom + vista.desplazamiento_x;
      const sy = y * vista.zoom + vista.desplazamiento_y;
      return sx >= -2 && sy >= -2 && sx <= 902 && sy <= 702;
    };

    expect(dentro(nodos[0].x, nodos[0].y)).toBe(true);
    expect(dentro(nodos[1].x + nodos[1].ancho, nodos[1].y + nodos[1].alto)).toBe(true);
  });
});
