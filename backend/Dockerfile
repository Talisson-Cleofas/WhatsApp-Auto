# Usa imagem oficial com Puppeteer + Chromium
FROM ghcr.io/puppeteer/puppeteer:latest

# Define diretório de trabalho
WORKDIR /app

# Copia todos os arquivos
COPY . .

# Instala as dependências
RUN npm install

# Exponha a porta usada pelo seu app
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]
