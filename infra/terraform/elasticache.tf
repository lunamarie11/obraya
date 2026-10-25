resource "aws_elasticache_subnet_group" "main" {
  name       = "obraya-redis-subnet-group"
  subnet_ids = aws_subnet.private[*].id
}

# 1 solo nodo, sin replicacion: suficiente para cache/sessions en
# pre-lanzamiento. Si se necesita alta disponibilidad mas adelante, migrar
# a aws_elasticache_replication_group con automatic_failover_enabled.
resource "aws_elasticache_cluster" "main" {
  cluster_id         = "obraya-${var.environment}"
  engine             = "redis"
  engine_version     = "7.0"
  node_type          = var.redis_node_type
  num_cache_nodes    = 1
  port               = 6379
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  tags = { Name = "obraya-redis" }
}
