# ============================================================
# Next.js 16 - Dockerfile (standalone output)
# Basado en el ejemplo oficial de Vercel:
# https://github.com/vercel/next.js/tree/canary/examples/with-docker
# ============================================================

# IMPORTANT: Node.js Version Maintenance
# Esta versión es la LTS recomendada por Vercel al momento de escritura.
# Revisa periódicamente https://nodejs.org/ y actualiza este ARG.
ARG NODE_VERSION=24.13.0-slim

# ============================================================
# Stage 1: Dependencies - instalar solo dependencias
# ============================================================
FROM node:${NODE_VERSION} AS dependencies

WORKDIR /app

# Copiar solo manifiestos para aprovechar la cache de capas
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* .npmrc* ./

# Instalar dependencias con BuildKit cache mounts para acelerar builds
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/usr/local/share/.cache/yarn \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund; \
    elif [ -f yarn.lock ]; then \
      corepack enable yarn && yarn install --frozen-lockfile --production=false; \
    elif [ -f pnpm-lock.yaml ]; then \
      corepack enable pnpm && pnpm install --frozen-lockfile; \
    else \
      echo "No lockfile found." && exit 1; \
    fi

# ============================================================
# Stage 2: Builder - compilar la aplicación
# ============================================================
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

# Copiar dependencias instaladas
COPY --from=dependencies /app/node_modules ./node_modules

# Copiar el código fuente
COPY . .

# Variables de entorno de build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build de producción (genera .next/standalone gracias a output: "standalone")
RUN if [ -f package-lock.json ]; then \
      npm run build; \
    elif [ -f yarn.lock ]; then \
      corepack enable yarn && yarn build; \
    elif [ -f pnpm-lock.yaml ]; then \
      corepack enable pnpm && pnpm build; \
    else \
      echo "No lockfile found." && exit 1; \
    fi

# ============================================================
# Stage 3: Runner - imagen final mínima de producción
# ============================================================
FROM node:${NODE_VERSION} AS runner

WORKDIR /app

# Variables de entorno de producción
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copiar assets estáticos (public)
COPY --from=builder --chown=node:node /app/public ./public

# Crear directorio de cache para Next.js con permisos correctos
RUN mkdir .next && chown node:node .next

# Copiar el output standalone (incluye server.js y node_modules mínimos)
COPY --from=builder --chown=node:node /app/.next/standalone ./

# Copiar assets estáticos generados por el build
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Cambiar a usuario no-root (incluido en la imagen oficial de node)
USER node

# Exponer el puerto (Dokploy lo mapea automáticamente)
EXPOSE 3000

# Health check para que Dokploy pueda verificar el estado del contenedor
#HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
#  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/salud || exit 1

# Ejecutar el servidor standalone de Next.js
CMD ["node", "server.js"]
