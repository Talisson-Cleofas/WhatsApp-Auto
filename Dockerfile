# Etapa 1: Build do frontend com Vite
FROM node:20-slim AS frontend-builder

# Define diretório de trabalho para o frontend
WORKDIR /app/frontend

# Copia o frontend
COPY frontend/ ./

# 🔥 Define a variável de ambiente de build para o Vite
ENV VITE_API_BASE_URL=https://marshall-whatsapp-auto-production.up.railway.app/api

# Instala dependências e gera o build
RUN npm install --omit=dev && npm run build

# Etapa 2: Backend + frontend buildado
FROM node:20-slim AS backend

# Diretório do backend
WORKDIR /app

# Copia o backend
COPY backend/ ./backend

# Copia o build do frontend para o backend servir via "public"
COPY --from=frontend-builder /app/frontend/dist ./backend/public

# Instala dependências do backend
WORKDIR /app/backend
RUN npm install --omit=dev && npm cache clean --force

# Exponha a porta usada pelo backend (ajuste conforme necessário)
EXPOSE 3000

# Comando de execução do servidor
CMD ["node", "services/server.js"]
