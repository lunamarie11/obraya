# Una sola instancia expuesta a internet (ver ec2.tf). Sin SSH abierto: el
# acceso remoto es via SSM Session Manager (ver iam.tf), que sale por HTTPS
# saliente (ya permitido por el egress "allow all"), no necesita puerto de
# entrada.
resource "aws_security_group" "app" {
  name        = "obraya-app-sg"
  description = "Instancia unica: HTTP/HTTPS desde internet (Caddy hace de reverse proxy)"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP (redirige a HTTPS en Caddy)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "obraya-app-sg" }
}

resource "aws_security_group" "opensearch" {
  count       = var.enable_opensearch ? 1 : 0
  name        = "obraya-opensearch-sg"
  description = "OpenSearch: solo desde la instancia de la app, dentro de la VPC"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTPS desde la instancia"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "obraya-opensearch-sg" }
}
