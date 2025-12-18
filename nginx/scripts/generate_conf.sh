#!/bin/sh

mkdir -p /var/cache/nginx

# Удаление кеша Nginx, если директория существует
[ -d /var/cache/nginx ] && rm -rf /var/cache/nginx/*

# Удаление логов Nginx, если файлы существуют
[ -f /var/log/nginx/access.log ] && rm -f /var/log/nginx/access.log
[ -f /var/log/nginx/error.log ] && rm -f /var/log/nginx/error.log

# Создание пустых лог-файлов
touch /var/log/nginx/access.log /var/log/nginx/error.log

# Установка прав
chmod 666 /var/log/nginx/access.log /var/log/nginx/error.log

envsubst '${NGINX_PORT_1} ${NGINX_PORT_2} ${DOMAIN} ${APP_CONTAINER} ${APP_PORT}' \
  < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/nginx.conf
