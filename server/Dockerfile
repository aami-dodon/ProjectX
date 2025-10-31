FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY server/package*.json ./
COPY server/prisma ./prisma
RUN npm install --omit=dev
RUN npx prisma generate

COPY server/src ./src
COPY server/public ./public

ENV NODE_ENV=production

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
