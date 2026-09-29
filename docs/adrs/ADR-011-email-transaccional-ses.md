# ADR-011: Email transaccional con AWS SES

**Estado:** Aceptado
**Fecha:** 2026-09-19
**Decidido por:** Fundadores ObraYa

## Contexto

El backoffice de fabricantes (Fase 1) permite invitar usuarios a una empresa
(`UsersService.inviteUser()`): genera un `inviteToken` y lo guarda en `CompanyUser`,
pero nunca lo enviaba a nadie — el usuario invitado no tenía forma de enterarse ni de
acceder al link `/accept-invite?token=...` del frontend. Era una funcionalidad
implementada a medias: el flujo de aceptación existe, pero el disparador (el email)
nunca se construyó.

Lo mismo aplicaba para las notificaciones de cambio de estado de pedido: existía el
push via Firebase FCM (`NotificationsService`, ver ADR-007), pero ningún canal de
email para compradores sin la app instalada o sin token FCM registrado.

## Decision

- **Proveedor: AWS SES**, no SendGrid. El proyecto ya usa AWS S3 para storage de
  producción (`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` en `.env.example`) y AWS
  sa-east-1 como cloud target (ver ADR-001). Reutilizar las mismas credenciales evita
  gestionar un segundo proveedor con su propia cuenta/API key.
- **`EmailModule`/`EmailService`** (`packages/backend/src/modules/email/`): mismo patrón
  best-effort que `NotificationsService` (FCM) y `AfipService`. Si falta
  `AWS_SES_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` o `EMAIL_FROM`, el
  servicio se deshabilita silenciosamente en `onModuleInit()` — nunca bloquea invitar
  un usuario ni cambiar el estado de un pedido.
- **Dos usos iniciales:**
  1. `UsersService.inviteUser()`: envía el link de invitación
     (`${FRONTEND_URL}/accept-invite?token=...`) al email invitado.
  2. `OrdersService.updateStatus()`: envía un email al comprador en paralelo al push
     existente, reusando el mismo mapa de estados → mensaje (duplicado en `EmailService`
     porque el contenido es HTML, no push).
- Sin cola de envío (Bull) todavía: el envío es un `fire-and-forget` (`.catch()` sin
  `await` en el caller), igual que el resto de las integraciones best-effort del
  proyecto. Si el volumen de emails lo justifica, se puede mover a una queue en una
  iteración futura.

## Justificacion

- Consistencia con el patrón ya establecido (best-effort, no bloqueante) que usan
  `AfipService`, `NotificationsService` y `PaymentsService` — no se introduce un
  paradigma nuevo de manejo de fallos.
- SES sobre SendGrid: menor costo a escala, una sola cuenta/credencial de nube para
  todo (S3 + SES), y ObraYa ya está comprometido con AWS sa-east-1.

## Consecuencias

- Nueva dependencia: `@aws-sdk/client-ses`.
- `.env.example` agrega `AWS_SES_REGION` y `EMAIL_FROM`. En desarrollo, si no se
  configuran, el email queda deshabilitado sin romper nada (igual que FCM/AFIP/ES).
- En producción, el dominio de `EMAIL_FROM` debe estar verificado en SES (y salir de
  sandbox mode de SES) antes de poder enviar a destinatarios reales.

## Riesgos

- **Bajo**: cuentas nuevas de SES arrancan en *sandbox mode* (solo pueden enviar a
  direcciones verificadas manualmente). Hay que pedir salida de sandbox a AWS antes del
  lanzamiento o las invitaciones/notificaciones no van a llegar a usuarios reales.
- **Bajo**: sin retry ni dead-letter queue — un fallo de SES se loguea como warning y
  se pierde el email. Aceptable para el volumen actual (pre-lanzamiento).
