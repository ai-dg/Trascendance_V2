FROM debian:bookworm

RUN apt update && apt upgrade -y \
	&& apt install -y curl gnupg \
	&& curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
	&& apt install -y nodejs \
	&& apt clean \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /data

COPY package*.json ./

RUN npm install -g nodemon typescript tailwindcss ts-node concurrently


RUN npm init -y \
&& npm install fastify @fastify/view ejs @fastify/csrf-protection jsonwebtoken @fastify/env @fastify/jwt	@fastify/oauth2 @fastify/websocket && npm install typescript @types/ejs @types/node autoprefixer postcss postcss-cli amqplib
COPY . .

EXPOSE 3005

# CMD ["node", "server.js"]

CMD [ "nodemon", "--config", "nodemon.json" ]
