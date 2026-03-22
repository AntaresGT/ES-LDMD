/**
 * @archivo tokenizador.ts
 * @descripcion Tokenizador (lexer) del lenguaje es-ldmd.
 * Convierte texto fuente en una secuencia de tokens con posiciones exactas.
 */

import { Token, TipoToken, Posicion } from '@/dominio/tipos';

/**
 * Clase Tokenizador: convierte código fuente del DSL es-ldmd en tokens.
 *
 * Soporta:
 * - Palabras clave: Tabla, Grupo, Nota, indices, primaria, foranea
 * - Opciones: no nulo, incremento, eliminación en cascada, actualización en cascada
 * - Identificadores con caracteres en español (áéíóúñü)
 * - Cadenas entre comillas simples
 * - Números
 * - Comentarios de línea (//)
 * - Delimitadores: {, }, (, ), [, ], :, ,, .
 */
export class Tokenizador {
  /** Código fuente a tokenizar */
  private fuente: string;
  /** Posición actual en la cadena */
  private posicion: number;
  /** Línea actual (1-indexada) */
  private linea: number;
  /** Columna actual (1-indexada) */
  private columna: number;
  /** Lista de tokens producidos */
  private tokens: Token[];

  /**
   * Crea una nueva instancia del tokenizador.
   *
   * @param {string} fuente - Código fuente a tokenizar
   */
  constructor(fuente: string) {
    this.fuente = fuente;
    this.posicion = 0;
    this.linea = 1;
    this.columna = 1;
    this.tokens = [];
  }

  /**
   * Tokeniza todo el código fuente y retorna la lista de tokens.
   *
   * @returns {Token[]} Lista de tokens producidos
   */
  tokenizar(): Token[] {
    while (!this.es_fin()) {
      this.saltar_espacios_blancos();

      if (this.es_fin()) break;

      const caracter = this.caracter_actual();

      // Comentarios de línea
      if (caracter === '/' && this.ver_siguiente() === '/') {
        this.leer_comentario();
        continue;
      }

      // Cadenas entre comillas simples
      if (caracter === "'") {
        this.leer_cadena();
        continue;
      }

      // Expresiones entre backticks (para valores por defecto)
      if (caracter === '`') {
        this.leer_expresion();
        continue;
      }

      // Números
      if (this.es_digito(caracter)) {
        this.leer_numero();
        continue;
      }

      // Delimitadores
      if (this.es_delimitador(caracter)) {
        this.leer_delimitador();
        continue;
      }

      // Identificadores y palabras clave
      if (this.es_inicio_identificador(caracter)) {
        this.leer_identificador_o_palabra_clave();
        continue;
      }

      // Carácter desconocido
      this.agregar_token(TipoToken.DESCONOCIDO, caracter);
      this.avanzar();
    }

    // Token de fin de archivo
    this.agregar_token(TipoToken.FIN_DE_ARCHIVO, '');

    return this.tokens;
  }

  // ============================================================
  // Métodos de lectura de tokens
  // ============================================================

  /**
   * Lee un comentario de línea (//).
   */
  private leer_comentario(): void {
    const posicion_inicio = this.posicion_actual();
    let valor = '';

    // Consumir //
    valor += this.avanzar();
    valor += this.avanzar();

    // Consumir hasta fin de línea
    while (!this.es_fin() && this.caracter_actual() !== '\n') {
      valor += this.avanzar();
    }

    this.tokens.push({
      tipo: TipoToken.COMENTARIO,
      valor: valor.trim(),
      posicion: posicion_inicio,
    });
  }

  /**
   * Lee una cadena entre comillas simples.
   */
  private leer_cadena(): void {
    const posicion_inicio = this.posicion_actual();
    let valor = '';

    // Consumir comilla de apertura
    this.avanzar();

    // Leer contenido
    while (!this.es_fin() && this.caracter_actual() !== "'") {
      valor += this.avanzar();
    }

    // Consumir comilla de cierre (si existe)
    if (!this.es_fin()) {
      this.avanzar();
    }

    this.tokens.push({
      tipo: TipoToken.CADENA,
      valor,
      posicion: posicion_inicio,
    });
  }

  /**
   * Lee una expresión entre backticks (para valores por defecto).
   * El contenido se preserva verbatim para copiarse al SQL generado.
   */
  private leer_expresion(): void {
    const posicion_inicio = this.posicion_actual();
    let valor = '';

    // Consumir backtick de apertura
    this.avanzar();

    // Leer contenido hasta encontrar el backtick de cierre
    while (!this.es_fin() && this.caracter_actual() !== '`') {
      valor += this.avanzar();
    }

    // Consumir backtick de cierre (si existe)
    if (!this.es_fin()) {
      this.avanzar();
    }

    this.tokens.push({
      tipo: TipoToken.EXPRESION,
      valor,
      posicion: posicion_inicio,
    });
  }

  /**
   * Lee un número entero.
   */
  private leer_numero(): void {
    const posicion_inicio = this.posicion_actual();
    let valor = '';

    while (!this.es_fin() && this.es_digito(this.caracter_actual())) {
      valor += this.avanzar();
    }

    this.tokens.push({
      tipo: TipoToken.NUMERO,
      valor,
      posicion: posicion_inicio,
    });
  }

  /**
   * Lee un delimitador simple ({, }, (, ), [, ], :, ,, .).
   */
  private leer_delimitador(): void {
    const caracter = this.caracter_actual();
    const mapa_delimitadores: Record<string, TipoToken> = {
      '{': TipoToken.LLAVE_ABIERTA,
      '}': TipoToken.LLAVE_CERRADA,
      '(': TipoToken.PARENTESIS_ABIERTO,
      ')': TipoToken.PARENTESIS_CERRADO,
      '[': TipoToken.CORCHETE_ABIERTO,
      ']': TipoToken.CORCHETE_CERRADO,
      ':': TipoToken.DOS_PUNTOS,
      ',': TipoToken.COMA,
      '.': TipoToken.PUNTO,
    };

    this.agregar_token(mapa_delimitadores[caracter], caracter);
    this.avanzar();
  }

  /**
   * Lee un identificador o una palabra clave.
   * Reconoce frases compuestas como "no nulo", "eliminación en cascada",
   * "actualización en cascada".
   */
  private leer_identificador_o_palabra_clave(): void {
    const posicion_inicio = this.posicion_actual();
    let valor = '';

    // Leer el identificador completo
    while (!this.es_fin() && this.es_parte_identificador(this.caracter_actual())) {
      valor += this.avanzar();
    }

    // Verificar frases compuestas
    const frase_compuesta = this.intentar_leer_frase_compuesta(valor, posicion_inicio);
    if (frase_compuesta) return;

    // Clasificar el token
    const tipo = this.clasificar_palabra(valor);

    this.tokens.push({
      tipo,
      valor,
      posicion: posicion_inicio,
    });
  }

  /**
   * Intenta leer una frase compuesta que empieza con la palabra dada.
   * Frases soportadas: "no nulo", "eliminación en cascada", "actualización en cascada".
   *
   * @param {string} primera_palabra - Primera palabra de la posible frase
   * @param {Posicion} posicion_inicio - Posición de inicio de la primera palabra
   * @returns {boolean} True si se leyó una frase compuesta
   */
  private intentar_leer_frase_compuesta(primera_palabra: string, posicion_inicio: Posicion): boolean {
    const posicion_guardada = this.posicion;
    const linea_guardada = this.linea;
    const columna_guardada = this.columna;

    if (primera_palabra === 'no') {
      // Intentar "no nulo"
      this.saltar_espacios_en_linea();
      if (!this.es_fin() && this.es_inicio_identificador(this.caracter_actual())) {
        const segunda = this.leer_palabra();
        if (segunda === 'nulo') {
          this.tokens.push({
            tipo: TipoToken.NO_NULO,
            valor: 'no nulo',
            posicion: posicion_inicio,
          });
          return true;
        }
      }
      // Restaurar posición si no coincidió
      this.posicion = posicion_guardada;
      this.linea = linea_guardada;
      this.columna = columna_guardada;
    }

    if (primera_palabra === 'eliminación') {
      // Intentar "eliminación en cascada"
      this.saltar_espacios_en_linea();
      const pos2 = this.posicion;
      const lin2 = this.linea;
      const col2 = this.columna;
      if (!this.es_fin() && this.es_inicio_identificador(this.caracter_actual())) {
        const segunda = this.leer_palabra();
        if (segunda === 'en') {
          this.saltar_espacios_en_linea();
          if (!this.es_fin() && this.es_inicio_identificador(this.caracter_actual())) {
            const tercera = this.leer_palabra();
            if (tercera === 'cascada') {
              this.tokens.push({
                tipo: TipoToken.ELIMINACION_CASCADA,
                valor: 'eliminación en cascada',
                posicion: posicion_inicio,
              });
              return true;
            }
          }
        }
      }
      this.posicion = pos2;
      this.linea = lin2;
      this.columna = col2;
      // Restaurar
      this.posicion = posicion_guardada;
      this.linea = linea_guardada;
      this.columna = columna_guardada;
    }

    if (primera_palabra === 'actualización') {
      // Intentar "actualización en cascada"
      this.saltar_espacios_en_linea();
      const pos2 = this.posicion;
      const lin2 = this.linea;
      const col2 = this.columna;
      if (!this.es_fin() && this.es_inicio_identificador(this.caracter_actual())) {
        const segunda = this.leer_palabra();
        if (segunda === 'en') {
          this.saltar_espacios_en_linea();
          if (!this.es_fin() && this.es_inicio_identificador(this.caracter_actual())) {
            const tercera = this.leer_palabra();
            if (tercera === 'cascada') {
              this.tokens.push({
                tipo: TipoToken.ACTUALIZACION_CASCADA,
                valor: 'actualización en cascada',
                posicion: posicion_inicio,
              });
              return true;
            }
          }
        }
      }
      this.posicion = pos2;
      this.linea = lin2;
      this.columna = col2;
      this.posicion = posicion_guardada;
      this.linea = linea_guardada;
      this.columna = columna_guardada;
    }

    return false;
  }

  /**
   * Lee una palabra completa (identificador) sin clasificarla.
   * @returns {string} Palabra leída
   */
  private leer_palabra(): string {
    let valor = '';
    while (!this.es_fin() && this.es_parte_identificador(this.caracter_actual())) {
      valor += this.avanzar();
    }
    return valor;
  }

  /**
   * Clasifica una palabra como palabra clave o identificador.
   *
   * @param {string} palabra - Palabra a clasificar
   * @returns {TipoToken} Tipo de token correspondiente
   */
  private clasificar_palabra(palabra: string): TipoToken {
    const mapa_palabras_clave: Record<string, TipoToken> = {
      Tabla: TipoToken.TABLA,
      Grupo: TipoToken.GRUPO,
      Nota: TipoToken.NOTA,
      indices: TipoToken.INDICES,
      primaria: TipoToken.PRIMARIA,
      foranea: TipoToken.FORANEA,
      nota: TipoToken.NOTA,
      incremento: TipoToken.INCREMENTO,
      por_defecto: TipoToken.POR_DEFECTO,
    };

    return mapa_palabras_clave[palabra] || TipoToken.IDENTIFICADOR;
  }

  // ============================================================
  // Métodos auxiliares
  // ============================================================

  /**
   * Retorna el carácter en la posición actual.
   * @returns {string} Carácter actual
   */
  private caracter_actual(): string {
    return this.fuente[this.posicion];
  }

  /**
   * Retorna el siguiente carácter sin avanzar la posición.
   * @returns {string | undefined} Siguiente carácter
   */
  private ver_siguiente(): string | undefined {
    return this.fuente[this.posicion + 1];
  }

  /**
   * Avanza la posición y retorna el carácter consumido.
   * @returns {string} Carácter consumido
   */
  private avanzar(): string {
    const caracter = this.fuente[this.posicion];
    this.posicion++;

    if (caracter === '\n') {
      this.linea++;
      this.columna = 1;
    } else {
      this.columna++;
    }

    return caracter;
  }

  /**
   * Indica si se alcanzó el fin del código fuente.
   * @returns {boolean} True si es fin de archivo
   */
  private es_fin(): boolean {
    return this.posicion >= this.fuente.length;
  }

  /**
   * Retorna la posición actual como objeto Posicion.
   * @returns {Posicion} Posición actual
   */
  private posicion_actual(): Posicion {
    return { linea: this.linea, columna: this.columna };
  }

  /**
   * Agrega un token a la lista.
   * @param {TipoToken} tipo - Tipo del token
   * @param {string} valor - Valor textual del token
   */
  private agregar_token(tipo: TipoToken, valor: string): void {
    this.tokens.push({
      tipo,
      valor,
      posicion: this.posicion_actual(),
    });
  }

  /**
   * Salta espacios en blanco (espacios, tabs, saltos de línea).
   */
  private saltar_espacios_blancos(): void {
    while (!this.es_fin() && this.es_espacio_blanco(this.caracter_actual())) {
      this.avanzar();
    }
  }

  /**
   * Salta espacios en la misma línea (espacios y tabs, no saltos de línea).
   */
  private saltar_espacios_en_linea(): void {
    while (!this.es_fin() && (this.caracter_actual() === ' ' || this.caracter_actual() === '\t')) {
      this.avanzar();
    }
  }

  /**
   * Indica si un carácter es espacio en blanco.
   * @param {string} c - Carácter a evaluar
   * @returns {boolean} True si es espacio en blanco
   */
  private es_espacio_blanco(c: string): boolean {
    return c === ' ' || c === '\t' || c === '\n' || c === '\r';
  }

  /**
   * Indica si un carácter es un dígito.
   * @param {string} c - Carácter a evaluar
   * @returns {boolean} True si es dígito
   */
  private es_digito(c: string): boolean {
    return c >= '0' && c <= '9';
  }

  /**
   * Indica si un carácter puede iniciar un identificador.
   * @param {string} c - Carácter a evaluar
   * @returns {boolean} True si puede iniciar un identificador
   */
  private es_inicio_identificador(c: string): boolean {
    return /[a-zA-Z_áéíóúñüÁÉÍÓÚÑÜ]/.test(c);
  }

  /**
   * Indica si un carácter puede ser parte de un identificador.
   * @param {string} c - Carácter a evaluar
   * @returns {boolean} True si puede ser parte de un identificador
   */
  private es_parte_identificador(c: string): boolean {
    return /[a-zA-Z0-9_áéíóúñüÁÉÍÓÚÑÜ]/.test(c);
  }

  /**
   * Indica si un carácter es un delimitador.
   * @param {string} c - Carácter a evaluar
   * @returns {boolean} True si es delimitador
   */
  private es_delimitador(c: string): boolean {
    return '{}()[]:.'.includes(c) || c === ',';
  }
}

/**
 * Función de conveniencia para tokenizar código fuente.
 *
 * @param {string} fuente - Código fuente a tokenizar
 * @returns {Token[]} Lista de tokens
 */
export function tokenizar(fuente: string): Token[] {
  const tokenizador = new Tokenizador(fuente);
  return tokenizador.tokenizar();
}
