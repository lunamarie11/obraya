# CloudFront exige certificados ACM propios (no puede usar Let's Encrypt) y
# en us-east-1 sin importar en que region viva el resto de la infra.
#
# app./admin./api.<dominio> NO tienen certificado ACM: Caddy, corriendo en
# la instancia unica (ver ec2.tf), emite y renueva esos certificados solo
# via Let's Encrypt (HTTP-01), sin intervencion manual ni ALB de por medio.
resource "aws_acm_certificate" "cdn" {
  provider = aws.us_east_1

  domain_name       = "cdn.${var.domain_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = { Name = "obraya-cdn-cert" }
}

# NOTA: no se declara aws_acm_certificate_validation aca a proposito.
# Terraform generaria el registro DNS de validacion pero se quedaria
# esperando (apply colgado) hasta que ese CNAME exista en el DNS real del
# dominio -- que vive fuera de AWS (ver README.md). Flujo:
#
#   1. terraform apply -target=aws_acm_certificate.cdn
#   2. terraform output acm_validation_record
#   3. Crear ese CNAME donde este alojado el DNS de obraya.com.ar
#   4. Esperar a que propague (minutos a un par de horas)
#   5. terraform apply (sin -target) para el resto de la infra, que ya
#      referencia aws_acm_certificate.cdn.arn directamente -- AWS permite
#      asociar el cert a CloudFront aunque la validacion DNS siga pendiente,
#      pero la distribucion no sirve HTTPS hasta que valide.
