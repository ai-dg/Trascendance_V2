FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY discord-adapter.js ./

EXPOSE 9094

CMD ["npm", "start"]
