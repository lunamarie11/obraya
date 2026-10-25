resource "random_password" "db" {
  length  = 32
  special = false # evita caracteres que requieran escaping en DATABASE_URL
}

resource "aws_db_subnet_group" "main" {
  name       = "obraya-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_db_instance" "main" {
  identifier     = "obraya-${var.environment}"
  engine         = "postgres"
  engine_version = "16"
  instance_class = var.db_instance_class

  allocated_storage     = 20
  max_allocated_storage = 100 # autoscaling de storage hasta 100GB
  storage_type           = "gp3"
  storage_encrypted      = true

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db.result
  port     = 5432

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  multi_az = false # pre-lanzamiento: 1 sola AZ para no duplicar el costo de RDS

  backup_retention_period = 7
  backup_window           = "06:00-07:00" # madrugada en sa-east-1 (UTC-3)
  maintenance_window      = "sun:07:00-sun:08:00"

  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "obraya-${var.environment}-final"

  tags = { Name = "obraya-rds" }
}

resource "aws_secretsmanager_secret" "db_password" {
  name = "obraya/${var.environment}/database-password"
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db.result
}
