
FROM node:12-alpine

RUN apk update && apk upgrade && \
    apk add --no-cache git

WORKDIR /app

COPY package.json ./
COPY yarn.lock ./
RUN yarn install --production --non-interactive
COPY . .

CMD [ "node", "src/index.js" ]
