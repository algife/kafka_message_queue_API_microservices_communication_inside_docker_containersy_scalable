FROM node:18
WORKDIR /app
COPY package.json index.js /app/
COPY ./ /app/
RUN yarn install
RUN yarn global add nodemon

CMD ["nodemon","index.js"]