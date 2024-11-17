FROM node:20

WORKDIR /app

COPY ./src/package*.json ./

RUN npm install -g npm@10.9.0 && npm install
RUN npm install axios

COPY ./src /app/

ENV NODE_PATH=/app/node_modules

EXPOSE 3000

CMD ["npm", "start"]
