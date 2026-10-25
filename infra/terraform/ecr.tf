resource "aws_ecr_repository" "backend" {
  name                 = "obraya-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "frontend" {
  name                 = "obraya-frontend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# Se queda solo con las ultimas 10 imagenes de cada repo para no acumular
# costo de storage en ECR indefinidamente.
locals {
  ecr_keep_last_10_policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Mantener solo las ultimas 10 imagenes"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name
  policy     = local.ecr_keep_last_10_policy
}

resource "aws_ecr_lifecycle_policy" "frontend" {
  repository = aws_ecr_repository.frontend.name
  policy     = local.ecr_keep_last_10_policy
}
