#!/bin/bash
# Скрипт автоматического деплоя PDFShare

set -e  # Остановка при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Функция логирования
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Проверка зависимостей
check_dependencies() {
    log_info "Проверка зависимостей..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker не установлен"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose не установлен"
        exit 1
    fi
    
    log_success "Все зависимости установлены"
}

# Проверка .env файла
check_env() {
    log_info "Проверка переменных окружения..."
    
    if [ ! -f .env ]; then
        log_warning ".env файл не найден, создается из .env.example"
        cp .env.example .env
        log_warning "Заполните .env файл и запустите скрипт снова"
        exit 1
    fi
    
    # Проверка обязательных переменных
    source .env
    
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL не установлен в .env"
        exit 1
    fi
    
    if [ -z "$SESSION_SECRET" ] || [ "$SESSION_SECRET" = "your-random-secret-here" ]; then
        log_error "SESSION_SECRET не установлен или использует значение по умолчанию"
        log_info "Сгенерируйте секрет: openssl rand -base64 32"
        exit 1
    fi
    
    log_success "Переменные окружения проверены"
}

# Backup базы данных
backup_database() {
    log_info "Создание backup базы данных..."
    
    if docker-compose ps | grep -q "pdfshare-db.*Up"; then
        BACKUP_DIR="backups"
        mkdir -p $BACKUP_DIR
        
        BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
        
        docker-compose exec -T db pg_dump -U pdfshare pdfshare > $BACKUP_FILE
        
        if [ -f $BACKUP_FILE ]; then
            log_success "Backup создан: $BACKUP_FILE"
        else
            log_warning "Не удалось создать backup"
        fi
    else
        log_warning "База данных не запущена, backup пропущен"
    fi
}

# Остановка старых контейнеров
stop_containers() {
    log_info "Остановка существующих контейнеров..."
    docker-compose down
    log_success "Контейнеры остановлены"
}

# Сборка образов
build_images() {
    log_info "Сборка Docker образов..."
    docker-compose build --no-cache
    log_success "Образы собраны"
}

# Запуск контейнеров
start_containers() {
    log_info "Запуск контейнеров..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    else
        docker-compose up -d
    fi
    
    log_success "Контейнеры запущены"
}

# Проверка здоровья сервисов
health_check() {
    log_info "Проверка здоровья сервисов..."
    
    MAX_ATTEMPTS=30
    ATTEMPT=0
    
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        if curl -f http://localhost/api/health > /dev/null 2>&1; then
            log_success "Приложение работает корректно"
            return 0
        fi
        
        ATTEMPT=$((ATTEMPT + 1))
        log_info "Попытка $ATTEMPT/$MAX_ATTEMPTS..."
        sleep 2
    done
    
    log_error "Приложение не отвечает после $MAX_ATTEMPTS попыток"
    log_info "Проверьте логи: docker-compose logs -f"
    return 1
}

# Показать информацию
show_info() {
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║       PDFShare успешно развернут!                    ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Приложение доступно на:${NC}"
    echo "  • http://localhost (HTTP)"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        echo "  • https://your-domain.com (HTTPS - настройте домен)"
    fi
    
    echo ""
    echo -e "${BLUE}Полезные команды:${NC}"
    echo "  • Логи:              docker-compose logs -f"
    echo "  • Статус:            docker-compose ps"
    echo "  • Остановка:         docker-compose down"
    echo "  • Перезапуск:        docker-compose restart"
    echo "  • Backup БД:         make db-backup"
    echo ""
}

# Главная функция
main() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════╗"
    echo "║           PDFShare Deployment Script                 ║"
    echo "╚═══════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Определение окружения
    ENVIRONMENT=${1:-development}
    
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "Деплой в PRODUCTION режиме"
        
        read -p "Вы уверены? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Деплой отменен"
            exit 0
        fi
    else
        log_info "Деплой в DEVELOPMENT режиме"
    fi
    
    # Выполнение шагов
    check_dependencies
    check_env
    
    if [ "$ENVIRONMENT" = "production" ]; then
        backup_database
    fi
    
    stop_containers
    build_images
    start_containers
    
    # Небольшая пауза для инициализации
    log_info "Ожидание инициализации сервисов..."
    sleep 5
    
    health_check
    
    show_info
}

# Обработка ошибок
trap 'log_error "Деплой прерван"; exit 1' ERR

# Запуск
main "$@"
