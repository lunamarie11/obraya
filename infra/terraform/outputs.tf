output "eip_public_ip" {
  description = "Apuntar aqui (A record) app./admin./api.<dominio> en el DNS real. Caddy en la instancia emite los certificados TLS de estos tres solo (ver acm.tf)."
  value       = aws_eip.app.public_ip
}

output "cloudfront_domain_name" {
  description = "Apuntar aqui cdn.<dominio> (CNAME/ALIAS) en el DNS real"
  value       = aws_cloudfront_distribution.storage.domain_name
}

output "acm_validation_record" {
  description = "Crear este CNAME en el DNS de obraya.com.ar para validar el certificado ACM de CloudFront (unico que usa ACM, ver acm.tf)"
  value = [for o in aws_acm_certificate.cdn.domain_validation_options : {
    name  = o.resource_record_name
    type  = o.resource_record_type
    value = o.resource_record_value
  }]
}

output "ecr_backend_repository_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_repository_url" {
  value = aws_ecr_repository.frontend.repository_url
}

output "opensearch_endpoint" {
  value = var.enable_opensearch ? aws_opensearch_domain.main[0].endpoint : null
}

output "instance_id" {
  description = "Para conectarse via SSM Session Manager: aws ssm start-session --target <este-valor>"
  value       = aws_instance.app.id
}
