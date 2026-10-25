data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  azs = slice(data.aws_availability_zones.available.names, 0, 2)
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "obraya-vpc" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = { Name = "obraya-igw" }
}

# Solo subnets publicas: la instancia unica (ver ec2.tf) tiene IP publica
# propia y no necesita NAT Gateway (~35 USD/mes que se evitan por completo,
# ver ADR-020). 2 AZs se mantienen solo porque OpenSearch (opcional, ver
# opensearch.tf) pide al menos 1 subnet valida -- si en el futuro se vuelve
# a un diseno multi-instancia con failover, estas subnets ya estan listas.
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = { Name = "obraya-public-${local.azs[count.index]}" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "obraya-public-rt" }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Gateway endpoint a S3: gratis, evita que el trafico a S3 (storage de
# productos) pague de mas por salir via el Internet Gateway.
resource "aws_vpc_endpoint" "s3" {
  vpc_id          = aws_vpc.main.id
  service_name    = "com.amazonaws.${var.aws_region}.s3"
  route_table_ids = [aws_route_table.public.id]

  tags = { Name = "obraya-s3-endpoint" }
}
