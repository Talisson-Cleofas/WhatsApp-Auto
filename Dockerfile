# Etapa 1: Build do frontend com Vite
FROM node:20-slim AS frontend-builder

# Diretório de trabalho do frontend
WORKDIR /app/frontend

# Copia apenas arquivos necessários do frontend (para cache de dependências)
COPY frontend/package*.json ./
RUN npm install --omit=dev

# Copia o restante do frontend e faz o build
COPY frontend/ ./
ENV VITE_API_BASE_URL=https://marshall-whatsapp-auto-production.up.railway.app/api
RUN npm run build

# Etapa 2: Backend + frontend buildado
FROM node:20-slim AS backend

WORKDIR /app/backend

# Copia e instala dependências primeiro
COPY backend/package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copia restante dos arquivos do backend
COPY backend/ ./

# Copia o build do frontend para a pasta pública do backend
COPY --from=frontend-builder /app/frontend/dist ./public

# Exponha a porta usada pelo backend
EXPOSE 3000

# Comando para rodar o servidor
CMD ["node", "services/server.js"]
