/**
 * @archivo auto-layout.ts
 * @descripcion Algoritmos de distribución automática de nodos en el diagrama.
 * Soporta tres estrategias: izquierda-derecha (Sugiyama), copo de nieve
 * (nodo más conectado al centro) y compacto (grilla rectangular).
 */

import { NodoDiagrama, AristaDiagrama, GrupoDiagrama } from '@/transformadores/ast-a-diagrama';

/**
 * Tipo de algoritmo de distribución automática.
 * - 'izquierda-derecha': Layout por capas tipo Sugiyama basado en dependencias.
 * - 'copo-de-nieve': Nodo más conectado al centro, conectados alrededor.
 * - 'compacto': Grilla rectangular uniforme.
 */
export type TipoLayout = 'izquierda-derecha' | 'copo-de-nieve' | 'compacto';

/** Margen horizontal entre nodos */
const MARGEN_HORIZONTAL = 60;
/** Margen vertical entre nodos */
const MARGEN_VERTICAL = 50;
/** Padding inicial */
const PADDING_INICIAL = 40;

/**
 * Aplica distribución automática a los nodos del diagrama.
 *
 * @param {NodoDiagrama[]} nodos - Nodos a distribuir
 * @param {AristaDiagrama[]} aristas - Aristas (relaciones) entre nodos
 * @param {GrupoDiagrama[]} grupos - Grupos de nodos
 * @param {TipoLayout} tipo - Algoritmo de distribución a usar
 * @returns {NodoDiagrama[]} Nodos con posiciones actualizadas
 */
export function aplicar_auto_layout(
  nodos: NodoDiagrama[],
  aristas: AristaDiagrama[],
  grupos: GrupoDiagrama[],
  tipo: TipoLayout = 'izquierda-derecha',
): NodoDiagrama[] {
  if (nodos.length === 0) return nodos;

  const nodos_copia = nodos.map((n) => ({ ...n }));

  switch (tipo) {
    case 'copo-de-nieve':
      layout_copo_de_nieve(nodos_copia, aristas);
      break;
    case 'compacto':
      layout_compacto(nodos_copia);
      break;
    case 'izquierda-derecha':
    default: {
      const dependencias = construir_grafo_dependencias(nodos_copia, aristas);
      const capas = asignar_capas(nodos_copia, dependencias);
      posicionar_por_capas(nodos_copia, capas, grupos);
      break;
    }
  }

  return nodos_copia;
}

/**
 * Construye un grafo de dependencias a partir de las aristas.
 * Un nodo depende de otro si tiene una llave foránea apuntando a él.
 *
 * @param {NodoDiagrama[]} nodos - Lista de nodos
 * @param {AristaDiagrama[]} aristas - Lista de aristas
 * @returns {Map<string, Set<string>>} Mapa de id → dependencias (tablas de las que depende)
 */
function construir_grafo_dependencias(
  nodos: NodoDiagrama[],
  aristas: AristaDiagrama[],
): Map<string, Set<string>> {
  const dependencias = new Map<string, Set<string>>();

  for (const nodo of nodos) {
    dependencias.set(nodo.id, new Set());
  }

  for (const arista of aristas) {
    const deps = dependencias.get(arista.nodo_origen);
    if (deps) {
      deps.add(arista.nodo_destino);
    }
  }

  return dependencias;
}

/**
 * Asigna capas (niveles) a los nodos usando ordering topológico.
 * Los nodos sin dependencias van en la capa 0 (arriba).
 *
 * @param {NodoDiagrama[]} nodos - Lista de nodos
 * @param {Map<string, Set<string>>} dependencias - Grafo de dependencias
 * @returns {Map<string, number>} Mapa de id → número de capa
 */
function asignar_capas(
  nodos: NodoDiagrama[],
  dependencias: Map<string, Set<string>>,
): Map<string, number> {
  const capas = new Map<string, number>();
  const visitados = new Set<string>();

  /**
   * Calcula la capa de un nodo recursivamente.
   */
  function calcular_capa(id: string, en_pila: Set<string>): number {
    if (capas.has(id)) return capas.get(id)!;
    if (en_pila.has(id)) return 0; // Ciclo detectado, evitar recursión infinita

    en_pila.add(id);
    const deps = dependencias.get(id) || new Set();
    let max_capa = -1;

    for (const dep of deps) {
      const capa_dep = calcular_capa(dep, en_pila);
      max_capa = Math.max(max_capa, capa_dep);
    }

    const mi_capa = max_capa + 1;
    capas.set(id, mi_capa);
    en_pila.delete(id);
    visitados.add(id);

    return mi_capa;
  }

  for (const nodo of nodos) {
    if (!visitados.has(nodo.id)) {
      calcular_capa(nodo.id, new Set());
    }
  }

  return capas;
}

/**
 * Posiciona los nodos en el canvas según sus capas asignadas.
 * Los nodos de la misma capa se colocan horizontalmente.
 * Los grupos se mantienen agrupados visualmente.
 *
 * @param {NodoDiagrama[]} nodos - Nodos a posicionar (se mutan)
 * @param {Map<string, number>} capas - Mapa de capas
 * @param {GrupoDiagrama[]} grupos - Grupos de nodos
 */
function posicionar_por_capas(
  nodos: NodoDiagrama[],
  capas: Map<string, number>,
  grupos: GrupoDiagrama[],
): void {
  // Agrupar nodos por capa
  const nodos_por_capa = new Map<number, NodoDiagrama[]>();

  for (const nodo of nodos) {
    const capa = capas.get(nodo.id) || 0;
    if (!nodos_por_capa.has(capa)) {
      nodos_por_capa.set(capa, []);
    }
    nodos_por_capa.get(capa)!.push(nodo);
  }

  // Ordenar nodos dentro de cada capa por grupo (los del mismo grupo juntos)
  const mapa_grupo = new Map<string, string>();
  for (const grupo of grupos) {
    for (const nodo_id of grupo.nodos) {
      mapa_grupo.set(nodo_id, grupo.nombre);
    }
  }

  for (const nodos_capa of nodos_por_capa.values()) {
    nodos_capa.sort((a, b) => {
      const grupo_a = mapa_grupo.get(a.id) || '';
      const grupo_b = mapa_grupo.get(b.id) || '';
      return grupo_a.localeCompare(grupo_b);
    });
  }

  // Posicionar nodos
  const capas_ordenadas = Array.from(nodos_por_capa.keys()).sort((a, b) => a - b);
  let y_actual = PADDING_INICIAL;

  for (const capa of capas_ordenadas) {
    const nodos_capa = nodos_por_capa.get(capa)!;
    let x_actual = PADDING_INICIAL;
    let max_alto = 0;

    for (const nodo of nodos_capa) {
      nodo.x = x_actual;
      nodo.y = y_actual;
      x_actual += nodo.ancho + MARGEN_HORIZONTAL;
      max_alto = Math.max(max_alto, nodo.alto);
    }

    y_actual += max_alto + MARGEN_VERTICAL;
  }
}

// ============================================================
// Algoritmo: Copo de nieve (Snowflake)
// ============================================================

/**
 * Calcula el grado de conexión de cada nodo (aristas entrantes + salientes).
 */
function calcular_grados(
  nodos: NodoDiagrama[],
  aristas: AristaDiagrama[],
): Map<string, number> {
  const grados = new Map<string, number>();
  for (const nodo of nodos) {
    grados.set(nodo.id, 0);
  }
  for (const arista of aristas) {
    grados.set(arista.nodo_origen, (grados.get(arista.nodo_origen) || 0) + 1);
    grados.set(arista.nodo_destino, (grados.get(arista.nodo_destino) || 0) + 1);
  }
  return grados;
}

/**
 * Layout tipo copo de nieve: el nodo más conectado al centro,
 * nodos directamente conectados en un primer anillo,
 * y el resto en un segundo anillo exterior.
 */
function layout_copo_de_nieve(
  nodos: NodoDiagrama[],
  aristas: AristaDiagrama[],
): void {
  const grados = calcular_grados(nodos, aristas);

  // Ordenar por grado descendente; el más conectado será el centro
  const ordenados = [...nodos].sort(
    (a, b) => (grados.get(b.id) || 0) - (grados.get(a.id) || 0),
  );

  const centro_id = ordenados[0].id;

  // Identificar vecinos directos del centro
  const vecinos_centro = new Set<string>();
  for (const arista of aristas) {
    if (arista.nodo_origen === centro_id) vecinos_centro.add(arista.nodo_destino);
    if (arista.nodo_destino === centro_id) vecinos_centro.add(arista.nodo_origen);
  }

  const nodos_anillo_1: NodoDiagrama[] = [];
  const nodos_anillo_2: NodoDiagrama[] = [];
  let nodo_centro: NodoDiagrama | null = null;

  for (const nodo of nodos) {
    if (nodo.id === centro_id) {
      nodo_centro = nodo;
    } else if (vecinos_centro.has(nodo.id)) {
      nodos_anillo_1.push(nodo);
    } else {
      nodos_anillo_2.push(nodo);
    }
  }

  // Calcular radio de los anillos basándose en el tamaño de los nodos
  const ancho_max = Math.max(...nodos.map((n) => n.ancho));
  const alto_max = Math.max(...nodos.map((n) => n.alto));
  const diagonal = Math.sqrt(ancho_max * ancho_max + alto_max * alto_max);

  const radio_1 = Math.max(
    diagonal + MARGEN_HORIZONTAL,
    (nodos_anillo_1.length * (ancho_max + MARGEN_HORIZONTAL)) / (2 * Math.PI),
  );
  const radio_2 = radio_1 + diagonal + MARGEN_VERTICAL;

  // Calcular centro del canvas
  const cx = PADDING_INICIAL + radio_2 + ancho_max / 2;
  const cy = PADDING_INICIAL + radio_2 + alto_max / 2;

  // Posicionar nodo central
  if (nodo_centro) {
    nodo_centro.x = cx - nodo_centro.ancho / 2;
    nodo_centro.y = cy - nodo_centro.alto / 2;
  }

  // Posicionar primer anillo
  posicionar_en_anillo(nodos_anillo_1, cx, cy, radio_1);

  // Posicionar segundo anillo
  posicionar_en_anillo(nodos_anillo_2, cx, cy, radio_2);
}

/**
 * Distribuye una lista de nodos uniformemente en un anillo circular.
 */
function posicionar_en_anillo(
  nodos: NodoDiagrama[],
  cx: number,
  cy: number,
  radio: number,
): void {
  if (nodos.length === 0) return;
  const paso_angulo = (2 * Math.PI) / nodos.length;
  // Empezar desde arriba (-PI/2)
  const angulo_inicio = -Math.PI / 2;

  for (let i = 0; i < nodos.length; i++) {
    const angulo = angulo_inicio + i * paso_angulo;
    nodos[i].x = cx + radio * Math.cos(angulo) - nodos[i].ancho / 2;
    nodos[i].y = cy + radio * Math.sin(angulo) - nodos[i].alto / 2;
  }
}

// ============================================================
// Algoritmo: Compacto (grilla rectangular)
// ============================================================

/**
 * Layout compacto: distribuye los nodos en una grilla rectangular.
 * No considera relaciones, simplemente organiza en filas y columnas.
 */
function layout_compacto(nodos: NodoDiagrama[]): void {
  const columnas = Math.ceil(Math.sqrt(nodos.length));

  let x_actual = PADDING_INICIAL;
  let y_actual = PADDING_INICIAL;
  let max_alto_fila = 0;

  for (let i = 0; i < nodos.length; i++) {
    if (i > 0 && i % columnas === 0) {
      // Nueva fila
      x_actual = PADDING_INICIAL;
      y_actual += max_alto_fila + MARGEN_VERTICAL;
      max_alto_fila = 0;
    }

    nodos[i].x = x_actual;
    nodos[i].y = y_actual;
    x_actual += nodos[i].ancho + MARGEN_HORIZONTAL;
    max_alto_fila = Math.max(max_alto_fila, nodos[i].alto);
  }
}
