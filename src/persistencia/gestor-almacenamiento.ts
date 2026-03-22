/**
 * @archivo gestor-almacenamiento.ts
 * @descripcion Gestión de persistencia local usando localStorage.
 * Soporta múltiples archivos, versionado, recuperación y borrado.
 */

/**
 * Versión de un archivo guardado.
 */
export interface VersionArchivo {
  /** ID único de la versión */
  id: string;
  /** Fecha de creación (ISO string) */
  fecha: string;
  /** Contenido del código fuente */
  contenido: string;
}

/**
 * Archivo guardado en localStorage.
 */
export interface ArchivoGuardado {
  /** ID único del archivo */
  id: string;
  /** Nombre del archivo */
  nombre: string;
  /** Fecha de creación (ISO string) */
  fecha_creacion: string;
  /** Fecha de última modificación (ISO string) */
  fecha_modificacion: string;
  /** Versiones del archivo (la más reciente primero) */
  versiones: VersionArchivo[];
}

/**
 * Preferencias del usuario.
 */
export interface PreferenciasUsuario {
  /** ID del último archivo abierto */
  ultimo_archivo_id: string | null;
  /** Tema preferido */
  tema: 'dark' | 'light';
}

/** Clave de localStorage para archivos */
const CLAVE_ARCHIVOS = 'esldmd_archivos';
/** Clave de localStorage para preferencias */
const CLAVE_PREFERENCIAS = 'esldmd_preferencias';
/** Máximo de versiones por archivo */
const MAX_VERSIONES = 50;

/**
 * Genera un ID único simple.
 *
 * @returns {string} ID único
 */
function generar_id(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================
// Operaciones con archivos
// ============================================================

/**
 * Obtiene todos los archivos guardados.
 *
 * @returns {ArchivoGuardado[]} Lista de archivos
 */
export function obtener_archivos(): ArchivoGuardado[] {
  try {
    const datos = localStorage.getItem(CLAVE_ARCHIVOS);
    if (!datos) return [];
    return JSON.parse(datos) as ArchivoGuardado[];
  } catch {
    return [];
  }
}

/**
 * Guarda la lista de archivos en localStorage.
 *
 * @param {ArchivoGuardado[]} archivos - Lista de archivos a guardar
 */
function guardar_archivos(archivos: ArchivoGuardado[]): void {
  localStorage.setItem(CLAVE_ARCHIVOS, JSON.stringify(archivos));
}

/**
 * Obtiene un archivo por su ID.
 *
 * @param {string} id - ID del archivo
 * @returns {ArchivoGuardado | null} Archivo encontrado o null
 */
export function obtener_archivo(id: string): ArchivoGuardado | null {
  const archivos = obtener_archivos();
  return archivos.find((a) => a.id === id) ?? null;
}

/**
 * Crea un nuevo archivo y lo guarda.
 *
 * @param {string} nombre - Nombre del archivo
 * @param {string} contenido - Contenido inicial
 * @returns {ArchivoGuardado} Archivo creado
 */
export function crear_archivo(nombre: string, contenido: string): ArchivoGuardado {
  const ahora = new Date().toISOString();
  const archivo: ArchivoGuardado = {
    id: generar_id(),
    nombre,
    fecha_creacion: ahora,
    fecha_modificacion: ahora,
    versiones: [
      {
        id: generar_id(),
        fecha: ahora,
        contenido,
      },
    ],
  };

  const archivos = obtener_archivos();
  archivos.unshift(archivo);
  guardar_archivos(archivos);

  return archivo;
}

/**
 * Guarda una nueva versión de un archivo existente.
 *
 * @param {string} id - ID del archivo
 * @param {string} contenido - Nuevo contenido
 * @returns {ArchivoGuardado | null} Archivo actualizado o null si no existe
 */
export function guardar_version(id: string, contenido: string): ArchivoGuardado | null {
  const archivos = obtener_archivos();
  const indice = archivos.findIndex((a) => a.id === id);

  if (indice === -1) return null;

  const ahora = new Date().toISOString();
  const nueva_version: VersionArchivo = {
    id: generar_id(),
    fecha: ahora,
    contenido,
  };

  // Agregar al inicio (más reciente primero)
  archivos[indice].versiones.unshift(nueva_version);
  archivos[indice].fecha_modificacion = ahora;

  // Limitar cantidad de versiones
  if (archivos[indice].versiones.length > MAX_VERSIONES) {
    archivos[indice].versiones = archivos[indice].versiones.slice(0, MAX_VERSIONES);
  }

  guardar_archivos(archivos);

  return archivos[indice];
}

/**
 * Renombra un archivo.
 *
 * @param {string} id - ID del archivo
 * @param {string} nuevo_nombre - Nuevo nombre
 * @returns {ArchivoGuardado | null} Archivo actualizado o null
 */
export function renombrar_archivo(id: string, nuevo_nombre: string): ArchivoGuardado | null {
  const archivos = obtener_archivos();
  const indice = archivos.findIndex((a) => a.id === id);

  if (indice === -1) return null;

  archivos[indice].nombre = nuevo_nombre;
  archivos[indice].fecha_modificacion = new Date().toISOString();
  guardar_archivos(archivos);

  return archivos[indice];
}

/**
 * Elimina un archivo y todas sus versiones.
 *
 * @param {string} id - ID del archivo a eliminar
 * @returns {boolean} true si se eliminó, false si no existía
 */
export function eliminar_archivo(id: string): boolean {
  const archivos = obtener_archivos();
  const archivos_filtrados = archivos.filter((a) => a.id !== id);

  if (archivos_filtrados.length === archivos.length) return false;

  guardar_archivos(archivos_filtrados);
  return true;
}

/**
 * Elimina una versión específica de un archivo.
 *
 * @param {string} archivo_id - ID del archivo
 * @param {string} version_id - ID de la versión a eliminar
 * @returns {ArchivoGuardado | null} Archivo actualizado o null
 */
export function eliminar_version(
  archivo_id: string,
  version_id: string,
): ArchivoGuardado | null {
  const archivos = obtener_archivos();
  const indice = archivos.findIndex((a) => a.id === archivo_id);

  if (indice === -1) return null;

  archivos[indice].versiones = archivos[indice].versiones.filter(
    (v) => v.id !== version_id,
  );
  guardar_archivos(archivos);

  return archivos[indice];
}

/**
 * Elimina todas las versiones de un archivo excepto la más reciente.
 *
 * @param {string} id - ID del archivo
 * @returns {ArchivoGuardado | null} Archivo actualizado o null
 */
export function limpiar_versiones(id: string): ArchivoGuardado | null {
  const archivos = obtener_archivos();
  const indice = archivos.findIndex((a) => a.id === id);

  if (indice === -1) return null;

  // Conservar solo la versión más reciente
  if (archivos[indice].versiones.length > 1) {
    archivos[indice].versiones = [archivos[indice].versiones[0]];
  }
  guardar_archivos(archivos);

  return archivos[indice];
}

/**
 * Obtiene el contenido de una versión específica.
 *
 * @param {string} archivo_id - ID del archivo
 * @param {string} version_id - ID de la versión
 * @returns {string | null} Contenido de la versión o null
 */
export function obtener_contenido_version(
  archivo_id: string,
  version_id: string,
): string | null {
  const archivo = obtener_archivo(archivo_id);
  if (!archivo) return null;

  const version = archivo.versiones.find((v) => v.id === version_id);
  return version?.contenido ?? null;
}

// ============================================================
// Preferencias
// ============================================================

/**
 * Obtiene las preferencias del usuario.
 *
 * @returns {PreferenciasUsuario} Preferencias actuales
 */
export function obtener_preferencias(): PreferenciasUsuario {
  try {
    const datos = localStorage.getItem(CLAVE_PREFERENCIAS);
    if (!datos) {
      return { ultimo_archivo_id: null, tema: 'dark' };
    }
    return JSON.parse(datos) as PreferenciasUsuario;
  } catch {
    return { ultimo_archivo_id: null, tema: 'dark' };
  }
}

/**
 * Guarda las preferencias del usuario.
 *
 * @param {Partial<PreferenciasUsuario>} preferencias - Preferencias a actualizar
 */
export function guardar_preferencias(preferencias: Partial<PreferenciasUsuario>): void {
  const actuales = obtener_preferencias();
  const nuevas = { ...actuales, ...preferencias };
  localStorage.setItem(CLAVE_PREFERENCIAS, JSON.stringify(nuevas));
}
