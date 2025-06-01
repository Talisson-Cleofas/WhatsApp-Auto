PASSO A PASSO

1. Instale as dependências:
   npm install

2. Inicie o servidor:
   node index.js

3. Escaneie o QR Code no terminal com o WhatsApp.

4. Teste com Postman:
   POST http://localhost:3000/send-message
   {
     "number": "5511999999999",
     "message": "Olá via Postman!"
   }

   POST http://localhost:3000/send-bulk
   {
     "messages": [
       { "number": "5511999999999", "message": "Oi!" },
       { "number": "5511988888888", "message": "Olá!" }
     ]
   }