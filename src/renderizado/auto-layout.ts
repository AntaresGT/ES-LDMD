/**
 * @archivo auto-layout.ts
 * @descripcion Algoritmos de distribución automática de nodos en el diagrama.
 * Soporta tres estrategias: izquierda-derecha (Sugiyama), copo de nieve
 * (nodo más conectado al centro) y compacto (grilla rectangular).
 * Si hay grupos, cada uno se empaqueta como bloque y el algoritmo opera sobre bloques.
 */

import { NodoDiagrama, AristaDiagrama, GrupoDiagrama } from '@/transformadores/ast-a-diagrama';
import { ALTO_BARRA_GRUPO, PADDING_GRUPO } from './constantes-diagrama';
import { asignacion_exclusiva_grupos } from './geometria-arista';

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

interface BloqueLayout {
  id: string;
  es_grupo: boolean;
  nodos: NodoDiagrama[];
  ancho: number;
  alto: number;
}

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

  if (grupos.length === 0) {
    aplicar_layout_sobre_nodos(nodos_copia, aristas, grupos, tipo);
    return nodos_copia;
  }

  const bloques = construir_bloques(nodos_copia, grupos);
  for (const bloque of bloques) {
    if (bloque.es_grupo) {
      empaquetar_grupo(bloque, aristas);
    } else {
      bloque.ancho = bloque.nodos[0].ancho;
      bloque.alto = bloque.nodos[0].alto;
    }
  }

  const super_nodos = bloques.map((bloque) =>
    nodo_ficticio(bloque.id, bloque.ancho, bloque.alto),
  );
  const super_aristas = aristas_entre_bloques(aristas, bloques);
  aplicar_layout_sobre_nodos(super_nodos, super_aristas, [], tipo);

  const por_id = new Map(super_nodos.map((nodo) => [nodo.id, nodo]));
  for (const bloque of bloques) {
    const super_nodo = por_id.get(bloque.id);
    if (!super_nodo) continue;
    volcar_bloque(bloque, super_nodo.x, super_nodo.y);
  }

  return nodos_copia;
}

function aplicar_layout_sobre_nodos(
  nodos: NodoDiagrama[],
  aristas: AristaDiagrama[],
  grupos: GrupoDiagrama[],
  tipo: TipoLayout,
): void {
  switch (tipo) {
    case 'copo-de-nieve':
      layout_copo_de_nieve(nodos, aristas);
      break;
    case 'compacto':
      layout_compacto(nodos);
      break;
    case 'izquierda-derecha':
    default: {
      const dependencias = construir_grafo_dependencias(nodos, aristas);
      const capas = asignar_capas(nodos, dependencias);
      posicionar_por_capas(nodos, capas, grupos);
      break;
    }
  }
}

function construir_bloques(
  nodos: NodoDiagrama[],
  grupos: GrupoDiagrama[],
): BloqueLayout[] {
  const asignacion = asignacion_exclusiva_grupos(grupos);
  const por_id = new Map(nodos.map((nodo) => [nodo.id, nodo]));
  const usados = new Set<string>();
  const bloques: BloqueLayout[] = [];

  for (const grupo of grupos) {
    const miembros: NodoDiagrama[] = [];
    for (const id of grupo.nodos) {
      if (asignacion.get(id) !== grupo.nombre) continue;
      const nodo = por_id.get(id);
      if (!nodo) continue;
      miembros.push(nodo);
      usados.add(id);
    }
    if (miembros.length === 0) continue;
    bloques.push({
      id: `grupo:${grupo.nombre}`,
      es_grupo: true,
      nodos: miembros,
      ancho: 0,
      alto: 0,
    });
  }

  for (const nodo of nodos) {
    if (usados.has(nodo.id)) continue;
    bloques.push({
      id: `nodo:${nodo.id}`,
      es_grupo: false,
      nodos: [nodo],
      ancho: nodo.ancho,
      alto: nodo.alto,
    });
  }

  return bloques;
}

function empaquetar_grupo(bloque: BloqueLayout, aristas: AristaDiagrama[]): void {
  const ids = new Set(bloque.nodos.map((nodo) => nodo.id));
  const internas = aristas.filter(
    (arista) => ids.has(arista.nodo_origen) && ids.has(arista.nodo_destino),
  );

  const dependencias = construir_grafo_dependencias(bloque.nodos, internas);
  const capas = asignar_capas(bloque.nodos, dependencias);
  posicionar_por_capas(bloque.nodos, capas, []);

  let min_x = Infinity;
  let min_y = Infinity;
  let max_x = -Infinity;
  let max_y = -Infinity;

  for (const nodo of bloque.nodos) {
    min_x = Math.min(min_x, nodo.x);
    min_y = Math.min(min_y, nodo.y);
    max_x = Math.max(max_x, nodo.x + nodo.ancho);
    max_y = Math.max(max_y, nodo.y + nodo.alto);
  }

  for (const nodo of bloque.nodos) {
    nodo.x -= min_x;
    nodo.y -= min_y;
  }

  bloque.ancho = PADDING_GRUPO * 2 + (max_x - min_x);
  bloque.alto = ALTO_BARRA_GRUPO + PADDING_GRUPO * 2 + (max_y - min_y);
}

function volcar_bloque(bloque: BloqueLayout, x: number, y: number): void {
  if (!bloque.es_grupo) {
    const nodo = bloque.nodos[0];
    nodo.x = x;
    nodo.y = y;
    return;
  }

  for (const nodo of bloque.nodos) {
    nodo.x = x + PADDING_GRUPO + nodo.x;
    nodo.y = y + ALTO_BARRA_GRUPO + PADDING_GRUPO + nodo.y;
  }
}

function aristas_entre_bloques(
  aristas: AristaDiagrama[],
  bloques: BloqueLayout[],
): AristaDiagrama[] {
  const id_a_bloque = new Map<string, string>();
  for (const bloque of bloques) {
    for (const nodo of bloque.nodos) {
      id_a_bloque.set(nodo.id, bloque.id);
    }
  }

  const vistas = new Set<string>();
  const resultado: AristaDiagrama[] = [];

  for (const arista of aristas) {
    const origen = id_a_bloque.get(arista.nodo_origen);
    const destino = id_a_bloque.get(arista.nodo_destino);
    if (!origen || !destino || origen === destino) continue;
    const clave = `${origen}->${destino}`;
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    resultado.push({
      id: clave,
      nodo_origen: origen,
      columna_origen: '',
      nodo_destino: destino,
      columnas_destino: [],
      eliminacion_cascada: false,
      actualizacion_cascada: false,
      cardinalidad: '1:N',
    });
  }

  return resultado;
}

function nodo_ficticio(id: string, ancho: number, alto: number): NodoDiagrama {
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
 * vecinos por anillos BFS. El radio de cada anillo usa el tamaño real
 * de sus nodos para que bloques de grupo no exploten el canvas.
 */
function layout_copo_de_nieve(
  nodos: NodoDiagrama[],
  aristas: AristaDiagrama[],
): void {
  if (nodos.length === 1) {
    nodos[0].x = PADDING_INICIAL;
    nodos[0].y = PADDING_INICIAL;
    return;
  }

  const grados = calcular_grados(nodos, aristas);

  // Ordenar por grado descendente; el más conectado será el centro
  const ordenados = [...nodos].sort(
    (a, b) => (grados.get(b.id) || 0) - (grados.get(a.id) || 0),
  );

  const nodo_centro = ordenados[0];
  const anillos = construir_anillos_bfs(nodos, aristas, nodo_centro.id);

  nodo_centro.x = -nodo_centro.ancho / 2;
  nodo_centro.y = -nodo_centro.alto / 2;
  let radio_exterior = Math.hypot(nodo_centro.ancho / 2, nodo_centro.alto / 2);

  const capas = Array.from(anillos.keys())
    .filter((capa) => capa > 0)
    .sort((a, b) => a - b);

  for (const capa of capas) {
    const anillo = anillos.get(capa)!;
    if (anillo.length === 0) continue;

    const radios_nodo = anillo.map((nodo) => Math.hypot(nodo.ancho / 2, nodo.alto / 2));
    const radio_nodo_max = Math.max(...radios_nodo);
    const arco = anillo.reduce(
      (suma, _nodo, i) => suma + 2 * radios_nodo[i] + MARGEN_HORIZONTAL,
      0,
    );
    const radio = Math.max(
      radio_exterior + radio_nodo_max + MARGEN_VERTICAL,
      arco / (2 * Math.PI),
    );

    posicionar_en_anillo(anillo, 0, 0, radio);
    radio_exterior = radio + radio_nodo_max;
  }

  normalizar_origen(nodos);
}

/**
 * Anillos de distancia BFS desde el centro. Nodos inalcanzables van al anillo exterior.
 */
function construir_anillos_bfs(
  nodos: NodoDiagrama[],
  aristas: AristaDiagrama[],
  centro_id: string,
): Map<number, NodoDiagrama[]> {
  const adyacentes = new Map<string, Set<string>>();
  for (const nodo of nodos) {
    adyacentes.set(nodo.id, new Set());
  }
  for (const arista of aristas) {
    adyacentes.get(arista.nodo_origen)?.add(arista.nodo_destino);
    adyacentes.get(arista.nodo_destino)?.add(arista.nodo_origen);
  }

  const distancia = new Map<string, number>();
  distancia.set(centro_id, 0);
  const cola = [centro_id];
  while (cola.length > 0) {
    const id = cola.shift()!;
    const dist = distancia.get(id)!;
    for (const vecino of adyacentes.get(id) || []) {
      if (distancia.has(vecino)) continue;
      distancia.set(vecino, dist + 1);
      cola.push(vecino);
    }
  }

  let max_dist = 0;
  for (const dist of distancia.values()) {
    max_dist = Math.max(max_dist, dist);
  }
  const anillo_exterior = max_dist + 1;

  const anillos = new Map<number, NodoDiagrama[]>();
  for (const nodo of nodos) {
    const capa = distancia.has(nodo.id) ? distancia.get(nodo.id)! : anillo_exterior;
    const lista = anillos.get(capa);
    if (lista) {
      lista.push(nodo);
    } else {
      anillos.set(capa, [nodo]);
    }
  }
  return anillos;
}

function normalizar_origen(nodos: NodoDiagrama[]): void {
  let min_x = Infinity;
  let min_y = Infinity;
  for (const nodo of nodos) {
    min_x = Math.min(min_x, nodo.x);
    min_y = Math.min(min_y, nodo.y);
  }
  if (!Number.isFinite(min_x) || !Number.isFinite(min_y)) return;
  for (const nodo of nodos) {
    nodo.x += PADDING_INICIAL - min_x;
    nodo.y += PADDING_INICIAL - min_y;
  }
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
