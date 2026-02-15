FROM alpine:latest


# Install Nginx, OpenSSL, outils de base
RUN apk update && apk add --no-cache \
    nginx \
    openssl \
    curl \
    bash


# Générer un certificat auto-signé
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/nginx.key \
        -out /etc/nginx/ssl/nginx.crt \
        -subj "/C=FR/ST=IDF/L=Paris/O=42/OU=Dev/CN=localhost"


# Config Nginx
RUN mkdir -p /run/nginx /etc/nginx/conf.d
COPY ./services/security/temp/conf/default.conf /etc/nginx/conf.d/default.conf
COPY ./services/security/temp/conf/nginx.conf /etc/nginx/nginx.conf


# Lancer Nginx
CMD ["nginx", "-g", "daemon off;"]


