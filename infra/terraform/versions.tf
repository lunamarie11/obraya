terraform {
  required_version = ">= 1.6"

  required_providers {
    aws    = { source = "hashicorp/aws", version = "~> 5.0" }
    random = { source = "hashicorp/random", version = "~> 3.6" }
  }

  # Backend remoto: completar con los valores que salen de
  # `terraform apply` en infra/terraform/bootstrap/ (ver README.md),
  # despues correr `terraform init` para migrar el state local a S3.
  # backend "s3" {
  #   bucket         = "obraya-terraform-state-XXXXXXXX"
  #   key            = "produccion/terraform.tfstate"
  #   region         = "sa-east-1"
  #   dynamodb_table = "obraya-terraform-locks"
  #   encrypt        = true
  # }
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
