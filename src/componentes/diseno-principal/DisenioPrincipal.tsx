/**
 * @archivo DisenioPrincipal.tsx
 * @descripcion Layout principal de la aplicación con 3 paneles redimensionables.
 * Utiliza Allotment para dividir: Editor | Diagrama | Herramientas.
 * Integra el pipeline completo: código → AST → diagrama + errores.
 * Gestión de archivos con persistencia local (Fase 9).
 */
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Box } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { BarraHerramientas } from '../barra-herramientas/BarraHerramientas';
import { EditorCodigo, RefEditorCodigo } from '../editor/EditorCodigo';
import { VistaDiagrama } from '../diagrama/VistaDiagrama';
import { PanelHerramientas } from '../panel-herramientas/PanelHerramientas';
import { PanelExportacion } from '../panel-exportacion/PanelExportacion';
import { UsarTema } from '@/hooks/UsarTema';
import { GestorArchivos } from '../archivos/GestorArchivos';
import { DOCUMENTO_EJEMPLO } from '@/dominio/documento-ejemplo';
import { ejecutar_pipeline } from '@/dominio/pipeline-analisis';
import { DocumentoAST } from '@/dominio/tipos';
import { ast_a_diagrama, ModeloDiagrama } from '@/transformadores/ast-a-diagrama';
import { aplicar_auto_layout, TipoLayout } from '@/renderizado/auto-layout';
import {
  guardar_version,
  obtener_archivo,
  obtener_preferencias,
  guardar_preferencias,
} from '@/persistencia/gestor-almacenamiento';
import {
  descargar_archivo_esldmd,
  importar_archivo_esldmd,
  abrir_selector_archivo,
} from '@/exportacion/archivo-esldmd';

/** Tiempo de espera antes de re-analizar el código (ms) */
const RETARDO_ANALISIS = 300;

/**
 * Layout principal de la aplicación es-ldmd.
 * Divide la interfaz en 3 secciones redimensionables con Allotment:
 * 1. Editor de código (izquierda)
 * 2. Vista previa del diagrama (centro)
 * 3. Panel de herramientas con Errores e IA (derecha)
 *
 * Integra el pipeline completo:
 * código fuente → tokenización → parsing → validación → diagrama + errores
 *
 * @returns {JSX.Element} Layout principal renderizado
 */
export function DisenioPrincipal() {
  const [codigo_fuente, fijarCodigoFuente] = useState<string>(DOCUMENTO_EJEMPLO);
  const [modelo_diagrama, fijarModeloDiagrama] = useState<ModeloDiagrama | null>(null);
  const [tipo_layout, fijarTipoLayout] = useState<TipoLayout>('izquierda-derecha');
  const [ast_actual, fijarAstActual] = useState<DocumentoAST | null>(null);
  const [panel_exportacion_abierto, fijarPanelExportacionAbierto] = useState(false);
  const [gestor_archivos_abierto, fijarGestorArchivosAbierto] = useState(false);
  const [archivo_actual_id, fijarArchivoActualId] = useState<string | null>(null);
  const [nombre_archivo, fijarNombreArchivo] = useState('Sin título');
  const [errores, fijarErrores] = useState<Array<{
    mensaje: string;
    linea: number;
    columna: number;
    severidad: string;
  }>>([]);

  const temporizador_ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editor_ref = useRef<RefEditorCodigo | null>(null);

  /** Detecta si la pantalla es pequeña (móvil/tableta) para layout vertical */
  const es_pantalla_pequena = useMediaQuery('(max-width: 768px)');

  const { alternar_tema } = UsarTema();

  const alternar_tema_ref = useRef(alternar_tema);
  alternar_tema_ref.current = alternar_tema;

  /**
   * Ejecuta el pipeline de análisis sobre el código fuente
   * y actualiza el diagrama y los errores.
   *
   * @param {string} codigo - Código fuente a analizar
   */
  const procesar_codigo = useCallback((codigo: string) => {
    if (!codigo.trim()) {
      fijarModeloDiagrama(null);
      fijarAstActual(null);
      fijarErrores([]);
      return;
    }

    try {
      // Ejecutar el pipeline de análisis
      const resultado = ejecutar_pipeline(codigo);

      // Guardar el AST para exportación
      fijarAstActual(resultado.ast);

      // Convertir diagnósticos al formato del panel de errores
      const errores_formateados = resultado.diagnosticos.map((d) => ({
        mensaje: d.mensaje,
        linea: d.rango.inicio.linea,
        columna: d.rango.inicio.columna,
        severidad: d.severidad,
      }));
      fijarErrores(errores_formateados);

      // Transformar AST a modelo de diagrama
      const modelo = generar_modelo_diagrama(resultado.ast);
      fijarModeloDiagrama(modelo);
    } catch {
      // Si el pipeline falla completamente, limpiar el diagrama
      fijarModeloDiagrama(null);
      fijarAstActual(null);
      fijarErrores([{
        mensaje: 'Error interno al analizar el código',
        linea: 1,
        columna: 1,
        severidad: 'error',
      }]);
    }
  }, []);

  /**
   * Genera el modelo de diagrama a partir del AST,
   * aplicando la distribución automática.
   *
   * @param {DocumentoAST} ast - AST del documento
   * @returns {ModeloDiagrama | null} Modelo de diagrama o null si está vacío
   */
  const generar_modelo_diagrama = (ast: DocumentoAST, tipo: TipoLayout = tipo_layout): ModeloDiagrama | null => {
    if (ast.tablas.length === 0) return null;

    // Transformar AST a modelo de diagrama
    const modelo = ast_a_diagrama(ast);

    // Aplicar distribución automática
    const nodos_distribuidos = aplicar_auto_layout(
      modelo.nodos,
      modelo.aristas,
      modelo.grupos,
      tipo,
    );

    return {
      ...modelo,
      nodos: nodos_distribuidos,
    };
  };

  /**
   * Maneja el cambio en el contenido del editor.
   * Aplica debounce para evitar re-análisis excesivo.
   *
   * @param {string} nuevo_valor - Nuevo contenido del editor
   */
  const manejar_cambio_editor = useCallback((nuevo_valor: string) => {
    fijarCodigoFuente(nuevo_valor);

    // Debounce del análisis
    if (temporizador_ref.current) {
      clearTimeout(temporizador_ref.current);
    }

    temporizador_ref.current = setTimeout(() => {
      procesar_codigo(nuevo_valor);
    }, RETARDO_ANALISIS);
  }, [procesar_codigo]);

  /**
   * Maneja el click en un error para navegar al editor.
   *
   * @param {number} linea - Línea del error
   * @param {number} columna - Columna del error
   */
  const manejar_click_error = useCallback((linea: number, columna: number) => {
    editor_ref.current?.ir_a_linea(linea, columna);
  }, []);

  /**
   * Maneja la acción de guardar.
   * Si hay un archivo actual, crea una nueva versión.
   * Si no hay archivo, abre el gestor para "Guardar como nuevo".
   */
  const manejar_guardar = useCallback(() => {
    if (archivo_actual_id) {
      const resultado = guardar_version(archivo_actual_id, codigo_fuente);
      if (resultado) {
        guardar_preferencias({ ultimo_archivo_id: archivo_actual_id });
        notifications.show({
          title: 'Guardado',
          message: `"${nombre_archivo}" guardado correctamente`,
          color: 'green',
          autoClose: 2000,
        });
      }
    } else {
      // No hay archivo actual, abrir el gestor para crear uno nuevo
      fijarGestorArchivosAbierto(true);
    }
  }, [archivo_actual_id, codigo_fuente, nombre_archivo]);

  /**
   * Maneja la acción de exportar: abre el panel de exportación.
   */
  const manejar_exportar = useCallback(() => {
    fijarPanelExportacionAbierto(true);
  }, []);

  /**
   * Maneja la acción de nuevo archivo.
   * Limpia el editor y resetea el estado del archivo actual.
   */
  const manejar_nuevo_archivo = useCallback(() => {
    fijarCodigoFuente('');
    fijarArchivoActualId(null);
    fijarNombreArchivo('Sin título');
    fijarModeloDiagrama(null);
    fijarAstActual(null);
    fijarErrores([]);
  }, []);

  /**
   * Maneja la acción de borrar el contenido del editor.
   */
  const manejar_borrar = useCallback(() => {
    fijarCodigoFuente('');
    fijarModeloDiagrama(null);
    fijarAstActual(null);
    fijarErrores([]);
  }, []);

  /**
   * Maneja la acción de abrir archivo: abre el gestor de archivos.
   */
  const manejar_abrir_archivo = useCallback(() => {
    fijarGestorArchivosAbierto(true);
  }, []);

  /**
   * Callback cuando se selecciona un archivo desde el GestorArchivos.
   *
   * @param {string} id - ID del archivo
   * @param {string} nombre - Nombre del archivo
   * @param {string} contenido - Contenido del archivo
   */
  const manejar_archivo_seleccionado = useCallback((id: string, nombre: string, contenido: string) => {
    fijarArchivoActualId(id);
    fijarNombreArchivo(nombre);
    fijarCodigoFuente(contenido);
    guardar_preferencias({ ultimo_archivo_id: id });
    // Forzar el procesamiento inmediato del código cargado
    procesar_codigo(contenido);
  }, [procesar_codigo]);

  /**
   * Descarga el contenido actual del editor como un archivo .esldmd.
   */
  const manejar_descargar_esldmd = useCallback(() => {
    descargar_archivo_esldmd(codigo_fuente, nombre_archivo);
  }, [codigo_fuente, nombre_archivo]);

  /**
   * Importa un archivo .esldmd desde el sistema de archivos del usuario.
   * Valida el contenido y muestra notificaciones de errores/advertencias.
   */
  const manejar_importar_esldmd = useCallback(async () => {
    const archivo = await abrir_selector_archivo();
    if (!archivo) return;

    const resultado = await importar_archivo_esldmd(archivo);

    if (!resultado.valido) {
      notifications.show({
        title: 'Error al importar',
        message: resultado.error,
        color: 'red',
        autoClose: 5000,
      });
      return;
    }

    // Cargar el contenido en el editor
    fijarCodigoFuente(resultado.contenido);
    fijarNombreArchivo(resultado.nombre);
    fijarArchivoActualId(null); // Es un archivo externo, no vinculado a localStorage
    procesar_codigo(resultado.contenido);

    // Mostrar resultado de validación
    if (resultado.cantidad_errores > 0 || resultado.cantidad_advertencias > 0) {
      notifications.show({
        title: 'Archivo importado con observaciones',
        message: `${resultado.cantidad_errores} error(es), ${resultado.cantidad_advertencias} advertencia(s). Revisa el panel de errores.`,
        color: 'yellow',
        autoClose: 5000,
      });
    } else {
      notifications.show({
        title: 'Archivo importado',
        message: `"${resultado.nombre}" cargado correctamente.`,
        color: 'green',
        autoClose: 3000,
      });
    }
  }, [procesar_codigo]);

  /**
   * Maneja la inserción de código DSL generado por la IA.
   * Reemplaza el contenido del editor con el código generado.
   *
   * @param {string} codigo - Código DSL a insertar
   */
  const manejar_insertar_codigo_ia = useCallback((codigo: string) => {
    fijarCodigoFuente(codigo);
    procesar_codigo(codigo);
  }, [procesar_codigo]);

  // Procesar el código inicial al montar y restaurar último archivo
  useEffect(() => {
    // Intentar restaurar el último archivo abierto
    const preferencias = obtener_preferencias();
    if (preferencias.ultimo_archivo_id) {
      const archivo = obtener_archivo(preferencias.ultimo_archivo_id);
      if (archivo && archivo.versiones.length > 0) {
        const contenido = archivo.versiones[0].contenido;
        fijarArchivoActualId(archivo.id);
        fijarNombreArchivo(archivo.nombre);
        fijarCodigoFuente(contenido);
        procesar_codigo(contenido);
        return;
      }
    }

    // Si no hay archivo guardado, usar el documento de ejemplo
    procesar_codigo(codigo_fuente);

    return () => {
      if (temporizador_ref.current) {
        clearTimeout(temporizador_ref.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Atajos de teclado globales
  useEffect(() => {
    const manejar_atajo = (evento: KeyboardEvent) => {
      const ctrl_o_meta = evento.ctrlKey || evento.metaKey;

      // Ctrl+S: Guardar
      if (ctrl_o_meta && evento.key === 's') {
        evento.preventDefault();
        manejar_guardar();
        return;
      }

      // Ctrl+Shift+E: Abrir panel de exportación
      if (ctrl_o_meta && evento.shiftKey && evento.key === 'E') {
        evento.preventDefault();
        manejar_exportar();
        return;
      }

      // Ctrl+N: Nuevo archivo
      if (ctrl_o_meta && evento.key === 'n') {
        evento.preventDefault();
        manejar_nuevo_archivo();
        return;
      }

      // Ctrl+Shift+D: Borrar contenido
      if (ctrl_o_meta && evento.shiftKey && evento.key === 'D') {
        evento.preventDefault();
        manejar_borrar();
        return;
      }

      // Ctrl+E: Exportar/descargar .esldmd
      if (ctrl_o_meta && !evento.shiftKey && evento.key === 'e') {
        evento.preventDefault();
        manejar_descargar_esldmd();
        return;
      }

      // Ctrl+O: Abrir archivo
      if (ctrl_o_meta && !evento.shiftKey && evento.key === 'o') {
        evento.preventDefault();
        manejar_abrir_archivo();
        return;
      }

      // Ctrl+Shift+U: Importar .esldmd
      if (ctrl_o_meta && evento.shiftKey && evento.key === 'U') {
        evento.preventDefault();
        manejar_importar_esldmd();
        return;
      }

      // Ctrl+Shift+L: Alternar tema
      if (ctrl_o_meta && evento.shiftKey && evento.key === 'L') {
        evento.preventDefault();
        alternar_tema_ref.current();
        return;
      }
    };

    window.addEventListener('keydown', manejar_atajo);
    return () => window.removeEventListener('keydown', manejar_atajo);
  }, [manejar_guardar, manejar_exportar, manejar_descargar_esldmd, manejar_nuevo_archivo, manejar_borrar, manejar_abrir_archivo, manejar_importar_esldmd]);

  return (
    <Box style={{ height: '100vh', display: 'flex', flexDirection: 'column' }} role="application" aria-label="es-ldmd - Editor de diagramas entidad-relación">
      <BarraHerramientas
        al_guardar={manejar_guardar}
        al_exportar={manejar_exportar}
        al_descargar_esldmd={manejar_descargar_esldmd}
        al_importar_esldmd={manejar_importar_esldmd}
        al_nuevo_archivo={manejar_nuevo_archivo}
        al_borrar={manejar_borrar}
        al_abrir_archivo={manejar_abrir_archivo}
        nombre_archivo={nombre_archivo}
      />
      <Box style={{ flex: 1, overflow: 'hidden' }}>
        <Allotment vertical={es_pantalla_pequena ?? false}>
          <Allotment.Pane minSize={es_pantalla_pequena ? 150 : 250} preferredSize={es_pantalla_pequena ? '50%' : '33%'}>
            <EditorCodigo
              ref={editor_ref}
              valor={codigo_fuente}
              al_cambiar={manejar_cambio_editor}
            />
          </Allotment.Pane>
          <Allotment.Pane minSize={es_pantalla_pequena ? 150 : 300} preferredSize={es_pantalla_pequena ? '30%' : '40%'}>
            <VistaDiagrama
              modelo={modelo_diagrama}
              tipo_layout={tipo_layout}
              al_cambiar_layout={(tipo) => {
                fijarTipoLayout(tipo);
                if (ast_actual) {
                  fijarModeloDiagrama(generar_modelo_diagrama(ast_actual, tipo));
                }
              }}
            />
          </Allotment.Pane>
          <Allotment.Pane minSize={es_pantalla_pequena ? 100 : 200} preferredSize={es_pantalla_pequena ? '20%' : '27%'}>
            <PanelHerramientas
              errores={errores}
              al_click_error={manejar_click_error}
              al_insertar_codigo={manejar_insertar_codigo_ia}
            />
          </Allotment.Pane>
        </Allotment>
      </Box>

      {/* Panel de exportación (Drawer) */}
      <PanelExportacion
        abierto={panel_exportacion_abierto}
        al_cerrar={() => fijarPanelExportacionAbierto(false)}
        ast={ast_actual}
        modelo={modelo_diagrama}
      />

      {/* Modal del gestor de archivos */}
      <GestorArchivos
        abierto={gestor_archivos_abierto}
        al_cerrar={() => fijarGestorArchivosAbierto(false)}
        al_abrir_archivo={manejar_archivo_seleccionado}
        contenido_actual={codigo_fuente}
      />
    </Box>
  );
}
