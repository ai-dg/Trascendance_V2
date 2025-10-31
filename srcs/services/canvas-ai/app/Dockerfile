FROM debian:bookworm

RUN apt update && apt upgrade -y \
	&& apt install -y curl gnupg \
	&& curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
	&& apt install -y nodejs \
	&& apt clean \
	&& rm -rf /var/lib/apt/lists/*

VOLUME ["/data"]

WORKDIR /data

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
	@grpc/grpc-js \
	@grpc/proto-loader \
	amqplib \
	@fastify/websocket
	# sqlite3 \
	# sqlite
	
COPY . .

EXPOSE 3007

CMD ["nodemon", "--config", "nodemon.json"]