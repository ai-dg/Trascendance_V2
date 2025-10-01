
FROM node:20-bullseye

WORKDIR /data

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
