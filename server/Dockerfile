FROM node:20-bullseye

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci

COPY prisma ./prisma
RUN npm run prisma:generate

COPY src ./src

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
