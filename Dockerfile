# Stage 2: Builder
FROM node:20-alpine AS builder
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
FROM node:20-alpine AS runner
WORKDIR /app

# Установить переменные окружения
ENV NODE_ENV=production
ENV PORT=3000

# Создать non-root пользователя
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Копировать production зависимости из deps stage
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules

# Копировать собранное приложение из builder stage
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/package*.json ./

# Копировать необходимые конфигурационные файлы
COPY --chown=appuser:nodejs server ./server
COPY --chown=appuser:nodejs shared ./shared
COPY --chown=appuser:nodejs drizzle.config.ts ./

# Переключиться на non-root пользователя
USER appuser

# Запуск приложения
CMD ["node", "dist/index.js"]
