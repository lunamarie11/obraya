# Permite que GitHub Actions (repo lunamarie11/obraya, workflow de deploy)
# asuma un role de AWS sin guardar credenciales estaticas como secret --
# ver .github/workflows/deploy.yml y docs/backlog-salida-produccion.md
# punto 6 (antes el deploy a produccion era 100% manual via SSM).
resource "aws_iam_openid_connect_provider" "github_actions" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
  # AWS valida el certificado real del IdP en el momento del assume-role
  # desde 2023 (ya no depende de este thumbprint para la seguridad), pero
  # el recurso de Terraform sigue exigiendo un valor. Thumbprint publico
  # conocido de GitHub, documentado en la guia oficial de AWS para OIDC.
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

locals {
  github_repo = "lunamarie11/obraya"
}

# Se usa para armar el ARN de la instancia a mano (en vez de
# aws_instance.app.arn) para que este role no quede en el grafo de
# dependencias de la instancia -- esta sola (ADR-020) tiene drift de AMI
# pendiente de resolver (el parametro SSM "latest" de ec2.tf cambia de
# valor con el tiempo) y cualquier `terraform apply` sin -target la
# reemplazaria. No queremos que crear este role arrastre esa replace.
data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "github_actions_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github_actions.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    # Restringido a pushes a la rama main del repo -- un workflow corriendo
    # desde un fork o una rama de feature no puede asumir este role.
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${local.github_repo}:ref:refs/heads/main"]
    }
  }
}

resource "aws_iam_role" "github_actions_deploy" {
  name               = "obraya-github-actions-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume_role.json
}

data "aws_iam_policy_document" "github_actions_deploy_permissions" {
  statement {
    sid       = "EcrAuth"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"] # GetAuthorizationToken no soporta permisos a nivel de recurso
  }

  statement {
    sid = "EcrPush"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:PutImage",
    ]
    resources = [
      aws_ecr_repository.backend.arn,
      aws_ecr_repository.frontend.arn,
    ]
  }

  # Deploy via SSM Session Manager -- mismo mecanismo que se usa a mano hoy
  # (sin SSH, ver security_groups.tf / iam.tf de la instancia).
  statement {
    sid     = "SsmSendCommand"
    actions = ["ssm:SendCommand"]
    resources = [
      # ARN armado a mano (ver comentario de data.aws_caller_identity.current
      # arriba) en vez de aws_instance.app.arn -- mismo instance ID que hoy
      # corre en produccion (i-041a8665a0055ce26, ver ec2.tf/outputs.tf).
      "arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:instance/i-041a8665a0055ce26",
      "arn:aws:ssm:${var.aws_region}::document/AWS-RunShellScript",
    ]
  }

  statement {
    sid       = "SsmGetCommandInvocation"
    actions   = ["ssm:GetCommandInvocation", "ssm:ListCommandInvocations"]
    resources = ["*"] # estas acciones no soportan permisos a nivel de recurso
  }
}

resource "aws_iam_role_policy" "github_actions_deploy_permissions" {
  name   = "obraya-github-actions-deploy-permissions"
  role   = aws_iam_role.github_actions_deploy.id
  policy = data.aws_iam_policy_document.github_actions_deploy_permissions.json
}

output "github_actions_deploy_role_arn" {
  description = "Configurar como secret/variable AWS_DEPLOY_ROLE_ARN en GitHub Actions (repo lunamarie11/obraya)"
  value       = aws_iam_role.github_actions_deploy.arn
}
