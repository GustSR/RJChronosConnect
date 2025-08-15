# Etapa 1: Usar uma imagem oficial e leve do Python
FROM python:3.11-slim

# Etapa 2: Definir o diretório de trabalho dentro do contêiner
WORKDIR /app

# Etapa 3: Copiar o arquivo de dependências para aproveitar o cache do Docker
COPY requirements.txt .

# Etapa 4: Instalar as dependências
RUN pip install --no-cache-dir -r requirements.txt

# Etapa 5: Copiar todo o código-fonte do backend para o contêiner
COPY . .

# Etapa 6: Expor a porta que a nossa API vai usar
EXPOSE 8000

# Etapa 7: Definir o comando padrão para iniciar o servidor
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
