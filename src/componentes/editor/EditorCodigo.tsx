/**
 * @archivo EditorCodigo.tsx
 * @descripcion Componente del editor de código Monaco para el lenguaje es-ldmd.
 * Incluye syntax highlighting, autocompletado, hover y diagnósticos.
 */
'use client';

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Box, Text } from '@mantine/core';
import { UsarTema } from '@/hooks/UsarTema';
import {
  registrar_lenguaje,
  ID_LENGUAJE,
} from './configuracion-lenguaje';

/** Tipo de la instancia de Monaco editor */
type EditorMonaco = import('monaco-editor').editor.IStandaloneCodeEditor;
/** Tipo del módulo Monaco */
type ModuloMonaco = typeof import('monaco-editor');

/**
 * Métodos expuestos por EditorCodigo a componentes padres.
 */
export interface RefEditorCodigo {
  /** Navega a una línea y columna específica */
  ir_a_linea: (linea: number, columna: number) => void;
}

/**
 * Propiedades del componente EditorCodigo.
 */
interface PropiedadesEditorCodigo {
  /** Valor actual del editor */
  valor?: string;
  /** Callback cuando cambia el contenido del editor */
  al_cambiar?: (valor: string) => void;
}

/**
 * Componente de editor de código basado en Monaco Editor.
 * Proporciona una experiencia de edición profesional con:
 * - Syntax highlighting del DSL es-ldmd
 * - Autocompletado contextual
 * - Hover informativo
 * - Plegado de bloques
 * - Numeración de líneas
 * - Minimapa opcional
 * - Soporte de temas claro/oscuro
 *
 * @param {PropiedadesEditorCodigo} props - Propiedades del componente
 * @returns {JSX.Element} Editor de código renderizado
 */
export const EditorCodigo = forwardRef<RefEditorCodigo, PropiedadesEditorCodigo>(
  function EditorCodigo({ valor, al_cambiar }, ref) {
  const contenedor_ref = useRef<HTMLDivElement>(null);
  const editor_ref = useRef<EditorMonaco | null>(null);
  const monaco_ref = useRef<ModuloMonaco | null>(null);
  const { es_oscuro } = UsarTema();

  /**
   * Expone métodos al componente padre a través de ref.
   */
  useImperativeHandle(ref, () => ({
    ir_a_linea(linea: number, columna: number) {
      if (editor_ref.current) {
        editor_ref.current.setPosition({ lineNumber: linea, column: columna });
        editor_ref.current.revealLineInCenter(linea);
        editor_ref.current.focus();
      }
    },
  }), []);

  /**
   * Inicializa el editor al montar el componente.
   * Usa un flag de cancelación para evitar condiciones de carrera
   * cuando React Strict Mode desmonta y remonta el componente
   * mientras el import asíncrono de Monaco aún está en curso.
   */
  useEffect(() => {
    let cancelado = false;

    async function inicializar() {
      if (!contenedor_ref.current) return;

      const monaco = await import('monaco-editor');

      // Si el componente fue desmontado durante el import, no continuar
      if (cancelado || !contenedor_ref.current) return;

      monaco_ref.current = monaco;

      // Configurar workers de Monaco para evitar carga en hilo principal
      self.MonacoEnvironment = {
        getWorker: function (_workerId: string, _label: string) {
          return new Worker(
            new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url)
          );
        },
      };

      // Registrar el lenguaje personalizado
      registrar_lenguaje(monaco);

      // Crear la instancia del editor
      const editor = monaco.editor.create(contenedor_ref.current, {
        value: valor || '',
        language: ID_LENGUAJE,
        theme: es_oscuro ? 'esldmd-oscuro' : 'esldmd-claro',
        automaticLayout: true,
        minimap: { enabled: true, maxColumn: 80 },
        fontSize: 14,
        fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
        fontLigatures: true,
        lineNumbers: 'on',
        renderLineHighlight: 'all',
        scrollBeyondLastLine: false,
        wordWrap: 'off',
        tabSize: 4,
        insertSpaces: true,
        folding: true,
        foldingStrategy: 'indentation',
        showFoldingControls: 'always',
        bracketPairColorization: { enabled: true },
        guides: {
          bracketPairs: true,
          indentation: true,
        },
        padding: { top: 8, bottom: 8 },
        smoothScrolling: true,
        cursorSmoothCaretAnimation: 'on',
        cursorBlinking: 'smooth',
        roundedSelection: true,
        renderWhitespace: 'selection',
        suggest: {
          showKeywords: true,
          showSnippets: true,
        },
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false,
        },
        accessibilitySupport: 'auto',
      });

      editor_ref.current = editor;

      // Escuchar cambios en el contenido
      editor.onDidChangeModelContent(() => {
        const nuevo_valor = editor.getValue();
        al_cambiar?.(nuevo_valor);
      });
    }

    inicializar();

    return () => {
      cancelado = true;
      editor_ref.current?.dispose();
      editor_ref.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Actualiza el tema del editor cuando cambia el modo oscuro/claro.
   */
  useEffect(() => {
    if (monaco_ref.current) {
      monaco_ref.current.editor.setTheme(es_oscuro ? 'esldmd-oscuro' : 'esldmd-claro');
    }
  }, [es_oscuro]);

  /**
   * Actualiza el valor del editor cuando cambia externamente.
   */
  useEffect(() => {
    if (editor_ref.current && valor !== undefined) {
      const valor_actual = editor_ref.current.getValue();
      if (valor_actual !== valor) {
        editor_ref.current.setValue(valor);
      }
    }
  }, [valor]);

  return (
    <Box
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--mantine-color-body)',
      }}
    >
      <Box
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--mantine-color-default-border)',
          flexShrink: 0,
        }}
      >
        <Text size="xs" c="dimmed" fw={600}>
          EDITOR
        </Text>
      </Box>
      <Box
        ref={contenedor_ref}
        style={{ flex: 1, overflow: 'hidden' }}
        aria-label="Editor de código del diagrama"
        role="textbox"
        aria-multiline="true"
      />
    </Box>
  );
});
