/**
 * @archivo ExportarSQL.tsx
 * @descripcion Panel de exportación de código SQL.
 * Permite seleccionar el motor de base de datos (PostgreSQL/MariaDB),
 * ver la previsualización del SQL generado y copiar al portapapeles.
 */
'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Text,
  Select,
  Button,
  Switch,
  Group,
  Stack,
  ScrollArea,
  Tooltip,
  CopyButton,
} from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { VscCopy, VscCheck, VscDesktopDownload } from 'react-icons/vsc';
import { DocumentoAST } from '@/dominio/tipos';
import { ast_a_sql, OpcionesSQL } from '@/exportacion/ast-a-sql';
import { MotorBD } from '@/exportacion/conversor-tipos';

/**
 * Propiedades del componente ExportarSQL.
 */
interface PropiedadesExportarSQL {
  /** AST del documento actual */
  ast: DocumentoAST | null;
}

/**
 * Panel de exportación SQL con selector de motor,
 * opciones y previsualización del código generado.
 *
 * @param {PropiedadesExportarSQL} props - Propiedades del componente
 * @returns {JSX.Element} Panel de exportación SQL
 */
export function ExportarSQL({ ast }: PropiedadesExportarSQL) {
  const [motor, fijarMotor] = useState<MotorBD>('postgresql');
  const [si_no_existe, fijarSiNoExiste] = useState(false);
  const [incluir_drop, fijarIncluirDrop] = useState(false);

  /**
   * Genera el SQL a partir del AST y las opciones seleccionadas.
   */
  const sql_generado = useMemo(() => {
    if (!ast || ast.tablas.length === 0) {
      return '';
    }

    const opciones: OpcionesSQL = {
      motor,
      si_no_existe,
      incluir_drop,
    };

    try {
      return ast_a_sql(ast, opciones);
    } catch {
      return '-- Error al generar el código SQL';
    }
  }, [ast, motor, si_no_existe, incluir_drop]);

  /**
   * Maneja el cambio de motor de base de datos.
   */
  const manejar_cambio_motor = useCallback((valor: string | null) => {
    if (valor === 'postgresql' || valor === 'mariadb') {
      fijarMotor(valor);
    }
  }, []);

  const tiene_contenido = sql_generado.length > 0 && ast && ast.tablas.length > 0;

  /**
   * Descarga el SQL generado como archivo .sql.
   */
  const descargar_sql = useCallback(() => {
    if (!sql_generado) return;
    const extension = motor === 'postgresql' ? 'pgsql' : 'sql';
    const blob = new Blob([sql_generado], { type: 'text/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `esquema.${extension}`;
    enlace.click();
    URL.revokeObjectURL(url);
  }, [sql_generado, motor]);

  return (
    <Stack gap="md" p="md" style={{ height: '100%' }}>
      {/* Selector de motor */}
      <Select
        label="Motor de base de datos"
        data={[
          { value: 'postgresql', label: 'PostgreSQL' },
          { value: 'mariadb', label: 'MariaDB' },
        ]}
        value={motor}
        onChange={manejar_cambio_motor}
        size="sm"
        allowDeselect={false}
      />

      {/* Opciones */}
      <Stack gap="xs">
        <Text size="xs" fw={600} c="dimmed">
          OPCIONES
        </Text>
        <Switch
          label="IF NOT EXISTS"
          checked={si_no_existe}
          onChange={(evento) => fijarSiNoExiste(evento.currentTarget.checked)}
          size="sm"
        />
        <Switch
          label="DROP TABLE antes de CREATE"
          checked={incluir_drop}
          onChange={(evento) => fijarIncluirDrop(evento.currentTarget.checked)}
          size="sm"
        />
      </Stack>

      {/* Previsualización del SQL */}
      <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Group justify="space-between" mb="xs">
          <Text size="xs" fw={600} c="dimmed">
            CÓDIGO SQL
          </Text>
          {tiene_contenido && (
            <CopyButton value={sql_generado} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copiado' : 'Copiar al portapapeles'} withArrow>
                  <Button
                    variant="subtle"
                    color={copied ? 'teal' : 'gray'}
                    size="compact-xs"
                    onClick={copy}
                    leftSection={
                      copied ? <VscCheck size={12} /> : <VscCopy size={12} />
                    }
                  >
                    {copied ? 'Copiado' : 'Copiar'}
                  </Button>
                </Tooltip>
              )}
            </CopyButton>
          )}
        </Group>

        <ScrollArea
          style={{
            flex: 1,
            border: '1px solid var(--mantine-color-default-border)',
            borderRadius: 'var(--mantine-radius-sm)',
          }}
        >
          {tiene_contenido ? (
            <CodeHighlight
              code={sql_generado}
              language="sql"
              copyLabel="Copiar"
              copiedLabel="Copiado"
              withCopyButton={false}
              styles={{
                code: {
                  fontSize: 12,
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                },
              }}
            />
          ) : (
            <Box p="xl" style={{ textAlign: 'center' }}>
              <Text size="sm" c="dimmed">
                Escribe código en el editor para generar SQL
              </Text>
            </Box>
          )}
        </ScrollArea>
      </Box>

      {/* Botón de descargar */}
      {tiene_contenido && (
        <Button
          leftSection={<VscDesktopDownload size={16} />}
          onClick={descargar_sql}
          fullWidth
        >
          Descargar archivo .sql
        </Button>
      )}
    </Stack>
  );
}
