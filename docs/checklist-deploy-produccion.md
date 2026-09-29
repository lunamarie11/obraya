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

## 2. Base de datos — bloqueante

- **No existe ninguna migration todavía** (`packages/backend/src/database/migrations/`
  solo tiene un `.gitkeep`). El proyecto corrió siempre con `synchronize: true`
  en desarrollo (`database.module.ts`), que en producción está
  deliberadamente apagado (`synchronize: config.get('app.nodeEnv') === 'development'`).
  **Si se despliega tal cual hoy, la base de producción queda sin tablas.**
  Antes del primer deploy:
  1. Generar la migration inicial contra una base vacía (no contra la de
     desarrollo, que ya tiene el schema sincronizado y el diff saldría vacío):
     ```bash
     npm run build --workspace=@obraya/backend
     # crear una DB vacía temporal y apuntar las envs ahí, ej.:
     DATABASE_NAME=obraya_migration_gen npx typeorm migration:generate \
       -d packages/backend/dist/database/data-source.js \
       packages/backend/src/database/migrations/InitialSchema
     ```
  2. Revisar el SQL generado a mano antes de commitear (TypeORM no siempre
     infiere índices/constraints exactamente igual que `synchronize`).
  3. `npm run migration:run --workspace=@obraya/backend` como paso del deploy,
     antes de levantar la nueva versión de la app.
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
| Storage — S3 | — | **Gap real, no solo de configuración**: `StorageService` (`modules/products/storage.service.ts`) usa el cliente `minio` contra `STORAGE_ENDPOINT/PORT/USE_SSL/ACCESS_KEY/SECRET_KEY` únicamente — nunca lee `AWS_S3_BUCKET`/`AWS_S3_REGION` (que están comentados en `.env.example` como si ya fuera un toggle a producción, pero no hay ningún código que los use). Las URLs devueltas son del estilo `http://<endpoint>:<port>/<bucket>/<objeto>` (formato MinIO), no URLs de S3/CloudFront. Para producción hay dos caminos: (a) correr un MinIO propio en el servidor y apuntar `STORAGE_ENDPOINT` ahí, o (b) reescribir `StorageService` para usar `@aws-sdk/client-s3` de verdad. Ninguna de las dos está hecha todavía. |

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

## 6. Infraestructura de deploy — gap grande, no asumir que existe

Auditado directamente en `infra/`: hoy solo existe
`infra/docker/docker-compose.yml` (para desarrollo local) y
`infra/docker/Dockerfile.backend`. **No existe:**

- `docker-compose.prod.yml` (ni ningún otro compose de producción).
- Dockerfile para el frontend (Next.js) ni para el mobile.
- Ningún workflow de CI/CD (`.github/workflows/` no existe).
- Ninguna configuración de reverse proxy/SSL (nginx, Caddy, certbot).

Esto es trabajo de infraestructura que todavía no se hizo — no es un simple
"completar variables de entorno" como el resto de este checklist. Antes de
poder desplegar hace falta decidir y construir:

1. Dónde corre esto (VPS propio con Docker Compose, ECS, un PaaS tipo
   Railway/Render, etc.) — no hay una decisión tomada todavía, no hay ADR al
   respecto.
2. Dockerfile del frontend (Next.js build + start).
3. Pipeline de CI (al menos: build + test en cada PR — hoy no hay ningún
   workflow corriendo `npm test` automáticamente).
4. Pipeline/script de deploy (build de imágenes, push a un registry, deploy
   al servidor, correr migrations antes de levantar la nueva versión).

## 7. Orden sugerido antes del primer deploy

1. Decidir la infraestructura de destino (sección 6) — bloquea todo lo demás.
2. Generar y verificar la migration inicial (sección 2).
3. Generar `JWT_SECRET`/`JWT_REFRESH_SECRET` nuevos y configurar
   `DATABASE_PASSWORD` real (sección 1) — sin esto el backend no arranca.
4. Configurar credenciales reales de MercadoPago/AFIP/SES/FCM/Sentry/S3
   (sección 3) — la app arranca sin esto, pero con funcionalidad de negocio
   apagada.
5. DNS + dominios reales en `cors.config.ts` (sección 4).
6. Armar Dockerfile de frontend + compose/pipeline de producción (sección 6).
7. Deploy, correr migrations, smoke test de `/api/v1/health` y de un flujo
   de compra end-to-end contra las integraciones reales (MercadoPago/AFIP en
   modo producción suelen comportarse distinto que en sandbox).
