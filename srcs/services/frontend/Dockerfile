FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY srcs ./srcs
COPY locales ./locales
#RUN npm run build

RUN npm install -g nodemon

RUN mkdir -p dist/config && cp srcs/config/server.js dist/config/

EXPOSE 3006

CMD ["nodemon", "srcs/config/server.js"]
