FROM node:latest

WORKDIR /usr/src/session-service

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 4001

CMD [ "node", "app.js" ]