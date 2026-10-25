# Certificado para el ALB (api./app./admin.<dominio>) -- tiene que estar en
# la misma region que el ALB (sa-east-1).
resource "aws_acm_certificate" "alb" {
  domain_name       = "app.${var.domain_name}"
  validation_method = "DNS"

  subject_alternative_names = [
    "admin.${var.domain_name}",
    "api.${var.domain_name}",
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = { Name = "obraya-alb-cert" }
}

# Certificado para CloudFront (cdn.<dominio>) -- CloudFront exige que el
# cert este en us-east-1 sin importar en que region corra el resto.
resource "aws_acm_certificate" "cdn" {
  provider = aws.us_east_1

  domain_name        = "cdn.${var.domain_name}"
  validation_method  = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = { Name = "obraya-cdn-cert" }
}

# NOTA: no se declara aws_acm_certificate_validation aca a proposito.
# Terraform generaria los registros DNS de validacion pero se quedaria
# esperando (apply colgado) hasta que esos CNAME existan en el DNS real del
# dominio -- que vive fuera de AWS (ver README.md). Flujo:
#
#   1. terraform apply -target=aws_acm_certificate.alb -target=aws_acm_certificate.cdn
#   2. terraform output acm_validation_records
#   3. Crear esos CNAME donde este alojado el DNS de obraya.com.ar
#   4. Esperar a que propaguen (minutos a un par de horas)
#   5. terraform apply (sin -target) para el resto de la infra, que ya
#      referencia aws_acm_certificate.alb.arn / cdn.arn directamente -- AWS
#      permite asociar el cert al ALB/CloudFront aunque la validacion DNS
#      siga pendiente, pero el listener HTTPS no funciona hasta que valide.
