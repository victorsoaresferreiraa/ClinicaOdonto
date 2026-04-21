FROM node:20-alpine

# Instala bibliotecas essenciais para o Next.js
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copia os arquivos de dependência
COPY package.json package-lock.json* ./

# Instala as dependências (isso garante que o npm esteja disponível)
RUN npm install

# Copia o restante do código
COPY . .

# Expõe a porta do Next.js
EXPOSE 3000

# Comando para rodar em desenvolvimento
CMD ["npm", "run", "dev"]