/**
 * @archivo VistaDiagrama.tsx
 * @descripcion Componente de vista previa del diagrama entidad-relación.
 * Renderiza el diagrama en un canvas 2D con zoom, paneo y ajuste al contenido.
 */
'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { Box, Text, ActionIcon, Group, Tooltip, Center, Stack, Menu } from '@mantine/core';
import { VscZoomIn, VscZoomOut, VscScreenFull, VscGraph, VscListFlat } from 'react-icons/vsc';
import { TipoLayout } from '@/renderizado/auto-layout';
import { UsarTema } from '@/hooks/UsarTema';
import { ModeloDiagrama, NodoDiagrama } from '@/transformadores/ast-a-diagrama';
import { renderizar_diagrama } from '@/renderizado/motor-diagrama';
import { ALTO_BARRA_GRUPO } from '@/renderizado/motor-diagrama';
import {
  EstadoVista,
  crear_estado_vista_inicial,
  aplicar_zoom,
  aplicar_paneo,
  ajustar_al_contenido,
  PASO_ZOOM,
  COLORES_OSCURO,
  COLORES_CLARO,
} from '@/renderizado/utilidades-canvas';

/**
 * Propiedades del componente VistaDiagrama.
 */
interface PropiedadesVistaDiagrama {
  /** Modelo del diagrama a renderizar */
  modelo?: ModeloDiagrama | null;
  /** Tipo de layout seleccionado */
  tipo_layout?: TipoLayout;
  /** Callback al cambiar el algoritmo de layout */
  al_cambiar_layout?: (tipo: TipoLayout) => void;
}

/**
 * Componente de vista previa del diagrama ER con Canvas 2D.
 * Soporta zoom con rueda del ratón, paneo con arrastre,
 * y ajuste automático al contenido.
 *
 * @param {PropiedadesVistaDiagrama} props - Propiedades del componente
 * @returns {JSX.Element} Vista del diagrama renderizada
 */
/** Opciones de layout disponibles */
const OPCIONES_LAYOUT: { tipo: TipoLayout; nombre: string; descripcion: string; tecla: string }[] = [
  {
    tipo: 'izquierda-derecha',
    nombre: 'Izquierda-derecha',
    descripcion: 'Ordena tablas de izquierda a derecha según sus relaciones. Ideal para cadenas lineales tipo pipelines ETL.',
    tecla: '1',
  },
  {
    tipo: 'copo-de-nieve',
    nombre: 'Copo de nieve',
    descripcion: 'Las tablas más conectadas al centro. Ideal para diagramas densamente conectados tipo data warehouses.',
    tecla: '2',
  },
  {
    tipo: 'compacto',
    nombre: 'Compacto',
    descripcion: 'Rectángulo compacto. Ideal para diagramas con pocas relaciones y tablas.',
    tecla: '3',
  },
];

export function VistaDiagrama({ modelo, tipo_layout = 'izquierda-derecha', al_cambiar_layout }: PropiedadesVistaDiagrama) {
  const canvas_ref = useRef<HTMLCanvasElement>(null);
  const contenedor_ref = useRef<HTMLDivElement>(null);
  const vista_ref = useRef<EstadoVista>(crear_estado_vista_inicial());
  const arrastrando_ref = useRef(false);
  const ultimo_punto_ref = useRef({ x: 0, y: 0 });

  // Estado para arrastre de nodos individuales y grupos
  const nodo_arrastrado_ref = useRef<string | null>(null);
  const grupo_arrastrado_ref = useRef<string | null>(null);
  const posiciones_usuario_ref = useRef<Map<string, { x: number; y: number }>>(new Map());
  const nodos_renderizado_ref = useRef<NodoDiagrama[]>([]);
  const raf_ref = useRef<number | null>(null);
  const { es_oscuro } = UsarTema();

  const [dimensiones, fijarDimensiones] = useState({ ancho: 0, alto: 0 });

  const colores = es_oscuro ? COLORES_OSCURO : COLORES_CLARO;

  /**
   * Construye el modelo con las posiciones del usuario aplicadas.
   */
  const obtener_modelo_renderizado = useCallback((): ModeloDiagrama | null => {
    if (!modelo || modelo.nodos.length === 0) return null;

    const posiciones = posiciones_usuario_ref.current;
    const nodos = modelo.nodos.map((nodo) => {
      const pos = posiciones.get(nodo.id);
      return pos ? { ...nodo, x: pos.x, y: pos.y } : nodo;
    });
    nodos_renderizado_ref.current = nodos;
    return { ...modelo, nodos };
  }, [modelo]);

  /**
   * Dibuja el diagrama en el canvas.
   */
  const dibujar = useCallback(() => {
    const canvas = canvas_ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const ancho = canvas.width / dpr;
    const alto = canvas.height / dpr;

    const modelo_render = obtener_modelo_renderizado();
    if (modelo_render) {
      renderizar_diagrama(ctx, modelo_render, vista_ref.current, colores, ancho, alto);
    } else {
      // Limpiar canvas cuando no hay modelo
      ctx.clearRect(0, 0, ancho, alto);
      ctx.fillStyle = colores.fondo;
      ctx.fillRect(0, 0, ancho, alto);
    }
  }, [obtener_modelo_renderizado, colores]);

  /**
   * Solicita un repintado del canvas vía requestAnimationFrame.
   */
  const solicitar_repintado = useCallback(() => {
    if (raf_ref.current !== null) {
      cancelAnimationFrame(raf_ref.current);
    }
    raf_ref.current = requestAnimationFrame(() => {
      dibujar();
      raf_ref.current = null;
    });
  }, [dibujar]);

  /**
   * Ajusta el tamaño del canvas a las dimensiones del contenedor.
   */
  const ajustar_tamano = useCallback(() => {
    const contenedor = contenedor_ref.current;
    const canvas = canvas_ref.current;
    if (!contenedor || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = contenedor.getBoundingClientRect();
    const ancho = rect.width;
    const alto = rect.height;

    canvas.width = ancho * dpr;
    canvas.height = alto * dpr;
    canvas.style.width = `${ancho}px`;
    canvas.style.height = `${alto}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    fijarDimensiones({ ancho, alto });
    solicitar_repintado();
  }, [solicitar_repintado]);

  /**
   * Ajusta la vista para mostrar todo el contenido.
   */
  const ajustar_vista_al_contenido = useCallback(() => {
    if (!modelo || modelo.nodos.length === 0) return;

    const nodos = nodos_renderizado_ref.current.length > 0
      ? nodos_renderizado_ref.current
      : modelo.nodos;

    vista_ref.current = ajustar_al_contenido(
      nodos,
      dimensiones.ancho,
      dimensiones.alto,
    );
    solicitar_repintado();
  }, [modelo, dimensiones, solicitar_repintado]);

  /**
   * Acercar zoom.
   */
  const acercar = useCallback(() => {
    vista_ref.current = aplicar_zoom(
      vista_ref.current,
      PASO_ZOOM,
      dimensiones.ancho / 2,
      dimensiones.alto / 2,
    );
    solicitar_repintado();
  }, [dimensiones, solicitar_repintado]);

  /**
   * Alejar zoom.
   */
  const alejar = useCallback(() => {
    vista_ref.current = aplicar_zoom(
      vista_ref.current,
      -PASO_ZOOM,
      dimensiones.ancho / 2,
      dimensiones.alto / 2,
    );
    solicitar_repintado();
  }, [dimensiones, solicitar_repintado]);

  /**
   * Maneja el evento de rueda del ratón para zoom.
   */
  const manejar_rueda = useCallback(
    (evento: WheelEvent) => {
      evento.preventDefault();
      const delta = evento.deltaY > 0 ? -PASO_ZOOM : PASO_ZOOM;
      const rect = canvas_ref.current?.getBoundingClientRect();
      if (!rect) return;

      vista_ref.current = aplicar_zoom(
        vista_ref.current,
        delta,
        evento.clientX - rect.left,
        evento.clientY - rect.top,
      );
      solicitar_repintado();
    },
    [solicitar_repintado],
  );

  /**
   * Convierte coordenadas del ratón (screen) a coordenadas del mundo (canvas).
   */
  const screen_a_mundo = useCallback((evento: React.MouseEvent): { x: number; y: number } => {
    const rect = canvas_ref.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const vista = vista_ref.current;
    return {
      x: (evento.clientX - rect.left - vista.desplazamiento_x) / vista.zoom,
      y: (evento.clientY - rect.top - vista.desplazamiento_y) / vista.zoom,
    };
  }, []);

  /**
   * Detecta si un punto del mundo está dentro de un nodo.
   * Devuelve el nodo más "arriba" (último dibujado) que contenga el punto.
   */
  const detectar_nodo = useCallback((mx: number, my: number): NodoDiagrama | null => {
    const nodos = nodos_renderizado_ref.current;
    for (let i = nodos.length - 1; i >= 0; i--) {
      const n = nodos[i];
      if (mx >= n.x && mx <= n.x + n.ancho && my >= n.y && my <= n.y + n.alto) {
        return n;
      }
    }
    return null;
  }, []);

  /**
   * Detecta si un punto del mundo está dentro de la barra de arrastre de un grupo.
   * Devuelve el nombre del grupo si hay hit en la barra superior.
   */
  const detectar_grupo = useCallback((mx: number, my: number): string | null => {
    if (!modelo) return null;
    const nodos = nodos_renderizado_ref.current;
    const PADDING = 20;

    for (const grupo of modelo.grupos) {
      const nodos_grupo = nodos.filter((n) => grupo.nodos.includes(n.id));
      if (nodos_grupo.length === 0) continue;

      let min_x = Infinity, min_y = Infinity, max_x = -Infinity;
      for (const n of nodos_grupo) {
        min_x = Math.min(min_x, n.x);
        min_y = Math.min(min_y, n.y);
        max_x = Math.max(max_x, n.x + n.ancho);
      }
      min_x -= PADDING;
      min_y -= PADDING;
      max_x += PADDING;

      // Solo detectar la barra de arrastre (franja superior)
      const barra_y = min_y - ALTO_BARRA_GRUPO;
      const barra_ancho = max_x - min_x;

      if (mx >= min_x && mx <= min_x + barra_ancho && my >= barra_y && my <= barra_y + ALTO_BARRA_GRUPO) {
        return grupo.nombre;
      }
    }
    return null;
  }, [modelo]);

  /**
   * Maneja el inicio del arrastre (nodo individual o paneo).
   */
  const manejar_raton_abajo = useCallback((evento: React.MouseEvent) => {
    const mundo = screen_a_mundo(evento);
    const nodo = detectar_nodo(mundo.x, mundo.y);

    arrastrando_ref.current = true;
    ultimo_punto_ref.current = { x: evento.clientX, y: evento.clientY };

    if (nodo) {
      // Prioridad: nodo individual
      nodo_arrastrado_ref.current = nodo.id;
      grupo_arrastrado_ref.current = null;
      if (canvas_ref.current) canvas_ref.current.style.cursor = 'move';
    } else {
      nodo_arrastrado_ref.current = null;
      const grupo = detectar_grupo(mundo.x, mundo.y);
      if (grupo) {
        // Arrastrar grupo completo
        grupo_arrastrado_ref.current = grupo;
        if (canvas_ref.current) canvas_ref.current.style.cursor = 'move';
      } else {
        // Paneo del canvas
        grupo_arrastrado_ref.current = null;
        if (canvas_ref.current) canvas_ref.current.style.cursor = 'grabbing';
      }
    }
  }, [screen_a_mundo, detectar_nodo, detectar_grupo]);

  /**
   * Maneja el movimiento del ratón durante el arrastre.
   */
  const manejar_raton_movimiento = useCallback(
    (evento: React.MouseEvent) => {
      if (!arrastrando_ref.current) {
        // Cambiar cursor al pasar sobre un nodo o grupo
        const mundo = screen_a_mundo(evento);
        const nodo = detectar_nodo(mundo.x, mundo.y);
        if (canvas_ref.current) {
          if (nodo) {
            canvas_ref.current.style.cursor = 'move';
          } else {
            const grupo = detectar_grupo(mundo.x, mundo.y);
            canvas_ref.current.style.cursor = grupo ? 'move' : 'grab';
          }
        }
        return;
      }

      const delta_x = evento.clientX - ultimo_punto_ref.current.x;
      const delta_y = evento.clientY - ultimo_punto_ref.current.y;
      ultimo_punto_ref.current = { x: evento.clientX, y: evento.clientY };

      const vista = vista_ref.current;
      const delta_mundo_x = delta_x / vista.zoom;
      const delta_mundo_y = delta_y / vista.zoom;

      const id_nodo = nodo_arrastrado_ref.current;
      const nombre_grupo = grupo_arrastrado_ref.current;

      if (id_nodo) {
        // Arrastrar nodo individual
        const posiciones = posiciones_usuario_ref.current;
        const nodo = nodos_renderizado_ref.current.find((n) => n.id === id_nodo);
        if (nodo) {
          posiciones.set(id_nodo, { x: nodo.x + delta_mundo_x, y: nodo.y + delta_mundo_y });
        }
      } else if (nombre_grupo && modelo) {
        // Arrastrar grupo: mover todos sus nodos
        const grupo = modelo.grupos.find((g) => g.nombre === nombre_grupo);
        if (grupo) {
          const posiciones = posiciones_usuario_ref.current;
          for (const nodo_id of grupo.nodos) {
            const nodo = nodos_renderizado_ref.current.find((n) => n.id === nodo_id);
            if (nodo) {
              posiciones.set(nodo_id, { x: nodo.x + delta_mundo_x, y: nodo.y + delta_mundo_y });
            }
          }
        }
      } else {
        // Paneo del canvas
        vista_ref.current = aplicar_paneo(vista_ref.current, delta_x, delta_y);
      }
      solicitar_repintado();
    },
    [solicitar_repintado, screen_a_mundo, detectar_nodo],
  );

  /**
   * Maneja el fin del arrastre.
   */
  const manejar_raton_arriba = useCallback(() => {
    arrastrando_ref.current = false;
    nodo_arrastrado_ref.current = null;
    grupo_arrastrado_ref.current = null;
    if (canvas_ref.current) {
      canvas_ref.current.style.cursor = 'grab';
    }
  }, []);

  // Observar cambios de tamaño del contenedor
  useEffect(() => {
    const contenedor = contenedor_ref.current;
    if (!contenedor) return;

    const observer = new ResizeObserver(() => {
      ajustar_tamano();
    });
    observer.observe(contenedor);

    // Ajuste inicial
    ajustar_tamano();

    return () => {
      observer.disconnect();
      if (raf_ref.current !== null) {
        cancelAnimationFrame(raf_ref.current);
      }
    };
  }, [ajustar_tamano]);

  // Registrar evento de rueda (necesita passive: false)
  useEffect(() => {
    const canvas = canvas_ref.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', manejar_rueda, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', manejar_rueda);
    };
  }, [manejar_rueda]);

  // Sincronizar posiciones de usuario cuando el modelo cambia
  useEffect(() => {
    if (!modelo) {
      posiciones_usuario_ref.current.clear();
      nodos_renderizado_ref.current = [];
      return;
    }
    // Limpiar posiciones de nodos que ya no existen
    const ids_actuales = new Set(modelo.nodos.map((n) => n.id));
    for (const id of posiciones_usuario_ref.current.keys()) {
      if (!ids_actuales.has(id)) posiciones_usuario_ref.current.delete(id);
    }
    // Inicializar nodos de renderizado
    nodos_renderizado_ref.current = modelo.nodos.map((nodo) => {
      const pos = posiciones_usuario_ref.current.get(nodo.id);
      return pos ? { ...nodo, x: pos.x, y: pos.y } : nodo;
    });
  }, [modelo]);

  // Redibujar cuando cambia el modelo o el tema
  useEffect(() => {
    solicitar_repintado();
  }, [solicitar_repintado]);

  // Ajustar al contenido cuando cambia el modelo
  useEffect(() => {
    if (modelo && modelo.nodos.length > 0 && dimensiones.ancho > 0) {
      ajustar_vista_al_contenido();
    }
  }, [modelo]); // eslint-disable-line react-hooks/exhaustive-deps

  const tiene_contenido = modelo && modelo.nodos.length > 0;

  return (
    <Box
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--mantine-color-body)',
      }}
    >
      {/* Header con controles de zoom */}
      <Box
        style={{
          padding: '6px 12px',
          borderBottom: '1px solid var(--mantine-color-default-border)',
          flexShrink: 0,
        }}
      >
        <Group justify="space-between">
          <Text size="xs" c="dimmed" fw={600}>
            DIAGRAMA
          </Text>
          <Group gap={4}>
            <Tooltip label="Acercar" withArrow>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={acercar}
                aria-label="Acercar zoom"
                disabled={!tiene_contenido}
              >
                <VscZoomIn size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Alejar" withArrow>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={alejar}
                aria-label="Alejar zoom"
                disabled={!tiene_contenido}
              >
                <VscZoomOut size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Ajustar al contenido" withArrow>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={ajustar_vista_al_contenido}
                aria-label="Ajustar vista al contenido"
                disabled={!tiene_contenido}
              >
                <VscScreenFull size={14} />
              </ActionIcon>
            </Tooltip>

            {/* Selector de algoritmo de ordenamiento */}
            <Menu shadow="md" width={320} position="bottom-end" withArrow>
              <Menu.Target>
                <Tooltip label="Ordenar tablas" withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    aria-label="Elegir algoritmo de ordenamiento"
                    disabled={!tiene_contenido}
                  >
                    <VscListFlat size={14} />
                  </ActionIcon>
                </Tooltip>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Elegir algoritmo de ordenamiento</Menu.Label>
                {OPCIONES_LAYOUT.map((opcion) => (
                  <Menu.Item
                    key={opcion.tipo}
                    onClick={() => {
                      al_cambiar_layout?.(opcion.tipo);
                      posiciones_usuario_ref.current.clear();
                    }}
                    rightSection={
                      <Text size="xs" c="dimmed" fw={700}>
                        {opcion.tecla}
                      </Text>
                    }
                    style={{
                      backgroundColor: tipo_layout === opcion.tipo
                        ? 'var(--mantine-color-dark-5)'
                        : undefined,
                    }}
                  >
                    <Text size="sm" fw={600}>
                      {opcion.nombre}
                    </Text>
                    <Text size="xs" c="dimmed" lh={1.3}>
                      {opcion.descripcion}
                    </Text>
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </Box>

      {/* Canvas del diagrama */}
      <Box
        ref={contenedor_ref}
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <canvas
          ref={canvas_ref}
          onMouseDown={manejar_raton_abajo}
          onMouseMove={manejar_raton_movimiento}
          onMouseUp={manejar_raton_arriba}
          onMouseLeave={manejar_raton_arriba}
          style={{
            cursor: tiene_contenido ? 'grab' : 'default',
            display: 'block',
          }}
          aria-label="Diagrama entidad-relación"
          role="img"
        />

        {/* Placeholder cuando no hay contenido */}
        {!tiene_contenido && (
          <Center
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
            }}
          >
            <Stack align="center" gap="sm">
              <VscGraph size={48} color="var(--mantine-color-dimmed)" />
              <Text size="sm" c="dimmed">
                La vista previa del diagrama aparecerá aquí
              </Text>
              <Text size="xs" c="dimmed">
                Escribe código en el editor para generar el diagrama
              </Text>
            </Stack>
          </Center>
        )}
      </Box>
    </Box>
  );
}
