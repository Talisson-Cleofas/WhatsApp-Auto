# Usa imagem do Node para buildar
FROM node:20-alpine AS builder

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Usa Nginx para servir os arquivos
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia configuração customizada do Nginx (opcional)
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
