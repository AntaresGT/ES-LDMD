/**
 * @archivo configuracion-lenguaje.ts
 * @descripcion Configuración del lenguaje es-ldmd para Monaco Editor.
 * Registra el lenguaje con syntax highlighting, autocompletado,
 * hover informativo y plegado de bloques.
 */

import type * as Monaco from 'monaco-editor';

/** Identificador del lenguaje en Monaco */
export const ID_LENGUAJE = 'esldmd';

/** Palabras clave principales del DSL */
const PALABRAS_CLAVE = ['Tabla', 'Grupo', 'Nota'];

/** Bloques internos de una tabla */
const BLOQUES = ['indices', 'primaria', 'foranea'];

/** Opciones de columna entre corchetes */
const OPCIONES_COLUMNA = ['no nulo', 'incremento', 'nota'];

/** Opciones de foránea entre corchetes */
const OPCIONES_FORANEA = [
  'eliminación en cascada',
  'actualización en cascada',
];

/** Tipos de datos del DSL en español */
const TIPOS_DATOS = [
  'entero',
  'texto',
  'fecha',
  'lógico',
  'logico',
  'log',
  'decimal',
  'caracter',
  'entero_grande',
  'entero_pequeño',
  'flotante',
  'fecha_hora',
  'hora',
  'fecha_hora_zona',
  'json',
  'jsonb',
  'uuid',
  'listado',
  'mapa',
  'enum',
];

/**
 * Definición de tokens (syntax highlighting) para el lenguaje es-ldmd.
 * Utiliza el formato Monarch de Monaco.
 */
export const DEFINICION_TOKENS: Monaco.languages.IMonarchLanguage = {
  keywords: PALABRAS_CLAVE,
  blocks: BLOQUES,
  typeKeywords: TIPOS_DATOS,

  tokenizer: {
    root: [
      // Comentarios de línea
      [/\/\/.*$/, 'comment'],

      // Strings entre comillas simples
      [/'[^']*'/, 'string'],

      // Palabras clave principales (Tabla, Grupo, Nota)
      [/\b(Tabla|Grupo)\b/, 'keyword'],
      [/\bNota\b/, 'keyword'],

      // Bloques internos
      [/\b(indices|primaria|foranea)\b/, 'keyword.block'],

      // Opciones entre corchetes
      [/\b(no nulo)\b/, 'keyword.option'],
      [/\b(incremento)\b/, 'keyword.option'],
      [/\b(por_defecto)\b/, 'keyword.option'],
      [/\b(nota)\b(?=\s*:)/, 'keyword.option'],
      [/\b(eliminación en cascada|actualización en cascada)\b/, 'keyword.option'],

      // Expresiones entre backticks
      [/`[^`]*`/, 'string.expression'],

      // Tipos de datos
      [
        /\b(entero_grande|entero_pequeño|entero|texto|fecha_hora_zona|fecha_hora|fecha|lógico|logico|log|decimal|caracter|flotante|hora|jsonb|json|uuid|listado|mapa|enum)\b/,
        'type',
      ],

      // Números
      [/\b\d+\b/, 'number'],

      // Identificadores con esquema (esquema.tabla)
      [/[a-zA-Z_áéíóúñü][a-zA-Z0-9_áéíóúñü]*\.[a-zA-Z_áéíóúñü][a-zA-Z0-9_áéíóúñü]*/, 'identifier.schema'],

      // Identificadores simples
      [/[a-zA-Z_áéíóúñü][a-zA-Z0-9_áéíóúñü]*/, 'identifier'],

      // Delimitadores
      [/[{}()\[\]]/, '@brackets'],
      [/:/, 'delimiter'],
      [/,/, 'delimiter.comma'],

      // Espacios
      [/\s+/, 'white'],
    ],
  },

  brackets: [
    { open: '{', close: '}', token: 'delimiter.curly' },
    { open: '(', close: ')', token: 'delimiter.paren' },
    { open: '[', close: ']', token: 'delimiter.square' },
  ],
};

/**
 * Configuración del lenguaje para Monaco (paréntesis, comentarios, plegado).
 */
export const CONFIGURACION_LENGUAJE: Monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: '//',
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: "'", close: "'" },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: "'", close: "'" },
  ],
  folding: {
    markers: {
      start: /\{/,
      end: /\}/,
    },
  },
  indentationRules: {
    increaseIndentPattern: /\{[^}]*$/,
    decreaseIndentPattern: /^\s*\}/,
  },
};

/**
 * Genera las sugerencias de autocompletado para el lenguaje es-ldmd.
 *
 * @param {Monaco.languages.CompletionItemInsertTextRule} regla_insercion - Regla de inserción de snippets
 * @param {Monaco.IRange} rango - Rango donde insertar la sugerencia
 * @returns {Monaco.languages.CompletionItem[]} Lista de sugerencias de autocompletado
 */
function generar_sugerencias(
  regla_insercion: typeof Monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
  rango: Monaco.IRange,
  tipo_completado: typeof Monaco.languages.CompletionItemKind,
): Monaco.languages.CompletionItem[] {
  return [
    // Snippet de tabla completa
    {
      label: 'Tabla',
      kind: tipo_completado.Snippet,
      documentation: 'Crear una nueva tabla con estructura completa',
      insertText: [
        'Tabla ${1:nombre_tabla} {',
        '\t${2:columna1} ${3:entero} [no nulo]',
        '\t${4:columna2} ${5:texto}',
        '',
        '\tindices {',
        '\t\t${2:columna1}',
        '\t}',
        '',
        '\tprimaria {',
        '\t\t${2:columna1}',
        '\t}',
        '}',
      ].join('\n'),
      insertTextRules: regla_insercion,
      range: rango,
    },
    // Snippet de tabla con schema
    {
      label: 'Tabla con esquema',
      kind: tipo_completado.Snippet,
      documentation: 'Crear una nueva tabla con esquema (schema)',
      insertText: [
        'Tabla ${1:esquema}.${2:nombre_tabla} {',
        '\t${3:columna1} ${4:entero} [no nulo]',
        '\t${5:columna2} ${6:texto}',
        '',
        '\tindices {',
        '\t\t${3:columna1}',
        '\t}',
        '',
        '\tprimaria {',
        '\t\t${3:columna1}',
        '\t}',
        '}',
      ].join('\n'),
      insertTextRules: regla_insercion,
      range: rango,
    },
    // Snippet de grupo
    {
      label: 'Grupo',
      kind: tipo_completado.Snippet,
      documentation: 'Crear un grupo para organizar tablas',
      insertText: [
        'Grupo ${1:nombre_grupo} {',
        '\t${2:tabla1}',
        '\t${3:tabla2}',
        '}',
      ].join('\n'),
      insertTextRules: regla_insercion,
      range: rango,
    },
    // Bloque indices
    {
      label: 'indices',
      kind: tipo_completado.Keyword,
      documentation: 'Bloque de definición de índices',
      insertText: [
        'indices {',
        '\t${1:columna}',
        '}',
      ].join('\n'),
      insertTextRules: regla_insercion,
      range: rango,
    },
    // Bloque primaria
    {
      label: 'primaria',
      kind: tipo_completado.Keyword,
      documentation: 'Bloque de definición de llave primaria',
      insertText: [
        'primaria {',
        '\t${1:columna}',
        '}',
      ].join('\n'),
      insertTextRules: regla_insercion,
      range: rango,
    },
    // Bloque foranea
    {
      label: 'foranea',
      kind: tipo_completado.Keyword,
      documentation: 'Bloque de definición de llaves foráneas',
      insertText: [
        'foranea {',
        '\t${1:columna} ${2:tabla_referencia}(${3:columna_referencia})',
        '}',
      ].join('\n'),
      insertTextRules: regla_insercion,
      range: rango,
    },
    // Bloque foranea con cascada
    {
      label: 'foranea con cascada',
      kind: tipo_completado.Snippet,
      documentation: 'Llave foránea con eliminación y actualización en cascada',
      insertText: [
        'foranea {',
        '\t${1:columna} ${2:tabla_referencia}(${3:columna_referencia}) [eliminación en cascada, actualización en cascada]',
        '}',
      ].join('\n'),
      insertTextRules: regla_insercion,
      range: rango,
    },
    // Nota de tabla
    {
      label: 'Nota',
      kind: tipo_completado.Keyword,
      documentation: 'Agregar una nota a la tabla',
      insertText: "Nota: '${1:descripción de la tabla}'",
      insertTextRules: regla_insercion,
      range: rango,
    },
    // Tipos de datos
    ...TIPOS_DATOS.map((tipo) => ({
      label: tipo,
      kind: tipo_completado.TypeParameter,
      documentation: `Tipo de dato: ${tipo}`,
      insertText: tipo,
      range: rango,
    })),
    // Opciones
    {
      label: 'no nulo',
      kind: tipo_completado.Property,
      documentation: 'Restricción NOT NULL - la columna no puede ser nula',
      insertText: 'no nulo',
      range: rango,
    },
    {
      label: 'incremento',
      kind: tipo_completado.Property,
      documentation: 'Auto-incremento - convierte el tipo a SERIAL (PostgreSQL) o AUTO_INCREMENT (MariaDB)',
      insertText: 'incremento',
      range: rango,
    },
    {
      label: 'por_defecto',
      kind: tipo_completado.Property,
      documentation: 'Valor por defecto - expresión SQL que se usa como DEFAULT en la columna',
      insertText: 'por_defecto: `${1:expresión}`',
      insertTextRules: regla_insercion,
      range: rango,
    },
    {
      label: 'nota',
      kind: tipo_completado.Property,
      documentation: 'Agregar una nota descriptiva a la columna',
      insertText: "nota: '${1:descripción}'",
      insertTextRules: regla_insercion,
      range: rango,
    },
    {
      label: 'eliminación en cascada',
      kind: tipo_completado.Property,
      documentation: 'ON DELETE CASCADE - eliminar registros relacionados automáticamente',
      insertText: 'eliminación en cascada',
      range: rango,
    },
    {
      label: 'actualización en cascada',
      kind: tipo_completado.Property,
      documentation: 'ON UPDATE CASCADE - actualizar registros relacionados automáticamente',
      insertText: 'actualización en cascada',
      range: rango,
    },
  ];
}

/**
 * Definición del tema claro para el editor es-ldmd.
 */
export const TEMA_CLARO: Monaco.editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
    { token: 'keyword', foreground: '0550ae', fontStyle: 'bold' },
    { token: 'keyword.block', foreground: '1c7ed6' },
    { token: 'keyword.option', foreground: 'e36209' },
    { token: 'type', foreground: '8250df' },
    { token: 'string', foreground: '0a3069' },
    { token: 'number', foreground: '0550ae' },
    { token: 'identifier', foreground: '24292f' },
    { token: 'identifier.schema', foreground: '1c7ed6' },
    { token: 'delimiter', foreground: '57606a' },
    { token: 'delimiter.comma', foreground: '57606a' },
  ],
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#24292f',
    'editorLineNumber.foreground': '#8c959f',
    'editorLineNumber.activeForeground': '#1c7ed6',
    'editor.selectionBackground': '#a5d8ff80',
    'editor.lineHighlightBackground': '#f6f8fa',
  },
};

/**
 * Definición del tema oscuro para el editor es-ldmd.
 */
export const TEMA_OSCURO: Monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
    { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
    { token: 'keyword.block', foreground: '4fc1ff' },
    { token: 'keyword.option', foreground: 'ce9178' },
    { token: 'type', foreground: '4ec9b0' },
    { token: 'string', foreground: 'ce9178' },
    { token: 'number', foreground: 'b5cea8' },
    { token: 'identifier', foreground: 'd4d4d4' },
    { token: 'identifier.schema', foreground: '4fc1ff' },
    { token: 'delimiter', foreground: '808080' },
    { token: 'delimiter.comma', foreground: '808080' },
  ],
  colors: {
    'editor.background': '#1a1b1e',
    'editor.foreground': '#d4d4d4',
    'editorLineNumber.foreground': '#858585',
    'editorLineNumber.activeForeground': '#4dabf7',
    'editor.selectionBackground': '#264f7840',
    'editor.lineHighlightBackground': '#2a2b2e',
  },
};

/** Indica si el lenguaje ya fue registrado en Monaco */
let lenguaje_registrado = false;

/**
 * Registra el lenguaje es-ldmd en una instancia de Monaco Editor.
 * Configura: tokens, autocompletado, hover y plegado.
 * Solo registra una vez para evitar el error "Element already has context attribute".
 *
 * @param {typeof Monaco} monaco - Instancia de Monaco
 */
export function registrar_lenguaje(monaco: typeof Monaco) {
  if (lenguaje_registrado) return;
  lenguaje_registrado = true;

  // Registrar el lenguaje
  monaco.languages.register({
    id: ID_LENGUAJE,
    extensions: ['.esldmd'],
    aliases: ['ES-LDMD', 'esldmd'],
  });

  // Configurar tokenización
  monaco.languages.setMonarchTokensProvider(ID_LENGUAJE, DEFINICION_TOKENS);

  // Configurar lenguaje
  monaco.languages.setLanguageConfiguration(ID_LENGUAJE, CONFIGURACION_LENGUAJE);

  // Registrar temas
  monaco.editor.defineTheme('esldmd-oscuro', TEMA_OSCURO);
  monaco.editor.defineTheme('esldmd-claro', TEMA_CLARO);

  // Registrar proveedor de autocompletado
  monaco.languages.registerCompletionItemProvider(ID_LENGUAJE, {
    provideCompletionItems: (_modelo, posicion) => {
      const rango: Monaco.IRange = {
        startLineNumber: posicion.lineNumber,
        startColumn: posicion.column,
        endLineNumber: posicion.lineNumber,
        endColumn: posicion.column,
      };

      const sugerencias = generar_sugerencias(
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        rango,
        monaco.languages.CompletionItemKind,
      );

      return { suggestions: sugerencias };
    },
  });

  // Registrar proveedor de hover
  monaco.languages.registerHoverProvider(ID_LENGUAJE, {
    provideHover: (_modelo, posicion) => {
      const palabra = _modelo.getWordAtPosition(posicion);
      if (!palabra) return null;

      const texto = palabra.word;
      const info = obtener_info_hover(texto);

      if (!info) return null;

      return {
        range: new monaco.Range(
          posicion.lineNumber,
          palabra.startColumn,
          posicion.lineNumber,
          palabra.endColumn,
        ),
        contents: [
          { value: `**${info.titulo}**` },
          { value: info.descripcion },
        ],
      };
    },
  });
}

/**
 * Información de hover para palabras clave del DSL.
 */
interface InfoHover {
  /** Título a mostrar en el hover */
  titulo: string;
  /** Descripción detallada */
  descripcion: string;
}

/**
 * Obtiene la información de hover para una palabra del DSL.
 *
 * @param {string} palabra - Palabra sobre la que se hace hover
 * @returns {InfoHover | null} Información de hover o null si no se reconoce
 */
function obtener_info_hover(palabra: string): InfoHover | null {
  const diccionario: Record<string, InfoHover> = {
    Tabla: {
      titulo: 'Tabla',
      descripcion: 'Define una nueva tabla en el diagrama.\n\nSintaxis: `Tabla nombre_tabla { ... }` o `Tabla esquema.nombre_tabla { ... }`',
    },
    Grupo: {
      titulo: 'Grupo',
      descripcion: 'Agrupa tablas visualmente.\n\nSintaxis: `Grupo nombre_grupo { tabla1 tabla2 }`',
    },
    indices: {
      titulo: 'Índices',
      descripcion: 'Bloque para definir los índices de la tabla.\n\nSintaxis: `indices { columna1 columna2 }`',
    },
    primaria: {
      titulo: 'Llave Primaria',
      descripcion: 'Bloque para definir la(s) columna(s) de la llave primaria.\n\nSintaxis: `primaria { columna1 }`\n\nSoporta llaves compuestas con múltiples columnas.',
    },
    foranea: {
      titulo: 'Llave Foránea',
      descripcion: 'Bloque para definir las relaciones foráneas.\n\nSintaxis: `foranea { columna tabla_ref(col_ref) }`\n\nSoporta cascadas: `[eliminación en cascada, actualización en cascada]`',
    },
    Nota: {
      titulo: 'Nota',
      descripcion: "Agrega una nota descriptiva a la tabla.\n\nSintaxis: `Nota: 'descripción'`",
    },
    incremento: {
      titulo: 'Opción: incremento',
      descripcion: 'Auto-incremento para columnas enteras.\n\nEn PostgreSQL se convierte a `SERIAL`, `BIGSERIAL` o `SMALLSERIAL`.\nEn MariaDB se agrega `AUTO_INCREMENT`.\n\nEjemplo: `id entero [incremento]`',
    },
    por_defecto: {
      titulo: 'Opción: por_defecto',
      descripcion: 'Valor por defecto para la columna. La expresión SQL se pasa literalmente como cláusula `DEFAULT`.\n\nSintaxis: `[por_defecto: \\`expresión\\`]`\n\nEjemplos:\n- `[por_defecto: \\`0\\`]`\n- `[por_defecto: \\`true\\`]`\n- `[por_defecto: \\`NOW()\\`]`\n- `[por_defecto: \\`gen_random_uuid()\\`]`',
    },
    entero: { titulo: 'Tipo: entero', descripcion: 'Se convierte a `INTEGER` en SQL.' },
    texto: { titulo: 'Tipo: texto', descripcion: 'Se convierte a `TEXT` en SQL.\n\nCon parámetro: `texto(n)` → `VARCHAR(n)`' },
    fecha: { titulo: 'Tipo: fecha', descripcion: 'Se convierte a `DATE` en SQL.' },
    'lógico': { titulo: 'Tipo: lógico', descripcion: 'Valor lógico verdadero/falso. Se convierte a `BOOLEAN` en SQL.\n\nAlias: `logico`, `log`' },
    logico: { titulo: 'Tipo: logico', descripcion: 'Valor lógico verdadero/falso. Se convierte a `BOOLEAN` en SQL.\n\nAlias de: `lógico`' },
    log: { titulo: 'Tipo: log', descripcion: 'Valor lógico verdadero/falso. Se convierte a `BOOLEAN` en SQL.\n\nAlias de: `lógico`' },
    decimal: { titulo: 'Tipo: decimal', descripcion: 'Se convierte a `DECIMAL` en SQL.' },
    caracter: { titulo: 'Tipo: caracter', descripcion: 'Se convierte a `CHAR(n)` en SQL.' },
    entero_grande: { titulo: 'Tipo: entero_grande', descripcion: 'Se convierte a `BIGINT` en SQL.' },
    entero_pequeño: { titulo: 'Tipo: entero_pequeño', descripcion: 'Se convierte a `SMALLINT` en SQL.' },
    flotante: { titulo: 'Tipo: flotante', descripcion: 'Se convierte a `FLOAT` en SQL.' },
    fecha_hora: { titulo: 'Tipo: fecha_hora', descripcion: 'Se convierte a `TIMESTAMP` en SQL.' },
    hora: { titulo: 'Tipo: hora', descripcion: 'Se convierte a `TIME` en SQL.' },
    fecha_hora_zona: { titulo: 'Tipo: fecha_hora_zona', descripcion: 'Se convierte a `TIMESTAMPTZ` en SQL.' },
    json: { titulo: 'Tipo: json', descripcion: 'Se convierte a `JSON` en SQL.' },
    jsonb: { titulo: 'Tipo: jsonb', descripcion: 'Se convierte a `JSONB` en SQL.' },
    uuid: { titulo: 'Tipo: uuid', descripcion: 'Se convierte a `UUID` en SQL.' },
    listado: { titulo: 'Tipo: listado', descripcion: 'Se convierte a array en SQL.\n\nEjemplo: `listado(entero)` → `INTEGER[]`' },
    mapa: { titulo: 'Tipo: mapa', descripcion: 'Se convierte a `JSON` en SQL.\n\nEjemplo: `mapa(texto, entero)` → `JSON`' },
    enum: { titulo: 'Tipo: enum', descripcion: "Se convierte a `ENUM(...)` en SQL.\n\nEjemplo: `enum('valor1', 'valor2')` → `ENUM('valor1', 'valor2')`" },
  };

  return diccionario[palabra] || null;
}
