terraform {
  required_version = ">= 1.6"

  required_providers {
    aws    = { source = "hashicorp/aws", version = "~> 5.0" }
    random = { source = "hashicorp/random", version = "~> 3.6" }
  }

  # Backend remoto: creado por `terraform apply` en infra/terraform/bootstrap/
  # (ver README.md). State local ya migrado a S3 via `terraform init`.
  backend "s3" {
    bucket         = "obraya-terraform-state-0aa31cf0"
    key            = "produccion/terraform.tfstate"
    region         = "sa-east-1"
    dynamodb_table = "obraya-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "obraya"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# CloudFront exige que el certificado ACM este en us-east-1,
# independientemente de en que region viva el resto de la infra.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "obraya"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
