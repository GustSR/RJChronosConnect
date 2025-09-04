# --- Estágio 1: Build da Aplicação React ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copia os arquivos de dependência e instala
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copia o resto do código-fonte
COPY . .

# Executa o build de produção
RUN npm run build


# --- Estágio 2: Servidor de Produção Nginx ---
FROM nginx:stable-alpine

# Copia os arquivos estáticos gerados no estágio de build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia a configuração do Nginx para produção
# Esta configuração é essencial para o roteamento de SPAs
COPY nginx.prod.conf /etc/nginx/conf.d/default.conf

# Expõe a porta 80 e inicia o Nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
