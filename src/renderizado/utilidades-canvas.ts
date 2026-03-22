/**
 * @archivo utilidades-canvas.ts
 * @descripcion Utilidades para el canvas de renderizado del diagrama.
 * Incluye funciones de dibujo, gestión de zoom y paneo.
 */

// ============================================================
// Tipos
// ============================================================

/**
 * Estado de la vista del canvas (zoom y desplazamiento).
 */
export interface EstadoVista {
  /** Factor de zoom (1.0 = 100%) */
  zoom: number;
  /** Desplazamiento horizontal */
  desplazamiento_x: number;
  /** Desplazamiento vertical */
  desplazamiento_y: number;
}

/**
 * Colores del tema para el diagrama.
 */
export interface ColoresTema {
  /** Color de fondo del canvas */
  fondo: string;
  /** Color del header de la tabla */
  header_tabla: string;
  /** Color de texto del header */
  texto_header: string;
  /** Color de fondo del cuerpo de la tabla */
  fondo_tabla: string;
  /** Color de texto del cuerpo */
  texto_cuerpo: string;
  /** Color del borde */
  borde: string;
  /** Color del icono de llave primaria */
  color_pk: string;
  /** Color del icono de llave foránea */
  color_fk: string;
  /** Color de las líneas de relación */
  color_relacion: string;
  /** Color del texto de tipo de dato */
  color_tipo: string;
  /** Color de fondo de grupo */
  color_grupo_fondo: string;
  /** Color del borde de grupo */
  color_grupo_borde: string;
  /** Color del texto de grupo */
  color_grupo_texto: string;
  /** Color de filas alternadas */
  fila_alterna: string;
}

// ============================================================
// Constantes
// ============================================================

/** Zoom mínimo permitido */
export const ZOOM_MINIMO = 0.2;
/** Zoom máximo permitido */
export const ZOOM_MAXIMO = 3.0;
/** Paso de zoom por scroll */
export const PASO_ZOOM = 0.1;

/**
 * Colores para tema oscuro.
 */
export const COLORES_OSCURO: ColoresTema = {
  fondo: '#1a1b1e',
  header_tabla: '#228be6',
  texto_header: '#ffffff',
  fondo_tabla: '#25262b',
  texto_cuerpo: '#c1c2c5',
  borde: '#373A40',
  color_pk: '#fab005',
  color_fk: '#4dabf7',
  color_relacion: '#5c5f66',
  color_tipo: '#868e96',
  fila_alterna: '#2c2e33',
  color_grupo_fondo: '#228be610',
  color_grupo_borde: '#228be640',
  color_grupo_texto: '#4dabf7',
};

/**
 * Colores para tema claro.
 */
export const COLORES_CLARO: ColoresTema = {
  fondo: '#f8f9fa',
  header_tabla: '#228be6',
  texto_header: '#ffffff',
  fondo_tabla: '#ffffff',
  texto_cuerpo: '#212529',
  borde: '#dee2e6',
  color_pk: '#e67700',
  color_fk: '#1c7ed6',
  color_relacion: '#adb5bd',
  color_tipo: '#868e96',
  fila_alterna: '#f1f3f5',
  color_grupo_fondo: '#228be610',
  color_grupo_borde: '#228be640',
  color_grupo_texto: '#1c7ed6',
};

/**
 * Estado de vista inicial.
 */
export function crear_estado_vista_inicial(): EstadoVista {
  return {
    zoom: 1.0,
    desplazamiento_x: 0,
    desplazamiento_y: 0,
  };
}

/**
 * Aplica zoom al estado de la vista.
 *
 * @param {EstadoVista} estado - Estado actual
 * @param {number} delta - Cambio de zoom (+/-)
 * @param {number} punto_x - Punto X del cursor para zoom centrado
 * @param {number} punto_y - Punto Y del cursor para zoom centrado
 * @returns {EstadoVista} Nuevo estado de vista
 */
export function aplicar_zoom(
  estado: EstadoVista,
  delta: number,
  punto_x: number,
  punto_y: number,
): EstadoVista {
  const nuevo_zoom = Math.min(
    ZOOM_MAXIMO,
    Math.max(ZOOM_MINIMO, estado.zoom + delta),
  );

  const factor = nuevo_zoom / estado.zoom;

  return {
    zoom: nuevo_zoom,
    desplazamiento_x: punto_x - (punto_x - estado.desplazamiento_x) * factor,
    desplazamiento_y: punto_y - (punto_y - estado.desplazamiento_y) * factor,
  };
}

/**
 * Aplica paneo (desplazamiento) al estado de la vista.
 *
 * @param {EstadoVista} estado - Estado actual
 * @param {number} delta_x - Cambio en X
 * @param {number} delta_y - Cambio en Y
 * @returns {EstadoVista} Nuevo estado de vista
 */
export function aplicar_paneo(
  estado: EstadoVista,
  delta_x: number,
  delta_y: number,
): EstadoVista {
  return {
    ...estado,
    desplazamiento_x: estado.desplazamiento_x + delta_x,
    desplazamiento_y: estado.desplazamiento_y + delta_y,
  };
}

/**
 * Calcula el estado de vista para ajustar todo el contenido.
 *
 * @param {Array<{x: number; y: number; ancho: number; alto: number}>} nodos - Nodos del diagrama
 * @param {number} ancho_canvas - Ancho del canvas
 * @param {number} alto_canvas - Alto del canvas
 * @returns {EstadoVista} Estado de vista ajustado
 */
export function ajustar_al_contenido(
  nodos: Array<{ x: number; y: number; ancho: number; alto: number }>,
  ancho_canvas: number,
  alto_canvas: number,
): EstadoVista {
  if (nodos.length === 0) {
    return crear_estado_vista_inicial();
  }

  const padding = 40;
  let min_x = Infinity;
  let min_y = Infinity;
  let max_x = -Infinity;
  let max_y = -Infinity;

  for (const nodo of nodos) {
    min_x = Math.min(min_x, nodo.x);
    min_y = Math.min(min_y, nodo.y);
    max_x = Math.max(max_x, nodo.x + nodo.ancho);
    max_y = Math.max(max_y, nodo.y + nodo.alto);
  }

  const ancho_contenido = max_x - min_x + padding * 2;
  const alto_contenido = max_y - min_y + padding * 2;

  const zoom_x = ancho_canvas / ancho_contenido;
  const zoom_y = alto_canvas / alto_contenido;
  const zoom = Math.min(zoom_x, zoom_y, 1.5);

  const desplazamiento_x = (ancho_canvas - ancho_contenido * zoom) / 2 - min_x * zoom + padding * zoom;
  const desplazamiento_y = (alto_canvas - alto_contenido * zoom) / 2 - min_y * zoom + padding * zoom;

  return {
    zoom: Math.max(ZOOM_MINIMO, zoom),
    desplazamiento_x,
    desplazamiento_y,
  };
}
