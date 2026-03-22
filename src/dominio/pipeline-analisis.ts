/**
 * @archivo pipeline-analisis.ts
 * @descripcion Pipeline de análisis del DSL es-ldmd.
 * Encadena: texto → tokenización → parsing → validación → resultado.
 */

import { ResultadoAnalisis, Severidad } from '@/dominio/tipos';
import { tokenizar } from '@/parser/tokenizador';
import { analizar } from '@/parser/analizador';
import { validar_sintaxis } from '@/validacion/validador-sintactico';
import { validar_semantica } from '@/validacion/validador-semantico';

/**
 * Ejecuta el pipeline completo de análisis del código fuente del DSL.
 *
 * El pipeline consiste en:
 * 1. **Tokenización**: Convierte el texto en tokens
 * 2. **Análisis sintáctico**: Convierte los tokens en un AST
 * 3. **Validación sintáctica**: Detecta tablas/grupos duplicados, tablas vacías
 * 4. **Validación semántica**: Verifica referencias cruzadas
 * 5. **Recopilación de diagnósticos**: Acumula todos los errores
 *
 * @param {string} codigo_fuente - Código fuente del DSL es-ldmd
 * @returns {ResultadoAnalisis} Resultado con AST, diagnósticos y estado de errores
 *
 * @ejemplo
 * ```typescript
 * const resultado = ejecutar_pipeline("Tabla usuarios { id entero }");
 * console.log(resultado.ast.tablas); // [{nombre: 'usuarios', ...}]
 * console.log(resultado.tiene_errores); // false
 * ```
 */
export function ejecutar_pipeline(codigo_fuente: string): ResultadoAnalisis {
  // Paso 1: Tokenización
  const tokens = tokenizar(codigo_fuente);

  // Paso 2: Análisis sintáctico (parsing)
  const { ast, diagnosticos: diagnosticos_parser } = analizar(tokens);

  // Paso 3: Validación sintáctica
  const diagnosticos_sintacticos = validar_sintaxis(ast);

  // Paso 4: Validación semántica
  const diagnosticos_semanticos = validar_semantica(ast);

  // Combinar todos los diagnósticos
  const diagnosticos = [
    ...diagnosticos_parser,
    ...diagnosticos_sintacticos,
    ...diagnosticos_semanticos,
  ];

  // Determinar si hay errores
  const tiene_errores = diagnosticos.some(
    (d) => d.severidad === Severidad.ERROR,
  );

  return {
    ast,
    diagnosticos,
    tiene_errores,
  };
}
