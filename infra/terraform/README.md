# Infraestructura de produccion (ADR-015)

Terraform de todo lo que ADR-015 decidio: ECS Fargate + RDS + ElastiCache +
S3/CloudFront + ALB + ECR, en `sa-east-1`. OpenSearch queda apagado por
defecto (`enable_opensearch = false`, ver `variables.tf`) porque tiene costo
fijo y `SearchService` ya cae a ILIKE en Postgres sin el.

**Nada de esto se provisiona solo.** Escribir este codigo no cuesta nada;
`terraform apply` si crea recursos reales en AWS con costo real. No correrlo
sin confirmar antes.

## Costo estimado (mensual, aproximado, con todo prendido salvo OpenSearch)

| Recurso | Estimado USD/mes |
|---|---|
| NAT Gateway (1, fijo + data) | ~35 |
| RDS `db.t4g.micro` | ~15 |
| ElastiCache `cache.t4g.micro` | ~12 |
| Fargate (backend 0.5vCPU/1GB + frontend 0.25vCPU/0.5GB, 1 task c/u) | ~25 |
| ALB | ~20 |
| S3 + CloudFront | variable, bajo a este volumen (~5) |
| ECR | ~1 |
| **Total aprox.** | **~110-120/mes** |

Prender OpenSearch suma ~25-30/mes mas. Esto es una referencia gruesa, no
una cotizacion — revisar la calculadora de AWS con los valores reales de
`variables.tf` antes de aprobar presupuesto.

## Orden de pasos

### 0. Prerequisitos

- Cuenta de AWS con metodo de pago, credenciales con permisos de admin (o un
  rol con los permisos de los servicios de este Terraform) configuradas
  localmente (`aws configure` o variables `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`).
- Terraform >= 1.6 instalado.
- Dominio `obraya.com.ar` registrado y con acceso a su DNS (para crear los
  CNAME de validacion y los que apuntan a AWS).

### 1. Bootstrap del remote state (una sola vez)

```
cd infra/terraform/bootstrap
terraform init
terraform apply
terraform output   # anotar state_bucket y lock_table
```

Despues, en `infra/terraform/versions.tf`, descomentar el bloque `backend "s3"`
con esos dos valores y correr `terraform init` dentro de `infra/terraform/`
(migra el state local a S3 — Terraform pregunta confirmacion).

### 2. Certificados ACM primero (necesitan DNS manual)

```
cd infra/terraform
terraform init
cp terraform.tfvars.example terraform.tfvars   # ajustar si hace falta
terraform apply -target=aws_acm_certificate.alb -target=aws_acm_certificate.cdn
terraform output acm_validation_records
```

Crear esos CNAME en el DNS de `obraya.com.ar` (donde este alojado — GoDaddy,
Route53, el proveedor que sea). Esperar a que propaguen (minutos a un par de
horas, verificar con `dig`).

### 3. Resto de la infraestructura

```
terraform apply
```

Crea VPC, RDS, ElastiCache, ALB, ECS (cluster + task definitions + services,
**sin imagenes todavia** — ver paso 4), S3+CloudFront, Secrets Manager, IAM.
Los servicios de ECS van a quedar en estado `RUNNING` pero con tasks
fallando hasta que haya una imagen real en ECR (paso 4).

### 4. Build y push de las imagenes a ECR

```
AWS_ACCOUNT_ID=<tu cuenta>
aws ecr get-login-password --region sa-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.sa-east-1.amazonaws.com

docker build -f infra/docker/Dockerfile.backend -t $AWS_ACCOUNT_ID.dkr.ecr.sa-east-1.amazonaws.com/obraya-backend:latest .
docker push $AWS_ACCOUNT_ID.dkr.ecr.sa-east-1.amazonaws.com/obraya-backend:latest

docker build -f infra/docker/Dockerfile.frontend \
  --build-arg NEXT_PUBLIC_API_URL=https://api.obraya.com.ar/api/v1 \
  -t $AWS_ACCOUNT_ID.dkr.ecr.sa-east-1.amazonaws.com/obraya-frontend:latest .
docker push $AWS_ACCOUNT_ID.dkr.ecr.sa-east-1.amazonaws.com/obraya-frontend:latest
```

El `--build-arg NEXT_PUBLIC_API_URL` es obligatorio: Next.js inlinea esa
variable en el bundle de cliente durante el build, no sirve setearla en
runtime de ECS (ver comentario en `Dockerfile.frontend` y en `ecs.tf`).

Despues forzar que ECS levante las tasks con la imagen nueva:

```
aws ecs update-service --cluster obraya-cluster --service obraya-backend --force-new-deployment --region sa-east-1
aws ecs update-service --cluster obraya-cluster --service obraya-frontend --force-new-deployment --region sa-east-1
```

(Este paso manual es exactamente lo que falta automatizar en CI — ver
"Pendiente" mas abajo.)

### 5. DNS final

Apuntar en el DNS real de `obraya.com.ar`:

- `app.obraya.com.ar` y `admin.obraya.com.ar` → CNAME/ALIAS a
  `terraform output alb_dns_name`
- `api.obraya.com.ar` → CNAME/ALIAS a `terraform output alb_dns_name`
- `cdn.obraya.com.ar` → CNAME/ALIAS a `terraform output cloudfront_domain_name`

### 6. Secrets de integraciones externas

Los placeholders que crea Terraform (`secrets.tf`) hay que pisarlos con los
valores reales una vez que esten (ver `docs/checklist-deploy-produccion.md`
seccion 3 para de donde sale cada uno):

```
aws secretsmanager put-secret-value --region sa-east-1 \
  --secret-id obraya/production/mercadopago-access-token \
  --secret-string '<access token real de Mercado Pago>'

aws secretsmanager put-secret-value --region sa-east-1 \
  --secret-id obraya/production/firebase-service-account \
  --secret-string '<JSON completo del service account de Firebase>'

aws secretsmanager put-secret-value --region sa-east-1 \
  --secret-id obraya/production/sentry-dsn \
  --secret-string '<DSN real de Sentry>'
```

Despues de cada uno, `aws ecs update-service --force-new-deployment` para
que la task nueva lea el valor actualizado (los secrets se inyectan al
arrancar el contenedor, no hay hot-reload).

`AFIP_CUIT`/`AFIP_CERT_PATH`/`AFIP_KEY_PATH` no estan en este Terraform: son
un certificado + clave (archivos, no un string), hay que decidir como
montarlos en la task (ECS Secrets solo soporta valores string de Secrets
Manager/SSM Parameter Store, no archivos binarios directamente — una opcion
es subirlos a un SSM Parameter como base64 y agregar un `entrypoint` que los
escriba a disco antes de arrancar, u otra igual de manual). Pendiente de
decidir cuando llegue el certificado real de AFIP.

### 7. Migration de la base de datos

La tabla no existe hasta correr la migration. Mas simple: un task one-off de
Fargate con la misma imagen del backend, overrideando el comando:

```
aws ecs run-task \
  --cluster obraya-cluster \
  --task-definition obraya-backend \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<private-subnet-ids>],securityGroups=[<ecs-tasks-sg-id>],assignPublicIp=DISABLED}" \
  --overrides '{"containerOverrides":[{"name":"backend","command":["npm","run","migration:run","--workspace=@obraya/backend"]}]}' \
  --region sa-east-1
```

(subnet ids y security group id salen de `terraform state show` o del
output de los recursos `aws_subnet.private`/`aws_security_group.ecs_tasks`).

### 8. Smoke test

```
curl https://api.obraya.com.ar/api/v1/health
```

Y un flujo de compra end-to-end real contra Mercado Pago/AFIP en modo
produccion (se comportan distinto que en sandbox).

## Pendiente (fuera de alcance de este Terraform)

- Extender `.github/workflows/ci.yml` para hacer build+push a ECR y
  `aws ecs update-service --force-new-deployment` en merge a `main` — hoy el
  paso 4 de arriba es manual.
- Decidir como montar el certificado de AFIP (paso 6).
- Evaluar Multi-AZ en RDS / replication group en ElastiCache / 2da NAT
  Gateway si el volumen post-lanzamiento lo justifica (hoy todo en 1 sola AZ
  para bajar costo).
