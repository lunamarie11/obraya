# AMI oficial de Amazon Linux 2023, arquitectura arm64 (coincide con
# instance_type t4g.* de variables.tf -- Graviton es mas barato que x86
# equivalente). Se resuelve por SSM Parameter Store publico, sin hardcodear
# un AMI ID que varia por region y se desactualiza.
data "aws_ssm_parameter" "al2023_arm64" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64"
}

# user_data instala Docker + Compose, clona nada del repo (las imagenes ya
# estan en ECR, se hace pull directo) y levanta docker-compose.prod.yml. El
# Caddyfile y el compose file se suben via SSM Session Manager o se versionan
# en un repo privado aparte -- ver README.md seccion "primer deploy" para el
# detalle de como llegan los archivos a /opt/obraya en la instancia.
locals {
  user_data = <<-EOF
    #!/bin/bash
    set -euo pipefail

    dnf install -y docker
    systemctl enable --now docker

    curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-aarch64" \
      -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose

    mkdir -p /opt/obraya
    echo "Instancia lista. Subir docker-compose.prod.yml y Caddyfile a /opt/obraya via SSM, despues 'docker-compose up -d' (ver README.md)." > /opt/obraya/README
  EOF
}

resource "aws_instance" "app" {
  ami                    = data.aws_ssm_parameter.al2023_arm64.value
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.app.id]
  iam_instance_profile   = aws_iam_instance_profile.app.name
  user_data              = local.user_data

  # Elastic IP la maneja un recurso separado (aws_eip.app) para no perder la
  # IP publica si la instancia se recrea (cambio de AMI, etc).
  root_block_device {
    volume_size = var.root_volume_size_gb
    volume_type = "gp3"
    encrypted   = true
  }

  tags = { Name = "obraya-app" }
}

# IP publica fija: el DNS (app./admin./api.obraya.com.ar) apunta aca, y no
# puede cambiar cada vez que la instancia se recrea.
resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"

  tags = { Name = "obraya-app-eip" }
}
