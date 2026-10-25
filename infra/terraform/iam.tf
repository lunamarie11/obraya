data "aws_iam_policy_document" "ecs_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# Execution role: lo usa el agente de ECS para pullear la imagen de ECR y
# escribir logs/leer secrets ANTES de que arranque el contenedor.
resource "aws_iam_role" "ecs_execution" {
  name               = "obraya-ecs-execution-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json
}

resource "aws_iam_role_policy_attachment" "ecs_execution_managed" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy_document" "ecs_execution_secrets" {
  statement {
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
}

resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name   = "obraya-ecs-execution-secrets"
  role   = aws_iam_role.ecs_execution.id
  policy = data.aws_iam_policy_document.ecs_execution_secrets.json
}

# Task role del backend: permisos que el CODIGO de la app necesita en
# runtime (S3 para StorageService, SES para email transaccional).
resource "aws_iam_role" "backend_task" {
  name               = "obraya-backend-task-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json
}

data "aws_iam_policy_document" "backend_task_permissions" {
  statement {
    sid     = "S3Storage"
    actions = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
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
}

resource "aws_iam_role_policy" "backend_task_permissions" {
  name   = "obraya-backend-task-permissions"
  role   = aws_iam_role.backend_task.id
  policy = data.aws_iam_policy_document.backend_task_permissions.json
}

# El frontend no necesita permisos de AWS en runtime (solo sirve Next.js).
resource "aws_iam_role" "frontend_task" {
  name               = "obraya-frontend-task-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json
}
