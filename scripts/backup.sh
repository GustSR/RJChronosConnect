#!/bin/bash
# ===========================================================
# RJChronosConnect — Backup Automático
# PostgreSQL + MongoDB
# ===========================================================
# Uso: ./backup.sh
# Crontab (diário 3AM): 0 3 * * * /opt/rjchronos/scripts/backup.sh
# ===========================================================

set -euo pipefail

# --- Configuração ---
BACKUP_DIR="/opt/rjchronos/backups"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${BACKUP_DIR}/backup_${DATE}.log"

# Containers
PG_CONTAINER="rjchronos_db_app_prod"
MONGO_CONTAINER="rjchronos_db_acs_prod"

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"; }

# --- Criar diretório de backup ---
mkdir -p "${BACKUP_DIR}/postgresql"
mkdir -p "${BACKUP_DIR}/mongodb"

log "${GREEN}=== Iniciando Backup RJChronosConnect ===${NC}"

# --- Backup PostgreSQL ---
log "${YELLOW}[1/3] Backup PostgreSQL...${NC}"
PG_BACKUP_FILE="${BACKUP_DIR}/postgresql/rjchronos_pg_${DATE}.sql.gz"

if docker exec ${PG_CONTAINER} pg_dump -U rjchronos -d rjchronos --format=custom | gzip > "${PG_BACKUP_FILE}"; then
    PG_SIZE=$(du -h "${PG_BACKUP_FILE}" | cut -f1)
    log "${GREEN}  ✅ PostgreSQL backup OK (${PG_SIZE})${NC}"
else
    log "${RED}  ❌ PostgreSQL backup FALHOU${NC}"
fi

# --- Backup MongoDB ---
log "${YELLOW}[2/3] Backup MongoDB (GenieACS)...${NC}"
MONGO_BACKUP_DIR="${BACKUP_DIR}/mongodb/genieacs_${DATE}"

if docker exec ${MONGO_CONTAINER} mongodump --db=genieacs --out=/tmp/mongodump_${DATE} && \
   docker cp ${MONGO_CONTAINER}:/tmp/mongodump_${DATE} "${MONGO_BACKUP_DIR}" && \
   docker exec ${MONGO_CONTAINER} rm -rf /tmp/mongodump_${DATE}; then
    
    # Compactar
    tar -czf "${MONGO_BACKUP_DIR}.tar.gz" -C "${BACKUP_DIR}/mongodb" "genieacs_${DATE}"
    rm -rf "${MONGO_BACKUP_DIR}"
    MONGO_SIZE=$(du -h "${MONGO_BACKUP_DIR}.tar.gz" | cut -f1)
    log "${GREEN}  ✅ MongoDB backup OK (${MONGO_SIZE})${NC}"
else
    log "${RED}  ❌ MongoDB backup FALHOU${NC}"
fi

# --- Limpeza de backups antigos ---
log "${YELLOW}[3/3] Limpando backups com mais de ${RETENTION_DAYS} dias...${NC}"
DELETED_PG=$(find "${BACKUP_DIR}/postgresql" -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
DELETED_MONGO=$(find "${BACKUP_DIR}/mongodb" -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
DELETED_LOGS=$(find "${BACKUP_DIR}" -name "backup_*.log" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
log "  Removidos: ${DELETED_PG} backups PG, ${DELETED_MONGO} backups Mongo, ${DELETED_LOGS} logs"

# --- Resumo ---
log "${GREEN}=== Backup Concluído ===${NC}"
log "  PostgreSQL: ${PG_BACKUP_FILE}"
log "  MongoDB:    ${MONGO_BACKUP_DIR}.tar.gz"
log "  Log:        ${LOG_FILE}"
