/**
 * @archivo PaginaErrorMinima.tsx
 * @descripcion Variante minimalista, sin Mantine ni dependencias del layout raíz.
 * Pensada para `global-error.tsx`, donde el RootLayout (y por lo tanto el
 * MantineProvider) NO está montado. Usa estilos inline para garantizar
 * renderización aunque la cascada CSS global haya fallado.
 */
'use client';

export interface PaginaErrorMinimaProps {
  /** Código HTTP a mostrar (ej. 500). */
  codigo: number;
  /** Título principal. */
  titulo: string;
  /** Mensaje descriptivo. */
  mensaje: string;
  /** Si es true, se muestra el botón "Intentar de nuevo". */
  mostrarReintento?: boolean;
  /** Callback para el botón de reintento. */
  alReintentar?: () => void;
}

const ESTILO_BOTON_BASE: React.CSSProperties = {
  display: 'inline-block',
  paddingInline: 24,
  paddingBlock: 12,
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 16,
  textDecoration: 'none',
  cursor: 'pointer',
  border: '1px solid transparent',
  transition: 'transform 120ms ease, opacity 120ms ease',
  fontFamily: 'inherit',
};

const ESTILO_BOTON_PRIMARIO: React.CSSProperties = {
  ...ESTILO_BOTON_BASE,
  color: '#0e0f12',
  background: 'linear-gradient(135deg, #74c0fc, #b197fc)',
};

const ESTILO_BOTON_SECUNDARIO: React.CSSProperties = {
  ...ESTILO_BOTON_BASE,
  color: '#e1ebfa',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.15)',
};

const ESTILO_BOTON_REINTENTO: React.CSSProperties = {
  ...ESTILO_BOTON_BASE,
  color: '#b4c8e6',
  background: 'transparent',
};

/**
 * Versión sin proveedores de UI para usarse en `global-error.tsx`.
 *
 * @param props - Configuración del contenido a mostrar.
 * @returns JSX renderizado.
 */
export function PaginaErrorMinima({
  codigo,
  titulo,
  mensaje,
  mostrarReintento = false,
  alReintentar,
}: PaginaErrorMinimaProps) {
  return (
    <main
      role="main"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        background:
          'radial-gradient(ellipse at 20% 0%, rgba(77,171,247,0.18), transparent 60%), radial-gradient(ellipse at 90% 30%, rgba(151,117,250,0.18), transparent 55%), #0e0f12',
        color: '#e1ebfa',
        fontFamily:
          '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 720 }}>
        <div
          aria-hidden="true"
          style={{
            fontSize: 'clamp(5rem, 14vw, 10rem)',
            lineHeight: 1,
            fontWeight: 800,
            letterSpacing: '-0.05em',
            background: 'linear-gradient(90deg, #74c0fc, #b197fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {codigo}
        </div>

        <h1
          style={{
            fontSize: 'clamp(1.6rem, 3.5vw, 2.6rem)',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            fontWeight: 700,
            margin: '24px 0 16px',
          }}
        >
          {titulo}
        </h1>

        <p
          style={{
            fontSize: 18,
            lineHeight: 1.6,
            color: '#b4c8e6',
            margin: '0 0 32px',
          }}
        >
          {mensaje}
        </p>

        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <a href="/" style={ESTILO_BOTON_PRIMARIO}>
            Ir al inicio
          </a>
          <a href="/aplicacion" style={ESTILO_BOTON_SECUNDARIO}>
            Abrir el editor
          </a>
          {mostrarReintento && alReintentar && (
            <button
              type="button"
              onClick={alReintentar}
              style={ESTILO_BOTON_REINTENTO}
            >
              Intentar de nuevo
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
