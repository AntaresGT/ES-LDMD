# ============================================================
# Stage 1: Base - imagen base con dependencias del sistema
# ============================================================
FROM node:22-alpine AS base

# Instalar parches de seguridad del sistema
RUN apk update && apk upgrade --no-cache

# ============================================================
# Stage 2: Dependencies - instalar solo dependencias
# ============================================================
FROM base AS deps

WORKDIR /app

# Copiar solo los archivos de manifiesto para aprovechar cache de capas
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Instalar dependencias según el lockfile disponible
RUN \
  if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm install --frozen-lockfile; \
  elif [ -f yarn.lock ]; then \
    yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci; \
  else \
    echo "No lockfile found." && exit 1; \
  fi

# ============================================================
# Stage 3: Builder - compilar la aplicación
# ============================================================
FROM base AS builder

WORKDIR /app

# Copiar dependencias instaladas
COPY --from=deps /app/node_modules ./node_modules

# Copiar el código fuente
COPY . .

# Desactivar telemetría de Next.js durante el build
ENV NEXT_TELEMETRY_DISABLED=1

# Build de producción (genera .next/standalone gracias a output: "standalone")
RUN npm run build

# ============================================================
# Stage 4: Runner - imagen final mínima de producción
# ============================================================
FROM node:22-alpine AS runner

WORKDIR /app

# Instalar parches de seguridad y eliminar cache
RUN apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*

# Variables de entorno de producción
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# --- Hardening de seguridad ---

# Crear grupo y usuario no-root con UID/GID alto y sin shell
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs --shell /sbin/nologin nextjs

# Crear directorio de cache para Next.js con permisos correctos
RUN mkdir -p .next && chown nextjs:nodejs .next

# Copiar assets estáticos (public)
COPY --from=builder /app/public ./public

# Copiar el output standalone (incluye server.js y node_modules mínimos)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copiar assets estáticos generados por el build
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cambiar a usuario no-root
USER nextjs

# Exponer el puerto (Dokploy lo mapea automáticamente)
EXPOSE 3000

# Configurar hostname para escuchar en todas las interfaces (necesario en Docker)
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Health check para que Dokploy pueda verificar el estado del contenedor
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Ejecutar el servidor standalone de Next.js
CMD ["node", "server.js"]
