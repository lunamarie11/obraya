#!/bin/bash
# Setup inicial del servidor ObraYa
# Correr UNA SOLA VEZ como root en Ubuntu 22.04
# Uso: curl -sSL https://raw.githubusercontent.com/lunamarie11/obraya/main/infra/setup-server.sh | bash

set -e
echo "=== ObraYa Server Setup ==="

# Docker
apt-get update -y
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Usuario deploy sin sudo para Docker
useradd -m -s /bin/bash deploy || true
usermod -aG docker deploy

# Directorio de la app
mkdir -p /opt/obraya
chown deploy:deploy /opt/obraya

# SSH para el usuario deploy (copiar clave pública)
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
# Agregar tu clave pública aquí:
# echo "ssh-ed25519 AAAA... tu_clave_publica" >> /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

# Firewall básico
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "=== Setup completo ==="
echo "Próximos pasos:"
echo "1. Agregar tu clave SSH pública en /home/deploy/.ssh/authorized_keys"
echo "2. Apuntar los dominios app.obraya.com y api.obraya.com a la IP de este servidor"
echo "3. Crear /opt/obraya/.env con los valores de producción"
echo "4. Correr: docker compose -f /opt/obraya/docker-compose.prod.yml up -d"
