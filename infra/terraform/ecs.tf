resource "aws_ecs_cluster" "main" {
  name = "obraya-cluster"
  # Container Insights deshabilitado (default) para no sumar costo de
  # CloudWatch en pre-lanzamiento.
}

locals {
  redis_url = "redis://${aws_elasticache_cluster.main.cache_nodes[0].address}:6379"
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "obraya-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn             = aws_iam_role.backend_task.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${aws_ecr_repository.backend.repository_url}:${var.backend_image_tag}"
      essential = true

      portMappings = [{ containerPort = 3000, protocol = "tcp" }]

      environment = concat([
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3000" },
        { name = "LOG_LEVEL", value = "info" },
        { name = "FRONTEND_URL", value = "https://app.${var.domain_name}" },
        { name = "BACKEND_URL", value = "https://api.${var.domain_name}" },
        { name = "DATABASE_HOST", value = aws_db_instance.main.address },
        { name = "DATABASE_PORT", value = "5432" },
        { name = "DATABASE_NAME", value = var.db_name },
        { name = "DATABASE_USER", value = var.db_username },
        { name = "REDIS_URL", value = local.redis_url },
        { name = "AWS_S3_BUCKET", value = aws_s3_bucket.storage.bucket },
        { name = "AWS_S3_REGION", value = var.aws_region },
        { name = "AWS_CLOUDFRONT_DOMAIN", value = "cdn.${var.domain_name}" },
        { name = "AWS_SES_REGION", value = var.aws_region },
        { name = "EMAIL_FROM", value = "no-reply@${var.domain_name}" },
        { name = "ENABLE_DEMO", value = "false" },
        { name = "SENTRY_ENVIRONMENT", value = var.environment },
        { name = "SENTRY_TRACES_SAMPLE_RATE", value = "0" },
        ],
        var.enable_opensearch ? [
          { name = "ELASTICSEARCH_NODE", value = "https://${aws_opensearch_domain.main[0].endpoint}" }
        ] : []
        # AFIP_ENV/AFIP_CUIT/AFIP_CERT_PATH/AFIP_KEY_PATH: se agregan a mano
        # cuando exista el certificado real de AFIP (ver README.md); sin
        # ellos AfipService queda deshabilitado, no bloquea el arranque.
      )

      secrets = [
        { name = "JWT_SECRET", valueFrom = aws_secretsmanager_secret.jwt_secret.arn },
        { name = "JWT_REFRESH_SECRET", valueFrom = aws_secretsmanager_secret.jwt_refresh_secret.arn },
        { name = "DATABASE_PASSWORD", valueFrom = aws_secretsmanager_secret.db_password.arn },
        { name = "MERCADOPAGO_ACCESS_TOKEN", valueFrom = aws_secretsmanager_secret.mercadopago_token.arn },
        { name = "FIREBASE_SERVICE_ACCOUNT", valueFrom = aws_secretsmanager_secret.firebase_service_account.arn },
        { name = "SENTRY_DSN", valueFrom = aws_secretsmanager_secret.sentry_dsn.arn },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
        }
      }
    }
  ])
}

resource "aws_ecs_task_definition" "frontend" {
  family                   = "obraya-frontend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn             = aws_iam_role.frontend_task.arn

  container_definitions = jsonencode([
    {
      name      = "frontend"
      image     = "${aws_ecr_repository.frontend.repository_url}:${var.frontend_image_tag}"
      essential = true

      portMappings = [{ containerPort = 3001, protocol = "tcp" }]

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3001" },
        { name = "HOSTNAME", value = "0.0.0.0" },
        # NEXT_PUBLIC_API_URL NO va aca: se inlinea en build time en el
        # Dockerfile (ver infra/docker/Dockerfile.frontend), seteando esta
        # variable en runtime de ECS no tiene efecto.
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.frontend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "frontend"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "backend" {
  name            = "obraya-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.backend_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.https, aws_lb_listener_rule.api]
}

resource "aws_ecs_service" "frontend" {
  name            = "obraya-frontend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = var.frontend_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 3001
  }

  depends_on = [aws_lb_listener.https, aws_lb_listener_rule.admin]
}
