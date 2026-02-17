FROM node:20

WORKDIR /data

COPY package*.json ./

RUN npm ci --production --no-audit --no-fund

COPY . .

EXPOSE 3002

CMD ["node", "server.js"]