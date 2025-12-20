
FROM nginx:1.20-alpine

ENV TZ Europe/Moscow

RUN apk update && apk add openssl
RUN rm /etc/nginx/conf.d/default.conf && mkdir -p /home/web/www

COPY nginx/scripts/generate_conf.sh /scripts/generate_conf.sh
RUN chmod +x /scripts/generate_conf.sh

COPY nginx/nginx.conf.template /etc/nginx/nginx.conf.template
COPY nginx/ssl-params.conf /etc/nginx/ssl-params.conf
COPY nginx/certs/fullchain.pem /etc/nginx/certs/fullchain.pem
COPY nginx/certs/privkey.pem /etc/nginx/certs/privkey.pem
COPY nginx/www/ /usr/share/nginx/html/

CMD ["/bin/sh", "-c", "/scripts/generate_conf.sh && nginx -g 'daemon off;'"]