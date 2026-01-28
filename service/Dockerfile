FROM node:18-alpine

WORKDIR /app

copy package*.json ./
RUN npm install

COPY . .

EXPOSE 4000
CMD ["node", "app.js"]
