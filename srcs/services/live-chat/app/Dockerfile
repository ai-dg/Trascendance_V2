FROM node:20

WORKDIR /data

COPY . .
COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3002

CMD ["node", "server.js"]
