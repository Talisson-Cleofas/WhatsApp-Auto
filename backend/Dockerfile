FROM ghcr.io/puppeteer/puppeteer:latest

# Define diretório de trabalho
WORKDIR /app

# Copia arquivos como root temporariamente
USER root
COPY . .

# Ajusta permissões da pasta para o usuário padrão do container
RUN chown -R pptruser:pptruser /app

# Volta para o usuário seguro
USER pptruser

# Instala dependências
RUN npm install

# Exponha a porta usada pelo seu app
EXPOSE 3000

# Comando para iniciar o app
CMD ["npm", "start"]
