# Checklist de deploy a producción

Este documento audita, a partir del código real (no de memoria ni de
suposiciones), todo lo que falta configurar o construir antes del primer
deploy de ObraYa a producción. Reemplaza cualquier checklist anterior que
asumiera infraestructura (CI/CD, `docker-compose.prod.yml`, certbot) que
todavía no existe en este repo — el proyecto sigue en Fase 0/1 (pre-seed, ver
`CLAUDE.md`), sin infraestructura de producción armada todavía.

Última auditoría: 2026-10-25.

## 1. Secrets — bloqueante, con validación automática (ver ADR-014)

Desde este cambio, el backend **no arranca** en `NODE_ENV=production` si
alguno de estos tres sigue con el valor default de desarrollo
(`validateProductionEnv()` en `packages/backend/src/config/validate-production-env.ts`):

| Variable | Default de desarrollo (NO usar en prod) | Cómo generar uno real |
|---|---|---|
| `JWT_SECRET` | `change-me-in-production` (fallback en `app.config.ts`) | `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | `change-me-refresh-in-production` | `openssl rand -base64 48` |
| `DATABASE_PASSWORD` | `password` (default de `docker-compose.yml`) | password fuerte del proveedor de DB |

**El `JWT_SECRET`/`JWT_REFRESH_SECRET` usados en desarrollo local
(`packages/backend/.env`) fueron compartidos en el chat de este proyecto —
no reutilizarlos en producción bajo ningún concepto**, aunque tengan más de
32 caracteres y pasen la validación automática (la validación solo detecta
que *falte* un secret o que sea el placeholder/corto, no que haya sido
expuesto).

## 2. Base de datos — RESUELTO (2026-09-29)

- **Migration inicial generada y verificada**:
  `packages/backend/src/database/migrations/1790689901672-InitialSchema.ts`.
  Generada con `typeorm migration:generate` contra una DB Postgres 16 vacía
  (contenedor temporal descartable, no contra la de desarrollo local, que ya
  tenía el schema sincronizado y el diff hubiera salido vacío). Verificada
  de punta a punta contra esa misma DB temporal: `migration:run` la ejecuta
  sin errores (TypeORM crea la extensión `uuid-ossp` automáticamente antes
  de correr las migrations) y un segundo `migration:generate` posterior
  devuelve "No changes in database schema were found" — confirma que
  coincide exactamente con las entities actuales.
- Sigue pendiente como paso de deploy: `npm run migration:run --workspace=@obraya/backend`
  antes de levantar la nueva versión de la app en producción.
- `ssl: { rejectUnauthorized: false }` en producción (`database.module.ts`):
  suficiente para managed Postgres con certificados autofirmados (RDS, etc.),
  pero no valida la cadena — aceptable para MVP, revisar si se necesita
  `rejectUnauthorized: true` con el CA del proveedor más adelante.
- Backups automáticos del lado del proveedor de DB (RDS/Cloud SQL/etc.) — no
  hay nada implementado en este repo al respecto, es responsabilidad de la
  infraestructura elegida.

## 3. Integraciones externas — pasar de test/sandbox a producción

Todas siguen el mismo patrón best-effort: si falta configuración, se
deshabilitan solas sin romper el resto de la app (no bloquean el arranque
como los secrets de la sección 1). Pero sin esto, funcionalidad real de
negocio queda apagada en silencio:

| Integración | Ver | Qué falta para producción |
|---|---|---|
| Mercado Pago | ADR-007 | `MERCADOPAGO_ACCESS_TOKEN` de PROD (hoy es `TEST_TOKEN` en dev). Configurar `notification_url` real — usa `BACKEND_URL` (`payments.service.ts`), verificar que apunte al dominio público de producción. |
| AFIP | ADR-010 | `AFIP_ENV=production`, `AFIP_CUIT` real de la empresa, `AFIP_CERT_PATH`/`AFIP_KEY_PATH` con certificado válido emitido por AFIP (sin esto, `AfipService` se deshabilita en producción — ver el guard explícito en `onModuleInit()`). |
| Email — AWS SES | ADR-011 | Salir de *SES sandbox mode* (por default solo envía a direcciones verificadas manualmente) y verificar el dominio de `EMAIL_FROM`. `AWS_SES_REGION`/`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` de producción. |
| Push — Firebase FCM | ADR-007 | `FIREBASE_SERVICE_ACCOUNT` con el JSON del proyecto de Firebase real (hoy vacío en dev → `NotificationsService` deshabilitado). |
| Sentry | ADR-013 | Crear el proyecto en Sentry, setear `SENTRY_DSN` real. Evaluar `SENTRY_TRACES_SAMPLE_RATE` > 0 si se quiere tracing de performance (hoy en `0`). |
| Elasticsearch | ADR-007 | `ELASTICSEARCH_NODE` apuntando a un cluster real. Si no está disponible, `SearchService` cae a `ILIKE` en Postgres — no bloquea, pero es un fallback más lento. |
| Storage — S3 | — | **RESUELTO (2026-09-29)**: `StorageService` ahora soporta S3 real via `@aws-sdk/client-s3`. Si `AWS_S3_BUCKET`/`AWS_S3_REGION` están seteados usa S3 (URL de CloudFront si además hay `AWS_CLOUDFRONT_DOMAIN`, si no URL directa de S3); si no, sigue cayendo a MinIO como en dev — mismo patrón best-effort que el resto de integraciones. Para producción solo falta: crear el bucket real y setear esas dos env vars (no requiere `AWS_ACCESS_KEY_ID`/`SECRET` explícitos, usa el IAM role de la task de ECS Fargate). |

## 4. CORS y dominios — RESUELTO (2026-10-25)

**Dominio real confirmado: `obraya.com.ar`.**
`packages/backend/src/config/cors.config.ts` ya tiene hardcodeados
`https://app.obraya.com.ar` y `https://admin.obraya.com.ar` para
`NODE_ENV=production`, más lo que se agregue en `ALLOWED_ORIGINS`
(coma-separado).

- DNS: pendiente como paso de deploy (ver `infra/terraform/README.md`
  sección 5) — apuntar `app.`/`admin.`/`api.`/`cdn.obraya.com.ar` al ALB/
  CloudFront que salen de Terraform.
- HTTPS/SSL: lo maneja el ALB vía ACM (certificado gestionado en el
  Terraform, sin certbot/Let's Encrypt manual), según ADR-015.

## 5. Rate limiting

`ThrottlingModule` (`config/throttling.module.ts`) ya tiene límites
razonables por defecto (100 req/15min general, 5 req/15min en auth, etc.) y
no depende de configuración adicional — no hay acción pendiente acá, solo
queda validado como ya cubierto.

## 6. Infraestructura de deploy — en progreso (ver ADR-015)

**RESUELTO (2026-09-29): decisión de infraestructura + groundwork sin costo.**
ADR-015 fija AWS ECS Fargate (`sa-east-1`) como orquestador, con
RDS/ElastiCache/OpenSearch managed reemplazando los contenedores
self-hosted de `docker-compose.yml`, y GitHub Actions (sin ArgoCD) como
CI/CD. Ya construido y verificado:

- `infra/docker/Dockerfile.frontend` — multi-stage, usa el build
  `standalone` de Next.js (`next.config.js`). Verificado end-to-end: build
  de Docker exitoso, contenedor arranca y responde HTTP 200.
- `.github/workflows/ci.yml` — lint + build + test de backend (jest, 100
  tests), lint + build de frontend, lint + typecheck de mobile y lint de
  shared, en cada PR y push a `main`.

**RESUELTO en parte (2026-10-25): Terraform completo escrito** en
`infra/terraform/` (VPC, ECS Fargate, RDS, ElastiCache, OpenSearch opcional,
S3+CloudFront, ALB, ECR, Secrets Manager, IAM) — ver
`infra/terraform/README.md` para el orden de pasos y el estimado de costo
(~110-120 USD/mes con OpenSearch apagado). **Sigue pendiente, requiere
aprobación explícita por el costo:**

1. Correr `terraform apply` con una cuenta de AWS real con método de pago
   (nadie lo corrió todavía — escribir el código no generó costo).
2. Extender el workflow de CI para hacer build+push a ECR y
   `aws ecs update-service` en merge a `main` (hoy el workflow solo valida,
   no despliega; el paso de build+push está documentado como manual en el
   README de Terraform mientras tanto).
3. `docker-compose.prod.yml` no aplica bajo este ADR (Fargate reemplaza
   Compose en producción); no hace falta escribirlo.
4. Decidir cómo montar el certificado de AFIP en la task de ECS (es un
   archivo, no un secret de tipo string — no entra en el patrón de Secrets
   Manager usado para JWT/DB password/tokens).

**Gap menor encontrado de paso — resuelto:** los 4 packages (`backend`,
`frontend`, `shared`, `mobile`) ya tienen configuración de ESLint
funcional (`.eslintrc.js`/`.eslintrc.json`) y `npm run lint` corre limpio
(0 errores) en todos. El workflow de CI ya incluye un step de lint por
job (`.github/workflows/ci.yml`). Pendiente menor: `packages/shared` no
tiene `tsconfig.json` propio, así que su `build` (`tsc`) no corre en CI
todavía — solo el lint.

## 7. Orden sugerido antes del primer deploy

1. ~~Decidir la infraestructura de destino (sección 6)~~ — **hecho, ADR-015**.
2. ~~Generar y verificar la migration inicial (sección 2)~~ — **hecho**.
3. ~~Dominio real + `cors.config.ts` (sección 4)~~ — **hecho, `obraya.com.ar`**.
4. ~~Escribir el Terraform de la infraestructura (sección 6)~~ — **hecho**,
   `infra/terraform/`. `JWT_SECRET`/`JWT_REFRESH_SECRET`/`DATABASE_PASSWORD`
   (sección 1) ya los genera ese Terraform en Secrets Manager — no hace
   falta generarlos a mano por separado.
5. Aprobar costo y correr `terraform apply` (sección 6,
   `infra/terraform/README.md` tiene el orden exacto de pasos) — requiere
   cuenta de AWS real con método de pago.
6. Configurar credenciales reales de MercadoPago/AFIP/SES/FCM/Sentry
   (sección 3) vía `aws secretsmanager put-secret-value` (ver README de
   Terraform) — la app arranca sin esto, pero con funcionalidad de negocio
   apagada.
7. DNS final apuntando al ALB/CloudFront que salen de Terraform (sección 4).
8. Deploy (build+push de imágenes, ver README de Terraform), correr
   `migration:run` (sección 2), smoke test de `/api/v1/health` y de un flujo
   de compra end-to-end contra las integraciones reales (MercadoPago/AFIP en
   modo producción suelen comportarse distinto que en sandbox).
