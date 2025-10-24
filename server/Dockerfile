FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY server/package*.json ./
COPY server/prisma ./prisma
RUN npm install --omit=dev
RUN npx prisma generate

COPY server/src ./src
COPY shared /shared

ENV NODE_ENV=production

EXPOSE 4000

CMD ["node", "src/index.js"]
