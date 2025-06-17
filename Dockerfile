# Etapa 1: Build do frontend com Vite
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/ ./frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Etapa 2: Backend com Node.js + FFmpeg
FROM node:20-alpine

# Instala dependências necessárias (incluindo ffmpeg)
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copia o backend
COPY backend/ ./backend

# Copia o frontend já buildado para a pasta pública do backend
COPY --from=frontend-builder /app/frontend/dist ./backend/public

# Instala dependências do backend
WORKDIR /app/backend
RUN npm install

# Expõe a porta (ajuste se o backend usar outra)
EXPOSE 3000

# Inicia o backend
CMD ["node", "services/server.js"]
