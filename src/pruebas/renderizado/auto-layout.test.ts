/**
 * @archivo auto-layout.test.ts
 * @descripcion Pruebas unitarias para el algoritmo de distribución automática.
 */

import { describe, it, expect } from 'vitest';
import { aplicar_auto_layout, TipoLayout } from '@/renderizado/auto-layout';
import { NodoDiagrama, AristaDiagrama, GrupoDiagrama } from '@/transformadores/ast-a-diagrama';

/** Helper para crear un nodo de diagrama */
function crear_nodo(
  id: string,
  ancho: number = 200,
  alto: number = 120,
): NodoDiagrama {
  return {
    id,
    nombre: id,
    esquema: null,
    columnas: [],
    nota: null,
    grupo: null,
    x: 0,
    y: 0,
    ancho,
    alto,
  };
}

/** Helper para crear una arista */
function crear_arista(
  nodo_origen: string,
  columna_origen: string,
  nodo_destino: string,
): AristaDiagrama {
  return {
    id: `${nodo_origen}->${nodo_destino}`,
    nodo_origen,
    columna_origen,
    nodo_destino,
    columnas_destino: ['id'],
    eliminacion_cascada: false,
    actualizacion_cascada: false,
    cardinalidad: '1:N',
  };
}

describe('aplicar_auto_layout', () => {
  it('debería retornar array vacío para nodos vacíos', () => {
    const resultado = aplicar_auto_layout([], [], []);
    expect(resultado).toHaveLength(0);
  });

  it('debería posicionar un solo nodo en el padding inicial', () => {
    const nodos = [crear_nodo('A')];
    const resultado = aplicar_auto_layout(nodos, [], []);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].x).toBe(40); // PADDING_INICIAL
    expect(resultado[0].y).toBe(40);
  });

  it('debería no mutar los nodos originales', () => {
    const nodo_original = crear_nodo('A');
    const x_original = nodo_original.x;
    const y_original = nodo_original.y;

    aplicar_auto_layout([nodo_original], [], []);

    expect(nodo_original.x).toBe(x_original);
    expect(nodo_original.y).toBe(y_original);
  });

  it('debería colocar nodos sin dependencias en la misma capa', () => {
    const nodos = [crear_nodo('A'), crear_nodo('B'), crear_nodo('C')];
    const resultado = aplicar_auto_layout(nodos, [], []);

    // Todos en la misma capa → misma Y
    expect(resultado[0].y).toBe(resultado[1].y);
    expect(resultado[1].y).toBe(resultado[2].y);

    // Diferentes X (horizontalmente distribuidos)
    expect(resultado[0].x).toBeLessThan(resultado[1].x);
    expect(resultado[1].x).toBeLessThan(resultado[2].x);
  });

  it('debería colocar nodos dependientes en capas diferentes', () => {
    const nodos = [crear_nodo('pedidos'), crear_nodo('usuarios')];
    const aristas = [crear_arista('pedidos', 'usuario_id', 'usuarios')];

    const resultado = aplicar_auto_layout(nodos, aristas, []);

    // 'usuarios' no depende de nadie → capa 0
    // 'pedidos' depende de 'usuarios' → capa 1
    const nodo_usuarios = resultado.find((n) => n.id === 'usuarios')!;
    const nodo_pedidos = resultado.find((n) => n.id === 'pedidos')!;

    // El nodo dependiente debería estar en una Y mayor (capa inferior)
    expect(nodo_pedidos.y).toBeGreaterThan(nodo_usuarios.y);
  });

  it('debería manejar cadena de dependencias A -> B -> C', () => {
    const nodos = [crear_nodo('A'), crear_nodo('B'), crear_nodo('C')];
    const aristas = [
      crear_arista('A', 'b_id', 'B'),
      crear_arista('B', 'c_id', 'C'),
    ];

    const resultado = aplicar_auto_layout(nodos, aristas, []);

    const nodo_a = resultado.find((n) => n.id === 'A')!;
    const nodo_b = resultado.find((n) => n.id === 'B')!;
    const nodo_c = resultado.find((n) => n.id === 'C')!;

    // C → capa 0, B → capa 1, A → capa 2
    expect(nodo_c.y).toBeLessThan(nodo_b.y);
    expect(nodo_b.y).toBeLessThan(nodo_a.y);
  });

  it('debería manejar dependencias cíclicas sin recursión infinita', () => {
    const nodos = [crear_nodo('A'), crear_nodo('B')];
    const aristas = [
      crear_arista('A', 'b_id', 'B'),
      crear_arista('B', 'a_id', 'A'),
    ];

    // No debería lanzar error de stack overflow
    expect(() => {
      aplicar_auto_layout(nodos, aristas, []);
    }).not.toThrow();

    const resultado = aplicar_auto_layout(nodos, aristas, []);
    expect(resultado).toHaveLength(2);
  });

  it('debería evitar superposición de nodos', () => {
    const nodos = [
      crear_nodo('A', 200, 120),
      crear_nodo('B', 200, 120),
      crear_nodo('C', 200, 120),
    ];

    const resultado = aplicar_auto_layout(nodos, [], []);

    // Verificar que ningún par de nodos se superpone
    for (let i = 0; i < resultado.length; i++) {
      for (let j = i + 1; j < resultado.length; j++) {
        const n1 = resultado[i];
        const n2 = resultado[j];

        const se_superpone_x = n1.x < n2.x + n2.ancho && n2.x < n1.x + n1.ancho;
        const se_superpone_y = n1.y < n2.y + n2.alto && n2.y < n1.y + n1.alto;

        expect(se_superpone_x && se_superpone_y).toBe(false);
      }
    }
  });

  it('debería agrupar nodos del mismo grupo juntos en la capa', () => {
    const nodos = [
      crear_nodo('A'),
      crear_nodo('B'),
      crear_nodo('C'),
      crear_nodo('D'),
    ];
    const grupos: GrupoDiagrama[] = [
      { nombre: 'G1', nodos: ['A', 'C'], color: '#ff000040' },
    ];

    const resultado = aplicar_auto_layout(nodos, [], grupos);

    // A y C deberían estar agrupados (adyacentes horizontalmente)
    const nodo_a = resultado.find((n) => n.id === 'A')!;
    const nodo_c = resultado.find((n) => n.id === 'C')!;

    // Ambos en la misma capa
    expect(nodo_a.y).toBe(nodo_c.y);

    // A y C deberían estar uno al lado del otro (consecutivos)
    // El orden por grupo los pondría juntos
    const posiciones_x = resultado
      .filter((n) => n.y === nodo_a.y)
      .sort((a, b) => a.x - b.x)
      .map((n) => n.id);

    const idx_a = posiciones_x.indexOf('A');
    const idx_c = posiciones_x.indexOf('C');
    expect(Math.abs(idx_a - idx_c)).toBe(1);
  });

  it('debería distribuir nodos con dimensiones variables', () => {
    const nodos = [
      crear_nodo('pequeño', 100, 60),
      crear_nodo('mediano', 200, 150),
      crear_nodo('grande', 350, 300),
    ];

    const resultado = aplicar_auto_layout(nodos, [], []);

    // Verificar que se respetan los márgenes
    for (let i = 0; i < resultado.length - 1; i++) {
      const n1 = resultado[i];
      const n2 = resultado[i + 1];

      if (n1.y === n2.y) {
        // Misma capa: verificar margen horizontal
        const espacio = n2.x - (n1.x + n1.ancho);
        expect(espacio).toBeGreaterThanOrEqual(60); // MARGEN_HORIZONTAL
      }
    }
  });
});

describe('aplicar_auto_layout con tipo copo-de-nieve', () => {
  it('debería posicionar el nodo más conectado al centro', () => {
    // C tiene 3 conexiones, A y B tienen 1 cada uno, D tiene 1
    const nodos = [crear_nodo('A'), crear_nodo('B'), crear_nodo('C'), crear_nodo('D')];
    const aristas = [
      crear_arista('A', 'c_id', 'C'),
      crear_arista('B', 'c_id', 'C'),
      crear_arista('D', 'c_id', 'C'),
    ];

    const resultado = aplicar_auto_layout(nodos, aristas, [], 'copo-de-nieve');
    const nodo_c = resultado.find((n) => n.id === 'C')!;
    const otros = resultado.filter((n) => n.id !== 'C');

    // El centro de C debería estar más cerca del centro geométrico que los demás
    const cx_c = nodo_c.x + nodo_c.ancho / 2;
    const cy_c = nodo_c.y + nodo_c.alto / 2;

    for (const otro of otros) {
      const cx_otro = otro.x + otro.ancho / 2;
      const cy_otro = otro.y + otro.alto / 2;
      const dist_otro = Math.sqrt((cx_otro - cx_c) ** 2 + (cy_otro - cy_c) ** 2);
      expect(dist_otro).toBeGreaterThan(0);
    }
  });

  it('debería colocar vecinos directos en el primer anillo alrededor del centro', () => {
    const nodos = [crear_nodo('centro'), crear_nodo('vec1'), crear_nodo('vec2'), crear_nodo('lejano')];
    const aristas = [
      crear_arista('vec1', 'c_id', 'centro'),
      crear_arista('vec2', 'c_id', 'centro'),
    ];

    const resultado = aplicar_auto_layout(nodos, aristas, [], 'copo-de-nieve');
    const nc = resultado.find((n) => n.id === 'centro')!;
    const nv1 = resultado.find((n) => n.id === 'vec1')!;
    const nv2 = resultado.find((n) => n.id === 'vec2')!;
    const nl = resultado.find((n) => n.id === 'lejano')!;

    const centro = { x: nc.x + nc.ancho / 2, y: nc.y + nc.alto / 2 };
    const dist = (n: NodoDiagrama) =>
      Math.sqrt((n.x + n.ancho / 2 - centro.x) ** 2 + (n.y + n.alto / 2 - centro.y) ** 2);

    // Los vecinos deberían estar más cerca que el nodo lejano
    expect(dist(nv1)).toBeLessThan(dist(nl));
    expect(dist(nv2)).toBeLessThan(dist(nl));
  });

  it('debería no mutar los nodos originales', () => {
    const nodo = crear_nodo('A');
    const x = nodo.x;
    const y = nodo.y;
    aplicar_auto_layout([nodo], [], [], 'copo-de-nieve');
    expect(nodo.x).toBe(x);
    expect(nodo.y).toBe(y);
  });

  it('debería evitar superposición de nodos', () => {
    const nodos = [crear_nodo('A'), crear_nodo('B'), crear_nodo('C'), crear_nodo('D'), crear_nodo('E')];
    const aristas = [
      crear_arista('B', 'a_id', 'A'),
      crear_arista('C', 'a_id', 'A'),
      crear_arista('D', 'a_id', 'A'),
      crear_arista('E', 'a_id', 'A'),
    ];

    const resultado = aplicar_auto_layout(nodos, aristas, [], 'copo-de-nieve');

    for (let i = 0; i < resultado.length; i++) {
      for (let j = i + 1; j < resultado.length; j++) {
        const n1 = resultado[i];
        const n2 = resultado[j];
        const se_superpone_x = n1.x < n2.x + n2.ancho && n2.x < n1.x + n1.ancho;
        const se_superpone_y = n1.y < n2.y + n2.alto && n2.y < n1.y + n1.alto;
        expect(se_superpone_x && se_superpone_y).toBe(false);
      }
    }
  });
});

describe('aplicar_auto_layout con tipo compacto', () => {
  it('debería distribuir nodos en grilla rectangular', () => {
    const nodos = [crear_nodo('A'), crear_nodo('B'), crear_nodo('C'), crear_nodo('D')];
    const resultado = aplicar_auto_layout(nodos, [], [], 'compacto');

    // 4 nodos → ceil(sqrt(4)) = 2 columnas → 2 filas de 2
    const nodo_a = resultado.find((n) => n.id === 'A')!;
    const nodo_b = resultado.find((n) => n.id === 'B')!;
    const nodo_c = resultado.find((n) => n.id === 'C')!;
    const nodo_d = resultado.find((n) => n.id === 'D')!;

    // A y B en primera fila (misma Y)
    expect(nodo_a.y).toBe(nodo_b.y);
    // C y D en segunda fila (misma Y)
    expect(nodo_c.y).toBe(nodo_d.y);
    // Primera fila arriba de la segunda
    expect(nodo_a.y).toBeLessThan(nodo_c.y);
  });

  it('debería evitar superposición de nodos', () => {
    const nodos = [
      crear_nodo('A', 200, 120),
      crear_nodo('B', 150, 100),
      crear_nodo('C', 300, 200),
      crear_nodo('D', 180, 90),
      crear_nodo('E', 220, 150),
    ];

    const resultado = aplicar_auto_layout(nodos, [], [], 'compacto');

    for (let i = 0; i < resultado.length; i++) {
      for (let j = i + 1; j < resultado.length; j++) {
        const n1 = resultado[i];
        const n2 = resultado[j];
        const se_superpone_x = n1.x < n2.x + n2.ancho && n2.x < n1.x + n1.ancho;
        const se_superpone_y = n1.y < n2.y + n2.alto && n2.y < n1.y + n1.alto;
        expect(se_superpone_x && se_superpone_y).toBe(false);
      }
    }
  });

  it('debería posicionar el primer nodo en el padding inicial', () => {
    const nodos = [crear_nodo('A')];
    const resultado = aplicar_auto_layout(nodos, [], [], 'compacto');
    expect(resultado[0].x).toBe(40); // PADDING_INICIAL
    expect(resultado[0].y).toBe(40);
  });

  it('debería no mutar los nodos originales', () => {
    const nodo = crear_nodo('A');
    const x = nodo.x;
    const y = nodo.y;
    aplicar_auto_layout([nodo], [], [], 'compacto');
    expect(nodo.x).toBe(x);
    expect(nodo.y).toBe(y);
  });
});

describe('aplicar_auto_layout respeta el parámetro tipo', () => {
  it('debería usar izquierda-derecha por defecto', () => {
    const nodos = [crear_nodo('A'), crear_nodo('B')];
    const aristas = [crear_arista('A', 'b_id', 'B')];

    const sin_tipo = aplicar_auto_layout(nodos, aristas, []);
    const con_tipo = aplicar_auto_layout(nodos, aristas, [], 'izquierda-derecha');

    expect(sin_tipo[0].x).toBe(con_tipo[0].x);
    expect(sin_tipo[0].y).toBe(con_tipo[0].y);
    expect(sin_tipo[1].x).toBe(con_tipo[1].x);
    expect(sin_tipo[1].y).toBe(con_tipo[1].y);
  });

  it('debería producir resultados distintos con distintos algoritmos', () => {
    const nodos = [crear_nodo('A'), crear_nodo('B'), crear_nodo('C'), crear_nodo('D')];
    const aristas = [
      crear_arista('B', 'a_id', 'A'),
      crear_arista('C', 'a_id', 'A'),
      crear_arista('D', 'a_id', 'A'),
    ];

    const izq_der = aplicar_auto_layout(nodos, aristas, [], 'izquierda-derecha');
    const copo = aplicar_auto_layout(nodos, aristas, [], 'copo-de-nieve');
    const compacto = aplicar_auto_layout(nodos, aristas, [], 'compacto');

    // Al menos uno de los nodos debería tener posición diferente entre algoritmos
    const posiciones_diferentes = (a: NodoDiagrama[], b: NodoDiagrama[]) =>
      a.some((n, i) => n.x !== b[i].x || n.y !== b[i].y);

    expect(posiciones_diferentes(izq_der, copo)).toBe(true);
    expect(posiciones_diferentes(izq_der, compacto)).toBe(true);
  });
});
