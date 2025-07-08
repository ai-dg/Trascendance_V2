FROM debian:bookworm

RUN apt update && apt upgrade -y \
	&& apt install -y curl gnupg \
	&& curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
	&& apt install -y nodejs \
	&& apt clean \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .


RUN npm init -y \
	&& npm install fastify @fastify/view ejs @fastify/csrf-protection @fastify/env @fastify/jwt	@fastify/oauth2 @fastify/websocket
EXPOSE 3005

CMD ["node", "server.js"]
