resource "aws_security_group" "alb" {
  name        = "obraya-alb-sg"
  description = "ALB publico: HTTP/HTTPS desde internet"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP"
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

  tags = { Name = "obraya-alb-sg" }
}

resource "aws_security_group" "ecs_tasks" {
  name        = "obraya-ecs-tasks-sg"
  description = "Tasks de Fargate (backend + frontend): solo reciben trafico del ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Backend desde ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "Frontend desde ALB"
    from_port       = 3001
    to_port         = 3001
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "obraya-ecs-tasks-sg" }
}

resource "aws_security_group" "rds" {
  name        = "obraya-rds-sg"
  description = "Postgres: solo desde las tasks de ECS"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Postgres desde ECS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "obraya-rds-sg" }
}

resource "aws_security_group" "redis" {
  name        = "obraya-redis-sg"
  description = "Redis: solo desde las tasks de ECS"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Redis desde ECS"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "obraya-redis-sg" }
}

resource "aws_security_group" "opensearch" {
  count       = var.enable_opensearch ? 1 : 0
  name        = "obraya-opensearch-sg"
  description = "OpenSearch: solo desde las tasks de ECS"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTPS desde ECS"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "obraya-opensearch-sg" }
}
