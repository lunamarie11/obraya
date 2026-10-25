variable "aws_region" {
  description = "Region de AWS (ver ADR-001: sa-east-1 por latencia a Argentina)"
  type        = string
  default     = "sa-east-1"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "domain_name" {
  description = "Dominio raiz, sin protocolo ni subdominio (ver cors.config.ts)"
  type        = string
  default     = "obraya.com.ar"
}

variable "vpc_cidr" {
  type    = string
  default = "10.20.0.0/16"
}

variable "backend_image_tag" {
  description = "Tag de la imagen en ECR (lo setea CI al hacer push, ver README.md)"
  type        = string
  default     = "latest"
}

variable "frontend_image_tag" {
  type    = string
  default = "latest"
}

variable "db_name" {
  type    = string
  default = "obraya"
}

variable "db_username" {
  type    = string
  default = "obraya_app"
}

variable "instance_type" {
  description = "t4g.small: 2 vCPU/2GB ARM, alcanza para Postgres+Redis+backend+frontend en un solo host pre-lanzamiento (ver ADR-020). Subir si el volumen lo justifica."
  type        = string
  default     = "t4g.small"
}

variable "root_volume_size_gb" {
  description = "Disco de la instancia: contenedores + volumenes de Postgres/Redis."
  type        = number
  default     = 30
}

variable "enable_opensearch" {
  description = <<-EOT
    Amazon OpenSearch managed tiene costo fijo (~USD 25-30/mes) aun sin
    trafico. SearchService ya cae a ILIKE en Postgres si ELASTICSEARCH_NODE
    no esta seteado (best-effort, ver checklist-deploy-produccion.md seccion
    3) -- queda en false hasta que el volumen de busquedas justifique mejor
    relevancia. Cambiar a true + terraform apply lo prende sin tocar codigo.
  EOT
  type        = bool
  default     = false
}

variable "opensearch_instance_type" {
  type    = string
  default = "t3.small.search"
}
