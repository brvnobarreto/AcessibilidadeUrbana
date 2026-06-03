# Backend Express — Acessível Urbano
FROM node:20-alpine

WORKDIR /app

# Instala dependências de produção (usa package-lock.json)
COPY package*.json ./
RUN npm ci --omit=dev

# Copia o código
COPY . .

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/server.js"]
