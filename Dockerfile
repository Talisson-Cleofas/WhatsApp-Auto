# Etapa 1: Build do frontend com Vite
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/ ./
RUN npm install
RUN npm run build

# Etapa 2: Setup do backend
FROM node:20-alpine
WORKDIR /app

# Copia o backend
COPY backend/ ./backend

# Copia o frontend já buildado para o backend servir os arquivos
COPY --from=frontend-builder /app/frontend/dist ./backend/public

# Instala dependências do backend
WORKDIR /app/backend
RUN npm install

# Expõe a porta do backend (ajuste conforme sua aplicação)
EXPOSE 3000

# Comando para rodar o backend
CMD ["node", "services/server.js"]
