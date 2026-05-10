/**
 * @archivo codigos-http.ts
 * @descripcion Catálogo de códigos HTTP soportados por las páginas de error
 * personalizadas. Cada entrada contiene un título corto y un mensaje descriptivo
 * en español, listos para mostrarse al usuario.
 */

/** Información presentable de un código HTTP. */
export interface InfoCodigoHttp {
  /** Código HTTP numérico (ej. 404). */
  readonly codigo: number;
  /** Título breve, en español, para encabezados. */
  readonly titulo: string;
  /** Mensaje descriptivo orientado al usuario final. */
  readonly mensaje: string;
}

/** Mapa de códigos HTTP soportados con copy en español. */
export const CODIGOS_HTTP: Readonly<Record<number, InfoCodigoHttp>> = {
  400: {
    codigo: 400,
    titulo: 'Solicitud incorrecta',
    mensaje:
      'La solicitud no se entendió porque tiene un formato inválido o le faltan datos. Revisa la URL o intenta de nuevo.',
  },
  401: {
    codigo: 401,
    titulo: 'No autorizado',
    mensaje:
      'Necesitas iniciar sesión o presentar credenciales válidas para acceder a este recurso.',
  },
  403: {
    codigo: 403,
    titulo: 'Acceso prohibido',
    mensaje:
      'No tienes permisos para ver este contenido. Si crees que es un error, vuelve al inicio.',
  },
  404: {
    codigo: 404,
    titulo: 'No encontramos la página',
    mensaje:
      'La página que buscas no existe, fue movida o el enlace no es válido. Revisa la URL o vuelve al inicio.',
  },
  405: {
    codigo: 405,
    titulo: 'Método no permitido',
    mensaje:
      'El recurso existe, pero no acepta el método HTTP utilizado para esta solicitud.',
  },
  408: {
    codigo: 408,
    titulo: 'Tiempo de espera agotado',
    mensaje:
      'El servidor tardó demasiado en recibir tu solicitud. Verifica tu conexión e inténtalo de nuevo.',
  },
  410: {
    codigo: 410,
    titulo: 'Recurso eliminado',
    mensaje:
      'Este contenido ya no está disponible y no volverá. Te invitamos a explorar el resto del sitio.',
  },
  418: {
    codigo: 418,
    titulo: 'Soy una tetera',
    mensaje:
      'Esta es una respuesta de broma del estándar HTTP. Si llegaste aquí intencionalmente, ¡bien hecho!',
  },
  429: {
    codigo: 429,
    titulo: 'Demasiadas solicitudes',
    mensaje:
      'Has hecho muchas solicitudes en poco tiempo. Espera unos segundos y vuelve a intentarlo.',
  },
  500: {
    codigo: 500,
    titulo: 'Error interno del servidor',
    mensaje:
      'Algo salió mal en nuestro lado. Ya estamos al tanto. Intenta recargar o vuelve más tarde.',
  },
  502: {
    codigo: 502,
    titulo: 'Puerta de enlace incorrecta',
    mensaje:
      'Recibimos una respuesta inválida desde un servicio intermedio. Inténtalo nuevamente en unos momentos.',
  },
  503: {
    codigo: 503,
    titulo: 'Servicio no disponible',
    mensaje:
      'El servicio está temporalmente fuera de línea, probablemente por mantenimiento. Vuelve a intentarlo pronto.',
  },
  504: {
    codigo: 504,
    titulo: 'Tiempo de respuesta agotado',
    mensaje:
      'El servidor tardó demasiado en responder. Revisa tu conexión o inténtalo de nuevo en unos minutos.',
  },
};

/** Información genérica usada como respaldo para códigos no listados. */
export const INFO_CODIGO_DESCONOCIDO: InfoCodigoHttp = {
  codigo: 0,
  titulo: 'Ha ocurrido un error',
  mensaje:
    'No pudimos completar la operación solicitada. Vuelve al inicio o intenta nuevamente más tarde.',
};

/**
 * Devuelve la información asociada a un código HTTP, o un objeto genérico
 * cuando el código no está en el catálogo.
 *
 * @param codigo - Código HTTP a consultar.
 * @returns Información presentable del código (siempre devuelve algo).
 */
export function obtenerInfoCodigo(codigo: number): InfoCodigoHttp {
  return CODIGOS_HTTP[codigo] ?? { ...INFO_CODIGO_DESCONOCIDO, codigo };
}

/**
 * Indica si un código está soportado oficialmente en el catálogo.
 *
 * @param codigo - Código HTTP a verificar.
 * @returns true si el código existe en CODIGOS_HTTP.
 */
export function esCodigoSoportado(codigo: number): boolean {
  return Object.prototype.hasOwnProperty.call(CODIGOS_HTTP, codigo);
}
