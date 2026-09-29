# ADR-014: Fail-fast de configuración crítica en producción

**Estado:** Aceptado
**Fecha:** 2026-09-23
**Decidido por:** Fundadores ObraYa

## Contexto

`packages/backend/src/config/app.config.ts` define fallbacks para `JWT_SECRET`
(`'change-me-in-production'`), `JWT_REFRESH_SECRET`
(`'change-me-refresh-in-production'`) y `DATABASE_PASSWORD` (`'password'`,
igual que `infra/docker/docker-compose.yml`). Esos fallbacks existen para que
el proyecto funcione out-of-the-box en desarrollo sin pedirle a nadie que
copie `.env.example` y complete todo antes del primer `npm run dev`.

El problema es que ese mismo fallback aplica igual en producción: si por
error humano `JWT_SECRET` no llega a estar seteado en el entorno de
producción (variable no cargada en el orquestador, typo en el nombre, etc.),
la app arranca igual, sirve tráfico, y firma tokens JWT con un secret público
y conocido (está en el propio código fuente). Es el mismo tipo de riesgo que
ya había con el `JWT_SECRET` de desarrollo compartido por chat (ver memoria
de recordatorios de producción): un secret conocido no es un secret.

Este era el tercer y último gap identificado en la priorización de roadmap
del 2026-09-23 (después del fix de `/health` y de la observabilidad con
Sentry, ver ADR-013): un checklist de deploy a producción. Al auditar el
código para escribirlo, este fue el hallazgo concreto más serio — algo
accionable en código, no solo un paso manual de un checklist.

## Decision

- **`validateProductionEnv()`** (`packages/backend/src/config/validate-production-env.ts`):
  función pura, sin dependencias de Nest, que devuelve una lista de errores.
  Si `NODE_ENV !== 'production'` devuelve `[]` siempre (no interfiere con
  desarrollo/testing). En producción, valida:
  - `JWT_SECRET`/`JWT_REFRESH_SECRET`: deben existir, no ser el valor default
    de `app.config.ts`, y tener al menos 32 caracteres.
  - `DATABASE_PASSWORD`: no debe ser el default `'password'` de
    `docker-compose.yml`.
- **Se ejecuta en `main.ts`, antes de `NestFactory.create()`**: si hay
  errores, se imprimen por `console.error` (todavía no existe una instancia
  de Nest ni de `LoggerService` en ese punto) y el proceso termina con
  `process.exit(1)` — nunca llega a abrir un puerto ni a aceptar tráfico con
  configuración insegura.
- **No es best-effort**: a diferencia de AFIP/SES/FCM/Sentry, donde falta de
  configuración = feature deshabilitada sin romper nada, acá falta de
  configuración = la app no arranca. Un JWT_SECRET adivinable no es una
  feature opcional, es un incidente de seguridad.
- Nota de implementación: `ConfigModule.forRoot({ envFilePath: '.env' })` en
  `app.module.ts` carga `.env` en cuanto se importa `AppModule` (el decorador
  `@Module` evalúa `ConfigModule.forRoot(...)` de forma síncrona al cargar el
  archivo), lo cual ocurre antes de que `bootstrap()` llegue a llamar
  `validateProductionEnv()`. Esto es intencional y no rompe la validación: en
  producción real no existe un archivo `.env` (las variables las inyecta el
  orquestador — Docker/ECS/k8s — directamente en `process.env`), por lo que
  `dotenv` no encuentra nada que cargar y `process.env` refleja exactamente
  lo que configuró el operador. Verificado manualmente: sin archivo `.env`
  presente, `NODE_ENV=production node dist/main.js` corta inmediatamente con
  el mensaje de error y sin intentar conectarse a la base de datos.

## Justificacion

- Todas las demás integraciones externas del proyecto son best-effort porque
  su ausencia degrada una funcionalidad puntual (facturación AFIP, email,
  push, tracing de errores). La autenticación JWT no es una funcionalidad
  puntual: si el secret es adivinable, cualquier usuario puede forjar un
  token de cualquier otro usuario o de un admin. No hay una versión
  "degradada mansamente" de eso.
- Fail-fast en el arranque es preferible a un warning en los logs: un warning
  se puede no ver nunca; un proceso que no arranca fuerza a resolver el
  problema antes de que el deploy termine.

## Consecuencias

- Ningún cambio de comportamiento en desarrollo/testing (`NODE_ENV` distinto
  de `production`): la función siempre devuelve `[]`.
- Antes del primer deploy real a producción, es obligatorio configurar
  `JWT_SECRET`/`JWT_REFRESH_SECRET` (32+ caracteres, generados con
  `openssl rand -base64 48`) y `DATABASE_PASSWORD` real en el entorno del
  orquestador — sin esto la app no levanta (ver
  `docs/checklist-deploy-produccion.md`).
- Se corrigió además el script `migration:generate` de
  `packages/backend/package.json`, que le faltaba el flag `-d` (nunca se
  había usado realmente — el proyecto todavía no tiene ninguna migration
  generada, corre con `synchronize: true` en desarrollo desde el inicio).

## Riesgos

- **Bajo**: la validación es una lista fija de tres variables. Si en el
  futuro se agregan más secrets críticos (ej. una clave de firma para
  webhooks), hay que acordarse de sumarlos acá — no es automático.
