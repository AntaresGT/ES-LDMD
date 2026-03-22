/**
 * @archivo motor-diagrama.ts
 * @descripcion Motor de renderizado del diagrama entidad-relación en Canvas 2D.
 * Dibuja tablas como cajas con header, columnas con iconos PK/FK,
 * líneas de relación y grupos.
 */

import {
  NodoDiagrama,
  AristaDiagrama,
  GrupoDiagrama,
  ModeloDiagrama,
} from '@/transformadores/ast-a-diagrama';
import { EstadoVista, ColoresTema } from './utilidades-canvas';

/** Altura del header de tabla */
const ALTO_HEADER = 36;
/** Altura de cada fila de columna */
const ALTO_FILA = 28;
/** Radio de esquinas redondeadas */
const RADIO_ESQUINA = 6;
/** Padding horizontal dentro de la tabla */
const PADDING_HORIZONTAL = 12;
/** Tamaño de fuente del nombre de tabla */
const FUENTE_HEADER = '13px "Segoe UI", system-ui, sans-serif';
/** Tamaño de fuente de columnas */
const FUENTE_COLUMNA = '12px "JetBrains Mono", "Fira Code", monospace';
/** Tamaño de fuente de tipo de dato */
const FUENTE_TIPO = '11px "JetBrains Mono", "Fira Code", monospace';
/** Padding de grupo */
const PADDING_GRUPO = 20;
/** Altura de la barra de arrastre de grupo */
export const ALTO_BARRA_GRUPO = 26;

/**
 * Renderiza el diagrama completo en un canvas 2D.
 *
 * @param {CanvasRenderingContext2D} ctx - Contexto 2D del canvas
 * @param {ModeloDiagrama} modelo - Modelo del diagrama a renderizar
 * @param {EstadoVista} vista - Estado de zoom y desplazamiento
 * @param {ColoresTema} colores - Colores del tema actual
 * @param {number} ancho - Ancho del canvas
 * @param {number} alto - Alto del canvas
 */
export function renderizar_diagrama(
  ctx: CanvasRenderingContext2D,
  modelo: ModeloDiagrama,
  vista: EstadoVista,
  colores: ColoresTema,
  ancho: number,
  alto: number,
): void {
  // Limpiar canvas
  ctx.clearRect(0, 0, ancho, alto);
  ctx.fillStyle = colores.fondo;
  ctx.fillRect(0, 0, ancho, alto);

  // Dibujar grid de fondo
  dibujar_grid(ctx, vista, colores, ancho, alto);

  // Aplicar transformación de vista
  ctx.save();
  ctx.translate(vista.desplazamiento_x, vista.desplazamiento_y);
  ctx.scale(vista.zoom, vista.zoom);

  // Dibujar grupos (debajo de todo)
  for (const grupo of modelo.grupos) {
    dibujar_grupo(ctx, grupo, modelo.nodos, colores);
  }

  // Dibujar aristas (debajo de las tablas)
  for (const arista of modelo.aristas) {
    dibujar_arista(ctx, arista, modelo.nodos, colores);
  }

  // Dibujar nodos (tablas)
  for (const nodo of modelo.nodos) {
    dibujar_nodo(ctx, nodo, colores);
  }

  ctx.restore();
}

/**
 * Dibuja un grid de fondo sutil.
 */
function dibujar_grid(
  ctx: CanvasRenderingContext2D,
  vista: EstadoVista,
  colores: ColoresTema,
  ancho: number,
  alto: number,
): void {
  const tamano_grid = 30 * vista.zoom;
  if (tamano_grid < 5) return; // No dibujar si el grid es muy pequeño

  ctx.strokeStyle = colores.borde + '30';
  ctx.lineWidth = 0.5;

  const offset_x = vista.desplazamiento_x % tamano_grid;
  const offset_y = vista.desplazamiento_y % tamano_grid;

  ctx.beginPath();
  for (let x = offset_x; x < ancho; x += tamano_grid) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, alto);
  }
  for (let y = offset_y; y < alto; y += tamano_grid) {
    ctx.moveTo(0, y);
    ctx.lineTo(ancho, y);
  }
  ctx.stroke();
}

/**
 * Dibuja un nodo (tabla) en el canvas.
 */
function dibujar_nodo(
  ctx: CanvasRenderingContext2D,
  nodo: NodoDiagrama,
  colores: ColoresTema,
): void {
  const { x, y, ancho, alto } = nodo;

  // Sombra
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  // Fondo de la tabla completa
  dibujar_rectangulo_redondeado(ctx, x, y, ancho, alto, RADIO_ESQUINA);
  ctx.fillStyle = colores.fondo_tabla;
  ctx.fill();
  ctx.strokeStyle = colores.borde;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Resetear sombra
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Header
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + RADIO_ESQUINA, y);
  ctx.lineTo(x + ancho - RADIO_ESQUINA, y);
  ctx.quadraticCurveTo(x + ancho, y, x + ancho, y + RADIO_ESQUINA);
  ctx.lineTo(x + ancho, y + ALTO_HEADER);
  ctx.lineTo(x, y + ALTO_HEADER);
  ctx.lineTo(x, y + RADIO_ESQUINA);
  ctx.quadraticCurveTo(x, y, x + RADIO_ESQUINA, y);
  ctx.closePath();
  ctx.fillStyle = colores.header_tabla;
  ctx.fill();
  ctx.restore();

  // Nombre de la tabla en el header
  ctx.fillStyle = colores.texto_header;
  ctx.font = FUENTE_HEADER;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const nombre_mostrar = nodo.esquema
    ? `${nodo.esquema}.${nodo.nombre}`
    : nodo.nombre;
  ctx.fillText(nombre_mostrar, x + PADDING_HORIZONTAL, y + ALTO_HEADER / 2);

  // Línea separadora del header
  ctx.strokeStyle = colores.borde;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + ALTO_HEADER);
  ctx.lineTo(x + ancho, y + ALTO_HEADER);
  ctx.stroke();

  // Columnas
  for (let i = 0; i < nodo.columnas.length; i++) {
    const col = nodo.columnas[i];
    const fila_y = y + ALTO_HEADER + i * ALTO_FILA;

    // Fondo alternado
    if (i % 2 === 1) {
      ctx.fillStyle = colores.fila_alterna;
      ctx.fillRect(x + 1, fila_y, ancho - 2, ALTO_FILA);
    }

    // Iconos PK/FK
    let icono_x = x + PADDING_HORIZONTAL;

    if (col.es_primaria) {
      ctx.fillStyle = colores.color_pk;
      ctx.font = '10px monospace';
      ctx.fillText('PK', icono_x, fila_y + ALTO_FILA / 2);
      icono_x += 22;
    }

    if (col.es_foranea) {
      ctx.fillStyle = colores.color_fk;
      ctx.font = '10px monospace';
      ctx.fillText('FK', icono_x, fila_y + ALTO_FILA / 2);
      icono_x += 22;
    }

    if (!col.es_primaria && !col.es_foranea) {
      icono_x += 4;
    }

    // Nombre de columna
    ctx.fillStyle = colores.texto_cuerpo;
    ctx.font = FUENTE_COLUMNA;
    ctx.textAlign = 'left';
    ctx.fillText(col.nombre, icono_x, fila_y + ALTO_FILA / 2);

    // Tipo de dato (alineado a la derecha)
    ctx.fillStyle = colores.color_tipo;
    ctx.font = FUENTE_TIPO;
    ctx.textAlign = 'right';

    let tipo_mostrar = col.tipo;
    if (col.no_nulo) {
      tipo_mostrar += ' NN';
    }
    ctx.fillText(tipo_mostrar, x + ancho - PADDING_HORIZONTAL, fila_y + ALTO_FILA / 2);
  }

  ctx.textAlign = 'left';
}

/**
 * Dibuja una arista (línea de relación) entre dos nodos con indicadores
 * de cardinalidad (1:1, 1:N, N:N).
 */
function dibujar_arista(
  ctx: CanvasRenderingContext2D,
  arista: AristaDiagrama,
  nodos: NodoDiagrama[],
  colores: ColoresTema,
): void {
  const nodo_origen = nodos.find((n) => n.id === arista.nodo_origen);
  const nodo_destino = nodos.find((n) => n.id === arista.nodo_destino);

  if (!nodo_origen || !nodo_destino) return;

  // Encontrar la posición Y de la columna origen
  const idx_col_origen = nodo_origen.columnas.findIndex(
    (c) => c.nombre === arista.columna_origen,
  );

  // Calcular puntos de conexión
  const origen_y = nodo_origen.y + ALTO_HEADER + idx_col_origen * ALTO_FILA + ALTO_FILA / 2;
  const destino_y = nodo_destino.y + ALTO_HEADER / 2;

  let origen_x: number;
  let destino_x: number;

  // Determinar de qué lado sale la línea
  const centro_origen_x = nodo_origen.x + nodo_origen.ancho / 2;
  const centro_destino_x = nodo_destino.x + nodo_destino.ancho / 2;

  if (centro_origen_x < centro_destino_x) {
    // Origen a la izquierda del destino
    origen_x = nodo_origen.x + nodo_origen.ancho;
    destino_x = nodo_destino.x;
  } else {
    // Origen a la derecha del destino
    origen_x = nodo_origen.x;
    destino_x = nodo_destino.x + nodo_destino.ancho;
  }

  // Dibujar curva Bézier
  ctx.strokeStyle = colores.color_relacion;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);

  const control_offset = Math.abs(origen_x - destino_x) * 0.4;

  ctx.beginPath();
  ctx.moveTo(origen_x, origen_y);
  ctx.bezierCurveTo(
    origen_x + (destino_x > origen_x ? control_offset : -control_offset),
    origen_y,
    destino_x + (destino_x > origen_x ? -control_offset : control_offset),
    destino_y,
    destino_x,
    destino_y,
  );
  ctx.stroke();

  // Dibujar punto en el destino (diamante pequeño)
  ctx.fillStyle = colores.color_relacion;
  ctx.beginPath();
  ctx.arc(destino_x, destino_y, 4, 0, Math.PI * 2);
  ctx.fill();

  // Dibujar punto en el origen
  ctx.beginPath();
  ctx.arc(origen_x, origen_y, 3, 0, Math.PI * 2);
  ctx.fill();

  // Calcular punto medio de la curva Bézier (t=0.5)
  const cp1x = origen_x + (destino_x > origen_x ? control_offset : -control_offset);
  const cp1y = origen_y;
  const cp2x = destino_x + (destino_x > origen_x ? -control_offset : control_offset);
  const cp2y = destino_y;

  const t = 0.5;
  const mt = 1 - t;
  const medio_x = mt * mt * mt * origen_x + 3 * mt * mt * t * cp1x + 3 * mt * t * t * cp2x + t * t * t * destino_x;
  const medio_y = mt * mt * mt * origen_y + 3 * mt * mt * t * cp1y + 3 * mt * t * t * cp2y + t * t * t * destino_y;

  // Dibujar etiqueta de cardinalidad al centro de la línea
  dibujar_etiqueta_cardinalidad(ctx, arista.cardinalidad, medio_x, medio_y, colores);
}

/**
 * Dibuja una etiqueta de cardinalidad en un punto del canvas.
 */
function dibujar_etiqueta_cardinalidad(
  ctx: CanvasRenderingContext2D,
  texto: string,
  x: number,
  y: number,
  colores: ColoresTema,
): void {
  ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Fondo semitransparente para legibilidad
  const medida = ctx.measureText(texto);
  const pad_x = 6;
  const pad_y = 4;
  const ancho = medida.width + pad_x * 2;
  const alto = 14 + pad_y * 2;

  ctx.fillStyle = colores.fondo + 'E0';
  dibujar_rectangulo_redondeado(ctx, x - ancho / 2, y - alto / 2, ancho, alto, 4);
  ctx.fill();
  ctx.strokeStyle = colores.color_relacion;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Texto
  ctx.fillStyle = colores.color_relacion;
  ctx.fillText(texto, x, y);
  ctx.textAlign = 'left';
}

/**
 * Dibuja un grupo como un rectángulo con borde, barra de arrastre y etiqueta.
 */
function dibujar_grupo(
  ctx: CanvasRenderingContext2D,
  grupo: GrupoDiagrama,
  nodos: NodoDiagrama[],
  colores: ColoresTema,
): void {
  // Encontrar los nodos del grupo
  const nodos_grupo = nodos.filter((n) => grupo.nodos.includes(n.id));
  if (nodos_grupo.length === 0) return;

  // Calcular el bounding box del grupo
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

  // Agregar padding
  min_x -= PADDING_GRUPO;
  min_y -= PADDING_GRUPO;
  max_x += PADDING_GRUPO;
  max_y += PADDING_GRUPO;

  const ancho = max_x - min_x;
  const alto_cuerpo = max_y - min_y;
  const barra_y = min_y - ALTO_BARRA_GRUPO;
  const alto_total = alto_cuerpo + ALTO_BARRA_GRUPO;

  // Dibujar fondo del grupo (cuerpo + barra)
  dibujar_rectangulo_redondeado(ctx, min_x, barra_y, ancho, alto_total, 8);
  ctx.fillStyle = grupo.color || colores.color_grupo_fondo;
  ctx.fill();
  ctx.strokeStyle = colores.color_grupo_borde;
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Dibujar barra de arrastre (header del grupo)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(min_x + 8, barra_y);
  ctx.lineTo(min_x + ancho - 8, barra_y);
  ctx.quadraticCurveTo(min_x + ancho, barra_y, min_x + ancho, barra_y + 8);
  ctx.lineTo(min_x + ancho, barra_y + ALTO_BARRA_GRUPO);
  ctx.lineTo(min_x, barra_y + ALTO_BARRA_GRUPO);
  ctx.lineTo(min_x, barra_y + 8);
  ctx.quadraticCurveTo(min_x, barra_y, min_x + 8, barra_y);
  ctx.closePath();
  ctx.fillStyle = colores.color_grupo_borde + '80';
  ctx.fill();
  ctx.restore();

  // Línea separadora bajo la barra
  ctx.strokeStyle = colores.color_grupo_borde;
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(min_x, barra_y + ALTO_BARRA_GRUPO);
  ctx.lineTo(min_x + ancho, barra_y + ALTO_BARRA_GRUPO);
  ctx.stroke();

  // Icono de arrastre (grip dots: 2 columnas x 3 filas)
  const icono_x = min_x + 10;
  const icono_cy = barra_y + ALTO_BARRA_GRUPO / 2;
  ctx.fillStyle = colores.color_grupo_texto + 'B0';
  for (let fila = -1; fila <= 1; fila++) {
    for (let col = 0; col <= 1; col++) {
      ctx.beginPath();
      ctx.arc(icono_x + col * 5, icono_cy + fila * 5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Etiqueta del grupo
  ctx.fillStyle = colores.color_grupo_texto;
  ctx.font = '11px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(grupo.nombre, icono_x + 16, icono_cy);
}

/**
 * Dibuja un rectángulo con esquinas redondeadas.
 */
function dibujar_rectangulo_redondeado(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  radio: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + radio, y);
  ctx.lineTo(x + ancho - radio, y);
  ctx.quadraticCurveTo(x + ancho, y, x + ancho, y + radio);
  ctx.lineTo(x + ancho, y + alto - radio);
  ctx.quadraticCurveTo(x + ancho, y + alto, x + ancho - radio, y + alto);
  ctx.lineTo(x + radio, y + alto);
  ctx.quadraticCurveTo(x, y + alto, x, y + alto - radio);
  ctx.lineTo(x, y + radio);
  ctx.quadraticCurveTo(x, y, x + radio, y);
  ctx.closePath();
}

/**
 * Renderiza el diagrama a un canvas offscreen para exportación.
 *
 * @param {ModeloDiagrama} modelo - Modelo del diagrama
 * @param {ColoresTema} colores - Colores del tema
 * @param {string | null} color_fondo - Color de fondo (null = transparente)
 * @param {number} escala - Factor de escala (2 para retina)
 * @returns {HTMLCanvasElement} Canvas con el diagrama renderizado
 */
export function renderizar_para_exportacion(
  modelo: ModeloDiagrama,
  colores: ColoresTema,
  color_fondo: string | null,
  escala: number = 2,
): HTMLCanvasElement {
  // Calcular dimensiones del contenido
  let min_x = Infinity;
  let min_y = Infinity;
  let max_x = -Infinity;
  let max_y = -Infinity;

  for (const nodo of modelo.nodos) {
    min_x = Math.min(min_x, nodo.x);
    min_y = Math.min(min_y, nodo.y);
    max_x = Math.max(max_x, nodo.x + nodo.ancho);
    max_y = Math.max(max_y, nodo.y + nodo.alto);
  }

  const padding = 40;
  const ancho = (max_x - min_x + padding * 2) * escala;
  const alto = (max_y - min_y + padding * 2) * escala;

  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(escala, escala);

  // Fondo
  if (color_fondo) {
    ctx.fillStyle = color_fondo;
    ctx.fillRect(0, 0, ancho / escala, alto / escala);
  }

  // Ajustar offset para centrar
  const vista: EstadoVista = {
    zoom: 1,
    desplazamiento_x: -min_x + padding,
    desplazamiento_y: -min_y + padding,
  };

  ctx.translate(vista.desplazamiento_x, vista.desplazamiento_y);

  // Dibujar grupos
  for (const grupo of modelo.grupos) {
    dibujar_grupo(ctx, grupo, modelo.nodos, colores);
  }

  // Dibujar aristas
  for (const arista of modelo.aristas) {
    dibujar_arista(ctx, arista, modelo.nodos, colores);
  }

  // Dibujar nodos
  for (const nodo of modelo.nodos) {
    dibujar_nodo(ctx, nodo, colores);
  }

  return canvas;
}
