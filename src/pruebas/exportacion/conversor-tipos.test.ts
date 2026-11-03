/**
 * @archivo conversor-tipos.test.ts
 * @descripcion Pruebas unitarias para el conversor de tipos DSL a SQL.
 */

import { describe, it, expect } from 'vitest';
import { convertir_tipo } from '@/exportacion/conversor-tipos';

describe('convertir_tipo', () => {
  describe('tipos simples sin parámetros', () => {
    it.each([
      ['entero', 'INTEGER'],
      ['texto', 'TEXT'],
      ['fecha', 'DATE'],
      ['lógico', 'BOOLEAN'],
      ['logico', 'BOOLEAN'],
      ['log', 'BOOLEAN'],
      ['decimal', 'DECIMAL'],
      ['entero_grande', 'BIGINT'],
      ['entero_pequeño', 'SMALLINT'],
      ['flotante', 'FLOAT'],
      ['fecha_hora', 'TIMESTAMP'],
      ['hora', 'TIME'],
      ['fecha_hora_zona', 'TIMESTAMPTZ'],
      ['json', 'JSON'],
      ['jsonb', 'JSONB'],
      ['uuid', 'UUID'],
    ])('debería convertir "%s" a "%s"', (tipo_es, tipo_sql) => {
      expect(convertir_tipo(tipo_es, [], 'postgresql')).toBe(tipo_sql);
      expect(convertir_tipo(tipo_es, [], 'mariadb')).toBe(tipo_sql);
    });
  });

  describe('tipos parametrizados', () => {
    it('debería convertir texto(100) a VARCHAR(100)', () => {
      expect(convertir_tipo('texto', ['100'], 'postgresql')).toBe('VARCHAR(100)');
      expect(convertir_tipo('texto', ['100'], 'mariadb')).toBe('VARCHAR(100)');
    });

    it('debería convertir caracter(10) a CHAR(10)', () => {
      expect(convertir_tipo('caracter', ['10'], 'postgresql')).toBe('CHAR(10)');
      expect(convertir_tipo('caracter', ['10'], 'mariadb')).toBe('CHAR(10)');
    });

    it('debería convertir decimal(10, 2) a DECIMAL(10, 2)', () => {
      expect(convertir_tipo('decimal', ['10', '2'], 'postgresql')).toBe('DECIMAL(10, 2)');
    });
  });

  describe('tipo listado', () => {
    it('debería convertir listado(entero) a INTEGER[] en PostgreSQL', () => {
      expect(convertir_tipo('listado', ['entero'], 'postgresql')).toBe('INTEGER[]');
    });

    it('debería convertir listado(texto) a TEXT[] en PostgreSQL', () => {
      expect(convertir_tipo('listado', ['texto'], 'postgresql')).toBe('TEXT[]');
    });

    it('debería convertir listado(entero) a JSON en MariaDB', () => {
      expect(convertir_tipo('listado', ['entero'], 'mariadb')).toBe('JSON');
    });

    it('debería manejar listado sin tipo interno', () => {
      expect(convertir_tipo('listado', [], 'postgresql')).toBe('TEXT[]');
    });
  });

  describe('tipo mapa', () => {
    it('debería convertir mapa(texto, entero) a JSON', () => {
      expect(convertir_tipo('mapa', ['texto', 'entero'], 'postgresql')).toBe('JSON');
      expect(convertir_tipo('mapa', ['texto', 'entero'], 'mariadb')).toBe('JSON');
    });
  });

  describe('tipo enum', () => {
    it('debería convertir enum con valores', () => {
      expect(convertir_tipo('enum', ["'activo'", "'inactivo'"], 'postgresql'))
        .toBe("ENUM('activo', 'inactivo')");
    });

    it('debería convertir enum con múltiples valores', () => {
      expect(convertir_tipo('enum', ["'a'", "'b'", "'c'"], 'mariadb'))
        .toBe("ENUM('a', 'b', 'c')");
    });
  });

  describe('passthrough', () => {
    it('debería conservar tipos no reconocidos tal cual', () => {
      expect(convertir_tipo('nchar', ['10'], 'postgresql')).toBe('nchar(10)');
    });

    it('debería conservar tipos desconocidos simples tal cual', () => {
      expect(convertir_tipo('serial', [], 'postgresql')).toBe('serial');
    });

    it('debería conservar tipos desconocidos con parámetros tal cual', () => {
      expect(convertir_tipo('tinyint', ['1'], 'mariadb')).toBe('tinyint(1)');
    });
  });

  describe('MySQL', () => {
    it.each([
      ['jsonb', 'JSON'],
      ['uuid', 'CHAR(36)'],
      ['fecha_hora', 'DATETIME'],
      ['fecha_hora_zona', 'TIMESTAMP'],
      ['entero', 'INTEGER'],
    ])('debería convertir "%s" a "%s"', (tipo_es, tipo_sql) => {
      expect(convertir_tipo(tipo_es, [], 'mysql')).toBe(tipo_sql);
    });

    it('debería convertir listado y mapa a JSON', () => {
      expect(convertir_tipo('listado', ['entero'], 'mysql')).toBe('JSON');
      expect(convertir_tipo('mapa', ['texto', 'entero'], 'mysql')).toBe('JSON');
    });

    it('debería convertir enum nativo', () => {
      expect(convertir_tipo('enum', ["'a'", "'b'"], 'mysql')).toBe("ENUM('a', 'b')");
    });
  });

  describe('SQL Server', () => {
    it.each([
      ['entero', 'INT'],
      ['texto', 'NVARCHAR(MAX)'],
      ['lógico', 'BIT'],
      ['fecha_hora', 'DATETIME2'],
      ['fecha_hora_zona', 'DATETIMEOFFSET'],
      ['json', 'NVARCHAR(MAX)'],
      ['jsonb', 'NVARCHAR(MAX)'],
      ['uuid', 'UNIQUEIDENTIFIER'],
    ])('debería convertir "%s" a "%s"', (tipo_es, tipo_sql) => {
      expect(convertir_tipo(tipo_es, [], 'sqlserver')).toBe(tipo_sql);
    });

    it('debería convertir texto(n) a NVARCHAR(n)', () => {
      expect(convertir_tipo('texto', ['100'], 'sqlserver')).toBe('NVARCHAR(100)');
    });

    it('debería convertir caracter(n) a NCHAR(n)', () => {
      expect(convertir_tipo('caracter', ['10'], 'sqlserver')).toBe('NCHAR(10)');
    });

    it('debería convertir listado y mapa a NVARCHAR(MAX)', () => {
      expect(convertir_tipo('listado', ['entero'], 'sqlserver')).toBe('NVARCHAR(MAX)');
      expect(convertir_tipo('mapa', ['texto', 'entero'], 'sqlserver')).toBe('NVARCHAR(MAX)');
    });

    it('debería convertir enum a NVARCHAR(255)', () => {
      expect(convertir_tipo('enum', ["'a'", "'b'"], 'sqlserver')).toBe('NVARCHAR(255)');
    });
  });

  describe('SQLite', () => {
    it.each([
      ['entero', 'INTEGER'],
      ['entero_grande', 'BIGINT'],
      ['entero_pequeño', 'SMALLINT'],
      ['lógico', 'INTEGER'],
      ['fecha', 'TEXT'],
      ['hora', 'TEXT'],
      ['fecha_hora', 'TEXT'],
      ['fecha_hora_zona', 'TEXT'],
      ['json', 'TEXT'],
      ['jsonb', 'TEXT'],
      ['uuid', 'TEXT'],
      ['flotante', 'REAL'],
      ['texto', 'TEXT'],
    ])('debería convertir "%s" a "%s"', (tipo_es, tipo_sql) => {
      expect(convertir_tipo(tipo_es, [], 'sqlite')).toBe(tipo_sql);
    });

    it('debería convertir listado y mapa a TEXT', () => {
      expect(convertir_tipo('listado', ['entero'], 'sqlite')).toBe('TEXT');
      expect(convertir_tipo('mapa', ['texto', 'entero'], 'sqlite')).toBe('TEXT');
    });

    it('debería convertir enum a TEXT', () => {
      expect(convertir_tipo('enum', ["'a'", "'b'"], 'sqlite')).toBe('TEXT');
    });
  });
});
