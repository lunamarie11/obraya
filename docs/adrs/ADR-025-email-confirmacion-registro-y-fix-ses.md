# ADR-025: Email de confirmación de registro, alerta a ObraYa y fix de SES

**Estado:** Aceptado
**Fecha:** 2026-11-17
**Decidido por:** Fundadores ObraYa

## Contexto

Un fabricante real (Certezza s.r.l.) se registró en producción y reportó dos
problemas: (1) nunca le llegó un email de confirmación de registro, y (2)
"no lo dejaba ingresar" para cargar su catálogo. Investigando se encontraron
varias causas, algunas de infraestructura/código y una de dato de usuario:

1. **`EmailService` nunca pudo enviar nada en producción.** `onModuleInit()`
   exigía `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` explícitas además de
   `AWS_SES_REGION`/`EMAIL_FROM`. La instancia EC2 nunca tuvo esas dos
   variables seteadas (no hacían falta: el IAM role de la instancia ya tiene
   `ses:SendEmail`/`ses:SendRawEmail`, ver `iam.tf`), así que el servicio se
   auto-deshabilitaba silenciosamente (patrón best-effort) en todos los
   casos: invitaciones, estado de pedidos, y cualquier email futuro.
2. **`registerCompany()` nunca mandaba ningún email.** No existía (ni se
   llamaba) un email de "recibimos tu registro" — ni al fabricante ni a
   nadie de ObraYa. Nadie se entera cuando una empresa nueva queda
   `pending`, salvo que alguien entre manualmente al panel de SuperAdmin a
   revisar.
3. **El email del admin de Certezza tenía un typo**: se registró como
   `Lucasmdediego@gmail.coom` (dos "o"). Esto solo no es un bug de ObraYa,
   pero combinado con (1) significa que ni siquiera un bounce hubiera sido
   visible, y explica por qué el login fallaba si intentaba entrar con su
   email real (`...gmail.com`): no hay coincidencia en la base.

El login en sí (`validateUser` en `auth.service.ts`) y la carga de
productos (`products.service.ts`) **no bloquean por `Company.status`** —
se revisó código y no hay ningún guard ahí. El "no me deja entrar" del
fabricante era consecuencia del email mal escrito, no de un guard de
aprobación.

## Decisión

- **`EmailService`** (`packages/backend/src/modules/email/email.service.ts`)
  deja de requerir `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`. Ahora
  instancia `SESClient` sin `credentials` explícitas, usando el provider
  chain default del SDK (en producción, el IAM role de la instancia) — el
  mismo patrón que ya usaba `StorageService` con S3. Solo sigue
  requiriendo `AWS_SES_REGION` y `EMAIL_FROM` para habilitarse.
- Se agregan tres métodos nuevos a `EmailService`:
  - `sendRegistrationReceivedEmail(to, companyName)` — al fabricante, apenas
    se registra.
  - `sendNewCompanyAdminAlert(to, companyName, cuit)` — a ObraYa, para que
    alguien sepa que hay una empresa `pending` para revisar.
  - `sendCompanyApprovedEmail(to, companyName)` — al admin de la empresa,
    cuando `AdminService.updateCompanyStatus()` la pasa a `active`.
- `UsersService.registerCompany()` dispara los dos primeros al final del
  registro (best-effort, no bloquean el registro si SES falla).
  `AdminService.updateCompanyStatus()` dispara el tercero solo en la
  transición a `active` (no en cada `save`).
- Nueva variable `ADMIN_NOTIFICATION_EMAIL` en `.env.example`/producción:
  la casilla de ObraYa que recibe la alerta de nueva empresa. En
  producción se usa `delyanave@gmail.com` (la casilla real del fundador,
  ya es el contacto registrado en la cuenta de AWS SES) — **no**
  `contacto@obraya.com.ar`, porque `obraya.com.ar` todavía no tiene
  registro MX propio (no hay casilla real detrás de ese email todavía).
- Acción de soporte puntual: se corrigió en la base de producción el email
  del admin de Certezza (`...gmail.coom` → `...gmail.com`) y se aprobó
  manualmente su empresa (`status: pending → active`) para desbloquearlo
  sin esperar al próximo ciclo de revisión manual.

## Justificación

- Reusar el IAM role (en vez de pedir credenciales explícitas) es
  consistente con `StorageService`, reduce superficie de secretos (no hay
  que generar ni rotar un access key de SES), y es la causa raíz real del
  bug: las credenciales nunca iban a estar seteadas porque no hacían falta.
- El email de "registro recibido" y la alerta interna son el mínimo viable
  para que (a) el fabricante sepa que su registro se procesó y (b) alguien
  de ObraYa se entere sin tener que entrar a revisar el panel
  periódicamente. No se automatiza la aprobación: sigue siendo manual por
  decisión de negocio (ver `docs/backlog-salida-produccion.md` punto 9).
- No se agrega validación de dominio de email en el registro (ej. rechazar
  `gmail.coom`): un `@IsEmail` estándar ya lo considera válido
  sintácticamente, y validar contra una lista de dominios conocidos es
  frágil y fuera de alcance de este fix.

## Consecuencias

- A partir de ahora, toda empresa que se registre recibe confirmación por
  email y ObraYa recibe la alerta — visibilidad que antes no existía.
- Si `ADMIN_NOTIFICATION_EMAIL` no está seteada, el registro sigue
  funcionando igual (no se envía la alerta, sin romper nada) — mismo
  patrón best-effort que el resto de las integraciones externas.
- Verificado en producción: el log de arranque del backend muestra
  `[EmailService] AWS SES inicializado` y un envío de prueba vía
  `aws ses send-email` desde la instancia (mismo IAM role) entregó
  correctamente.

## Riesgos

- **Bajo:** si en el futuro se crea una casilla real `@obraya.com.ar` (con
  MX propio), hay que actualizar `ADMIN_NOTIFICATION_EMAIL` para usarla en
  vez del gmail personal — queda como pendiente operativo, no bloquea nada
  hoy.
