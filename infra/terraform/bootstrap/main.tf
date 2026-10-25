# Bootstrap del backend remoto de Terraform (S3 + DynamoDB lock).
#
# Se aplica UNA SOLA VEZ, antes de tocar infra/terraform/ (la infra real).
# Sin esto, el .tfstate de la infra de produccion vive solo en el disco del
# dev que corrio `apply` -- si se pierde ese archivo, Terraform ya no sabe
# que recursos existen en AWS.
#
# Uso:
#   cd infra/terraform/bootstrap
#   terraform init
#   terraform apply
#   terraform output   # anotar state_bucket y lock_table
#
# Despues, en infra/terraform/versions.tf, descomentar el bloque backend "s3"
# con esos dos valores y correr `terraform init` ahi (migra a backend remoto).

terraform {
  required_version = ">= 1.6"

  required_providers {
    aws    = { source = "hashicorp/aws", version = "~> 5.0" }
    random = { source = "hashicorp/random", version = "~> 3.6" }
  }
}

provider "aws" {
  region = "sa-east-1"
}

# Sufijo random: el nombre de bucket S3 tiene que ser unico globalmente.
resource "random_id" "suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "tf_state" {
  bucket = "obraya-terraform-state-${random_id.suffix.hex}"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "tf_state" {
  bucket                  = aws_s3_bucket.tf_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "tf_lock" {
  name         = "obraya-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}

output "state_bucket" {
  value = aws_s3_bucket.tf_state.bucket
}

output "lock_table" {
  value = aws_dynamodb_table.tf_lock.name
}
