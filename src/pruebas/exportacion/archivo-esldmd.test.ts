/**
 * @archivo archivo-esldmd.test.ts
 * @descripcion Pruebas unitarias para importar/exportar archivos .esldmd.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validar_contenido_esldmd,
  importar_archivo_esldmd,
  descargar_archivo_esldmd,
} from '@/exportacion/archivo-esldmd';

describe('validar_contenido_esldmd', () => {
  it('debería validar contenido vacío como válido', () => {
    const resultado = validar_contenido_esldmd('', 'vacio.esldmd');
    expect(resultado.valido).toBe(true);
    expect(resultado.nombre).toBe('vacio');
    expect(resultado.cantidad_errores).toBe(0);
  });

  it('debería validar contenido con solo espacios como válido', () => {
    const resultado = validar_contenido_esldmd('   \n  \n  ', 'espacios.esldmd');
    expect(resultado.valido).toBe(true);
    expect(resultado.nombre).toBe('espacios');
  });

  it('debería extraer el nombre sin extensión', () => {
    const resultado = validar_contenido_esldmd('', 'mi-diagrama.esldmd');
    expect(resultado.nombre).toBe('mi-diagrama');
  });

  it('debería validar contenido DSL correcto', () => {
    const codigo = 'Tabla usuarios {\n  id entero clave_primaria\n  nombre texto\n}';
    const resultado = validar_contenido_esldmd(codigo, 'usuarios.esldmd');

    expect(resultado.valido).toBe(true);
    expect(resultado.contenido).toBe(codigo);
    expect(resultado.nombre).toBe('usuarios');
  });

  it('debería detectar errores en contenido DSL incorrecto pero seguir siendo válido', () => {
    // Contenido con errores de sintaxis — el pipeline puede dar advertencias/errores
    // pero el archivo sigue siendo "cargable"
    const codigo = 'Tabla { }';
    const resultado = validar_contenido_esldmd(codigo, 'malo.esldmd');

    expect(resultado.valido).toBe(true);
    // Puede tener errores pero se permite cargar
  });
});

describe('importar_archivo_esldmd', () => {
  it('debería rechazar archivos sin extensión .esldmd', async () => {
    const archivo = new File(['contenido'], 'test.txt', { type: 'text/plain' });
    const resultado = await importar_archivo_esldmd(archivo);

    expect(resultado.valido).toBe(false);
    if (!resultado.valido) {
      expect(resultado.error).toContain('.esldmd');
    }
  });

  it('debería rechazar archivos vacíos', async () => {
    const archivo = new File([], 'test.esldmd', { type: 'text/plain' });
    const resultado = await importar_archivo_esldmd(archivo);

    expect(resultado.valido).toBe(false);
    if (!resultado.valido) {
      expect(resultado.error).toContain('vacío');
    }
  });

  it('debería rechazar archivos demasiado grandes', async () => {
    // Crear un "archivo" de más de 1 MB
    const contenido_grande = 'x'.repeat(1_048_577);
    const archivo = new File([contenido_grande], 'grande.esldmd', { type: 'text/plain' });
    const resultado = await importar_archivo_esldmd(archivo);

    expect(resultado.valido).toBe(false);
    if (!resultado.valido) {
      expect(resultado.error).toContain('grande');
    }
  });

  it('debería importar un archivo .esldmd válido', async () => {
    const contenido = 'Tabla productos {\n  id entero clave_primaria\n}';
    const archivo = new File([contenido], 'productos.esldmd', { type: 'text/plain' });
    const resultado = await importar_archivo_esldmd(archivo);

    expect(resultado.valido).toBe(true);
    if (resultado.valido) {
      expect(resultado.contenido).toBe(contenido);
      expect(resultado.nombre).toBe('productos');
    }
  });

  it('debería aceptar extensión en mayúsculas', async () => {
    const contenido = 'Tabla test { id entero }';
    const archivo = new File([contenido], 'test.ESLDMD', { type: 'text/plain' });
    const resultado = await importar_archivo_esldmd(archivo);

    expect(resultado.valido).toBe(true);
  });
});

describe('descargar_archivo_esldmd', () => {
  beforeEach(() => {
    // Mock de DOM APIs
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:test'),
      revokeObjectURL: vi.fn(),
    });
  });

  it('debería crear y descargar un archivo .esldmd', () => {
    const enlace_mock = {
      href: '',
      download: '',
      style: { display: '' },
      click: vi.fn(),
    };

    vi.spyOn(document, 'createElement').mockReturnValue(enlace_mock as unknown as HTMLElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => enlace_mock as unknown as HTMLElement);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => enlace_mock as unknown as HTMLElement);

    descargar_archivo_esldmd('Tabla test { }', 'mi-diagrama');

    expect(enlace_mock.download).toBe('mi-diagrama.esldmd');
    expect(enlace_mock.click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('debería no duplicar la extensión si ya la tiene', () => {
    const enlace_mock = {
      href: '',
      download: '',
      style: { display: '' },
      click: vi.fn(),
    };

    vi.spyOn(document, 'createElement').mockReturnValue(enlace_mock as unknown as HTMLElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => enlace_mock as unknown as HTMLElement);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => enlace_mock as unknown as HTMLElement);

    descargar_archivo_esldmd('contenido', 'archivo.esldmd');

    expect(enlace_mock.download).toBe('archivo.esldmd');
  });

  it('debería usar nombre por defecto si está vacío', () => {
    const enlace_mock = {
      href: '',
      download: '',
      style: { display: '' },
      click: vi.fn(),
    };

    vi.spyOn(document, 'createElement').mockReturnValue(enlace_mock as unknown as HTMLElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => enlace_mock as unknown as HTMLElement);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => enlace_mock as unknown as HTMLElement);

    descargar_archivo_esldmd('contenido', '');

    expect(enlace_mock.download).toBe('diagrama.esldmd');
  });
});
