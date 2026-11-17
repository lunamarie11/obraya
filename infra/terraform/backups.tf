# Ver docs/backlog-salida-produccion.md punto 4: al pasar de RDS (diseño
# original) a Postgres como contenedor en la misma instancia (ADR-020), se
# perdieron los backups automaticos. Bucket dedicado (no el de storage de
# imagenes, que es publico-via-CDN) para los dumps de pg_dump, con
# lifecycle de 30 dias -- suficiente para restaurar ante un error humano o
# la perdida de la instancia, sin acumular costo indefinidamente.
resource "aws_s3_bucket" "backups" {
  bucket = "obraya-backups-${var.environment}"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "backups" {
  bucket                  = aws_s3_bucket.backups.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id
  rule {
    id     = "expire-old-backups"
    status = "Enabled"
    filter {
      prefix = "postgres/"
    }
    expiration {
      days = 30
    }
  }
}
