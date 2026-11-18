# Ver docs/backlog-salida-produccion.md punto 3: SES arranca en modo
# sandbox (solo envia a direcciones verificadas manualmente). Para salir
# de sandbox, AWS exige primero verificar el dominio emisor con DKIM.
#
# aws_sesv2_email_identity con dkim_signing_attributes.next_signing_key_length
# usa Easy DKIM (RSA 2048): AWS genera 3 tokens CNAME que hay que publicar
# en el DNS del dominio -- Route53 ya administra obraya.com.ar (route53.tf),
# asi que se agregan automaticamente.
resource "aws_sesv2_email_identity" "main" {
  email_identity = var.domain_name

  dkim_signing_attributes {
    next_signing_key_length = "RSA_2048_BIT"
  }
}

resource "aws_route53_record" "ses_dkim" {
  count = 3

  zone_id = aws_route53_zone.main.zone_id
  name    = "${aws_sesv2_email_identity.main.dkim_signing_attributes[0].tokens[count.index]}._domainkey.${var.domain_name}"
  type    = "CNAME"
  ttl     = 600
  records = ["${aws_sesv2_email_identity.main.dkim_signing_attributes[0].tokens[count.index]}.dkim.amazonses.com"]
}

# Registro MAIL FROM personalizado (mail.obraya.com.ar) -- mejora la
# reputacion de entrega (SPF alineado) y evita que los emails salgan con
# el dominio generico de amazonses.com. Requiere su propio MX + TXT (SPF).
resource "aws_sesv2_email_identity_mail_from_attributes" "main" {
  email_identity   = aws_sesv2_email_identity.main.email_identity
  mail_from_domain = "mail.${var.domain_name}"
}

resource "aws_route53_record" "ses_mail_from_mx" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "mail.${var.domain_name}"
  type    = "MX"
  ttl     = 600
  records = ["10 feedback-smtp.${var.aws_region}.amazonses.com"]
}

resource "aws_route53_record" "ses_mail_from_spf" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "mail.${var.domain_name}"
  type    = "TXT"
  ttl     = 600
  records = ["v=spf1 include:amazonses.com ~all"]
}
