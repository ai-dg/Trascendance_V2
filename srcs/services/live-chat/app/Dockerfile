FROM node:20

WORKDIR /data

COPY . .
COPY package*.json ./

RUN npm install --production && npm install prom-client

COPY . .

EXPOSE 3002

CMD ["node", "server.js"]
