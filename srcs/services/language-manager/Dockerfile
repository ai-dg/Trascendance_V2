
FROM node:20-bullseye

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /data

COPY package*.json ./

RUN npm install node-vault
RUN npm install --production 

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
