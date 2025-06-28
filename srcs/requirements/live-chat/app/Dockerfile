FROM debian:bookworm

RUN apt update && apt upgrade -y \
	&& apt install -y curl gnupg build-essential python3 make g++ \
	&& curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
	&& apt install -y nodejs \
	&& apt clean \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json .
COPY server.js .

RUN npm install --package-lock

VOLUME ["/data"]

EXPOSE 3000

CMD ["node", "server.js"]
