# Etapa 1: Usar uma imagem oficial e leve do Node.js
FROM node:20-alpine

# Etapa 2: Definir o diretório de trabalho dentro do contêiner
WORKDIR /app

# Etapa 3: Copiar os arquivos de definição de dependências para cache
COPY package*.json ./

# Etapa 4: Instalar as dependências do projeto
RUN npm install

# Etapa 5: Copiar todo o resto do código-fonte do frontend
COPY . .

# Etapa 6: Expor a porta 3000, conforme definido em vite.config.ts
EXPOSE 3000

# Etapa 7: Definir o comando padrão para iniciar o servidor de desenvolvimento
CMD ["npm", "run", "dev"]