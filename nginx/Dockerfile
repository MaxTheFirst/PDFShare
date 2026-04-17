FROM node:20-alpine AS frontend-builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY client ./client
COPY shared ./shared
COPY components.json postcss.config.js tailwind.config.ts tsconfig.json vite.config.ts ./

RUN npm run build:client

FROM nginx:1.20-alpine

ENV TZ Europe/Moscow

RUN apk update && apk add openssl
RUN rm /etc/nginx/conf.d/default.conf && mkdir -p /home/web/www

COPY scripts/generate_conf.sh /scripts/generate_conf.sh
RUN chmod +x /scripts/generate_conf.sh

COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY ssl-params.conf /etc/nginx/ssl-params.conf
COPY certs/fullchain.pem /etc/nginx/certs/fullchain.pem
COPY certs/privkey.pem /etc/nginx/certs/privkey.pem

COPY www/ /usr/share/nginx/html/

COPY --from=frontend-builder /app/dist/public/ /home/web/www/

CMD ["/bin/sh", "-c", "/scripts/generate_conf.sh && nginx -g 'daemon off;'"]
