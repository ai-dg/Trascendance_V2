# FROM debian:bookworm-slim

# RUN apt-get update \
# 	&& apt-get install -y nginx curl \
# 	&& rm -rf /var/lib/apt/lists/*

# RUN mkdir -p /certs && \
#     openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
#     -keyout /certs/key.pem \
#     -out /certs/cert.pem \
#     -subj "/C=US/ST=State/L=City/O=Org/CN=localhost"

# RUN rm /etc/nginx/sites-enabled/default

# COPY nginx/nginx.conf /etc/nginx/nginx.conf

# EXPOSE 80

# CMD ["nginx", "-g", "daemon off;"]


FROM debian:bookworm

RUN apt update && apt upgrade -y \
 && apt install -y curl gnupg openssl \
 && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt install -y nodejs \
 && apt clean \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /data

RUN mkdir -p /certs && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /certs/key.pem \
    -out /certs/cert.pem \
    -subj "/C=FR/ST=IDF/L=Paris/O=42/OU=Transcendence/CN=realtime-sockets_app"

COPY package.json ./
COPY package-lock.json ./

RUN npm install -g nodemon

RUN npm install --package-lock \
 dotenv \
 mysql2 \
 fastify@latest \
 @fastify/formbody \
 @fastify/helmet \
 @fastify/rate-limit \
 @fastify/cors \
 bcryptjs \
 jsonwebtoken \
 @fastify/cookie \
 @fastify/csrf-protection \
 redis \
 xss \
 validator \
 nodemailer \
 socket.io

COPY . .

CMD ["node", "server.js"]
