FROM node:16-alpine

RUN mkdir -p /app
WORKDIR /app
COPY . .

### build typescript ###
RUN npm i
RUN npm run build

### RUN ###
CMD [ "npm", "run", "start" ]