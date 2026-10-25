resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/obraya-backend"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/obraya-frontend"
  retention_in_days = 30
}
