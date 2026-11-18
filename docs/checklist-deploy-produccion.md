# Checklist de deploy a producción

Este documento audita, a partir del código real (no de memoria ni de
suposiciones), todo lo que falta configurar o construir antes del primer
deploy de ObraYa a producción. Reemplaza cualquier checklist anterior que
asumiera infraestructura (CI/CD, `docker-compose.prod.yml`, certbot) que
todavía no existe en este repo — el proyecto sigue en Fase 0/1 (pre-seed, ver
`CLAUDE.md`), sin infraestructura de producción armada todavía.

Última auditoría: 2026-10-25 (revisión de infraestructura, ver ADR-020).

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

## 5. Rate limiting — RESUELTO (2026-11-16, ver ADR-023)

`ThrottlingModule` (`config/throttling.module.ts`) tenía un bug de alcance:
el throttler `auth` (5 intentos/15min, pensado solo para login) se
aplicaba por defecto a toda la API (`@nestjs/throttler` aplica todos los
throttlers nombrados a todas las rutas salvo `@SkipThrottle` explícito),
bloqueando `/orders` y el resto tras pocos requests sostenidos. Corregido
con `ApiThrottlerGuard`/`AuthThrottlerGuard` dedicados
(`config/scoped-throttler.guard.ts`) que acotan cada uno a un solo
throttler nombrado. Quedan 2 throttlers: `api` (120/min, global) y `auth`
(5/15min, solo en los controllers de login). Verificado con build limpio y
pruebas de carga manuales — ver ADR-023. No hay acción pendiente acá.

## 6. Infraestructura de deploy — RESUELTO (2026-11-17)

**Deploy real completado.** `terraform apply` corrido contra una cuenta de
AWS real (`sa-east-1`), instancia EC2 levantada, imágenes de Docker
construidas y subidas a ECR, contenedores desplegados vía SSM
(`docker-compose.prod.yml`), migración inicial corrida sin errores, DNS
apuntando y HTTPS funcionando en `api.`/`admin.`/`app.obraya.com.ar`
(verificado con `curl`, todos devuelven `200`). Los 6 secrets
(JWT/DB/Mercado Pago/Firebase/Sentry) están cargados en Secrets Manager.

Dos bugs de código reales encontrados y corregidos durante este deploy
(no eran de infraestructura): `packages/shared` nunca se compilaba a JS
antes de este cambio (rompía cualquier build de producción), y
`database.module.ts` forzaba SSL en la conexión a Postgres asumiendo el
diseño viejo de RDS (ADR-015) en vez del Postgres local de ADR-020 —
ahora `DATABASE_SSL` es una env var explícita, no se infiere de
`NODE_ENV`.

**Lo que sigue pendiente ya no es "llegar a producción" sino "operar en
serio" — ver `docs/backlog-salida-produccion.md`** (AFIP real, confirmar
que el token de Mercado Pago sea de producción, salir del sandbox de SES,
backups de Postgres, alarma de presupuesto, automatizar el deploy en CI).

<details>
<summary>Historial — estado antes del 2026-11-17 (en progreso, ver ADR-015)</summary>

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

**RESUELTO en parte (2026-10-25): Terraform completo escrito y revisado a
diseño de instancia única** en `infra/terraform/` (VPC sin NAT, EC2
`t4g.small` + Docker Compose + Caddy, S3+CloudFront, ECR, Secrets Manager,
IAM) — ver ADR-020 (revisa ADR-015, que quedó como diseño de destino para
cuando el volumen lo justifique) y `infra/terraform/README.md` para el
orden de pasos y el estimado de costo (~20-25 USD/mes con OpenSearch
apagado, bajó de ~110-120 del diseño original de ADR-015). **Sigue
pendiente, requiere aprobación explícita por el costo:**

1. Correr `terraform apply` con una cuenta de AWS real con método de pago
   (nadie lo corrió todavía — escribir el código no generó costo).
2. Extender el workflow de CI para hacer build+push a ECR y automatizar el
   redeploy en la instancia (hoy el workflow solo valida, no despliega; el
   paso de build+push + `docker-compose up` está documentado como manual en
   el README de Terraform mientras tanto).
3. `docker-compose.prod.yml` y `Caddyfile` ya están escritos en
   `infra/docker/` (bajo ADR-020, Docker Compose sí aplica en producción —
   corre en la instancia única, no reemplazado por Fargate como se había
   planeado originalmente en ADR-015).
4. Backups de Postgres ya no son automáticos (eran de RDS en el diseño
   original) — falta un cron de `pg_dump` a S3 o snapshot de EBS antes de
   tener datos reales.
5. Decidir cómo montar el certificado de AFIP en la instancia (es un
   archivo, no un secret de tipo string — no entra en el patrón de Secrets
   Manager usado para JWT/DB password/tokens).

**Gap menor encontrado de paso — resuelto:** los 4 packages (`backend`,
`frontend`, `shared`, `mobile`) ya tienen configuración de ESLint
funcional (`.eslintrc.js`/`.eslintrc.json`) y `npm run lint` corre limpio
(0 errores) en todos. El workflow de CI ya incluye un step de lint por
job (`.github/workflows/ci.yml`). Pendiente menor: `packages/shared` no
tiene `tsconfig.json` propio, así que su `build` (`tsc`) no corre en CI
todavía — solo el lint.

</details>

## 7. Orden sugerido antes del primer deploy

1. ~~Decidir la infraestructura de destino (sección 6)~~ — **hecho, ADR-015,
   revisado por ADR-020 (instancia única EC2 en vez de Fargate, por costo
   pre-lanzamiento)**.
2. ~~Generar y verificar la migration inicial (sección 2)~~ — **hecho**.
3. ~~Dominio real + `cors.config.ts` (sección 4)~~ — **hecho, `obraya.com.ar`**.
4. ~~Escribir el Terraform de la infraestructura (sección 6)~~ — **hecho**,
   `infra/terraform/`. `JWT_SECRET`/`JWT_REFRESH_SECRET`/`DATABASE_PASSWORD`
   (sección 1) ya los genera ese Terraform en Secrets Manager — no hace
   falta generarlos a mano por separado.
5. ~~Aprobar costo y correr `terraform apply` (sección 6)~~ — **hecho,
   2026-11-17**.
6. ~~Configurar credenciales reales de MercadoPago/Firebase/Sentry
   (sección 3)~~ — **hecho** (cargadas en Secrets Manager). AFIP sigue en
   modo testing (bloqueado por falta de CUIT real) y SES sigue en sandbox
   mode — ver `docs/backlog-salida-produccion.md`.
7. ~~DNS apuntando a la IP elástica de la instancia~~ — **hecho**,
   `app.`/`admin.`/`api.obraya.com.ar` resuelven y responden `200` sobre
   HTTPS.
8. ~~Deploy (build+push a ECR, SSM, `docker-compose up`) + `migration:run`
   + smoke test de `/api/v1/health`~~ — **hecho, 2026-11-17**. Falta el
   flujo de compra end-to-end contra Mercado Pago/AFIP reales — depende de
   los puntos 1-3 de `docs/backlog-salida-produccion.md`.

**El deploy a producción está completo. Lo que sigue (AFIP real, SES,
backups, CI/CD) ya no es "llegar a producción" sino "operar en serio" —
ver `docs/backlog-salida-produccion.md`.**
