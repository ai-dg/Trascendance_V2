FROM debian:latest

ARG DJANGO_ENV=DEV

RUN apt-get update && apt-get install -y \
    nginx \
    curl \
    net-tools



COPY requirements/proxy/nginx/conf/$DJANGO_ENV.conf /etc/nginx/sites-available/default.conf
COPY requirements/proxy/nginx/conf/nginx.conf /etc/nginx/nginx.conf

RUN ln -s /etc/nginx/sites-available/default.conf /etc/nginx/sites-enabled/

RUN mkdir -p /app/data


CMD ["nginx", "-g", "daemon off;"]