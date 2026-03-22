/**
 * @archivo ChatIA.tsx
 * @descripcion Componente de chat de IA local usando web-llm.
 * Permite descargar modelos, enviar mensajes y recibir respuestas
 * para generar código DSL es-ldmd a partir de lenguaje natural.
 */
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Text,
  Button,
  TextInput,
  Stack,
  Select,
  Progress,
  Center,
  Group,
  ActionIcon,
  Tooltip,
  Alert,
  Paper,
} from '@mantine/core';
import {
  VscRobot,
  VscSend,
  VscTrash,
  VscDebugStop,
  VscWarning,
  VscRefresh,
  VscClose,
} from 'react-icons/vsc';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';
import { BloqueCodigo } from '@/componentes/documentacion/BloqueCodigo';
import {
  obtener_motor_ia,
  obtener_modelos,
  type EstadoMotorIA,
  type MensajeChat,
} from '@/ia-local/motor-ia';

/**
 * Propiedades del componente ChatIA.
 */
interface PropiedadesChatIA {
  /** Callback para insertar código DSL en el editor */
  al_insertar_codigo?: (codigo: string) => void;
}

/**
 * Componente de chat de IA local.
 * Integra web-llm para ejecutar modelos LLM en el navegador.
 * Permite al usuario describir diagramas en lenguaje natural
 * y obtener código DSL es-ldmd.
 *
 * @param {PropiedadesChatIA} props - Propiedades del componente
 * @returns {JSX.Element} Chat de IA renderizado
 */
export function ChatIA({ al_insertar_codigo }: PropiedadesChatIA) {
  const [estado, fijarEstado] = useState<EstadoMotorIA>('sin_iniciar');
  const [modelo_seleccionado, fijarModeloSeleccionado] = useState<string | null>(null);
  const [progreso, fijarProgreso] = useState(0);
  const [texto_progreso, fijarTextoProgreso] = useState('');
  const [mensaje_input, fijarMensajeInput] = useState('');
  const [mensajes, fijarMensajes] = useState<MensajeChat[]>([]);
  const [respuesta_parcial, fijarRespuestaParcial] = useState('');
  const [error, fijarError] = useState<string | null>(null);
  const [soporte_webgpu, fijarSoporteWebgpu] = useState<boolean | null>(null);
  const [soporte_f16, fijarSoporteF16] = useState(false);

  const modelos = obtener_modelos(soporte_f16);

  const scroll_ref = useRef<HTMLDivElement>(null);
  const input_ref = useRef<HTMLInputElement>(null);
  const usuario_cerca_del_final = useRef(true);

  /**
   * Verifica el soporte de WebGPU al montar.
   */
  useEffect(() => {
    const verificar = async () => {
      const motor = obtener_motor_ia();
      const soporte = await motor.verificar_soporte();
      fijarSoporteWebgpu(soporte.webgpu);
      fijarSoporteF16(soporte.shader_f16);

      // Seleccionar primer modelo de la lista apropiada
      const lista = obtener_modelos(soporte.shader_f16);
      if (lista.length > 0) {
        fijarModeloSeleccionado(lista[0].id);
      }

      // Si el motor ya tiene un modelo cargado, restaurar estado
      if (motor.estado === 'listo') {
        fijarEstado('listo');
        fijarMensajes(motor.historial);
      }
    };
    verificar();
  }, []);

  /**
   * Desplaza el scroll al final solo si el usuario ya estaba cerca del fondo.
   */
  useEffect(() => {
    requestAnimationFrame(() => {
      if (scroll_ref.current && usuario_cerca_del_final.current) {
        scroll_ref.current.scrollTop = scroll_ref.current.scrollHeight;
      }
    });
  }, [mensajes, respuesta_parcial]);

  /**
   * Detecta si el usuario está cerca del final del scroll.
   */
  useEffect(() => {
    const el = scroll_ref.current;
    if (!el) return;

    const manejar_scroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      usuario_cerca_del_final.current = scrollHeight - scrollTop - clientHeight < 80;
    };

    el.addEventListener('scroll', manejar_scroll, { passive: true });
    return () => el.removeEventListener('scroll', manejar_scroll);
  }, [estado]);

  /**
   * Carga el modelo seleccionado.
   */
  const cargar_modelo = useCallback(async () => {
    if (!modelo_seleccionado) return;

    fijarError(null);
    fijarProgreso(0);
    fijarTextoProgreso('Iniciando descarga...');

    const motor = obtener_motor_ia();

    motor.registrar_cambio_estado((nuevo_estado) => {
      fijarEstado(nuevo_estado);
    });

    motor.registrar_progreso((informe) => {
      fijarProgreso(Math.round(informe.progreso * 100));
      fijarTextoProgreso(informe.texto);
    });

    try {
      await motor.cargar_modelo(modelo_seleccionado);
    } catch (err) {
      fijarError(err instanceof Error ? err.message : 'Error al cargar el modelo');
    }
  }, [modelo_seleccionado]);

  /**
   * Envía un mensaje al chat.
   */
  const enviar_mensaje = useCallback(async () => {
    const texto = mensaje_input.trim();
    if (!texto) return;

    fijarMensajeInput('');
    fijarError(null);
    usuario_cerca_del_final.current = true;

    const motor = obtener_motor_ia();

    // Agregar mensaje del usuario visualmente
    fijarMensajes((prev) => [
      ...prev,
      { rol: 'usuario', contenido: texto, fecha: new Date().toISOString() },
    ]);

    fijarEstado('generando');
    fijarRespuestaParcial('');

    try {
      const respuesta = await motor.enviar_mensaje(texto, (fragmento) => {
        fijarRespuestaParcial(fragmento);
      });

      fijarRespuestaParcial('');
      fijarMensajes((prev) => [
        ...prev,
        { rol: 'asistente', contenido: respuesta, fecha: new Date().toISOString() },
      ]);
      fijarEstado('listo');
    } catch (err) {
      fijarEstado('listo');
      fijarRespuestaParcial('');
      fijarError(err instanceof Error ? err.message : 'Error al generar respuesta');
    }
  }, [mensaje_input]);

  /**
   * Interrumpe la generación actual.
   */
  const interrumpir = useCallback(async () => {
    const motor = obtener_motor_ia();
    await motor.interrumpir();
    fijarRespuestaParcial('');
  }, []);

  /**
   * Descarga el modelo y vuelve al estado inicial.
   */
  const descargar_modelo = useCallback(async () => {
    const motor = obtener_motor_ia();
    await motor.descargar();
    fijarEstado('sin_iniciar');
    fijarMensajes([]);
    fijarRespuestaParcial('');
    fijarError(null);
  }, []);

  /**
   * Elimina el modelo de la caché local del navegador y libera recursos.
   */
  const eliminar_modelo = useCallback(async () => {
    const motor = obtener_motor_ia();
    await motor.eliminar_modelo_local();
    fijarEstado('sin_iniciar');
    fijarMensajes([]);
    fijarRespuestaParcial('');
    fijarError(null);
  }, []);

  /**
   * Limpia el historial del chat.
   */
  const limpiar_chat = useCallback(async () => {
    const motor = obtener_motor_ia();
    await motor.limpiar_historial();
    fijarMensajes([]);
    fijarRespuestaParcial('');
  }, []);

  /**
   * Extrae bloques de código DSL de un mensaje y los inserta en el editor.
   */
  const insertar_codigo_de_mensaje = useCallback(
    (contenido: string) => {
      // Buscar bloques de código en el mensaje
      const regex_codigo = /```(?:esldmd|es-ldmd)?\s*\n([\s\S]*?)```/g;
      const bloques: string[] = [];
      let coincidencia;

      while ((coincidencia = regex_codigo.exec(contenido)) !== null) {
        bloques.push(coincidencia[1].trim());
      }

      if (bloques.length > 0) {
        al_insertar_codigo?.(bloques.join('\n\n'));
      } else {
        // Si no hay bloques de código, insertar todo el contenido
        al_insertar_codigo?.(contenido);
      }
    },
    [al_insertar_codigo],
  );

  /**
   * Componentes personalizados para ReactMarkdown.
   * Intercepta bloques de código con lenguaje esldmd/es-ldmd
   * y los renderiza con el resaltado de sintaxis propio del DSL.
   */
  const componentes_markdown: Components = {
    code({ className, children, ...props }) {
      const es_lenguaje_dsl = className === 'language-esldmd'
        || className === 'language-es-ldmd'
        || className === 'hljs language-esldmd'
        || className === 'hljs language-es-ldmd';

      if (es_lenguaje_dsl) {
        const codigo = String(children).replace(/\n$/, '');
        return <BloqueCodigo codigo={codigo} />;
      }

      return <code className={className} {...props}>{children}</code>;
    },
    pre({ children }) {
      return <>{children}</>;
    },
  };

  // ============================================================
  // Renderizado condicional según estado
  // ============================================================

  // Sin soporte WebGPU
  if (soporte_webgpu === false) {
    return (
      <Center p="xl" style={{ height: '100%' }}>
        <Stack align="center" gap="md">
          <VscWarning size={48} color="var(--mantine-color-yellow-6)" />
          <Text size="sm" ta="center" fw={600}>
            WebGPU no disponible
          </Text>
          <Text size="xs" c="dimmed" ta="center" maw={280}>
            Tu navegador no soporta WebGPU. Para usar la IA local, necesitas Chrome 113+, Edge 113+
            u otro navegador con soporte de WebGPU.
          </Text>
        </Stack>
      </Center>
    );
  }

  // Estado inicial: selector de modelo
  if (estado === 'sin_iniciar' || estado === 'verificando_soporte') {
    return (
      <Box p="md" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Stack gap="md" style={{ flex: 1 }}>
          <Center>
            <Stack align="center" gap="sm">
              <VscRobot size={40} color="var(--mantine-color-blue-5)" />
              <Text size="sm" fw={600} ta="center">
                Asistente de IA local
              </Text>
              <Text size="xs" c="dimmed" ta="center" maw={280}>
                Selecciona un modelo para generar código DSL es-ldmd a partir de descripciones en
                lenguaje natural. El modelo se ejecuta completamente en tu navegador.
              </Text>
            </Stack>
          </Center>

          <Select
            label="Modelo"
            placeholder="Selecciona un modelo"
            value={modelo_seleccionado}
            onChange={fijarModeloSeleccionado}
            data={modelos.map((m) => ({
              value: m.id,
              label: `${m.nombre} (~${m.tamano_mb} MB)`,
            }))}
            size="sm"
          />

          <Text size="xs" c={soporte_f16 ? 'teal' : 'yellow'} ta="center">
            {soporte_f16
              ? 'Modo optimizado (f16) — modelos más ligeros'
              : 'Modo compatibilidad (f32) — compatible con tu GPU'}
          </Text>

          {error && (
            <Alert color="red" variant="light" title="Error">
              {error}
            </Alert>
          )}

          <Button
            onClick={cargar_modelo}
            disabled={!modelo_seleccionado}
            loading={estado === 'verificando_soporte'}
            color="azul"
            fullWidth
          >
            Descargar e iniciar modelo
          </Button>

          <Text size="xs" c="dimmed" ta="center">
            La primera descarga puede tardar varios minutos. El modelo se almacena en caché para
            futuras sesiones.
          </Text>
        </Stack>
      </Box>
    );
  }

  // Descargando modelo
  if (estado === 'descargando') {
    return (
      <Center p="xl" style={{ height: '100%' }}>
        <Stack align="center" gap="md" w="100%" maw={300}>
          <VscRobot size={40} color="var(--mantine-color-blue-5)" />
          <Text size="sm" fw={600}>
            Descargando modelo...
          </Text>
          <Progress value={progreso} size="lg" color="azul" w="100%" animated />
          <Text size="xs" c="dimmed" ta="center">
            {texto_progreso}
          </Text>
          <Text size="xs" c="dimmed">
            {progreso}%
          </Text>
        </Stack>
      </Center>
    );
  }

  // Error fatal
  if (estado === 'error') {
    return (
      <Center p="xl" style={{ height: '100%' }}>
        <Stack align="center" gap="md">
          <VscWarning size={40} color="var(--mantine-color-red-6)" />
          <Text size="sm" fw={600} c="red">
            Error al cargar el modelo
          </Text>
          {error && (
            <Text size="xs" c="dimmed" ta="center" maw={280}>
              {error}
            </Text>
          )}
          <Button
            variant="light"
            color="azul"
            size="sm"
            onClick={() => {
              fijarEstado('sin_iniciar');
              fijarError(null);
            }}
          >
            Intentar de nuevo
          </Button>
        </Stack>
      </Center>
    );
  }

  // Chat activo (estado: listo o generando)
  return (
    <Box style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Barra superior del chat */}
      <Group
        gap="xs"
        p="xs"
        style={{ borderBottom: '1px solid var(--mantine-color-default-border)', flexShrink: 0 }}
      >
        <VscRobot size={14} color="var(--mantine-color-blue-5)" />
        <Text size="xs" c="dimmed" style={{ flex: 1 }} truncate>
          {modelos.find((m) => m.id === obtener_motor_ia().modelo_id)?.nombre ?? 'IA'}
        </Text>
        <Tooltip label="Cambiar modelo" withArrow>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            onClick={descargar_modelo}
            disabled={estado === 'generando'}
          >
            <VscRefresh size={14} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Eliminar modelo local" withArrow>
          <ActionIcon
            variant="subtle"
            color="red"
            size="sm"
            onClick={eliminar_modelo}
            disabled={estado === 'generando'}
          >
            <VscClose size={14} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Limpiar chat" withArrow>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            onClick={limpiar_chat}
            disabled={estado === 'generando'}
          >
            <VscTrash size={14} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {/* Mensajes - contenedor con posición relativa para restringir la altura */}
      <Box style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <Box
          ref={scroll_ref}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflowY: 'auto',
            padding: 'var(--mantine-spacing-xs)',
          }}
        >
          {mensajes.length === 0 && !respuesta_parcial ? (
            <Center p="xl">
              <Stack align="center" gap="xs">
                <Text size="xs" c="dimmed" ta="center" maw={250}>
                  Describe el diagrama que necesitas y generaré el código DSL es-ldmd.
                </Text>
                <Text size="xs" c="dimmed" ta="center" maw={250}>
                  Ejemplo: &quot;Necesito un sistema de blog con usuarios, posts y comentarios&quot;
                </Text>
              </Stack>
            </Center>
          ) : (
            <Stack gap="xs">
              {mensajes.map((msg, indice) => (
                <Paper
                  key={indice}
                  p="xs"
                  radius="sm"
                  style={{
                    backgroundColor:
                      msg.rol === 'usuario'
                        ? 'var(--mantine-color-blue-light)'
                        : 'var(--mantine-color-default)',
                    alignSelf: msg.rol === 'usuario' ? 'flex-end' : 'flex-start',
                    maxWidth: '90%',
                  }}
                >
                  <Text size="xs" fw={600} mb={2}>
                    {msg.rol === 'usuario' ? 'Tú' : 'IA'}
                  </Text>
                  {msg.rol === 'asistente' ? (
                    <div className="chat-markdown">
                      <ReactMarkdown rehypePlugins={[rehypeHighlight]} components={componentes_markdown}>
                        {msg.contenido}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <Text
                      size="xs"
                      style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                    >
                      {msg.contenido}
                    </Text>
                  )}
                  {msg.rol === 'asistente' && al_insertar_codigo && (
                    <Button
                      size="compact-xs"
                      variant="subtle"
                      color="azul"
                      mt={4}
                      onClick={() => insertar_codigo_de_mensaje(msg.contenido)}
                    >
                      Insertar en editor
                    </Button>
                  )}
                </Paper>
              ))}

              {/* Respuesta parcial (streaming) */}
              {respuesta_parcial && (
                <Paper
                  p="xs"
                  radius="sm"
                  style={{
                    backgroundColor: 'var(--mantine-color-default)',
                    maxWidth: '90%',
                  }}
                >
                  <Text size="xs" fw={600} mb={2}>
                    IA
                  </Text>
                  <div className="chat-markdown">
                    <ReactMarkdown rehypePlugins={[rehypeHighlight]} components={componentes_markdown}>
                      {respuesta_parcial}
                    </ReactMarkdown>
                  </div>
                </Paper>
              )}
            </Stack>
          )}
        </Box>
      </Box>

      {/* Error */}
      {error && (
        <Alert color="red" variant="light" p="xs" m="xs" radius="sm" style={{ flexShrink: 0 }}>
          <Text size="xs">{error}</Text>
        </Alert>
      )}

      {/* Input de mensaje */}
      <Group gap="xs" p="xs" style={{ borderTop: '1px solid var(--mantine-color-default-border)', flexShrink: 0 }}>
        <TextInput
          ref={input_ref}
          placeholder="Describe tu diagrama..."
          value={mensaje_input}
          onChange={(e) => fijarMensajeInput(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              enviar_mensaje();
            }
          }}
          disabled={estado === 'generando'}
          size="xs"
          style={{ flex: 1 }}
        />
        {estado === 'generando' ? (
          <Tooltip label="Detener generación" withArrow>
            <ActionIcon
              variant="filled"
              color="red"
              size="md"
              onClick={interrumpir}
            >
              <VscDebugStop size={16} />
            </ActionIcon>
          </Tooltip>
        ) : (
          <Tooltip label="Enviar mensaje" withArrow>
            <ActionIcon
              variant="filled"
              color="azul"
              size="md"
              onClick={enviar_mensaje}
              disabled={!mensaje_input.trim()}
            >
              <VscSend size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
    </Box>
  );
}
