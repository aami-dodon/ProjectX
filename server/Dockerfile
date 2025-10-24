FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install --production

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

ENV NODE_ENV=production

EXPOSE 4000

CMD ["node", "src/index.js"]
