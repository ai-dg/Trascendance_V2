FROM debian:bookworm

RUN apt update && apt upgrade -y \
	&& apt install -y curl gnupg \
	&& curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
	&& apt install -y nodejs \
	&& apt clean \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json .
COPY server.js .

RUN npm init -y \
	&& npm install fastify

EXPOSE 3003

CMD ["node", "server.js"]
