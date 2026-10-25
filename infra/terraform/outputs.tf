output "alb_dns_name" {
  description = "Apuntar aqui app.<dominio>, admin.<dominio> y api.<dominio> (CNAME/ALIAS) en el DNS real"
  value       = aws_lb.main.dns_name
}

output "cloudfront_domain_name" {
  description = "Apuntar aqui cdn.<dominio> (CNAME/ALIAS) en el DNS real"
  value       = aws_cloudfront_distribution.storage.domain_name
}

output "acm_validation_records" {
  description = "Crear estos CNAME en el DNS de obraya.com.ar para validar ambos certificados ACM"
  value = {
    alb = [for o in aws_acm_certificate.alb.domain_validation_options : {
      name  = o.resource_record_name
      type  = o.resource_record_type
      value = o.resource_record_value
    }]
    cdn = [for o in aws_acm_certificate.cdn.domain_validation_options : {
      name  = o.resource_record_name
      type  = o.resource_record_type
      value = o.resource_record_value
    }]
  }
}

output "ecr_backend_repository_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_repository_url" {
  value = aws_ecr_repository.frontend.repository_url
}

output "rds_endpoint" {
  value = aws_db_instance.main.address
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.main.cache_nodes[0].address
}

output "opensearch_endpoint" {
  value = var.enable_opensearch ? aws_opensearch_domain.main[0].endpoint : null
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "backend_task_definition_family" {
  value = aws_ecs_task_definition.backend.family
}
