FROM node:16

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . . 

EXPOSE 8000 8080 8800

CMD ["npm", "run", "prod"]