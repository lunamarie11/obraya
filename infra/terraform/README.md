# Infraestructura de produccion (ADR-015, revisado por ADR-020)

ADR-015 original decidio ECS Fargate + RDS + ElastiCache + ALB (~110-120
USD/mes). ADR-020 lo reemplaza por una sola instancia EC2 corriendo
Postgres/Redis/backend/frontend como contenedores de Docker Compose, con
Caddy de reverse proxy + HTTPS automatico via Let's Encrypt (~20-25
USD/mes) — pensado para pre-lanzamiento, sin trafico real todavia. S3 +
CloudFront + ECR se mantienen igual que en ADR-015. OpenSearch sigue
apagado por defecto (`enable_opensearch = false`, ver `variables.tf`)
porque tiene costo fijo y `SearchService` ya cae a ILIKE en Postgres sin
el.

**Nada de esto se provisiona solo.** Escribir este codigo no cuesta nada;
`terraform apply` si crea recursos reales en AWS con costo real. No correrlo
sin confirmar antes.

## Costo estimado (mensual, aproximado)

| Recurso | Estimado USD/mes |
|---|---|
| EC2 `t4g.small` (2 vCPU/2GB, Graviton) | ~12 |
| EBS 30GB gp3 | ~2.5 |
| Elastic IP (asociada, sin costo propio mientras este en uso) | 0 |
| S3 + CloudFront | variable, bajo a este volumen (~5) |
| ECR | ~1 |
| Secrets Manager (6 secrets) | ~2.5 |
| **Total aprox.** | **~20-25/mes** |

Prender OpenSearch suma ~25-30/mes mas. Esto es una referencia gruesa, no
una cotizacion — revisar la calculadora de AWS con los valores reales de
`variables.tf` antes de aprobar presupuesto.

Sin HA: una sola instancia, sin failover. Aceptable para pre-lanzamiento
(ver ADR-020); migrar a ECS Fargate/RDS/ElastiCache (el diseno original de
ADR-015) cuando el trafico real lo justifique.

## Orden de pasos

### 0. Prerequisitos

- Cuenta de AWS con metodo de pago, credenciales con permisos de admin (o un
  rol con los permisos de los servicios de este Terraform) configuradas
  localmente (`aws configure` o variables `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`).
- Terraform >= 1.6 instalado.
- Dominio `obraya.com.ar` registrado y con acceso a su DNS (para crear el
  CNAME de validacion del cert de CloudFront y los A records que apuntan a
  la instancia).

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

### 2. Certificado ACM de CloudFront primero (necesita DNS manual)

Solo `cdn.obraya.com.ar` usa ACM — `app./admin./api.` los maneja Caddy con
Let's Encrypt directamente en la instancia (ver `acm.tf`), sin pasos de
validacion DNS manual.

```
cd infra/terraform
terraform init
cp terraform.tfvars.example terraform.tfvars   # ajustar si hace falta
terraform apply -target=aws_acm_certificate.cdn
terraform output acm_validation_record
```

Crear ese CNAME en el DNS de `obraya.com.ar` (donde este alojado — GoDaddy,
Route53, el proveedor que sea). Esperar a que propague (minutos a un par de
horas, verificar con `dig`).

### 3. Resto de la infraestructura

```
terraform apply
```

Crea VPC, la instancia EC2 + Elastic IP, S3+CloudFront, ECR, Secrets
Manager, IAM. La instancia arranca con Docker instalado (ver `user_data` en
`ec2.tf`) pero **sin la app todavia** — eso es el paso 4.

### 4. DNS hacia la instancia

```
terraform output eip_public_ip
```

Apuntar en el DNS real de `obraya.com.ar` (A record, no CNAME, porque es una
IP fija):

- `app.obraya.com.ar` → esa IP
- `admin.obraya.com.ar` → esa IP
- `api.obraya.com.ar` → esa IP
- `cdn.obraya.com.ar` → CNAME/ALIAS a `terraform output cloudfront_domain_name`

Esperar propagacion antes del paso 6 — Caddy necesita que el DNS ya resuelva
para poder completar el challenge HTTP-01 de Let's Encrypt.

### 5. Build y push de las imagenes a ECR

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
runtime del contenedor (ver comentario en `Dockerfile.frontend`).

### 6. Primer deploy en la instancia

Conectarse via SSM Session Manager (sin SSH, ver `iam.tf`/`security_groups.tf`):

```
aws ssm start-session --target $(terraform output -raw instance_id) --region sa-east-1
```

Dentro de la sesion, en `/opt/obraya`:

1. Subir `infra/docker/docker-compose.prod.yml` y `infra/docker/Caddyfile`
   (via `aws s3 cp` desde el bucket de storage, o pegando el contenido a
   mano con `cat > archivo <<'EOF' ... EOF` — no hay pipeline de CI que lo
   automatice todavia, ver "Pendiente" mas abajo).
2. Armar `.env.backend` con los valores reales (los secrets salen de
   Secrets Manager, el resto de `packages/backend/.env.example`):
   ```
   DATABASE_HOST=postgres
   DATABASE_PORT=5432
   DATABASE_NAME=obraya
   DATABASE_USER=obraya_app
   DATABASE_PASSWORD=$(aws secretsmanager get-secret-value --secret-id obraya/production/db-password --query SecretString --output text --region sa-east-1)
   DATABASE_URL=postgresql://obraya_app:<password-de-arriba>@postgres:5432/obraya
   REDIS_URL=redis://redis:6379
   JWT_SECRET=$(aws secretsmanager get-secret-value --secret-id obraya/production/jwt-secret --query SecretString --output text --region sa-east-1)
   JWT_REFRESH_SECRET=$(aws secretsmanager get-secret-value --secret-id obraya/production/jwt-refresh-secret --query SecretString --output text --region sa-east-1)
   NODE_ENV=production
   FRONTEND_URL=https://app.obraya.com.ar
   BACKEND_URL=https://api.obraya.com.ar
   AWS_S3_BUCKET=<terraform output del bucket de storage>
   AWS_S3_REGION=sa-east-1
   AWS_CLOUDFRONT_DOMAIN=cdn.obraya.com.ar
   # MERCADOPAGO_ACCESS_TOKEN, FIREBASE_SERVICE_ACCOUNT, SENTRY_DSN: ver seccion 7
   ```
3. Exportar `DATABASE_PASSWORD` tambien como variable de entorno del shell
   (la usa el servicio `postgres` del compose) y `ECR_BACKEND_IMAGE`/
   `ECR_FRONTEND_IMAGE` apuntando a las imagenes recien pusheadas:
   ```
   export DATABASE_PASSWORD=<mismo valor de arriba>
   export ECR_BACKEND_IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.sa-east-1.amazonaws.com/obraya-backend:latest
   export ECR_FRONTEND_IMAGE=$AWS_ACCOUNT_ID.dkr.ecr.sa-east-1.amazonaws.com/obraya-frontend:latest
   aws ecr get-login-password --region sa-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.sa-east-1.amazonaws.com
   docker-compose -f docker-compose.prod.yml up -d
   ```

Caddy va a intentar emitir los certificados de `app./admin./api.` al
arrancar — si el DNS del paso 4 todavia no propago, falla y reintenta solo
(no hace falta reiniciar nada a mano, solo esperar).

### 7. Secrets de integraciones externas

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

Despues de cada uno, actualizar `.env.backend` en la instancia con el valor
nuevo y `docker-compose -f docker-compose.prod.yml up -d backend` (no hay
hot-reload, hay que recrear el contenedor).

`AFIP_CUIT`/`AFIP_CERT_PATH`/`AFIP_KEY_PATH` no estan en este Terraform: son
un certificado + clave (archivos, no un string) — subirlos directo a
`/opt/obraya` via SSM (`aws ssm start-session` + `cat > archivo`, o
`aws s3 cp` desde un bucket privado) y montarlos en `docker-compose.prod.yml`
como volumen del backend. Pendiente de decidir el detalle cuando llegue el
certificado real de AFIP (bloqueado por el CUIT, ver
`docs/checklist-deploy-produccion.md`).

### 8. Migration de la base de datos

```
docker exec obraya-backend npm run migration:run --workspace=@obraya/backend
```

### 9. Smoke test

```
curl https://api.obraya.com.ar/api/v1/health
```

Y un flujo de compra end-to-end real contra Mercado Pago/AFIP en modo
produccion (se comportan distinto que en sandbox).

## Pendiente (fuera de alcance de este Terraform)

- Automatizar el paso 5-6 (build+push a ECR + redeploy) en
  `.github/workflows/ci.yml` en vez de correrlo a mano en cada merge a
  `main` — hoy no hay nada de esto en CI.
- Decidir como montar el certificado de AFIP (paso 7).
- Migrar a ECS Fargate + RDS + ElastiCache + ALB (diseno original de
  ADR-015) cuando el volumen de trafico post-lanzamiento lo justifique —
  ADR-020 documenta el tradeoff y cuando reconsiderarlo.
