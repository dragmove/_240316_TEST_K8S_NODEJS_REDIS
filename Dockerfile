FROM node:alpine

LABEL maintainer "dragmove <dragmove@gmail.com>"

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY ./ ./

CMD ["npm", "start"]