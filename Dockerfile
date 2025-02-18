# TODO: config mongodb to point to proper uri and port number 

FROM node:lts-iron

WORKDIR /usr/src/app

COPY . .

# Client
WORKDIR /usr/src/app/client/nextjs-codec/
RUN npm install && npm run build

# Server
WORKDIR /usr/src/app/server/codec-api/
RUN npm install

# Install concurrently globally
RUN npm install -g concurrently

# Expose port 3000
EXPOSE 3000

# Start both client and server
CMD ["concurrently", "--kill-others-on-fail", "npm:start --prefix /usr/src/app/client/nextjs-codec", "npm:prod --prefix /usr/src/app/server/codec-api"]

