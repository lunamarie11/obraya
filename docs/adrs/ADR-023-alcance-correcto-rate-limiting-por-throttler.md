# ADR-023: Alcance correcto de rate limiting por throttler nombrado

**Estado:** Aceptado
**Fecha:** 2026-11-16
**Decidido por:** Fundadores ObraYa

## Contexto

ADR-007 porteó desde "Codebase B" un `ThrottlingModule` con 4 throttlers
nombrados vía `ThrottlerModule.forRoot([...])`: `general` (100/15min),
`auth` (5/15min), `api` (50/min) y `search` (30/min, nunca usado en ningún
endpoint). La intención era que `auth` protegiera solo login/registro
contra fuerza bruta, aplicado explícitamente con
`@Throttle({ auth: {...} })` en `AuthController` y `BuyerAuthController`.

Durante la verificación manual de Fase 4d (ADR-022) en `/delivery`, la API
empezó a devolver `429` en rutas que no tienen nada que ver con login
(`/orders`, polling de `/delivery`) después de unos pocos requests. Al leer
el código compilado de `@nestjs/throttler` (`throttler.guard.js`) se
confirmó la causa: `ThrottlerGuard.canActivate()` itera **todos** los
throttlers nombrados registrados en `forRoot([...])` contra **toda** ruta
de la aplicación, salvo que la ruta tenga `@SkipThrottle({ name: true })`
explícito para ese nombre puntual. `@Throttle({ auth: {...} })` solo
sobreescribe el límite/ttl de ese throttler en esa ruta — no evita que
`auth` (u otro throttler nombrado) se evalúe en el resto de las rutas.

En la práctica, el throttler `auth` (5 intentos/15min, pensado solo para
login) estaba aplicándose también a `/orders` y cualquier otra ruta,
bloqueando el uso normal de la API tras apenas 5 requests en 15 minutos
por IP — un bug de producción latente desde ADR-007, nunca disparado antes
porque no se había hecho suficiente tráfico sostenido contra el backend en
una sola sesión de pruebas.

## Decisión

- Se crean `ApiThrottlerGuard` y `AuthThrottlerGuard`
  (`config/scoped-throttler.guard.ts`), subclases de `ThrottlerGuard` que
  filtran `this.throttlers` a un único throttler nombrado en
  `onModuleInit()`. Así cada guard solo evalúa el throttler que le
  corresponde, sin tocar metadata interna/privada de la librería.
- `ApiThrottlerGuard` (throttler `api`) se registra como `APP_GUARD` global
  — corre en toda la API.
- `AuthThrottlerGuard` (throttler `auth`) se aplica solo explícitamente con
  `@UseGuards(AuthThrottlerGuard)` en `AuthController` y
  `BuyerAuthController`, junto al `@Throttle({ auth: {...} })` ya existente.
- Se eliminan los throttlers `general` y `search`: `general` tenía la misma
  intención que `api` pero era más estricto en sostenido (100/15min ≈
  6.7/min, menos que el polling normal de varias pantallas de
  `/delivery`); `search` nunca se usó en ningún endpoint.
- El throttler `api` que queda pasa de 50/min a **120/min**, para cubrir
  cómodamente el polling de 30s de varias pantallas simultáneas (p. ej.
  `/delivery` hace ~2-3 queries/min) más varios usuarios detrás del mismo
  IP/NAT, sin dejar de frenar abuso o scraping evidente.
- `ThrottlingModule` pasa a ser `@Global()` para que `AuthThrottlerGuard`
  esté disponible vía `@UseGuards()` en cualquier controller sin que cada
  módulo tenga que importar `ThrottlingModule`.

## Justificación

- El comportamiento por defecto de `@nestjs/throttler` (todos los
  throttlers nombrados aplican a todas las rutas) es sorprendente y no
  está resuelto con los decoradores que ya se usaban en el código
  (`@Throttle`) — hacía falta un guard que filtre explícitamente, no una
  configuración distinta de los mismos decoradores.
- Filtrar `this.throttlers` en `onModuleInit()` es seguro porque es un
  array de instancia poblado por la propia librería a partir de las
  opciones inyectadas; no depende de claves de reflector privadas
  (`THROTTLER_LIMIT`/`THROTTLER_TTL`/`THROTTLER_SKIP`, no exportadas en el
  barrel público de `@nestjs/throttler`).
- Mantener solo 2 throttlers (`api`, `auth`) en vez de 4 reduce superficie
  de configuración incorrecta futura — cualquier throttler nuevo que se
  agregue va a tener que pasar por el mismo patrón de guard dedicado para
  no repetir este bug.

## Consecuencias

- `/orders`, `/delivery` y el resto de la API ya no heredan el límite
  pensado para login; solo responden al throttler `api` (120/min).
- Login/registro/demo-login en `AuthController` y `BuyerAuthController`
  siguen protegidos contra fuerza bruta a 5 intentos/15min, sin cambios de
  comportamiento ahí.
- Cualquier throttler nombrado nuevo que se agregue a futuro debe seguir
  el mismo patrón (guard dedicado que filtra `this.throttlers`) o
  documentar explícitamente por qué no lo necesita — de lo contrario
  reaparece este bug.

## Riesgos

- **Bajo**: si a futuro se agregan controllers que necesiten un throttler
  nombrado distinto de `api`/`auth` (p. ej. un endpoint público de alto
  volumen con límite propio), hay que recordar crear su guard dedicado
  siguiendo este mismo patrón en vez de asumir que `@Throttle({...})` solo
  alcanza.
