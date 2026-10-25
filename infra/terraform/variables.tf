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
  description = "Tag de la imagen en ECR (lo setea CI al hacer push, ver ADR-015 seccion 'siguiente paso')"
  type        = string
  default     = "latest"
}

variable "frontend_image_tag" {
  type    = string
  default = "latest"
}

variable "backend_desired_count" {
  description = "Cantidad de tasks del backend. 1 alcanza para pre-lanzamiento; subir a 2+ cuando haya trafico real (no hay HA con 1 sola task)."
  type        = number
  default     = 1
}

variable "frontend_desired_count" {
  type    = number
  default = 1
}

variable "db_instance_class" {
  description = "db.t4g.micro: el mas chico con soporte de Postgres 16 en RDS. Subir si el volumen lo justifica."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_name" {
  type    = string
  default = "obraya"
}

variable "db_username" {
  type    = string
  default = "obraya_app"
}

variable "redis_node_type" {
  type    = string
  default = "cache.t4g.micro"
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
