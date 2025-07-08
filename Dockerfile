FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

RUN mkdir -p auth_info_baileys

EXPOSE 3000

CMD ["npm", "start"]
