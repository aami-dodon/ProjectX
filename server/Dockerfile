FROM node:20-bullseye

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY server/package.json server/package-lock.json* ./
RUN npm ci

COPY server/prisma ./prisma
RUN npm run prisma:generate

COPY server/src ./src
COPY shared ./shared

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
