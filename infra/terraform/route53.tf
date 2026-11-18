# NIC.ar (registrador de obraya.com.ar) no permite administrar registros
# DNS individuales (CNAME/A) desde su panel -- solo transferir el dominio o
# delegarlo a otro proveedor de DNS. Por eso el DNS real de obraya.com.ar
# se maneja aca, en una hosted zone de Route53: NIC.ar solo delega los NS,
# todo lo demas (validacion ACM, A records a la instancia, CNAME al CDN)
# se administra en este archivo.
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = { Name = "obraya-dns" }
}

# Registro de validacion DNS del certificado ACM de CloudFront (ver acm.tf).
resource "aws_route53_record" "acm_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cdn.domain_validation_options : dvo.domain_name => {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  }

  zone_id         = aws_route53_zone.main.zone_id
  name            = each.value.name
  type            = each.value.type
  ttl             = 60
  records         = [each.value.value]
  allow_overwrite = true
}

# app./admin./api.<dominio> -> IP fija de la instancia unica. Caddy, en la
# instancia, emite sus propios certificados TLS via Let's Encrypt para estos
# tres (ver comentario en acm.tf) -- no dependen de ACM/CloudFront.
resource "aws_route53_record" "app_subdomains" {
  for_each = toset(["app", "admin", "api"])

  zone_id = aws_route53_zone.main.zone_id
  name    = "${each.value}.${var.domain_name}"
  type    = "A"
  ttl     = 300
  records = [aws_eip.app.public_ip]
}

# <dominio> (apex, sin subdominio) -> landing de marketing, separada de
# app.<dominio> (la app logueada). Mismo frontend/instancia que app./admin.,
# el Next.js decide via Host header (ver middleware.ts) si sirve la landing
# o la app -- no son despliegues distintos.
resource "aws_route53_record" "apex" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = 300
  records = [aws_eip.app.public_ip]
}

# cdn.<dominio> -> distribucion de CloudFront (storage de imagenes/archivos).
resource "aws_route53_record" "cdn" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "cdn.${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  records = [aws_cloudfront_distribution.storage.domain_name]
}
