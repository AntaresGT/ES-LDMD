/**
 * @archivo FondoAnimado.tsx
 * @descripcion Fondo animado tipo "diagrama entidad-relación vivo".
 *
 * Renderiza un canvas a pantalla completa del contenedor padre con
 * pequeñas tarjetas-tabla (con etiquetas reales del DSL es-ldmd) que
 * flotan lentamente y se conectan entre sí cuando están cerca, dibujando
 * relaciones con cardinalidades (1, N) en los extremos.
 *
 * Optimizaciones:
 * - Respeta `prefers-reduced-motion: reduce` (renderiza un único frame).
 * - Pausa el bucle cuando la pestaña no está visible.
 * - Reduce densidad en pantallas pequeñas.
 * - Sin dependencias externas (Canvas 2D nativo).
 */
'use client';

import { useEffect, useRef } from 'react';

/** Etiquetas reales del DSL para reforzar la temática del fondo. */
const ETIQUETAS_TABLA = [
  'usuarios',
  'productos',
  'pedidos',
  'categorias',
  'clientes',
  'facturas',
  'detalle_pedidos',
  'inventario',
  'roles',
  'permisos',
  'direcciones',
  'pagos',
  'sesiones',
  'comentarios',
  'etiquetas',
  'mensajes',
];

/** Colores (paleta Mantine dark). */
const COLOR_NODO_BORDE = 'rgba(116, 192, 252, 0.55)'; // azul-3
const COLOR_NODO_FONDO = 'rgba(28, 30, 36, 0.70)';
const COLOR_NODO_HEADER = 'rgba(151, 117, 250, 0.45)'; // violeta
const COLOR_LINEA_BASE = 'rgba(77, 171, 247, 0.18)'; // azul-4
const COLOR_TEXTO = 'rgba(225, 235, 250, 0.85)';
const COLOR_TEXTO_TENUE = 'rgba(180, 200, 230, 0.55)';

interface Nodo {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ancho: number;
  alto: number;
  etiqueta: string;
  columnas: number;
  fadeInicio: number; // ms desde inicio
}

/**
 * Componente que pinta un canvas 2D con un fondo animado de tipo ER.
 */
export function FondoAnimado() {
  const refCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = refCanvas.current;
    if (!canvas) return;
    const contexto = canvas.getContext('2d');
    if (!contexto) return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let nodos: Nodo[] = [];
    let idAnimacion = 0;
    let detenido = false;
    const tiempoInicio = performance.now();

    /** Reajusta el canvas al tamaño del contenedor padre. */
    const redimensionar = () => {
      const padre = canvas.parentElement;
      if (!padre) return;
      const ancho = padre.clientWidth;
      const alto = padre.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(ancho * dpr);
      canvas.height = Math.floor(alto * dpr);
      canvas.style.width = `${ancho}px`;
      canvas.style.height = `${alto}px`;
      contexto.setTransform(dpr, 0, 0, dpr, 0, 0);
      crearNodos(ancho, alto);
    };

    /** Crea los nodos según el tamaño de la viewport. */
    const crearNodos = (ancho: number, alto: number) => {
      const esPequeno = ancho < 600;
      const cantidad = esPequeno ? 6 : ancho < 1024 ? 10 : 14;
      const elegidas = [...ETIQUETAS_TABLA]
        .sort(() => Math.random() - 0.5)
        .slice(0, cantidad);

      nodos = elegidas.map((etiqueta, i) => {
        const anchoNodo = 110 + Math.random() * 30;
        const columnas = 2 + Math.floor(Math.random() * 3);
        const altoNodo = 22 + columnas * 10;
        return {
          x: Math.random() * (ancho - anchoNodo),
          y: Math.random() * (alto - altoNodo),
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          ancho: anchoNodo,
          alto: altoNodo,
          etiqueta,
          columnas,
          fadeInicio: i * 90,
        };
      });
    };

    /** Dibuja un nodo-tabla con encabezado y líneas de columnas. */
    const dibujarNodo = (n: Nodo, alpha: number) => {
      contexto.globalAlpha = alpha;
      // Sombra muy sutil
      contexto.shadowColor = 'rgba(77, 171, 247, 0.15)';
      contexto.shadowBlur = 8;

      // Cuerpo
      contexto.fillStyle = COLOR_NODO_FONDO;
      contexto.strokeStyle = COLOR_NODO_BORDE;
      contexto.lineWidth = 1;
      dibujarRectRedondeado(n.x, n.y, n.ancho, n.alto, 6);
      contexto.fill();
      contexto.stroke();

      // Header
      contexto.shadowBlur = 0;
      contexto.fillStyle = COLOR_NODO_HEADER;
      dibujarRectRedondeado(n.x, n.y, n.ancho, 18, 6, true);
      contexto.fill();

      // Texto del nombre de tabla
      contexto.fillStyle = COLOR_TEXTO;
      contexto.font = '600 10px "JetBrains Mono", "Fira Code", Consolas, monospace';
      contexto.textBaseline = 'middle';
      contexto.fillText(n.etiqueta, n.x + 8, n.y + 9);

      // Líneas de columnas simuladas
      contexto.fillStyle = COLOR_TEXTO_TENUE;
      for (let i = 0; i < n.columnas; i++) {
        const yLinea = n.y + 22 + i * 10 + 4;
        contexto.fillRect(n.x + 8, yLinea, n.ancho * 0.55, 1.2);
        contexto.fillRect(n.x + n.ancho - 22, yLinea, 14, 1.2);
      }

      contexto.globalAlpha = 1;
    };

    /** Dibuja un rectángulo redondeado. Si soloArriba=true, sólo redondea esquinas superiores. */
    const dibujarRectRedondeado = (
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
      soloArriba = false,
    ) => {
      const rb = soloArriba ? 0 : r;
      contexto.beginPath();
      contexto.moveTo(x + r, y);
      contexto.lineTo(x + w - r, y);
      contexto.quadraticCurveTo(x + w, y, x + w, y + r);
      contexto.lineTo(x + w, y + h - rb);
      contexto.quadraticCurveTo(x + w, y + h, x + w - rb, y + h);
      contexto.lineTo(x + rb, y + h);
      contexto.quadraticCurveTo(x, y + h, x, y + h - rb);
      contexto.lineTo(x, y + r);
      contexto.quadraticCurveTo(x, y, x + r, y);
      contexto.closePath();
    };

    /** Dibuja una relación curvada entre dos nodos con cardinalidad. */
    const dibujarRelacion = (a: Nodo, b: Nodo, alpha: number) => {
      const ax = a.x + a.ancho / 2;
      const ay = a.y + a.alto / 2;
      const bx = b.x + b.ancho / 2;
      const by = b.y + b.alto / 2;
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2 - 18; // pequeña curva

      contexto.globalAlpha = alpha;
      contexto.strokeStyle = COLOR_LINEA_BASE;
      contexto.lineWidth = 1;
      contexto.beginPath();
      contexto.moveTo(ax, ay);
      contexto.quadraticCurveTo(mx, my, bx, by);
      contexto.stroke();

      // Cardinalidades en los extremos (1 y N) — usa hash simple para variedad estable
      contexto.fillStyle = 'rgba(180, 200, 230, 0.70)';
      contexto.font = '600 9px "JetBrains Mono", monospace';
      const hash = (a.etiqueta.length + b.etiqueta.length) % 3;
      const carA = hash === 0 ? '1' : 'N';
      const carB = hash === 1 ? '1' : 'N';
      contexto.fillText(carA, ax + (bx > ax ? 4 : -10), ay - 4);
      contexto.fillText(carB, bx + (ax > bx ? 4 : -10), by - 4);
      contexto.globalAlpha = 1;
    };

    /** Un frame de la animación. */
    const renderizar = () => {
      if (detenido) return;
      const ahora = performance.now();
      const transcurrido = ahora - tiempoInicio;
      const ancho = canvas.clientWidth;
      const alto = canvas.clientHeight;

      contexto.clearRect(0, 0, ancho, alto);

      // Mover nodos
      if (!reduceMotion) {
        for (const n of nodos) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x <= 0 || n.x + n.ancho >= ancho) n.vx *= -1;
          if (n.y <= 0 || n.y + n.alto >= alto) n.vy *= -1;
        }
      }

      // Dibujar relaciones (entre nodos cercanos)
      const distMax = 260;
      for (let i = 0; i < nodos.length; i++) {
        for (let j = i + 1; j < nodos.length; j++) {
          const a = nodos[i];
          const b = nodos[j];
          const dx = a.x + a.ancho / 2 - (b.x + b.ancho / 2);
          const dy = a.y + a.alto / 2 - (b.y + b.alto / 2);
          const dist = Math.hypot(dx, dy);
          if (dist < distMax) {
            const fadeA = Math.min(1, Math.max(0, (transcurrido - a.fadeInicio) / 600));
            const fadeB = Math.min(1, Math.max(0, (transcurrido - b.fadeInicio) / 600));
            const alphaBase = 1 - dist / distMax;
            dibujarRelacion(a, b, alphaBase * 0.7 * Math.min(fadeA, fadeB));
          }
        }
      }

      // Dibujar nodos por encima
      for (const n of nodos) {
        const fade = Math.min(1, Math.max(0, (transcurrido - n.fadeInicio) / 600));
        dibujarNodo(n, fade);
      }

      if (!reduceMotion) {
        idAnimacion = requestAnimationFrame(renderizar);
      }
    };

    /** Pausa/reanuda según visibilidad de la pestaña. */
    const onVisibilityChange = () => {
      if (document.hidden) {
        detenido = true;
        cancelAnimationFrame(idAnimacion);
      } else if (!reduceMotion) {
        detenido = false;
        idAnimacion = requestAnimationFrame(renderizar);
      }
    };

    redimensionar();
    renderizar();

    let temporizadorResize = 0;
    const onResize = () => {
      window.clearTimeout(temporizadorResize);
      temporizadorResize = window.setTimeout(redimensionar, 150);
    };
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      detenido = true;
      cancelAnimationFrame(idAnimacion);
      window.clearTimeout(temporizadorResize);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={refCanvas}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: 0.42,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
