import { NextResponse } from 'next/server';

export async function GET() {
  const estado = {
    estado: 'saludable',
    marca_temporal: new Date().toISOString(),
    entorno: process.env.NODE_ENV ?? 'desconocido',
    tiempo_activo_segundos: process.uptime(),
    uso_memoria: {
      rss_mb: +(process.memoryUsage().rss / 1024 / 1024).toFixed(2),
      heap_usado_mb: +(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
      heap_total_mb: +(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2),
    },
    version_node: process.version,
  };

  return NextResponse.json(estado, { status: 200 });
}
