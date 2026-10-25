# JWT_SECRET / JWT_REFRESH_SECRET: generados por Terraform, nunca pisan los
# valores de dev que ya circularon en el chat (ver checklist seccion 1).
resource "random_password" "jwt_secret" {
  length  = 48
  special = false
}

resource "random_password" "jwt_refresh_secret" {
  length  = 48
  special = false
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name = "obraya/${var.environment}/jwt-secret"
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = random_password.jwt_secret.result
}

resource "aws_secretsmanager_secret" "jwt_refresh_secret" {
  name = "obraya/${var.environment}/jwt-refresh-secret"
}

resource "aws_secretsmanager_secret_version" "jwt_refresh_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_refresh_secret.id
  secret_string = random_password.jwt_refresh_secret.result
}

# Placeholders para credenciales de proveedores externos (Mercado Pago,
# Firebase, Sentry). Terraform solo crea el contenedor del secret con un
# valor dummy -- el valor real se carga aparte con:
#   aws secretsmanager put-secret-value --secret-id <name> --secret-string '<valor real>'
# `ignore_changes` evita que el siguiente `terraform apply` pise ese valor
# real con el placeholder de vuelta.
resource "aws_secretsmanager_secret" "mercadopago_token" {
  name = "obraya/${var.environment}/mercadopago-access-token"
}

resource "aws_secretsmanager_secret_version" "mercadopago_token" {
  secret_id     = aws_secretsmanager_secret.mercadopago_token.id
  secret_string = "CHANGEME"

  lifecycle {
    ignore_changes = [secret_string]
  }
}

resource "aws_secretsmanager_secret" "firebase_service_account" {
  name = "obraya/${var.environment}/firebase-service-account"
}

resource "aws_secretsmanager_secret_version" "firebase_service_account" {
  secret_id     = aws_secretsmanager_secret.firebase_service_account.id
  secret_string = "CHANGEME"

  lifecycle {
    ignore_changes = [secret_string]
  }
}

resource "aws_secretsmanager_secret" "sentry_dsn" {
  name = "obraya/${var.environment}/sentry-dsn"
}

resource "aws_secretsmanager_secret_version" "sentry_dsn" {
  secret_id     = aws_secretsmanager_secret.sentry_dsn.id
  secret_string = "CHANGEME"

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# AFIP_CERT_PATH/AFIP_KEY_PATH son archivos (certificado + clave), no un
# string simple -- no entran en este patron de Secrets Manager. Ver
# README.md para como montarlos en la task de ECS.
