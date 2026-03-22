/**
 * @archivo BloqueCodigo.tsx
 * @descripcion Componente de bloque de código con resaltado de sintaxis
 * para el lenguaje es-ldmd. Tokeniza el código fuente y aplica colores
 * según el tipo de token, adaptándose al tema claro/oscuro.
 */
'use client';

import { Box } from '@mantine/core';
import { UsarTema } from '@/hooks/UsarTema';

/* ─── Colores por tipo de token ─── */

/** Paleta de colores para el tema oscuro (basada en el tema Monaco oscuro) */
const COLORES_OSCURO = {
  palabra_clave: '#569cd6',
  bloque: '#4fc1ff',
  opcion: '#ce9178',
  tipo: '#4ec9b0',
  cadena: '#ce9178',
  comentario: '#6a9955',
  numero: '#b5cea8',
  identificador_esquema: '#4fc1ff',
  identificador: '#d4d4d4',
  delimitador: '#808080',
  texto: '#d4d4d4',
} as const;

/** Paleta de colores para el tema claro (basada en el tema Monaco claro) */
const COLORES_CLARO = {
  palabra_clave: '#0550ae',
  bloque: '#1c7ed6',
  opcion: '#e36209',
  tipo: '#8250df',
  cadena: '#0a3069',
  comentario: '#6a9955',
  numero: '#0550ae',
  identificador_esquema: '#1c7ed6',
  identificador: '#24292f',
  delimitador: '#57606a',
  texto: '#24292f',
} as const;

/* ─── Palabras reservadas del DSL ─── */

const PALABRAS_CLAVE = new Set(['Tabla', 'Grupo', 'Nota']);
const BLOQUES = new Set(['indices', 'primaria', 'foranea']);
const TIPOS_DATOS = new Set([
  'entero', 'texto', 'fecha', 'lógico', 'logico', 'log',
  'decimal', 'caracter', 'entero_grande', 'entero_pequeño',
  'flotante', 'fecha_hora', 'hora', 'fecha_hora_zona',
  'json', 'jsonb', 'uuid', 'listado', 'mapa', 'enum',
]);

/* ─── Tipos de token ─── */

type TipoToken =
  | 'palabra_clave'
  | 'bloque'
  | 'opcion'
  | 'tipo'
  | 'cadena'
  | 'comentario'
  | 'numero'
  | 'identificador_esquema'
  | 'identificador'
  | 'delimitador'
  | 'texto';

interface Token {
  tipo: TipoToken;
  valor: string;
}

/* ─── Tokenizador ─── */

/**
 * Tokeniza una línea de código es-ldmd para resaltado de sintaxis.
 *
 * @param {string} linea - Línea de código a tokenizar
 * @returns {Token[]} Lista de tokens con su tipo y valor
 */
function tokenizar_linea(linea: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < linea.length) {
    // Comentarios de línea
    if (linea[i] === '/' && linea[i + 1] === '/') {
      tokens.push({ tipo: 'comentario', valor: linea.slice(i) });
      break;
    }

    // Cadenas entre comillas simples
    if (linea[i] === "'") {
      const inicio = i;
      i++;
      while (i < linea.length && linea[i] !== "'") i++;
      if (i < linea.length) i++;
      tokens.push({ tipo: 'cadena', valor: linea.slice(inicio, i) });
      continue;
    }

    // Expresiones entre backticks
    if (linea[i] === '`') {
      const inicio = i;
      i++;
      while (i < linea.length && linea[i] !== '`') i++;
      if (i < linea.length) i++;
      tokens.push({ tipo: 'cadena', valor: linea.slice(inicio, i) });
      continue;
    }

    // Espacios en blanco
    if (/\s/.test(linea[i])) {
      const inicio = i;
      while (i < linea.length && /\s/.test(linea[i])) i++;
      tokens.push({ tipo: 'texto', valor: linea.slice(inicio, i) });
      continue;
    }

    // Delimitadores
    if (/[{}()\[\]:,]/.test(linea[i])) {
      tokens.push({ tipo: 'delimitador', valor: linea[i] });
      i++;
      continue;
    }

    // Números
    if (/\d/.test(linea[i])) {
      const inicio = i;
      while (i < linea.length && /\d/.test(linea[i])) i++;
      tokens.push({ tipo: 'numero', valor: linea.slice(inicio, i) });
      continue;
    }

    // Palabras (identificadores, palabras clave, tipos, etc.)
    if (/[a-zA-Z_áéíóúñüÁÉÍÓÚÑÜ]/.test(linea[i])) {
      const inicio = i;
      while (i < linea.length && /[a-zA-Z0-9_áéíóúñüÁÉÍÓÚÑÜ]/.test(linea[i])) i++;

      // Verificar si es esquema.tabla (identificador con punto)
      if (i < linea.length && linea[i] === '.' && i + 1 < linea.length && /[a-zA-Z_]/.test(linea[i + 1])) {
        i++; // consumir el punto
        while (i < linea.length && /[a-zA-Z0-9_áéíóúñüÁÉÍÓÚÑÜ]/.test(linea[i])) i++;
        tokens.push({ tipo: 'identificador_esquema', valor: linea.slice(inicio, i) });
        continue;
      }

      const palabra = linea.slice(inicio, i);

      // Frases compuestas: "no nulo", "eliminación en cascada", etc.
      if (palabra === 'no') {
        const resto = linea.slice(i);
        const coincidencia = resto.match(/^(\s+)(nulo)\b/);
        if (coincidencia) {
          const espacio = coincidencia[1];
          const nulo = coincidencia[2];
          tokens.push({ tipo: 'opcion', valor: palabra + espacio + nulo });
          i += espacio.length + nulo.length;
          continue;
        }
      }

      if (palabra === 'eliminación' || palabra === 'actualización') {
        const resto = linea.slice(i);
        const coincidencia = resto.match(/^(\s+en\s+cascada)\b/);
        if (coincidencia) {
          tokens.push({ tipo: 'opcion', valor: palabra + coincidencia[1] });
          i += coincidencia[1].length;
          continue;
        }
      }

      if (palabra === 'nota' || palabra === 'incremento' || palabra === 'unico' || palabra === 'por_defecto') {
        tokens.push({ tipo: 'opcion', valor: palabra });
        continue;
      }

      // Clasificar la palabra
      if (PALABRAS_CLAVE.has(palabra)) {
        tokens.push({ tipo: 'palabra_clave', valor: palabra });
      } else if (BLOQUES.has(palabra)) {
        tokens.push({ tipo: 'bloque', valor: palabra });
      } else if (TIPOS_DATOS.has(palabra)) {
        tokens.push({ tipo: 'tipo', valor: palabra });
      } else {
        tokens.push({ tipo: 'identificador', valor: palabra });
      }
      continue;
    }

    // Cualquier otro carácter
    tokens.push({ tipo: 'texto', valor: linea[i] });
    i++;
  }

  return tokens;
}

/* ─── Componente ─── */

interface PropiedadesBloqueCodigo {
  /** Código fuente es-ldmd a resaltar */
  codigo: string;
}

/**
 * Componente que renderiza un bloque de código es-ldmd con resaltado
 * de sintaxis basado en colores. Se adapta automáticamente al tema
 * claro/oscuro de la aplicación.
 *
 * @param {PropiedadesBloqueCodigo} props - Propiedades del componente
 * @returns {JSX.Element} Bloque de código con sintaxis resaltada
 */
export function BloqueCodigo({ codigo }: PropiedadesBloqueCodigo) {
  'use no memo';

  const { es_oscuro } = UsarTema();
  const colores = es_oscuro ? COLORES_OSCURO : COLORES_CLARO;

  const lineas = codigo.split('\n');

  return (
    <Box
      style={{
        fontFamily: 'var(--mantine-font-family-monospace)',
        fontSize: 'var(--mantine-font-size-sm)',
        lineHeight: 1.6,
        padding: 'var(--mantine-spacing-md)',
        borderRadius: 'var(--mantine-radius-sm)',
        backgroundColor: es_oscuro ? '#1a1b1e' : '#f8f9fa',
        border: `1px solid ${es_oscuro ? '#2c2e33' : '#dee2e6'}`,
        overflowX: 'auto',
        whiteSpace: 'pre',
      }}
    >
      {lineas.map((linea, indice_linea) => (
        <div key={indice_linea}>
          {tokenizar_linea(linea).map((token, indice_token) => (
            <span
              key={indice_token}
              style={{
                color: colores[token.tipo],
                fontStyle: token.tipo === 'comentario' ? 'italic' : undefined,
                fontWeight: token.tipo === 'palabra_clave' ? 'bold' : undefined,
              }}
            >
              {token.valor}
            </span>
          ))}
        </div>
      ))}
    </Box>
  );
}
