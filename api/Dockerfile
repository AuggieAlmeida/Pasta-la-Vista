# Debian slim: melhor compatibilidade com sharp que Alpine.
FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN chmod +x docker-entrypoint.sh && npm run build

ENV NODE_ENV=production
EXPOSE 3333

ENTRYPOINT ["./docker-entrypoint.sh"]
