# Usa imagem base do Node com Chromium incluído
FROM zenika/node:20-chrome

# Cria diretório do app
WORKDIR /app

# Copia os arquivos do projeto
COPY . .

# Instala dependências
RUN npm install

# Expõe a porta (ajuste se seu app usa outra porta)
EXPOSE 3000

# Inicia a aplicação
CMD ["npm", "start"]
