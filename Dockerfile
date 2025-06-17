# Etapa 1: Build do frontend com Vite
FROM node:20-slim AS frontend-builder

# Define diretório de trabalho para o frontend
WORKDIR /app/frontend

# Copia o frontend
COPY frontend/ ./

# Instala dependências e builda o frontend
RUN npm install --omit=dev && npm run build

# Etapa 2: Build do backend com os arquivos do frontend
FROM node:20-slim AS backend

# Diretório do backend
WORKDIR /app

# Copia apenas o backend
COPY backend/ ./backend

# Copia o build do frontend para o backend servir via "public/"
COPY --from=frontend-builder /app/frontend/dist ./backend/public

# Instala somente as dependências de produção do backend
WORKDIR /app/backend
RUN npm install --omit=dev && npm cache clean --force

# Expõe a porta usada pelo backend
EXPOSE 3000

# Comando para rodar o backend
CMD ["node", "services/server.js"]
