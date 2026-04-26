#!/bin/sh
# ── ObraYa — Backup de base de datos ────────────────────────────────────────
# Uso: ./scripts/backup-db.sh
# Cron diario (2am): 0 2 * * * /opt/obraya/scripts/backup-db.sh >> /var/log/obraya-backup.log 2>&1
#
# Variables de entorno requeridas (leer del .env de prod):
#   POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, BACKUP_DIR, S3_BUCKET (opcional)
# ────────────────────────────────────────────────────────────────────────────

set -e

BACKUP_DIR="${BACKUP_DIR:-/opt/obraya/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="obraya_${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Iniciando backup: ${FILENAME}"

# Dump comprimido
docker exec obraya_postgres_prod pg_dump \
  -U "${POSTGRES_USER}" \
  "${POSTGRES_DB}" | gzip > "${FILEPATH}"

echo "[$(date)] Backup generado: ${FILEPATH} ($(du -sh "$FILEPATH" | cut -f1))"

# Subir a S3 si está configurado
if [ -n "${S3_BUCKET}" ]; then
  aws s3 cp "${FILEPATH}" "s3://${S3_BUCKET}/backups/${FILENAME}"
  echo "[$(date)] Subido a S3: s3://${S3_BUCKET}/backups/${FILENAME}"
fi

# Limpiar backups locales más viejos que RETENTION_DAYS
find "${BACKUP_DIR}" -name "obraya_*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete
echo "[$(date)] Backups locales de más de ${RETENTION_DAYS} días eliminados"

echo "[$(date)] Backup completado OK"
