# ADR-013: Observabilidad mínima — reporte de errores con Sentry

**Estado:** Aceptado
**Fecha:** 2026-09-23
**Decidido por:** Fundadores ObraYa

## Contexto

El backend ya tenía logging estructurado (`LoggerService`, Winston con
transports de Console + File rotado, `logs/error.log`/`logs/combined.log`),
pero eso solo sirve si alguien está mirando el archivo de logs del servidor.
No existía:

- Ningún filtro de excepciones global: Nest usaba su manejo de errores por
  defecto, sin loguear en Winston los errores no controlados que llegan a un
  controller.
- Ningún handler de `uncaughtException`/`unhandledRejection` en `main.ts` —
  un error fuera del ciclo request/response (timer, listener, promesa sin
  `.catch()`) podía tirar el proceso sin dejar rastro.
- Ninguna forma de enterarse de un error en producción sin entrar a revisar
  archivos de log a mano. Con el health check ya confiable (ver bugfix del
  2026-09-23 en `MonitoringService`), el siguiente gap de observabilidad antes
  de exponer la app a usuarios de AMBA es enterarse de errores reales sin
  depender de que alguien mire logs proactivamente.

## Decision

- **`@sentry/node`** (SDK oficial, framework-agnostic) en vez de un wrapper
  específico de Nest (`@sentry/nestjs`) — mismo criterio que el resto de las
  integraciones del proyecto (AFIP, SES, FCM): usar el SDK crudo del
  proveedor, sin acoplar una capa extra de abstracción que no aporta nada acá.
- **`ErrorTrackingService`** (`packages/backend/src/common/error-tracking/`):
  mismo patrón best-effort que `AfipService`/`EmailService`/
  `NotificationsService`. Si falta `SENTRY_DSN`, `onModuleInit()` loguea un
  warning y el servicio queda deshabilitado — `captureException()` se vuelve
  un no-op, nunca bloquea ni rompe nada.
- **`AllExceptionsFilter`** (`@Catch()` global, registrado via `APP_FILTER` en
  `ErrorTrackingModule`): reemplaza el manejo de errores por defecto de Nest
  para agregar logging estructurado (Winston, con `method`/`url`/`statusCode`)
  y reporte a Sentry. La respuesta HTTP que ve el cliente no cambia: mismo
  status/body que generaría Nest por default para una `HttpException`, 500
  genérico para lo demás.
  - Solo se reportan a Sentry los errores no controlados o con status `>= 500`.
    Un 400/404 de negocio (CUIT inválido, empresa no encontrada) no es un
    incidente — reportarlos generaría ruido y consumiría cuota de Sentry sin
    aportar nada.
- **`ErrorTrackingModule` es `@Global()`**: el filtro y el servicio se usan en
  toda la app, no en un módulo de negocio puntual, mismo criterio que
  `CommonModule`.
- **`main.ts` agrega `process.on('uncaughtException')` y
  `process.on('unhandledRejection')`** como red de seguridad para errores que
  ni siquiera llegan al filtro (fuera del ciclo request/response). Ambos
  loguean via Winston y reportan a Sentry.
  - `uncaughtException` hace `process.exit(1)`: el proceso queda en estado
    indefinido, es más seguro reiniciar (Docker/PM2/systemd ya reinician el
    contenedor) que seguir sirviendo tráfico.
  - `unhandledRejection` **no** mata el proceso: en la práctica suele ser una
    promesa aislada sin `.catch()` (ej. un `fire-and-forget` de email/FCM mal
    hecho), no un error que deja la app en estado inconsistente. Matar el
    proceso por eso sería más disruptivo que el error original.

## Justificacion

- Mismo patrón best-effort que el resto de integraciones externas del
  proyecto (AFIP, SES, FCM, Elasticsearch): la ausencia de configuración
  nunca bloquea ni rompe la app, solo se pierde la funcionalidad opcional
  (en este caso, el reporte a Sentry — los logs de Winston siguen andando
  igual).
- Sentry sobre alternativas self-hosted (ej. GlitchTip) o rodar un exception
  tracker propio: es el estándar de la industria, tiene tier gratuito
  suficiente para el volumen pre-lanzamiento, y no agrega infraestructura
  propia que mantener (alineado con "no instalar dependencias sin
  justificación" — acá la dependencia reemplaza construir un sistema de
  alertas a mano, no lo contrario).
- Filtrar por status code antes de reportar evita ruido: si se reportara todo
  (incluidos 400/404 de validación), Sentry se llenaría de "errores" que en
  realidad son comportamiento esperado de la API.

## Consecuencias

- Nueva dependencia: `@sentry/node` (`^11.0.0`).
- `.env.example` agrega `SENTRY_DSN` (vacío por default), `SENTRY_ENVIRONMENT`
  y `SENTRY_TRACES_SAMPLE_RATE` (en `0` por default — sin tracing de
  performance hasta que se decida activar y pagar el volumen que implica).
- En desarrollo, sin `SENTRY_DSN` configurado, todo sigue funcionando igual
  que antes de este cambio (solo Winston).
- Antes de producción: crear el proyecto en Sentry, configurar `SENTRY_DSN`
  real y decidir un `SENTRY_TRACES_SAMPLE_RATE` > 0 si se quiere tracing de
  performance (queda para el checklist de deploy a producción).

## Riesgos

- **Bajo**: `unhandledRejection` no mata el proceso — si en el futuro aparece
  un caso real de estado inconsistente causado por una promesa sin manejar,
  habría que revisar ese caso puntual en vez de asumir que el proceso sigue
  sano. Aceptable porque hoy no hay evidencia de que eso ocurra.
- **Bajo**: sin tracing de performance activado (`SENTRY_TRACES_SAMPLE_RATE=0`),
  Sentry solo sirve para errores, no para detectar requests lentos. Suficiente
  para el objetivo de este cambio (saber cuándo algo se rompe).
