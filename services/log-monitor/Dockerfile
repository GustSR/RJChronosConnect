FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt update && apt install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY . .

# Configurar usuário não-root
RUN useradd -m -u 1000 monitor && chown -R monitor:monitor /app
USER monitor

# Expor portas
EXPOSE 8000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["python", "main.py"]