FROM node:lts-slim

WORKDIR /usr/src/app

COPY . .

# Client
WORKDIR /usr/src/app/client/nextjs-codec/

RUN npm install

RUN npm run build

CMD ['npm', 'start']

# Server
WORKDIR /usr/src/app/server/codec-api/

RUN npm install

CMD ['npm', 'run', 'prod']

