# PDFShare

## Обзор проекта
[Проект запущен!](https://pdfshare.ru/)

PDF файлообменник с интеграцией Telegram и системой подписок на обновления файлов.

## Сценарий использования
1. Пользователь заходит через Telegram Bot.
2. Можно создать папку и загрузить туда файлы.
3. Можно поделиться с другом либо одним файлом, либо всей папкой.
4. Друг может посмотреть папку, открыть файл прямо в браузере.
5. Можно подписаться на файл/папку - будут приходить уведомления в Telegram Bot.

## Технологический стек
- **Frontend**: React, Redux Toolkit, TanStack Query, Wouter (routing), Shadcn UI
- **Backend**: Express.js, Node.js, Drizzle ORM
- **База данных**: PostgreSQL (Neon)
- **Хранилище**: Minio
- **Авторизация**: Telegram Bot OAuth
- **Язык интерфейса**: Русский

## Запуск
### Минимальные требования

- **Node.js**: 18.x или выше
- **npm**: 9.x или выше
- **PostgreSQL**: 14.x или выше (для локальной разработки)
- **Docker**: 20.x или выше (для Docker развертывания)
- **Docker Compose**: 2.x или выше

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd pdfshare
```
### 2. Переключаем ветку
В main - для production. Для локального запуска:
```bash
git checkout test
```
### 3. Установка зависимостей

```bash
npm install
```

### 4. Docker
В отдельном терминале запускаем докер: `docker-compose up --build`
### 5. Ngrok
В отдельном терминале запускаем ngrok для проксирования (нужно для работы бота - регистрация через него): `ngrok http 127.0.0.1:5000`
### 6. Переменные окружения
Меняем `DOMAIN` в файле .env и остальные, если нужно.
### 7. Запуск приложения

```bash
#инициализация бд
npm run db:push
# Development режим с hot-reload
npm run dev

# Приложение запустится на http://localhost:5000
```
## Запуск всех тестов

### Unit-тесты (Jest)

```bash
# Запустить все unit-тесты
npm test

# Запустить с покрытием кода
npm run test:coverage

# Запустить в watch режиме
npm run test:watch

# Запустить конкретный тест
npm test -- authSlice.test.ts
```

**Ожидаемый результат:**
```
Test Suites: 5 passed, 5 total
Tests:       49 passed, 49 total
```

### Component тесты (Storybook + Loki)

```bash
# Шаг 1: Запустить Storybook
npm run storybook
# Откроется на http://localhost:6006

# Шаг 2: В новом терминале - создать reference screenshots
npx loki update --requireReference

# Шаг 3: Запустить visual regression тесты
npx loki test

# Шаг 4: Если есть изменения - одобрить
npx loki approve
```

### E2E тесты (Playwright)

```bash
# Установить браузеры (первый раз)
npx playwright install chromium

# Запустить все E2E тесты
npm run test:e2e

# Или напрямую через Playwright
npx playwright test

# Запустить в UI режиме (интерактивный)
npx playwright test --ui

# Запустить с показом браузера
npx playwright test --headed

# Запустить конкретный файл
npx playwright test e2e/folder-management.spec.ts

# Debug режим
npx playwright test --debug
```
## Структура проекта

```
pdfshare/
├── client/               # Frontend код
│   ├── src/
│   │   ├── components/  # React компоненты
│   │   ├── pages/       # Страницы
│   │   ├── store/       # Redux store
│   │   └── lib/         # Утилиты
├── server/              # Backend код
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Storage interface
│   └── objectAcl.ts     # ACL система
├── shared/              # Общий код
│   └── schema.ts        # Drizzle схема
├── e2e/                 # E2E тесты
├── nginx/               # Nginx конфигурация
├── docker-compose.yml   # Docker Compose
├── Dockerfile           # Docker образ
└── DEPLOYMENT.md        # Руководство по деплою
```
## Архитектура

### База данных (shared/schema.ts)
- `users` - пользователи (Telegram ID, username, firstName, lastName)
- `folders` - папки для организации файлов (name, ownerId, isRecent, shareToken)
- `files` - PDF файлы (name, folderId, ownerId, size, version)
- `subscriptions` - подписки на обновления (userId, fileId/folderId)
- `loginTokens` - одноразовые токены для авторизации через Telegram бота (token, userId, expiresAt, used)

### API Endpoints (server/routes.ts)

**Авторизация:**
- `POST /api/auth/telegram` - авторизация через Telegram (widget)
- `GET /api/auth/telegram-login/:token` - авторизация по одноразовому токену из бота
- `POST /api/auth/logout` - выход
- `GET /api/auth/me` - получить текущего пользователя
- `POST /api/auth/test-login` - тестовый endpoint для E2E тестов (только dev + ENABLE_TEST_LOGIN=true)
- `POST /api/auth/test-create-token` - создание тестовых токенов (только dev + ENABLE_TEST_LOGIN=true)

**Папки:**
- `GET /api/folders` - получить все папки пользователя
- `GET /api/folders/:id` - получить папку с файлами
- `POST /api/folders` - создать папку
- `DELETE /api/folders/:id` - удалить папку
- `POST /api/folders/:id/share` - сгенерировать share token
- `GET /api/shared/folder/:token` - публичный доступ к папке

**Файлы:**
- `GET /api/folders/:folderId/files/check?name=XXX` - проверить существование файла по имени
- `POST /api/folders/:folderId/files` - загрузить файл
- `GET /api/files/:id` - получить файл
- `GET /api/files/:id/metadata` - получить метаданные файла
- `DELETE /api/files/:id` - удалить файл

**Подписки:**
- `GET /api/subscriptions` - получить подписки пользователя
- `POST /api/subscriptions` - подписаться на файл/папку
- `DELETE /api/subscriptions/:id` - отписаться

### Фронтенд страницы (client/src/pages/)

**Маршруты:**
- `/` - Landing page (редирект на /explorer при авторизации)
- `/explorer` - главная страница с sidebar и списком файлов
- `/explorer/:folderId` - просмотр конкретной папки
- `/pdf/:fileId` - просмотр PDF файла
- `/about` - информация о проекте
- `/auth/telegram-login` - обработка одноразового токена из Telegram бота (редирект на /explorer)
- `/shared/folder/:shareToken` - публичный просмотр папки
- `/shared/file/:shareToken` - публичный просмотр файла

**Компоненты:**
- Sidebar с навигацией по папкам
- File Explorer (grid view, без переключателя режимов)
- PDF Viewer (react-pdf)
- Модальные окна: загрузка файлов, создание папок, share links для файлов и папок, подписки
- **Подписка на публичных страницах**: Кнопки subscribe/unsubscribe на /shared/file/:token и /shared/folder/:token (только для авторизованных пользователей)

### Telegram Bot (server/telegramBot.ts)
- **Webhook режим** - бот работает через webhook
- Русскоязычный интерфейс
- Команды: /start, /subscriptions, /help
- Уведомления о новых файлах и обновлениях
- Автоматическая регистрация пользователей через /start
- **Одноразовая авторизация**: При /start генерируется одноразовый токен (срок действия 5 минут)
- **Inline Keyboard**: Кнопка "🔐 Войти" с URL `/auth/telegram-login?token=XXX`
- При клике на кнопку пользователь автоматически авторизуется и редиректится в /explorer