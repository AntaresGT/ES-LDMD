/**
 * @archivo gestor-almacenamiento.test.ts
 * @descripcion Pruebas unitarias para el gestor de almacenamiento local.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  obtener_archivos,
  crear_archivo,
  obtener_archivo,
  guardar_version,
  renombrar_archivo,
  eliminar_archivo,
  eliminar_version,
  limpiar_versiones,
  obtener_contenido_version,
  obtener_preferencias,
  guardar_preferencias,
} from '@/persistencia/gestor-almacenamiento';

/** Mock de localStorage */
const mock_storage: Record<string, string> = {};

beforeEach(() => {
  // Limpiar storage entre tests
  for (const key of Object.keys(mock_storage)) {
    delete mock_storage[key];
  }

  vi.stubGlobal('localStorage', {
    getItem: (key: string) => mock_storage[key] ?? null,
    setItem: (key: string, value: string) => {
      mock_storage[key] = value;
    },
    removeItem: (key: string) => {
      delete mock_storage[key];
    },
    clear: () => {
      for (const key of Object.keys(mock_storage)) {
        delete mock_storage[key];
      }
    },
  });
});

describe('gestión de archivos', () => {
  it('debería retornar lista vacía cuando no hay archivos', () => {
    const archivos = obtener_archivos();
    expect(archivos).toEqual([]);
  });

  it('debería crear un archivo nuevo', () => {
    const archivo = crear_archivo('Mi diagrama', 'Tabla usuarios { }');

    expect(archivo.id).toBeDefined();
    expect(archivo.nombre).toBe('Mi diagrama');
    expect(archivo.versiones).toHaveLength(1);
    expect(archivo.versiones[0].contenido).toBe('Tabla usuarios { }');
  });

  it('debería listar archivos creados', () => {
    crear_archivo('Archivo 1', 'contenido 1');
    crear_archivo('Archivo 2', 'contenido 2');

    const archivos = obtener_archivos();

    expect(archivos).toHaveLength(2);
    // El más reciente primero
    expect(archivos[0].nombre).toBe('Archivo 2');
    expect(archivos[1].nombre).toBe('Archivo 1');
  });

  it('debería obtener un archivo por ID', () => {
    const creado = crear_archivo('Test', 'contenido');
    const obtenido = obtener_archivo(creado.id);

    expect(obtenido).not.toBeNull();
    expect(obtenido!.nombre).toBe('Test');
  });

  it('debería retornar null para ID inexistente', () => {
    const resultado = obtener_archivo('no_existe');
    expect(resultado).toBeNull();
  });

  it('debería guardar una nueva versión', () => {
    const archivo = crear_archivo('Test', 'v1');
    const actualizado = guardar_version(archivo.id, 'v2');

    expect(actualizado).not.toBeNull();
    expect(actualizado!.versiones).toHaveLength(2);
    // La más reciente primero
    expect(actualizado!.versiones[0].contenido).toBe('v2');
    expect(actualizado!.versiones[1].contenido).toBe('v1');
  });

  it('debería retornar null al guardar versión de archivo inexistente', () => {
    const resultado = guardar_version('no_existe', 'contenido');
    expect(resultado).toBeNull();
  });

  it('debería renombrar un archivo', () => {
    const archivo = crear_archivo('Original', 'contenido');
    const actualizado = renombrar_archivo(archivo.id, 'Nuevo nombre');

    expect(actualizado).not.toBeNull();
    expect(actualizado!.nombre).toBe('Nuevo nombre');
  });

  it('debería eliminar un archivo', () => {
    const archivo = crear_archivo('Para eliminar', 'contenido');
    const eliminado = eliminar_archivo(archivo.id);

    expect(eliminado).toBe(true);
    expect(obtener_archivos()).toHaveLength(0);
  });

  it('debería retornar false al eliminar archivo inexistente', () => {
    const resultado = eliminar_archivo('no_existe');
    expect(resultado).toBe(false);
  });

  it('debería eliminar una versión específica', () => {
    const archivo = crear_archivo('Test', 'v1');
    guardar_version(archivo.id, 'v2');

    const actualizado_pre = obtener_archivo(archivo.id)!;
    expect(actualizado_pre.versiones).toHaveLength(2);

    const version_a_eliminar = actualizado_pre.versiones[1].id;
    const resultado = eliminar_version(archivo.id, version_a_eliminar);

    expect(resultado).not.toBeNull();
    expect(resultado!.versiones).toHaveLength(1);
    expect(resultado!.versiones[0].contenido).toBe('v2');
  });

  it('debería limpiar versiones antiguas', () => {
    const archivo = crear_archivo('Test', 'v1');
    guardar_version(archivo.id, 'v2');
    guardar_version(archivo.id, 'v3');

    const resultado = limpiar_versiones(archivo.id);

    expect(resultado).not.toBeNull();
    expect(resultado!.versiones).toHaveLength(1);
    expect(resultado!.versiones[0].contenido).toBe('v3');
  });

  it('debería obtener contenido de una versión específica', () => {
    const archivo = crear_archivo('Test', 'contenido v1');
    guardar_version(archivo.id, 'contenido v2');

    const actualizado = obtener_archivo(archivo.id)!;
    const version_antigua = actualizado.versiones[1];

    const contenido = obtener_contenido_version(archivo.id, version_antigua.id);
    expect(contenido).toBe('contenido v1');
  });

  it('debería retornar null para versión inexistente', () => {
    const archivo = crear_archivo('Test', 'contenido');
    const resultado = obtener_contenido_version(archivo.id, 'version_falsa');
    expect(resultado).toBeNull();
  });

  it('debería retornar null para archivo inexistente al obtener versión', () => {
    const resultado = obtener_contenido_version('archivo_falso', 'version_falsa');
    expect(resultado).toBeNull();
  });
});

describe('preferencias', () => {
  it('debería retornar preferencias por defecto', () => {
    const prefs = obtener_preferencias();
    expect(prefs.ultimo_archivo_id).toBeNull();
    expect(prefs.tema).toBe('dark');
  });

  it('debería guardar y recuperar preferencias', () => {
    guardar_preferencias({ tema: 'light' });
    const prefs = obtener_preferencias();
    expect(prefs.tema).toBe('light');
  });

  it('debería actualizar solo las preferencias proporcionadas', () => {
    guardar_preferencias({ tema: 'light' });
    guardar_preferencias({ ultimo_archivo_id: '123' });

    const prefs = obtener_preferencias();
    expect(prefs.tema).toBe('light');
    expect(prefs.ultimo_archivo_id).toBe('123');
  });
});
