# Deshabilitado por defecto (enable_opensearch = false): tiene costo fijo
# aun sin trafico, y SearchService ya cae a ILIKE en Postgres sin esto
# (ver variables.tf). Prender con `enable_opensearch = true` cuando el
# volumen de busquedas lo justifique.
resource "aws_opensearch_domain" "main" {
  count       = var.enable_opensearch ? 1 : 0
  domain_name = "obraya-${var.environment}"

  engine_version = "OpenSearch_2.11"

  cluster_config {
    instance_type  = var.opensearch_instance_type
    instance_count = 1
  }

  ebs_options {
    ebs_enabled = true
    volume_type = "gp3"
    volume_size = 10
  }

  vpc_options {
    subnet_ids         = [aws_subnet.private[0].id]
    security_group_ids = [aws_security_group.opensearch[0].id]
  }

  encrypt_at_rest {
    enabled = true
  }

  node_to_node_encryption {
    enabled = true
  }

  domain_endpoint_options {
    enforce_https = true
  }

  tags = { Name = "obraya-opensearch" }
}

# Sin access_policies: al estar en una VPC privada, el control de acceso lo
# hace el security group (ver opensearch_sg en security_groups.tf), no hace
# falta una resource policy adicional.
