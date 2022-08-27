FROM node:16-alpine

WORKDIR /app
COPY . .

### build typescript ###
RUN npm i
RUN npm run build

### fix ytdl-core version ###
#RUN cd node_modules/discord-player && npm remove ytdl-core
#RUN cd node_modules/discord-player && npm i ytdl-core@4.9.1

### RUN ###
CMD [ "npm", "run", "start" ]