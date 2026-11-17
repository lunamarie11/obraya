data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

# Un solo role para la instancia: Postgres/Redis corren como contenedores
# locales (no hay task role separado de ECS que distinga backend/frontend).
resource "aws_iam_role" "app" {
  name               = "obraya-app-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json
}

# Acceso remoto via SSM Session Manager en vez de SSH -- sin puerto 22
# abierto ni llave que administrar (ver security_groups.tf).
resource "aws_iam_role_policy_attachment" "app_ssm" {
  role       = aws_iam_role.app.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

data "aws_iam_policy_document" "app_permissions" {
  statement {
    sid       = "S3Storage"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.storage.arn}/*"]
  }

  statement {
    sid       = "S3ListBucket"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.storage.arn]
  }

  statement {
    sid       = "SesSendEmail"
    actions   = ["ses:SendEmail", "ses:SendRawEmail"]
    resources = ["*"] # SES no soporta permisos a nivel de recurso para estas acciones
  }

  statement {
    sid     = "SecretsRead"
    actions = ["secretsmanager:GetSecretValue"]
    resources = [
      aws_secretsmanager_secret.jwt_secret.arn,
      aws_secretsmanager_secret.jwt_refresh_secret.arn,
      aws_secretsmanager_secret.db_password.arn,
      aws_secretsmanager_secret.mercadopago_token.arn,
      aws_secretsmanager_secret.firebase_service_account.arn,
      aws_secretsmanager_secret.sentry_dsn.arn,
    ]
  }

  statement {
    sid       = "EcrAuth"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"] # GetAuthorizationToken no soporta permisos a nivel de recurso
  }

  statement {
    sid = "EcrPull"
    actions = [
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchCheckLayerAvailability",
    ]
    resources = [
      aws_ecr_repository.backend.arn,
      aws_ecr_repository.frontend.arn,
    ]
  }
}

resource "aws_iam_role_policy" "app_permissions" {
  name   = "obraya-app-permissions"
  role   = aws_iam_role.app.id
  policy = data.aws_iam_policy_document.app_permissions.json
}

resource "aws_iam_instance_profile" "app" {
  name = "obraya-app-instance-profile"
  role = aws_iam_role.app.name
}
