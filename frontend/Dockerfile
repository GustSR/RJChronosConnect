FROM node:20-alpine

# Instalar curl para health check
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies first
RUN npm ci --include=dev 2>/dev/null || npm install --include=dev --legacy-peer-deps

# Copy source code AFTER installing deps
COPY . .

# Force install polyfills
RUN npm install buffer process --save-dev || true

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start development server
CMD ["npm", "run", "dev"]