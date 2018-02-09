FROM node:9.5.0-alpine

RUN apk update && \
    apk upgrade && \
    apk add git && \
    apk add make && \
    apk add bash && \
    apk add python

WORKDIR /app

COPY package*.json yarn.lock ./

RUN yarn

COPY . ./
