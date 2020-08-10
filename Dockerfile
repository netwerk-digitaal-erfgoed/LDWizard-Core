#FROM ubuntu

FROM node:12

ADD . /home/node/app

WORKDIR /home/node/app

RUN yarn