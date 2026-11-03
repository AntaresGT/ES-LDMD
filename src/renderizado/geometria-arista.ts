/**
 * @archivo geometria-arista.ts
 * @descripcion Geometría pura de aristas FK y cajas de grupo.
 * Elige lados libres, ancla a la columna real y mantiene la curva fuera de las tablas.
 */

import { AristaDiagrama, GrupoDiagrama, NodoDiagrama } from '@/transformadores/ast-a-diagrama';
import {
  ALTO_BARRA_GRUPO,
  ALTO_FILA,
  ALTO_HEADER,
  PADDING_GRUPO,
  SALIENTE_ANCLA,
} from './constantes-diagrama';

/** Lado del nodo por el que sale o entra la arista */
export type LadoAncla = 'izquierda' | 'derecha' | 'arriba' | 'abajo';

/** Caja mínima necesaria para calcular anclas */
export interface CajaNodo {
  id: string;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  columnas: Array<{ nombre: string }>;
}

/** Resultado geométrico de una arista Bézier */
export interface GeometriaArista {
  origen_x: number;
  origen_y: number;
  destino_x: number;
  destino_y: number;
  cp1x: number;
  cp1y: number;
  cp2x: number;
  cp2y: number;
  medio_x: number;
  medio_y: number;
  lado_origen: LadoAncla;
  lado_destino: LadoAncla;
}

/** Caja visual de un grupo, incluida la barra superior */
export interface CajaGrupo {
  min_x: number;
  min_y: number;
  max_x: number;
  max_y: number;
  barra_y: number;
  ancho: number;
  alto_total: number;
}

const MARGEN_ESQUINA = 12;
const ESPACIO_MIN_PUERTO = 16;
const OFFSET_MIN = 36;
const OFFSET_MAX = 160;
const OFFSET_FACTOR = 0.45;

/**
 * Asigna cada tabla al último grupo del documento que la declara.
 */
export function asignacion_exclusiva_grupos(
  grupos: GrupoDiagrama[],
): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const grupo of grupos) {
    for (const id of grupo.nodos) {
      mapa.set(id, grupo.nombre);
    }
  }
  return mapa;
}

/**
 * Tablas que pertenecen en exclusiva a un grupo (el último gana).
 */
export function nodos_del_grupo(
  grupo: GrupoDiagrama,
  nodos: NodoDiagrama[],
  asignacion: Map<string, string>,
): NodoDiagrama[] {
  return nodos.filter((nodo) => asignacion.get(nodo.id) === grupo.nombre);
}

/**
 * Bounding box visual de un grupo a partir de sus tablas.
 */
export function calcular_caja_grupo(
  nodos_grupo: Array<{ x: number; y: number; ancho: number; alto: number }>,
): CajaGrupo | null {
  if (nodos_grupo.length === 0) return null;

  let min_x = Infinity;
  let min_y = Infinity;
  let max_x = -Infinity;
  let max_y = -Infinity;

  for (const nodo of nodos_grupo) {
    min_x = Math.min(min_x, nodo.x);
    min_y = Math.min(min_y, nodo.y);
    max_x = Math.max(max_x, nodo.x + nodo.ancho);
    max_y = Math.max(max_y, nodo.y + nodo.alto);
  }

  min_x -= PADDING_GRUPO;
  min_y -= PADDING_GRUPO;
  max_x += PADDING_GRUPO;
  max_y += PADDING_GRUPO;

  const barra_y = min_y - ALTO_BARRA_GRUPO;
  return {
    min_x,
    min_y,
    max_x,
    max_y,
    barra_y,
    ancho: max_x - min_x,
    alto_total: max_y - min_y + ALTO_BARRA_GRUPO,
  };
}

/**
 * Calcula la geometría de todas las aristas, repartiendo puertos en el mismo lado.
 */
export function calcular_geometrias_aristas(
  aristas: AristaDiagrama[],
  nodos: CajaNodo[],
): Map<string, GeometriaArista> {
  const resultado = new Map<string, GeometriaArista>();
  const mapa_nodos = new Map(nodos.map((nodo) => [nodo.id, nodo]));

  interface PuertoPendiente {
    arista: AristaDiagrama;
    nodo: CajaNodo;
    otro: CajaNodo;
    lado: LadoAncla;
    es_origen: boolean;
    preferida: number;
    coord: number;
  }

  const puertos: PuertoPendiente[] = [];
  const metadatos: Array<{
    arista: AristaDiagrama;
    origen: CajaNodo;
    destino: CajaNodo;
    lado_origen: LadoAncla;
    lado_destino: LadoAncla;
    es_lazo: boolean;
    es_desvio: boolean;
  }> = [];

  for (const arista of aristas) {
    const origen = mapa_nodos.get(arista.nodo_origen);
    const destino = mapa_nodos.get(arista.nodo_destino);
    if (!origen || !destino) continue;

    const es_lazo = origen.id === destino.id;
    const lados = elegir_lados(origen, destino, es_lazo, nodos);
    const es_desvio = !es_lazo && lados.lado_origen === lados.lado_destino;
    const col_origen = arista.columna_origen;
    const col_destino = arista.columnas_destino[0];

    metadatos.push({
      arista,
      origen,
      destino,
      lado_origen: lados.lado_origen,
      lado_destino: lados.lado_destino,
      es_lazo,
      es_desvio,
    });

    puertos.push({
      arista,
      nodo: origen,
      otro: destino,
      lado: lados.lado_origen,
      es_origen: true,
      preferida: coord_preferida(origen, lados.lado_origen, col_origen, destino),
      coord: 0,
    });
    puertos.push({
      arista,
      nodo: destino,
      otro: origen,
      lado: lados.lado_destino,
      es_origen: false,
      preferida: coord_preferida(destino, lados.lado_destino, col_destino, origen),
      coord: 0,
    });
  }

  repartir_puertos(puertos);

  const puerto_de = (
    id_arista: string,
    es_origen: boolean,
  ): PuertoPendiente | undefined =>
    puertos.find((p) => p.arista.id === id_arista && p.es_origen === es_origen);

  for (const meta of metadatos) {
    const p_origen = puerto_de(meta.arista.id, true);
    const p_destino = puerto_de(meta.arista.id, false);
    if (!p_origen || !p_destino) continue;

    const ancla_origen = punto_ancla(meta.origen, meta.lado_origen, p_origen.coord);
    const ancla_destino = punto_ancla(meta.destino, meta.lado_destino, p_destino.coord);

    const distancia = Math.hypot(
      ancla_destino.x - ancla_origen.x,
      ancla_destino.y - ancla_origen.y,
    );
    const offset = offset_control(distancia, meta.es_lazo || meta.es_desvio);
    let cp1 = punto_control(ancla_origen.x, ancla_origen.y, meta.lado_origen, offset);
    let cp2 = punto_control(ancla_destino.x, ancla_destino.y, meta.lado_destino, offset);

    if (meta.es_desvio) {
      const alineados = alinear_controles_desvio(
        meta.lado_origen,
        ancla_origen,
        ancla_destino,
        offset,
      );
      cp1 = alineados.cp1;
      cp2 = alineados.cp2;
    } else {
      cp1 = limitar_control(cp1, ancla_origen, meta.lado_origen, nodos, [
        meta.origen.id,
        meta.destino.id,
      ]);
      cp2 = limitar_control(cp2, ancla_destino, meta.lado_destino, nodos, [
        meta.origen.id,
        meta.destino.id,
      ]);
    }
    const medio = punto_medio_bezier(
      ancla_origen.x,
      ancla_origen.y,
      cp1.x,
      cp1.y,
      cp2.x,
      cp2.y,
      ancla_destino.x,
      ancla_destino.y,
    );

    resultado.set(meta.arista.id, {
      origen_x: ancla_origen.x,
      origen_y: ancla_origen.y,
      destino_x: ancla_destino.x,
      destino_y: ancla_destino.y,
      cp1x: cp1.x,
      cp1y: cp1.y,
      cp2x: cp2.x,
      cp2y: cp2.y,
      medio_x: medio.x,
      medio_y: medio.y,
      lado_origen: meta.lado_origen,
      lado_destino: meta.lado_destino,
    });
  }

  return resultado;
}

/**
 * Geometría de una arista. Si no hay hermanas, no reparte puertos.
 */
export function calcular_geometria_arista(
  arista: AristaDiagrama,
  nodo_origen: CajaNodo,
  nodo_destino: CajaNodo,
  hermanas: AristaDiagrama[] = [],
): GeometriaArista {
  const lista = hermanas.length > 0 ? hermanas : [arista];
  if (!lista.some((a) => a.id === arista.id)) {
    lista.push(arista);
  }
  const nodos =
    nodo_origen.id === nodo_destino.id
      ? [nodo_origen]
      : [nodo_origen, nodo_destino];
  const mapa = calcular_geometrias_aristas(lista, nodos);
  return mapa.get(arista.id)!;
}

/**
 * Elige el par de lados enfrentados según solape y distancia entre centros.
 */
export function elegir_lados(
  origen: CajaNodo,
  destino: CajaNodo,
  es_lazo: boolean,
  obstaculos: CajaNodo[] = [],
): { lado_origen: LadoAncla; lado_destino: LadoAncla } {
  if (es_lazo) {
    return { lado_origen: 'derecha', lado_destino: 'derecha' };
  }

  const solape_x = rangos_solapan(
    origen.x,
    origen.x + origen.ancho,
    destino.x,
    destino.x + destino.ancho,
  );
  const solape_y = rangos_solapan(
    origen.y,
    origen.y + origen.alto,
    destino.y,
    destino.y + destino.alto,
  );

  const cx_o = origen.x + origen.ancho / 2;
  const cy_o = origen.y + origen.alto / 2;
  const cx_d = destino.x + destino.ancho / 2;
  const cy_d = destino.y + destino.alto / 2;
  const dx = Math.abs(cx_d - cx_o);
  const dy = Math.abs(cy_d - cy_o);

  let eje: 'x' | 'y';
  if (solape_x && !solape_y) {
    eje = 'y';
  } else if (solape_y && !solape_x) {
    eje = 'x';
  } else {
    eje = dy >= dx ? 'y' : 'x';
  }

  if (eje === 'y') {
    if (hay_obstaculo_en_corredor(origen, destino, obstaculos, 'y')) {
      if (solape_x) {
        const lado = lado_desvio_horizontal(origen, destino, obstaculos);
        return { lado_origen: lado, lado_destino: lado };
      }
      eje = 'x';
    } else if (cy_o <= cy_d) {
      return { lado_origen: 'abajo', lado_destino: 'arriba' };
    } else {
      return { lado_origen: 'arriba', lado_destino: 'abajo' };
    }
  }

  if (eje === 'x') {
    if (hay_obstaculo_en_corredor(origen, destino, obstaculos, 'x') && solape_y) {
      const lado = lado_desvio_vertical(origen, destino, obstaculos);
      return { lado_origen: lado, lado_destino: lado };
    }
    if (cx_o <= cx_d) {
      return { lado_origen: 'derecha', lado_destino: 'izquierda' };
    }
    return { lado_origen: 'izquierda', lado_destino: 'derecha' };
  }

  if (cy_o <= cy_d) {
    return { lado_origen: 'abajo', lado_destino: 'arriba' };
  }
  return { lado_origen: 'arriba', lado_destino: 'abajo' };
}

function hay_obstaculo_en_corredor(
  origen: CajaNodo,
  destino: CajaNodo,
  obstaculos: CajaNodo[],
  eje: 'x' | 'y',
): boolean {
  if (eje === 'y') {
    const superior = origen.y <= destino.y ? origen : destino;
    const inferior = origen.y <= destino.y ? destino : origen;
    const y1 = superior.y + superior.alto;
    const y2 = inferior.y;
    if (y2 <= y1) return false;
    const x1 = Math.min(origen.x, destino.x);
    const x2 = Math.max(origen.x + origen.ancho, destino.x + destino.ancho);
    return obstaculos.some((nodo) => {
      if (nodo.id === origen.id || nodo.id === destino.id) return false;
      return rangos_solapan(nodo.x, nodo.x + nodo.ancho, x1, x2)
        && rangos_solapan(nodo.y, nodo.y + nodo.alto, y1, y2);
    });
  }

  const izquierda = origen.x <= destino.x ? origen : destino;
  const derecha = origen.x <= destino.x ? destino : origen;
  const x1 = izquierda.x + izquierda.ancho;
  const x2 = derecha.x;
  if (x2 <= x1) return false;
  const y1 = Math.min(origen.y, destino.y);
  const y2 = Math.max(origen.y + origen.alto, destino.y + destino.alto);
  return obstaculos.some((nodo) => {
    if (nodo.id === origen.id || nodo.id === destino.id) return false;
    return rangos_solapan(nodo.x, nodo.x + nodo.ancho, x1, x2)
      && rangos_solapan(nodo.y, nodo.y + nodo.alto, y1, y2);
  });
}

function lado_desvio_horizontal(
  origen: CajaNodo,
  destino: CajaNodo,
  obstaculos: CajaNodo[],
): 'izquierda' | 'derecha' {
  const x_izq = Math.min(origen.x, destino.x);
  const x_der = Math.max(origen.x + origen.ancho, destino.x + destino.ancho);
  let peso_izq = 0;
  let peso_der = 0;
  for (const nodo of obstaculos) {
    if (nodo.id === origen.id || nodo.id === destino.id) continue;
    if (nodo.x + nodo.ancho <= x_izq) peso_izq += 1;
    if (nodo.x >= x_der) peso_der += 1;
  }
  return peso_izq <= peso_der ? 'izquierda' : 'derecha';
}

function lado_desvio_vertical(
  origen: CajaNodo,
  destino: CajaNodo,
  obstaculos: CajaNodo[],
): 'arriba' | 'abajo' {
  const y_sup = Math.min(origen.y, destino.y);
  const y_inf = Math.max(origen.y + origen.alto, destino.y + destino.alto);
  let peso_sup = 0;
  let peso_inf = 0;
  for (const nodo of obstaculos) {
    if (nodo.id === origen.id || nodo.id === destino.id) continue;
    if (nodo.y + nodo.alto <= y_sup) peso_sup += 1;
    if (nodo.y >= y_inf) peso_inf += 1;
  }
  return peso_sup <= peso_inf ? 'arriba' : 'abajo';
}

function rangos_solapan(a1: number, a2: number, b1: number, b2: number): boolean {
  return a1 < b2 && b1 < a2;
}

function y_columna(nodo: CajaNodo, nombre: string | undefined): number {
  if (!nombre) return nodo.y + ALTO_HEADER / 2;
  const idx = nodo.columnas.findIndex((c) => c.nombre === nombre);
  if (idx < 0) return nodo.y + ALTO_HEADER / 2;
  return nodo.y + ALTO_HEADER + idx * ALTO_FILA + ALTO_FILA / 2;
}

function coord_preferida(
  nodo: CajaNodo,
  lado: LadoAncla,
  nombre_columna: string | undefined,
  nodo_otro: CajaNodo,
): number {
  if (lado === 'izquierda' || lado === 'derecha') {
    return y_columna(nodo, nombre_columna);
  }
  const cx_otro = nodo_otro.x + nodo_otro.ancho / 2;
  return clamp(cx_otro, nodo.x + MARGEN_ESQUINA, nodo.x + nodo.ancho - MARGEN_ESQUINA);
}

function punto_ancla(
  nodo: CajaNodo,
  lado: LadoAncla,
  coord: number,
): { x: number; y: number } {
  switch (lado) {
    case 'derecha':
      return { x: nodo.x + nodo.ancho + SALIENTE_ANCLA, y: coord };
    case 'izquierda':
      return { x: nodo.x - SALIENTE_ANCLA, y: coord };
    case 'abajo':
      return { x: coord, y: nodo.y + nodo.alto + SALIENTE_ANCLA };
    case 'arriba':
      return { x: coord, y: nodo.y - SALIENTE_ANCLA };
  }
}

function alinear_controles_desvio(
  lado: LadoAncla,
  origen: { x: number; y: number },
  destino: { x: number; y: number },
  offset: number,
): { cp1: { x: number; y: number }; cp2: { x: number; y: number } } {
  switch (lado) {
    case 'izquierda': {
      const x = Math.min(origen.x, destino.x) - offset;
      return { cp1: { x, y: origen.y }, cp2: { x, y: destino.y } };
    }
    case 'derecha': {
      const x = Math.max(origen.x, destino.x) + offset;
      return { cp1: { x, y: origen.y }, cp2: { x, y: destino.y } };
    }
    case 'arriba': {
      const y = Math.min(origen.y, destino.y) - offset;
      return { cp1: { x: origen.x, y }, cp2: { x: destino.x, y } };
    }
    case 'abajo': {
      const y = Math.max(origen.y, destino.y) + offset;
      return { cp1: { x: origen.x, y }, cp2: { x: destino.x, y } };
    }
  }
}

function limitar_control(
  control: { x: number; y: number },
  ancla: { x: number; y: number },
  lado: LadoAncla,
  nodos: CajaNodo[],
  excluir: string[],
): { x: number; y: number } {
  const dx = control.x - ancla.x;
  const dy = control.y - ancla.y;
  let factor = 1;
  for (let i = 0; i < 8; i++) {
    const x = ancla.x + dx * factor;
    const y = ancla.y + dy * factor;
    const choca = nodos.some((nodo) => {
      if (excluir.includes(nodo.id)) return false;
      return x > nodo.x && x < nodo.x + nodo.ancho && y > nodo.y && y < nodo.y + nodo.alto;
    });
    if (!choca) return { x, y };
    factor *= 0.5;
  }
  return { x: ancla.x, y: ancla.y };
}

function punto_control(
  x: number,
  y: number,
  lado: LadoAncla,
  offset: number,
): { x: number; y: number } {
  switch (lado) {
    case 'derecha':
      return { x: x + offset, y };
    case 'izquierda':
      return { x: x - offset, y };
    case 'abajo':
      return { x, y: y + offset };
    case 'arriba':
      return { x, y: y - offset };
  }
}

function offset_control(distancia: number, es_lazo: boolean): number {
  const base = clamp(distancia * OFFSET_FACTOR, OFFSET_MIN, OFFSET_MAX);
  if (es_lazo) return Math.max(base, OFFSET_MIN);
  if (distancia <= 0) return OFFSET_MIN;
  return Math.min(base, distancia * 0.5);
}

function punto_medio_bezier(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
): { x: number; y: number } {
  const t = 0.5;
  const mt = 1 - t;
  return {
    x: mt * mt * mt * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3,
    y: mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3,
  };
}

function repartir_puertos(
  puertos: Array<{ nodo: CajaNodo; lado: LadoAncla; preferida: number; coord: number }>,
): void {
  const grupos = new Map<string, typeof puertos>();
  for (const puerto of puertos) {
    const clave = `${puerto.nodo.id}:${puerto.lado}`;
    const lista = grupos.get(clave);
    if (lista) {
      lista.push(puerto);
    } else {
      grupos.set(clave, [puerto]);
    }
  }

  for (const lista of grupos.values()) {
    const nodo = lista[0].nodo;
    const lado = lista[0].lado;
    const vertical = lado === 'izquierda' || lado === 'derecha';
    const min = vertical ? nodo.y + MARGEN_ESQUINA : nodo.x + MARGEN_ESQUINA;
    const max = vertical
      ? nodo.y + nodo.alto - MARGEN_ESQUINA
      : nodo.x + nodo.ancho - MARGEN_ESQUINA;
    const colocadas = repartir_coordenadas(
      lista.map((p) => p.preferida),
      min,
      max,
    );
    for (let i = 0; i < lista.length; i++) {
      lista[i].coord = colocadas[i];
    }
  }
}

function repartir_coordenadas(
  preferidas: number[],
  min: number,
  max: number,
): number[] {
  const n = preferidas.length;
  if (n === 0) return [];
  const lim_min = Math.min(min, max);
  const lim_max = Math.max(min, max);

  if (n === 1) {
    return [clamp(preferidas[0], lim_min, lim_max)];
  }

  const orden = preferidas
    .map((valor, indice) => ({ valor, indice }))
    .sort((a, b) => a.valor - b.valor || a.indice - b.indice);

  const span = lim_max - lim_min;
  const needed = (n - 1) * ESPACIO_MIN_PUERTO;
  if (span <= 0 || needed > span) {
    const step = n === 1 ? 0 : span / (n - 1);
    const resultado = new Array<number>(n);
    orden.forEach((item, k) => {
      resultado[item.indice] = lim_min + k * step;
    });
    return resultado;
  }

  const colocadas = orden.map((item) => clamp(item.valor, lim_min, lim_max));
  for (let i = 1; i < colocadas.length; i++) {
    if (colocadas[i] - colocadas[i - 1] < ESPACIO_MIN_PUERTO) {
      colocadas[i] = colocadas[i - 1] + ESPACIO_MIN_PUERTO;
    }
  }
  if (colocadas[colocadas.length - 1] > lim_max) {
    const extra = colocadas[colocadas.length - 1] - lim_max;
    for (let i = 0; i < colocadas.length; i++) {
      colocadas[i] -= extra;
    }
  }
  if (colocadas[0] < lim_min) {
    const step = span / (n - 1);
    const resultado = new Array<number>(n);
    orden.forEach((item, k) => {
      resultado[item.indice] = lim_min + k * step;
    });
    return resultado;
  }

  const resultado = new Array<number>(n);
  orden.forEach((item, k) => {
    resultado[item.indice] = colocadas[k];
  });
  return resultado;
}

function clamp(valor: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valor));
}
