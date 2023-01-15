FROM node:16

WORKDIR /dd

COPY package*.json ./
RUN npm install pm2 -g 
RUN npm install 

COPY ./ ./
RUN npm run generate

EXPOSE 80

CMD ["pm2-runtime", "start", "dd.config.js"]