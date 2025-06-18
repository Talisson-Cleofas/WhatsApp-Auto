# Etapa 1: Build do frontend com Vite
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install --omit=dev

COPY frontend/ ./

ENV VITE_API_BASE_URL=https://whatsapp-auto-back-production.up.railway.app/api

RUN npm run build

# Etapa 2: Backend + frontend buildado
FROM node:20-slim AS backend

# Instala Chromium e dependências necessárias para Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libx11-xcb1 \
    libx11-6 \
    libxcb1 \
    libxss1 \
    libxtst6 \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY backend/ ./

# Copia o build do frontend para a pasta pública do backend
COPY --from=frontend-builder /app/frontend/dist ./public

EXPOSE 8080

CMD ["node", "services/server.js"]
