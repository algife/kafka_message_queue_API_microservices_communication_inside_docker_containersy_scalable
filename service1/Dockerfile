FROM node:18
WORKDIR /app
COPY package.json index.js /app/
RUN yarn install
RUN yarn add -g nodemon

CMD ["nodemon","index.js"]