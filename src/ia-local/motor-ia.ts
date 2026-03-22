/**
 * @archivo motor-ia.ts
 * @descripcion Motor de IA local usando web-llm.
 * Gestiona la carga de modelos, el chat y la generación de DSL es-ldmd.
 * Se ejecuta completamente en el navegador usando WebGPU.
 */

import type {
  MLCEngineInterface,
  InitProgressReport,
  ChatCompletionMessageParam,
} from '@mlc-ai/web-llm';

// ============================================================
// Tipos
// ============================================================

/**
 * Información de un modelo disponible para descargar.
 */
export interface ModeloDisponible {
  /** ID del modelo en web-llm */
  id: string;
  /** Nombre para mostrar al usuario */
  nombre: string;
  /** Tamaño aproximado en MB */
  tamano_mb: number;
  /** Si requiere pocos recursos (apto para móviles) */
  bajo_recurso: boolean;
}

/**
 * Estado del motor de IA.
 */
export type EstadoMotorIA =
  | 'sin_iniciar'
  | 'verificando_soporte'
  | 'descargando'
  | 'listo'
  | 'generando'
  | 'error';

/**
 * Mensaje en el historial del chat.
 */
export interface MensajeChat {
  /** Rol del mensaje */
  rol: 'sistema' | 'usuario' | 'asistente';
  /** Contenido del mensaje */
  contenido: string;
  /** Timestamp */
  fecha: string;
}

/**
 * Callback de progreso de carga del modelo.
 */
export type CallbackProgresoCarga = (informe: {
  progreso: number;
  texto: string;
  tiempo_transcurrido: number;
}) => void;

/**
 * Resultado de verificación de soporte WebGPU.
 */
export interface SoporteWebGPU {
  /** Si el navegador soporta WebGPU */
  webgpu: boolean;
  /** Si el adaptador soporta la extensión shader-f16 */
  shader_f16: boolean;
}

// ============================================================
// Modelos recomendados
// ============================================================

/**
 * Modelos q4f32_1: compatibles con todos los navegadores con WebGPU.
 * No requieren la extensión shader-f16.
 */
const MODELOS_F32: ModeloDisponible[] = [
  {
    id: 'SmolLM2-360M-Instruct-q4f32_1-MLC',
    nombre: 'SmolLM2 360M (Recomendado)',
    tamano_mb: 580,
    bajo_recurso: true,
  },
  {
    id: 'SmolLM2-1.7B-Instruct-q4f32_1-MLC',
    nombre: 'SmolLM2 1.7B',
    tamano_mb: 2692,
    bajo_recurso: false,
  },
  {
    id: 'Qwen3-0.6B-q4f32_1-MLC',
    nombre: 'Qwen3 0.6B',
    tamano_mb: 1925,
    bajo_recurso: true,
  },
  {
    id: 'Qwen3-1.7B-q4f32_1-MLC',
    nombre: 'Qwen3 1.7B',
    tamano_mb: 2635,
    bajo_recurso: false,
  },
  {
    id: 'TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC',
    nombre: 'TinyLlama 1.1B',
    tamano_mb: 840,
    bajo_recurso: true,
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
    nombre: 'Llama 3.2 1B',
    tamano_mb: 1129,
    bajo_recurso: false,
  },
];

/**
 * Modelos q4f16_1: más ligeros pero requieren shader-f16.
 * Solo se muestran si el navegador soporta la extensión.
 */
const MODELOS_F16: ModeloDisponible[] = [
  {
    id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    nombre: 'SmolLM2 360M (Recomendado)',
    tamano_mb: 376,
    bajo_recurso: true,
  },
  {
    id: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC',
    nombre: 'SmolLM2 1.7B',
    tamano_mb: 1774,
    bajo_recurso: false,
  },
  {
    id: 'Qwen3-0.6B-q4f16_1-MLC',
    nombre: 'Qwen3 0.6B',
    tamano_mb: 1403,
    bajo_recurso: true,
  },
  {
    id: 'Qwen3-1.7B-q4f16_1-MLC',
    nombre: 'Qwen3 1.7B',
    tamano_mb: 2037,
    bajo_recurso: false,
  },
  {
    id: 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC',
    nombre: 'TinyLlama 1.1B',
    tamano_mb: 697,
    bajo_recurso: true,
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    nombre: 'Llama 3.2 1B',
    tamano_mb: 879,
    bajo_recurso: false,
  },
];

/**
 * Retorna la lista de modelos apropiada según soporte de shader-f16.
 * Si hay soporte f16, devuelve modelos más ligeros; si no, los f32 universales.
 */
export function obtener_modelos(soporte_f16: boolean): ModeloDisponible[] {
  return soporte_f16 ? MODELOS_F16 : MODELOS_F32;
}

/** @deprecated Usa obtener_modelos() en su lugar */
export const MODELOS_RECOMENDADOS = MODELOS_F32;

// ============================================================
// Prompt del sistema
// ============================================================

/**
 * Prompt del sistema que instruye al modelo sobre el DSL es-ldmd.
 * Incluye instrucciones estrictas de idioma español y contexto completo del DSL.
 */
const PROMPT_SISTEMA = `Eres un asistente especializado EXCLUSIVAMENTE en modelado de bases de datos usando el lenguaje DSL "es-ldmd" (Español - Lenguaje de Modelado de Diagramas).

## REGLAS ESTRICTAS

1. SOLO responde sobre el lenguaje es-ldmd y modelado de bases de datos.
2. Si te preguntan algo que NO sea sobre modelado de bases de datos o el lenguaje es-ldmd, responde: "Solo puedo ayudarte con modelado de bases de datos usando el lenguaje es-ldmd. Descríbeme las tablas o el sistema que necesitas y generaré el código."
3. Responde EXCLUSIVAMENTE en español. NUNCA uses inglés.
4. NUNCA generes código SQL (CREATE TABLE, ALTER TABLE, etc.). SIEMPRE genera código en el DSL es-ldmd.
5. Envuelve SIEMPRE el código DSL en bloques \`\`\`esldmd.
6. Usa SIEMPRE nombres en español para tablas y columnas.

## Sintaxis del DSL es-ldmd

### Definir tabla
\`\`\`esldmd
Tabla nombre_tabla {
    columna1 tipo_dato [incremento]
    columna2 tipo_dato [no nulo]
    columna3 tipo_dato [no nulo, nota: 'descripción de la columna']
    columna4 tipo_dato [no nulo, por_defecto: \`NOW()\`]

    indices {
        columna1
        columna2
    }

    primaria {
        columna1
    }

    foranea {
        columna2 tabla_referencia(columna_referencia)
        columna3 tabla_referencia(columna_referencia) [eliminación en cascada]
        columna4 tabla_referencia(columna_referencia) [eliminación en cascada, actualización en cascada]
    }

    Nota: 'Descripción de la tabla'
}
\`\`\`

### Tabla con schema
\`\`\`esldmd
Tabla esquema.nombre_tabla {
    columna1 tipo_dato
    foranea {
        columna1 esquema.otra_tabla(columna_ref)
    }
}
\`\`\`

### Tipos de datos disponibles (SOLO estos son válidos)

Tipos simples:
- entero → INTEGER
- texto → TEXT
- fecha → DATE
- lógico (alias: logico, log) → BOOLEAN
- decimal → DECIMAL
- entero_grande → BIGINT
- entero_pequeño → SMALLINT
- flotante → FLOAT
- fecha_hora → TIMESTAMP
- hora → TIME
- fecha_hora_zona → TIMESTAMPTZ
- json → JSON
- jsonb → JSONB
- uuid → UUID

Tipos parametrizados:
- texto(n) → VARCHAR(n) — ejemplo: texto(100), texto(255)
- caracter(n) → CHAR(n) — ejemplo: caracter(2)

Tipos especiales:
- enum('valor1', 'valor2', 'valor3')
- listado(tipo) — arreglo, ejemplo: listado(entero), listado(texto)
- mapa(clave, valor) — se convierte a JSON

IMPORTANTE: No inventes tipos que no estén en esta lista. No uses: varchar, int, boolean, timestamp, bigint, serial, ni ningún tipo en inglés. Tampoco uses tipos como binario, doble, texto_largo, texto_medio, dinero, xml, serie, serie_grande — estos no existen en el DSL.

### Opciones de columna (entre corchetes)
- [no nulo] — la columna no acepta valores nulos
- [incremento] — auto-incremento. En PostgreSQL convierte entero a SERIAL, entero_grande a BIGSERIAL, entero_pequeño a SMALLSERIAL. En MariaDB agrega AUTO_INCREMENT.
- [por_defecto: \`expresión\`] — valor por defecto. La expresión SQL entre backticks se pasa literalmente. Ejemplos: [por_defecto: \`0\`], [por_defecto: \`true\`], [por_defecto: \`NOW()\`], [por_defecto: \`gen_random_uuid()\`]
- [nota: 'texto descriptivo'] — agrega una nota a la columna
- Se pueden combinar: [no nulo, incremento, por_defecto: \`NOW()\`, nota: 'descripción']

### Opciones de foránea (entre corchetes)
- [eliminación en cascada] — borrado en cascada
- [actualización en cascada] — actualización en cascada
- Se pueden combinar: [eliminación en cascada, actualización en cascada]

### Llave primaria (bloque dentro de la tabla)
\`\`\`esldmd
primaria {
    columna1
}
\`\`\`

Llave primaria compuesta:
\`\`\`esldmd
primaria {
    columna1
    columna2
}
\`\`\`

### Índices (bloque dentro de la tabla)
\`\`\`esldmd
indices {
    columna1
    columna2
}
\`\`\`

### Grupos (agrupan tablas visualmente en el diagrama)
\`\`\`esldmd
Grupo nombre_grupo {
    tabla1
    tabla2
}
\`\`\`

### Comentarios
\`\`\`esldmd
// Este es un comentario de línea
\`\`\`

## Ejemplo completo

\`\`\`esldmd
// Sistema de gestión de una tienda en línea

Tabla usuarios {
    id entero [incremento]
    nombre texto(100) [no nulo]
    correo texto(255) [no nulo, nota: 'Correo electrónico único del usuario']
    contrasena texto(255) [no nulo]
    fecha_registro fecha_hora [no nulo, por_defecto: \`NOW()\`]
    activo lógico [por_defecto: \`true\`]

    indices {
        correo
    }

    primaria {
        id
    }

    Nota: 'Tabla principal de usuarios del sistema'
}

Tabla categorias {
    id entero [incremento]
    nombre texto(50) [no nulo]
    descripcion texto

    primaria {
        id
    }
}

Tabla productos {
    id entero [incremento]
    nombre texto(200) [no nulo]
    descripcion texto
    precio decimal [no nulo]
    stock entero [no nulo, por_defecto: \`0\`]
    categoria_id entero [no nulo]
    fecha_creacion fecha_hora [por_defecto: \`NOW()\`]

    indices {
        nombre
        categoria_id
    }

    primaria {
        id
    }

    foranea {
        categoria_id categorias(id) [eliminación en cascada]
    }

    Nota: 'Catálogo de productos disponibles'
}

Tabla pedidos {
    id entero [incremento]
    usuario_id entero [no nulo]
    fecha fecha_hora [no nulo, por_defecto: \`NOW()\`]
    total decimal [no nulo]
    estado texto(20) [por_defecto: \`'pendiente'\`]

    indices {
        usuario_id
        fecha
    }

    primaria {
        id
    }

    foranea {
        usuario_id usuarios(id)
    }
}

Tabla detalle_pedidos {
    pedido_id entero [no nulo]
    producto_id entero [no nulo]
    cantidad entero [no nulo]
    precio_unitario decimal [no nulo]

    indices {
        pedido_id
        producto_id
    }

    primaria {
        pedido_id
        producto_id
    }

    foranea {
        pedido_id pedidos(id) [eliminación en cascada, actualización en cascada]
        producto_id productos(id)
    }
}

Grupo tienda {
    productos
    categorias
}

Grupo ventas {
    pedidos
    detalle_pedidos
}
\`\`\`

Cuando el usuario describa un sistema o diagrama, genera el código DSL es-ldmd correspondiente. Responde siempre en español y usa únicamente la sintaxis y tipos documentados arriba. NUNCA generes SQL ni uses tipos en inglés.`;

// ============================================================
// Clase MotorIA
// ============================================================

/**
 * Motor de IA local que gestiona la carga de modelos web-llm
 * y la generación de respuestas para el chat.
 */
export class MotorIA {
  /** Instancia del motor web-llm */
  private motor: MLCEngineInterface | null = null;
  /** Estado actual */
  private _estado: EstadoMotorIA = 'sin_iniciar';
  /** ID del modelo cargado */
  private _modelo_id: string | null = null;
  /** Historial de mensajes del chat */
  private _historial: MensajeChat[] = [];
  /** Callback de cambio de estado */
  private al_cambiar_estado: ((estado: EstadoMotorIA) => void) | null = null;
  /** Callback de progreso */
  private al_progresar: CallbackProgresoCarga | null = null;
  /** Resultado de soporte WebGPU */
  private _soporte: SoporteWebGPU = { webgpu: false, shader_f16: false };

  /**
   * Obtiene el estado actual del motor.
   */
  get estado(): EstadoMotorIA {
    return this._estado;
  }

  /**
   * Obtiene el ID del modelo cargado.
   */
  get modelo_id(): string | null {
    return this._modelo_id;
  }

  /**
   * Obtiene el historial del chat.
   */
  get historial(): MensajeChat[] {
    return [...this._historial];
  }

  /**
   * Obtiene el resultado de soporte WebGPU.
   */
  get soporte(): SoporteWebGPU {
    return { ...this._soporte };
  }

  /**
   * Registra un callback para cambios de estado.
   *
   * @param {(estado: EstadoMotorIA) => void} callback - Callback de cambio de estado
   */
  registrar_cambio_estado(callback: (estado: EstadoMotorIA) => void): void {
    this.al_cambiar_estado = callback;
  }

  /**
   * Registra un callback para progreso de carga.
   *
   * @param {CallbackProgresoCarga} callback - Callback de progreso
   */
  registrar_progreso(callback: CallbackProgresoCarga): void {
    this.al_progresar = callback;
  }

  /**
   * Cambia el estado interno y notifica.
   */
  private cambiar_estado(nuevo_estado: EstadoMotorIA): void {
    this._estado = nuevo_estado;
    this.al_cambiar_estado?.(nuevo_estado);
  }

  /**
   * Verifica el soporte de WebGPU y la extensión shader-f16.
   *
   * @returns {Promise<SoporteWebGPU>} Resultado de soporte
   */
  async verificar_soporte(): Promise<SoporteWebGPU> {
    if (typeof navigator === 'undefined') return { webgpu: false, shader_f16: false };
    if (!('gpu' in navigator)) return { webgpu: false, shader_f16: false };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gpu = (navigator as any).gpu;
      const adaptador = await gpu.requestAdapter();
      if (!adaptador) return { webgpu: false, shader_f16: false };

      const shader_f16 = adaptador.features?.has('shader-f16') ?? false;
      this._soporte = { webgpu: true, shader_f16 };
      return this._soporte;
    } catch {
      return { webgpu: false, shader_f16: false };
    }
  }

  /**
   * Carga un modelo de IA en el navegador.
   * Descarga el modelo si no está en cache y lo inicializa.
   *
   * @param {string} modelo_id - ID del modelo a cargar
   * @throws {Error} Si el navegador no soporta WebGPU o falla la carga
   */
  async cargar_modelo(modelo_id: string): Promise<void> {
    this.cambiar_estado('verificando_soporte');

    const soporte = await this.verificar_soporte();
    if (!soporte.webgpu) {
      this.cambiar_estado('error');
      throw new Error(
        'Tu navegador no soporta WebGPU. Usa Chrome 113+ o Edge 113+ para usar la IA local.',
      );
    }

    this.cambiar_estado('descargando');

    try {
      // Importar web-llm dinámicamente para evitar problemas de SSR
      const webllm = await import('@mlc-ai/web-llm');

      const callback_progreso = (informe: InitProgressReport) => {
        this.al_progresar?.({
          progreso: informe.progress,
          texto: informe.text,
          tiempo_transcurrido: informe.timeElapsed,
        });
      };

      this.motor = await webllm.CreateMLCEngine(modelo_id, {
        initProgressCallback: callback_progreso,
      });

      this._modelo_id = modelo_id;
      this._historial = [];
      this.cambiar_estado('listo');
    } catch (error) {
      this.cambiar_estado('error');
      const mensaje = error instanceof Error ? error.message : 'Error desconocido al cargar el modelo';
      throw new Error(`Error al cargar el modelo: ${mensaje}`);
    }
  }

  /**
   * Envía un mensaje al chat y obtiene la respuesta.
   * Usa streaming para devolver la respuesta progresivamente.
   *
   * @param {string} mensaje - Mensaje del usuario
   * @param {(fragmento: string) => void} al_fragmento - Callback para cada fragmento de respuesta
   * @returns {Promise<string>} Respuesta completa del asistente
   * @throws {Error} Si el motor no está listo
   */
  async enviar_mensaje(
    mensaje: string,
    al_fragmento?: (fragmento: string) => void,
  ): Promise<string> {
    if (!this.motor || this._estado !== 'listo') {
      throw new Error('El motor de IA no está listo. Carga un modelo primero.');
    }

    // Agregar mensaje del usuario al historial
    this._historial.push({
      rol: 'usuario',
      contenido: mensaje,
      fecha: new Date().toISOString(),
    });

    this.cambiar_estado('generando');

    try {
      // Construir mensajes para web-llm (formato OpenAI)
      const mensajes: ChatCompletionMessageParam[] = [
        { role: 'system', content: PROMPT_SISTEMA },
        ...this._historial.map((m) => ({
          role: m.rol === 'usuario' ? 'user' as const : m.rol === 'asistente' ? 'assistant' as const : 'system' as const,
          content: m.contenido,
        })),
      ];

      let respuesta_completa = '';

      // Usar streaming para respuesta progresiva
      const stream = await this.motor.chatCompletion({
        messages: mensajes,
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      });

      for await (const fragmento of stream) {
        const delta = fragmento.choices[0]?.delta?.content ?? '';
        if (delta) {
          respuesta_completa += delta;
          al_fragmento?.(respuesta_completa);
        }
      }

      // Agregar respuesta al historial
      this._historial.push({
        rol: 'asistente',
        contenido: respuesta_completa,
        fecha: new Date().toISOString(),
      });

      this.cambiar_estado('listo');
      return respuesta_completa;
    } catch (error) {
      this.cambiar_estado('listo');
      const mensaje_error = error instanceof Error ? error.message : 'Error al generar respuesta';
      throw new Error(mensaje_error);
    }
  }

  /**
   * Interrumpe la generación actual.
   */
  async interrumpir(): Promise<void> {
    if (this.motor && this._estado === 'generando') {
      await this.motor.interruptGenerate();
      this.cambiar_estado('listo');
    }
  }

  /**
   * Limpia el historial del chat.
   */
  async limpiar_historial(): Promise<void> {
    this._historial = [];
    if (this.motor) {
      await this.motor.resetChat();
    }
  }

  /**
   * Descarga el motor y libera recursos.
   */
  async descargar(): Promise<void> {
    if (this.motor) {
      await this.motor.unload();
      this.motor = null;
      this._modelo_id = null;
      this._historial = [];
      this.cambiar_estado('sin_iniciar');
    }
  }

  /**
   * Elimina el modelo descargado de la caché local del navegador.
   * Borra tanto la Cache API como IndexedDB usados por web-llm.
   */
  async eliminar_modelo_local(): Promise<void> {
    const modelo_a_borrar = this._modelo_id;

    // Primero descargar el motor
    await this.descargar();

    if (typeof caches === 'undefined') return;

    try {
      // web-llm almacena los modelos en la Cache API
      const nombres_cache = await caches.keys();
      for (const nombre of nombres_cache) {
        // Borrar caches que contengan el nombre del modelo o caches de webllm
        if (
          (modelo_a_borrar && nombre.includes(modelo_a_borrar)) ||
          nombre.includes('webllm') ||
          nombre.includes('mlc')
        ) {
          await caches.delete(nombre);
        }
      }
    } catch {
      // Ignorar errores de limpieza de cache
    }

    try {
      // Limpiar IndexedDB usado por web-llm
      const bases = await indexedDB.databases();
      for (const base of bases) {
        if (
          base.name &&
          (base.name.includes('webllm') ||
            base.name.includes('mlc') ||
            base.name.includes('tvmjs'))
        ) {
          indexedDB.deleteDatabase(base.name);
        }
      }
    } catch {
      // Ignorar errores de limpieza de IndexedDB
    }
  }
}

/**
 * Instancia singleton del motor de IA.
 * Se usa una instancia compartida para evitar múltiples cargas del modelo.
 */
let instancia_motor: MotorIA | null = null;

/**
 * Obtiene la instancia singleton del motor de IA.
 *
 * @returns {MotorIA} Instancia del motor de IA
 */
export function obtener_motor_ia(): MotorIA {
  if (!instancia_motor) {
    instancia_motor = new MotorIA();
  }
  return instancia_motor;
}
