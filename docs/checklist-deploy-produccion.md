# Checklist de deploy a producción

Este documento audita, a partir del código real (no de memoria ni de
suposiciones), todo lo que falta configurar o construir antes del primer
deploy de ObraYa a producción. Reemplaza cualquier checklist anterior que
asumiera infraestructura (CI/CD, `docker-compose.prod.yml`, certbot) que
todavía no existe en este repo — el proyecto sigue en Fase 0/1 (pre-seed, ver
`CLAUDE.md`), sin infraestructura de producción armada todavía.

Última auditoría: 2026-09-23.

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

## 4. CORS y dominios

`packages/backend/src/config/cors.config.ts` ya tiene hardcodeados
`https://app.obraya.com` y `https://admin.obraya.com` para `NODE_ENV=production`,
más lo que se agregue en `ALLOWED_ORIGINS` (coma-separado). Antes de deploy:

- Confirmar que esos son los dominios reales que se van a usar (o
  actualizarlos en el código si cambiaron).
- DNS: apuntar los dominios elegidos (frontend, backoffice, API) al servidor/
  balanceador de producción.
- HTTPS/SSL: no hay nada de esto en el repo todavía (ni certbot ni
  Let's Encrypt configurado) — depende de la infraestructura que se elija
  (ver sección 6).

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
- `.github/workflows/ci.yml` — build + test de backend (jest, 72 tests),
  build de frontend y typecheck de mobile en cada PR y push a `main`.

**Sigue pendiente** (todo lo que implica costo real o acceso a la cuenta de
AWS, fuera del alcance de ADR-015 — requiere aprobación explícita antes de
crear recursos):

1. Provisionar la infraestructura de AWS en sí (cluster ECS, task
   definitions, RDS, ElastiCache, OpenSearch, ALB, ECR) — probablemente
   como Terraform (`infra/` y `.gitignore` ya anticipan `*.tfstate`).
2. Extender el workflow de CI para hacer build+push a ECR y
   `aws ecs update-service` en merge a `main` (hoy el workflow solo valida,
   no despliega — no hay nada a lo que desplegar todavía).
3. `docker-compose.prod.yml` no aplica bajo este ADR (Fargate reemplaza
   Compose en producción); no hace falta escribirlo.

**Gap menor encontrado de paso:** ningún package (`backend`, `frontend`,
`shared`) tiene configuración de ESLint — `npm run lint` falla localmente
en los tres (ESLint no encuentra config). Por eso el workflow de CI no
incluye lint todavía. No es bloqueante para el deploy, pero conviene
resolverlo en algún momento.

## 7. Orden sugerido antes del primer deploy

1. ~~Decidir la infraestructura de destino (sección 6)~~ — **hecho, ADR-015**.
2. ~~Generar y verificar la migration inicial (sección 2)~~ — **hecho**.
3. Generar `JWT_SECRET`/`JWT_REFRESH_SECRET` nuevos y configurar
   `DATABASE_PASSWORD` real (sección 1) — sin esto el backend no arranca.
4. Configurar credenciales reales de MercadoPago/AFIP/SES/FCM/Sentry/S3
   (sección 3) — la app arranca sin esto, pero con funcionalidad de negocio
   apagada.
5. DNS + dominios reales en `cors.config.ts` (sección 4).
6. Provisionar la infraestructura de AWS (sección 6) — requiere aprobación
   explícita porque genera costo.
7. Deploy, correr `migration:run` (sección 2), smoke test de `/api/v1/health`
   y de un flujo de compra end-to-end contra las integraciones reales
   (MercadoPago/AFIP en modo producción suelen comportarse distinto que en
   sandbox).
