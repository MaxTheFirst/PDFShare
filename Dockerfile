# Multi-stage build для оптимизации размера образа

# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Копировать package files
COPY package*.json ./

# Установить production зависимости
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Копировать package files
COPY package*.json ./

# Установить все зависимости (включая dev)
RUN npm ci

# Копировать исходный код
COPY . .

# Собрать frontend
RUN npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

# Установить переменные окружения
ENV NODE_ENV=production
ENV PORT=3000

# Создать non-root пользователя
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Копировать production зависимости из deps stage
COPY --from=deps --chown=appuser:nodejs /app/node_modules ./node_modules

# Копировать собранное приложение из builder stage
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/package*.json ./

# Копировать необходимые конфигурационные файлы
COPY --chown=appuser:nodejs server ./server
COPY --chown=appuser:nodejs shared ./shared
COPY --chown=appuser:nodejs drizzle.config.ts ./

# Переключиться на non-root пользователя
USER appuser

# Expose порт
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error('Health check failed')})"

# Запуск приложения
CMD ["node", "server/index.js"]
