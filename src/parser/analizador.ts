/**
 * @archivo analizador.ts
 * @descripcion Analizador (parser) del lenguaje es-ldmd.
 * Convierte una secuencia de tokens en un AST (Árbol de Sintaxis Abstracta).
 * Utiliza descenso recursivo con tolerancia a errores.
 */

import {
  Token,
  TipoToken,
  DocumentoAST,
  TablaAST,
  ColumnaAST,
  IndiceAST,
  PrimariaAST,
  ForaneaAST,
  ReferenciaForanea,
  GrupoAST,
  OpcionColumna,
  OpcionForanea,
  Diagnostico,
  Severidad,
  Posicion,
  Rango,
} from '@/dominio/tipos';

/**
 * Clase Analizador: convierte tokens del DSL es-ldmd en un AST.
 *
 * Implementa un parser de descenso recursivo tolerante a errores.
 * Cuando encuentra un error, lo registra como diagnóstico y
 * continúa el análisis lo mejor posible.
 */
export class Analizador {
  /** Lista de tokens a analizar */
  private tokens: Token[];
  /** Posición actual en la lista de tokens */
  private posicion: number;
  /** Lista de diagnósticos acumulados */
  private diagnosticos: Diagnostico[];

  /**
   * Crea una nueva instancia del analizador.
   *
   * @param {Token[]} tokens - Lista de tokens producidos por el tokenizador
   */
  constructor(tokens: Token[]) {
    // Filtrar comentarios para simplificar el parsing
    this.tokens = tokens.filter((t) => t.tipo !== TipoToken.COMENTARIO);
    this.posicion = 0;
    this.diagnosticos = [];
  }

  /**
   * Analiza todos los tokens y produce el documento AST.
   *
   * @returns {{ ast: DocumentoAST; diagnosticos: Diagnostico[] }} AST y diagnósticos
   */
  analizar(): { ast: DocumentoAST; diagnosticos: Diagnostico[] } {
    const tablas: TablaAST[] = [];
    const grupos: GrupoAST[] = [];

    while (!this.es_fin()) {
      const token = this.token_actual();

      if (token.tipo === TipoToken.TABLA) {
        const tabla = this.analizar_tabla();
        if (tabla) tablas.push(tabla);
      } else if (token.tipo === TipoToken.GRUPO) {
        const grupo = this.analizar_grupo();
        if (grupo) grupos.push(grupo);
      } else {
        this.reportar_error(
          `Se esperaba 'Tabla' o 'Grupo', pero se encontró '${token.valor}'`,
          token.posicion,
        );
        this.avanzar();
      }
    }

    return {
      ast: { tablas, grupos },
      diagnosticos: this.diagnosticos,
    };
  }

  // ============================================================
  // Análisis de Tablas
  // ============================================================

  /**
   * Analiza una declaración de tabla completa.
   *
   * Sintaxis:
   * ```
   * Tabla [esquema.]nombre_tabla {
   *     columnas...
   *     indices { ... }
   *     primaria { ... }
   *     foranea { ... }
   *     Nota: 'texto'
   * }
   * ```
   *
   * @returns {TablaAST | null} Tabla analizada o null si hubo error irrecuperable
   */
  private analizar_tabla(): TablaAST | null {
    const posicion_inicio = this.token_actual().posicion;

    // Consumir 'Tabla'
    this.consumir(TipoToken.TABLA);

    // Leer nombre (posiblemente con esquema)
    const { esquema, nombre } = this.leer_nombre_con_esquema();

    if (!nombre) {
      this.reportar_error('Se esperaba el nombre de la tabla', this.token_actual().posicion);
      this.recuperar_hasta_llave_cerrada();
      return null;
    }

    // Consumir '{'
    if (!this.esperar(TipoToken.LLAVE_ABIERTA, "Se esperaba '{' después del nombre de la tabla")) {
      this.recuperar_hasta_llave_cerrada();
      return null;
    }

    const columnas: ColumnaAST[] = [];
    let indices: IndiceAST | null = null;
    let primaria: PrimariaAST | null = null;
    let foranea: ForaneaAST | null = null;
    let nota: string | null = null;

    // Leer contenido de la tabla
    while (!this.es_fin() && !this.verificar(TipoToken.LLAVE_CERRADA)) {
      const token = this.token_actual();

      if (token.tipo === TipoToken.INDICES) {
        if (indices) {
          this.reportar_error('Ya se definió un bloque de índices en esta tabla', token.posicion);
        }
        indices = this.analizar_bloque_indices();
      } else if (token.tipo === TipoToken.PRIMARIA) {
        if (primaria) {
          this.reportar_error('Ya se definió un bloque de llave primaria en esta tabla', token.posicion);
        }
        primaria = this.analizar_bloque_primaria();
      } else if (token.tipo === TipoToken.FORANEA) {
        if (foranea) {
          this.reportar_error('Ya se definió un bloque de llaves foráneas en esta tabla', token.posicion);
        }
        foranea = this.analizar_bloque_foranea();
      } else if (token.tipo === TipoToken.NOTA && this.ver_siguiente_tipo() === TipoToken.DOS_PUNTOS) {
        nota = this.analizar_nota();
      } else if (token.tipo === TipoToken.IDENTIFICADOR) {
        const columna = this.analizar_columna();
        if (columna) columnas.push(columna);
      } else if (token.tipo === TipoToken.TABLA || token.tipo === TipoToken.GRUPO) {
        // Parece que falta cerrar la tabla
        this.reportar_error("Se esperaba '}' para cerrar la tabla", token.posicion);
        break;
      } else {
        this.reportar_error(`Token inesperado '${token.valor}' dentro de la tabla`, token.posicion);
        this.avanzar();
      }
    }

    const posicion_fin = this.token_actual().posicion;

    // Consumir '}'
    if (this.verificar(TipoToken.LLAVE_CERRADA)) {
      this.avanzar();
    } else {
      this.reportar_error("Se esperaba '}' para cerrar la tabla", this.token_actual().posicion);
    }

    return {
      nombre,
      esquema,
      columnas,
      indices,
      primaria,
      foranea,
      nota,
      rango: {
        inicio: posicion_inicio,
        fin: posicion_fin,
      },
    };
  }

  // ============================================================
  // Análisis de Columnas
  // ============================================================

  /**
   * Analiza una definición de columna.
   *
   * Sintaxis: `nombre_columna tipo_dato [opciones]`
   *
   * @returns {ColumnaAST | null} Columna analizada o null si hubo error
   */
  private analizar_columna(): ColumnaAST | null {
    const posicion_inicio = this.token_actual().posicion;
    const nombre = this.token_actual().valor;
    this.avanzar(); // Consumir nombre de columna

    // Leer tipo de dato
    if (this.es_fin() || this.verificar(TipoToken.LLAVE_CERRADA)) {
      this.reportar_error(`Se esperaba el tipo de dato para la columna '${nombre}'`, this.token_actual().posicion);
      return null;
    }

    const { tipo, parametros } = this.leer_tipo_dato();

    // Leer opciones entre corchetes (opcional)
    const opciones = this.verificar(TipoToken.CORCHETE_ABIERTO)
      ? this.analizar_opciones_columna()
      : { no_nulo: false, incremento: false, nota: null, valor_defecto: null };

    const posicion_fin = this.posicion > 0
      ? this.tokens[this.posicion - 1].posicion
      : posicion_inicio;

    return {
      nombre,
      tipo,
      parametros_tipo: parametros,
      opciones,
      rango: {
        inicio: posicion_inicio,
        fin: posicion_fin,
      },
    };
  }

  /**
   * Lee un tipo de dato, incluyendo parámetros.
   * Soporta: tipo, tipo(n), tipo(a, b), listado(tipo), mapa(tipo, tipo), enum('v1', 'v2')
   *
   * @returns {{ tipo: string; parametros: string[] }} Tipo y sus parámetros
   */
  private leer_tipo_dato(): { tipo: string; parametros: string[] } {
    let tipo = '';
    const parametros: string[] = [];

    // Leer nombre del tipo
    if (this.verificar(TipoToken.IDENTIFICADOR) || this.es_tipo_conocido()) {
      tipo = this.token_actual().valor;
      this.avanzar();
    } else {
      tipo = this.token_actual().valor;
      this.avanzar();
    }

    // Leer parámetros entre paréntesis (si existen)
    if (this.verificar(TipoToken.PARENTESIS_ABIERTO)) {
      this.avanzar(); // Consumir '('

      while (!this.es_fin() && !this.verificar(TipoToken.PARENTESIS_CERRADO)) {
        if (this.verificar(TipoToken.COMA)) {
          this.avanzar();
          continue;
        }

        if (this.verificar(TipoToken.CADENA)) {
          parametros.push(`'${this.token_actual().valor}'`);
        } else {
          parametros.push(this.token_actual().valor);
        }
        this.avanzar();
      }

      if (this.verificar(TipoToken.PARENTESIS_CERRADO)) {
        this.avanzar(); // Consumir ')'
      }
    }

    return { tipo, parametros };
  }

  /**
   * Analiza opciones de columna entre corchetes.
   *
   * Sintaxis: `[no nulo, incremento, nota: 'texto', por_defecto: \`expresión\`]`
   *
   * @returns {OpcionColumna} Opciones de la columna
   */
  private analizar_opciones_columna(): OpcionColumna {
    const opciones: OpcionColumna = { no_nulo: false, incremento: false, nota: null, valor_defecto: null };

    this.avanzar(); // Consumir '['

    while (!this.es_fin() && !this.verificar(TipoToken.CORCHETE_CERRADO)) {
      if (this.verificar(TipoToken.NO_NULO)) {
        opciones.no_nulo = true;
        this.avanzar();
      } else if (this.verificar(TipoToken.INCREMENTO)) {
        opciones.incremento = true;
        this.avanzar();
      } else if (this.verificar(TipoToken.NOTA) && this.ver_siguiente_tipo() === TipoToken.DOS_PUNTOS) {
        this.avanzar(); // Consumir 'nota'
        this.avanzar(); // Consumir ':'
        if (this.verificar(TipoToken.CADENA)) {
          opciones.nota = this.token_actual().valor;
          this.avanzar();
        }
      } else if (this.verificar(TipoToken.POR_DEFECTO) && this.ver_siguiente_tipo() === TipoToken.DOS_PUNTOS) {
        this.avanzar(); // Consumir 'por_defecto'
        this.avanzar(); // Consumir ':'
        if (this.verificar(TipoToken.EXPRESION)) {
          opciones.valor_defecto = this.token_actual().valor;
          this.avanzar();
        }
      } else if (this.verificar(TipoToken.COMA)) {
        this.avanzar();
      } else {
        // Token inesperado en opciones, avanzar
        this.avanzar();
      }
    }

    if (this.verificar(TipoToken.CORCHETE_CERRADO)) {
      this.avanzar(); // Consumir ']'
    }

    return opciones;
  }

  // ============================================================
  // Análisis de Bloques Internos
  // ============================================================

  /**
   * Analiza un bloque de índices.
   *
   * Sintaxis: `indices { col1 col2 ... }`
   *
   * @returns {IndiceAST | null} Índices analizados o null
   */
  private analizar_bloque_indices(): IndiceAST | null {
    const posicion_inicio = this.token_actual().posicion;
    this.avanzar(); // Consumir 'indices'

    if (!this.esperar(TipoToken.LLAVE_ABIERTA, "Se esperaba '{' después de 'indices'")) {
      return null;
    }

    const columnas: string[] = [];

    while (!this.es_fin() && !this.verificar(TipoToken.LLAVE_CERRADA)) {
      if (this.verificar(TipoToken.IDENTIFICADOR)) {
        columnas.push(this.token_actual().valor);
        this.avanzar();
      } else {
        this.reportar_error(
          `Se esperaba un nombre de columna en el bloque de índices, pero se encontró '${this.token_actual().valor}'`,
          this.token_actual().posicion,
        );
        this.avanzar();
      }
    }

    const posicion_fin = this.token_actual().posicion;

    if (this.verificar(TipoToken.LLAVE_CERRADA)) {
      this.avanzar();
    }

    return {
      columnas,
      rango: { inicio: posicion_inicio, fin: posicion_fin },
    };
  }

  /**
   * Analiza un bloque de llave primaria.
   *
   * Sintaxis: `primaria { col1 col2 ... }`
   *
   * @returns {PrimariaAST | null} Llave primaria analizada o null
   */
  private analizar_bloque_primaria(): PrimariaAST | null {
    const posicion_inicio = this.token_actual().posicion;
    this.avanzar(); // Consumir 'primaria'

    if (!this.esperar(TipoToken.LLAVE_ABIERTA, "Se esperaba '{' después de 'primaria'")) {
      return null;
    }

    const columnas: string[] = [];

    while (!this.es_fin() && !this.verificar(TipoToken.LLAVE_CERRADA)) {
      if (this.verificar(TipoToken.IDENTIFICADOR)) {
        columnas.push(this.token_actual().valor);
        this.avanzar();
      } else {
        this.reportar_error(
          `Se esperaba un nombre de columna en el bloque de llave primaria`,
          this.token_actual().posicion,
        );
        this.avanzar();
      }
    }

    const posicion_fin = this.token_actual().posicion;

    if (this.verificar(TipoToken.LLAVE_CERRADA)) {
      this.avanzar();
    }

    return {
      columnas,
      rango: { inicio: posicion_inicio, fin: posicion_fin },
    };
  }

  /**
   * Analiza un bloque de llaves foráneas.
   *
   * Sintaxis:
   * ```
   * foranea {
   *     columna [esquema.]tabla_ref(col1, col2) [eliminación en cascada, actualización en cascada]
   * }
   * ```
   *
   * @returns {ForaneaAST | null} Llaves foráneas analizadas o null
   */
  private analizar_bloque_foranea(): ForaneaAST | null {
    const posicion_inicio = this.token_actual().posicion;
    this.avanzar(); // Consumir 'foranea'

    if (!this.esperar(TipoToken.LLAVE_ABIERTA, "Se esperaba '{' después de 'foranea'")) {
      return null;
    }

    const referencias: ReferenciaForanea[] = [];

    while (!this.es_fin() && !this.verificar(TipoToken.LLAVE_CERRADA)) {
      if (this.verificar(TipoToken.IDENTIFICADOR)) {
        const referencia = this.analizar_referencia_foranea();
        if (referencia) referencias.push(referencia);
      } else {
        this.reportar_error(
          `Se esperaba una referencia foránea en el bloque foranea`,
          this.token_actual().posicion,
        );
        this.avanzar();
      }
    }

    const posicion_fin = this.token_actual().posicion;

    if (this.verificar(TipoToken.LLAVE_CERRADA)) {
      this.avanzar();
    }

    return {
      referencias,
      rango: { inicio: posicion_inicio, fin: posicion_fin },
    };
  }

  /**
   * Analiza una referencia foránea individual.
   *
   * Sintaxis: `columna_local [esquema.]tabla_ref(col_ref1, col_ref2) [opciones]`
   *
   * @returns {ReferenciaForanea | null} Referencia foránea analizada o null
   */
  private analizar_referencia_foranea(): ReferenciaForanea | null {
    const posicion_inicio = this.token_actual().posicion;

    // Leer columna local
    const columna_local = this.token_actual().valor;
    this.avanzar();

    // Leer tabla referenciada (posiblemente con esquema)
    const { esquema, nombre: tabla_referencia } = this.leer_nombre_con_esquema();

    if (!tabla_referencia) {
      this.reportar_error('Se esperaba el nombre de la tabla referenciada', this.token_actual().posicion);
      return null;
    }

    // Leer columnas referenciadas entre paréntesis
    const columnas_referencia: string[] = [];

    if (this.verificar(TipoToken.PARENTESIS_ABIERTO)) {
      this.avanzar(); // Consumir '('

      while (!this.es_fin() && !this.verificar(TipoToken.PARENTESIS_CERRADO)) {
        if (this.verificar(TipoToken.COMA)) {
          this.avanzar();
          continue;
        }

        if (this.verificar(TipoToken.IDENTIFICADOR)) {
          columnas_referencia.push(this.token_actual().valor);
          this.avanzar();
        } else {
          this.reportar_error(
            'Se esperaba un nombre de columna referenciada',
            this.token_actual().posicion,
          );
          this.avanzar();
        }
      }

      if (this.verificar(TipoToken.PARENTESIS_CERRADO)) {
        this.avanzar(); // Consumir ')'
      }
    } else {
      this.reportar_error(
        "Se esperaba '(' con las columnas referenciadas",
        this.token_actual().posicion,
      );
    }

    // Leer opciones de cascada (opcional)
    const opciones = this.verificar(TipoToken.CORCHETE_ABIERTO)
      ? this.analizar_opciones_foranea()
      : { eliminacion_cascada: false, actualizacion_cascada: false };

    const posicion_fin = this.posicion > 0
      ? this.tokens[this.posicion - 1].posicion
      : posicion_inicio;

    return {
      columna_local,
      esquema_referencia: esquema,
      tabla_referencia,
      columnas_referencia,
      opciones,
      rango: { inicio: posicion_inicio, fin: posicion_fin },
    };
  }

  /**
   * Analiza opciones de foránea entre corchetes.
   *
   * Sintaxis: `[eliminación en cascada, actualización en cascada]`
   *
   * @returns {OpcionForanea} Opciones de la foránea
   */
  private analizar_opciones_foranea(): OpcionForanea {
    const opciones: OpcionForanea = { eliminacion_cascada: false, actualizacion_cascada: false };

    this.avanzar(); // Consumir '['

    while (!this.es_fin() && !this.verificar(TipoToken.CORCHETE_CERRADO)) {
      if (this.verificar(TipoToken.ELIMINACION_CASCADA)) {
        opciones.eliminacion_cascada = true;
        this.avanzar();
      } else if (this.verificar(TipoToken.ACTUALIZACION_CASCADA)) {
        opciones.actualizacion_cascada = true;
        this.avanzar();
      } else if (this.verificar(TipoToken.COMA)) {
        this.avanzar();
      } else {
        this.avanzar();
      }
    }

    if (this.verificar(TipoToken.CORCHETE_CERRADO)) {
      this.avanzar(); // Consumir ']'
    }

    return opciones;
  }

  /**
   * Analiza una nota de tabla.
   *
   * Sintaxis: `Nota: 'texto de la nota'`
   *
   * @returns {string | null} Texto de la nota o null
   */
  private analizar_nota(): string | null {
    this.avanzar(); // Consumir 'Nota'
    this.avanzar(); // Consumir ':'

    if (this.verificar(TipoToken.CADENA)) {
      const nota = this.token_actual().valor;
      this.avanzar();
      return nota;
    }

    this.reportar_error("Se esperaba una cadena de texto para la nota", this.token_actual().posicion);
    return null;
  }

  // ============================================================
  // Análisis de Grupos
  // ============================================================

  /**
   * Analiza una declaración de grupo.
   *
   * Sintaxis: `Grupo nombre_grupo { tabla1 tabla2 ... }`
   *
   * @returns {GrupoAST | null} Grupo analizado o null
   */
  private analizar_grupo(): GrupoAST | null {
    const posicion_inicio = this.token_actual().posicion;

    this.avanzar(); // Consumir 'Grupo'

    // Leer nombre del grupo
    if (!this.verificar(TipoToken.IDENTIFICADOR)) {
      this.reportar_error('Se esperaba el nombre del grupo', this.token_actual().posicion);
      this.recuperar_hasta_llave_cerrada();
      return null;
    }

    const nombre = this.token_actual().valor;
    this.avanzar();

    if (!this.esperar(TipoToken.LLAVE_ABIERTA, "Se esperaba '{' después del nombre del grupo")) {
      this.recuperar_hasta_llave_cerrada();
      return null;
    }

    const tablas: string[] = [];

    while (!this.es_fin() && !this.verificar(TipoToken.LLAVE_CERRADA)) {
      if (this.verificar(TipoToken.IDENTIFICADOR)) {
        tablas.push(this.token_actual().valor);
        this.avanzar();
      } else {
        this.reportar_error(
          `Se esperaba un nombre de tabla en el grupo '${nombre}'`,
          this.token_actual().posicion,
        );
        this.avanzar();
      }
    }

    const posicion_fin = this.token_actual().posicion;

    if (this.verificar(TipoToken.LLAVE_CERRADA)) {
      this.avanzar();
    }

    return {
      nombre,
      tablas,
      rango: { inicio: posicion_inicio, fin: posicion_fin },
    };
  }

  // ============================================================
  // Utilidades del Parser
  // ============================================================

  /**
   * Lee un nombre que puede incluir esquema (esquema.nombre).
   *
   * @returns {{ esquema: string | null; nombre: string | null }} Esquema y nombre
   */
  private leer_nombre_con_esquema(): { esquema: string | null; nombre: string | null } {
    if (!this.verificar(TipoToken.IDENTIFICADOR)) {
      return { esquema: null, nombre: null };
    }

    const primera_parte = this.token_actual().valor;
    this.avanzar();

    // Verificar si hay un punto (esquema.nombre)
    if (this.verificar(TipoToken.PUNTO)) {
      this.avanzar(); // Consumir '.'

      if (this.verificar(TipoToken.IDENTIFICADOR)) {
        const segunda_parte = this.token_actual().valor;
        this.avanzar();
        return { esquema: primera_parte, nombre: segunda_parte };
      } else {
        this.reportar_error(
          'Se esperaba un nombre después del punto en el esquema',
          this.token_actual().posicion,
        );
        return { esquema: primera_parte, nombre: null };
      }
    }

    return { esquema: null, nombre: primera_parte };
  }

  /**
   * Retorna el token actual sin consumirlo.
   * @returns {Token} Token actual
   */
  private token_actual(): Token {
    if (this.posicion >= this.tokens.length) {
      return {
        tipo: TipoToken.FIN_DE_ARCHIVO,
        valor: '',
        posicion: this.tokens.length > 0
          ? this.tokens[this.tokens.length - 1].posicion
          : { linea: 1, columna: 1 },
      };
    }
    return this.tokens[this.posicion];
  }

  /**
   * Avanza al siguiente token.
   */
  private avanzar(): void {
    if (this.posicion < this.tokens.length) {
      this.posicion++;
    }
  }

  /**
   * Verifica si el token actual es del tipo dado.
   * @param {TipoToken} tipo - Tipo esperado
   * @returns {boolean} True si coincide
   */
  private verificar(tipo: TipoToken): boolean {
    return this.token_actual().tipo === tipo;
  }

  /**
   * Retorna el tipo del siguiente token sin avanzar.
   * @returns {TipoToken} Tipo del siguiente token
   */
  private ver_siguiente_tipo(): TipoToken {
    if (this.posicion + 1 >= this.tokens.length) {
      return TipoToken.FIN_DE_ARCHIVO;
    }
    return this.tokens[this.posicion + 1].tipo;
  }

  /**
   * Indica si se alcanzó el fin de los tokens.
   * @returns {boolean} True si no hay más tokens
   */
  private es_fin(): boolean {
    return this.token_actual().tipo === TipoToken.FIN_DE_ARCHIVO;
  }

  /**
   * Consume un token del tipo esperado.
   * @param {TipoToken} tipo - Tipo esperado
   * @returns {Token} Token consumido
   */
  private consumir(tipo: TipoToken): Token {
    const token = this.token_actual();
    if (token.tipo === tipo) {
      this.avanzar();
    }
    return token;
  }

  /**
   * Espera un token del tipo dado. Si no coincide, reporta un error.
   * @param {TipoToken} tipo - Tipo esperado
   * @param {string} mensaje_error - Mensaje de error si no coincide
   * @returns {boolean} True si el token coincidió y fue consumido
   */
  private esperar(tipo: TipoToken, mensaje_error: string): boolean {
    if (this.verificar(tipo)) {
      this.avanzar();
      return true;
    }

    this.reportar_error(mensaje_error, this.token_actual().posicion);
    return false;
  }

  /**
   * Verifica si el token actual es un tipo de dato conocido.
   * @returns {boolean} True si es un tipo conocido
   */
  private es_tipo_conocido(): boolean {
    const token = this.token_actual();
    return token.tipo === TipoToken.IDENTIFICADOR;
  }

  /**
   * Reporta un error diagnóstico.
   * @param {string} mensaje - Mensaje del error
   * @param {Posicion} posicion - Posición del error
   */
  private reportar_error(mensaje: string, posicion: Posicion): void {
    this.diagnosticos.push({
      mensaje,
      severidad: Severidad.ERROR,
      rango: {
        inicio: posicion,
        fin: { linea: posicion.linea, columna: posicion.columna + 1 },
      },
    });
  }

  /**
   * Recuperación de error: avanza hasta encontrar una llave cerrada '}' o fin de archivo.
   * Esto permite continuar el análisis después de un error.
   */
  private recuperar_hasta_llave_cerrada(): void {
    let nivel = 0;
    while (!this.es_fin()) {
      if (this.verificar(TipoToken.LLAVE_ABIERTA)) {
        nivel++;
      } else if (this.verificar(TipoToken.LLAVE_CERRADA)) {
        if (nivel <= 0) {
          this.avanzar();
          return;
        }
        nivel--;
      }
      this.avanzar();
    }
  }
}

/**
 * Función de conveniencia para analizar una lista de tokens.
 *
 * @param {Token[]} tokens - Lista de tokens
 * @returns {{ ast: DocumentoAST; diagnosticos: Diagnostico[] }} AST y diagnósticos
 */
export function analizar(tokens: Token[]): { ast: DocumentoAST; diagnosticos: Diagnostico[] } {
  const analizador = new Analizador(tokens);
  return analizador.analizar();
}
