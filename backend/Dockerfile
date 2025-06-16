# Imagem base otimizada com Chromium e Puppeteer
FROM ghcr.io/puppeteer/puppeteer:20.10.0

# Define o diretório de trabalho
WORKDIR /app

# Copia apenas os arquivos necessários
COPY package*.json ./

# Instala apenas dependências de produção
RUN npm ci --omit=dev

# Copia o restante da aplicação
COPY . .

# Expõe a porta da API
EXPOSE 3000

# Inicia a aplicação
CMD ["npm", "start"]
