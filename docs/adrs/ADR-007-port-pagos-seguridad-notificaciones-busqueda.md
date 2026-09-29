# ADR-007: Port de Mercado Pago, seguridad de producción, notificaciones FCM y búsqueda Elasticsearch

**Estado:** Aceptado
**Fecha:** 2026-09-02
**Decidido por:** Fundadores ObraYa

## Contexto

Durante 2026 convivieron sin saberlo dos historias de git independientes apuntando al
mismo remoto de GitHub (`lunamarie11/obraya`):

- **Codebase A** (este repo): NestJS + TypeORM, con toda la lógica de negocio de Fase 1
  (backoffice fabricantes), tests, y el scaffold de `packages/mobile`. Pagos,
  notificaciones y búsqueda existían solo como módulos stub (`PaymentsModule`,
  `NotificationsModule` con providers comentados; `SearchModule` ni existía).
- **Codebase B** (`/Users/dely/obraya`, sin lógica de negocio de Fase 1 ni mobile):
  NestJS + **Prisma**, con implementaciones reales de Mercado Pago (Checkout Pro +
  webhook), Firebase Cloud Messaging, Elasticsearch, y una capa de seguridad de
  producción (CORS por entorno, rate limiting con `@nestjs/throttler`, sanitización de
  inputs, logging con Winston) que A no tenía.

Al detectar la duplicación (`git merge-base` entre ambas historias devolvía vacío) se
decidió consolidar sobre A como línea principal — tiene la lógica de negocio real,
los tests y el mobile — preservando B completo en la rama `legacy/prisma-v1`, y
**portar manualmente a A** las piezas de B que sí eran valiosas y le faltaban.

Prisma y TypeORM son incompatibles a nivel de código (no hay traducción automática),
así que el port fue una reimplementación caso por caso, no un copy-paste.

## Decisión

### 1. Seguridad de producción (`packages/backend/src/common/`, `src/config/`)

- `InputSanitizerService` + `SecureValidationPipe` (reemplaza el `ValidationPipe` global
  de `main.ts`) + `SanitizeMiddleware`: sanitizan `body`/`query`/`params` contra XSS e
  inyección antes de que lleguen a los DTOs. Se **removieron** dos reglas de B que
  daban falsos positivos: el regex que marcaba cualquier `--` como sospechoso (rompía
  texto legítimo como rangos de fecha o direcciones) y el stripping de comillas
  (rompía notas/nombres con apóstrofes).
- `CorsConfig` (`config/cors.config.ts`): en desarrollo permite cualquier origen; en
  producción, whitelist fija + `ALLOWED_ORIGINS` (env, CSV) como override.
- `ThrottlingModule` (`config/throttling.module.ts`): 4 throttlers nombrados —
  `general` (100/15min), `auth` (5/15min), `api` (50/min), `search` (30/min) — vía
  `ThrottlerModule.forRoot([...])` + `APP_GUARD`. `auth` se aplica explícitamente con
  `@Throttle({ auth: {...} })` en `AuthController` (empresas) y
  `BuyerAuthController` (compradores) para frenar fuerza bruta de credenciales.
- Logging con Winston (`common/logging/`): consola + rotación de archivos
  (`error.log`, `combined.log`, 5MB × 5 archivos). Nivel configurable con `LOG_LEVEL`.
- `helmet()` agregado en `main.ts`.

### 2. Mercado Pago (`packages/backend/src/modules/payments/`)

- `PaymentsService.createPreference()`: Checkout Pro (SDK `mercadopago` v2), con
  `external_reference = order.id` y `notification_url` apuntando al webhook.
- `PaymentsController` (`POST /payments/webhook`): consulta el pago vía
  `getPaymentInfo()` y actualiza `Order.mpPaymentId`/`paymentStatus` directamente por
  repositorio (no reusa `OrdersService.updateStatus()` para evitar acoplar el webhook a
  la lógica de reserva de stock, pensada para decisiones del fabricante).
- **Decisión de diseño clave**: el estado de pago (`paymentStatus`) y el estado del
  pedido (`Order.status`, la máquina de estados `VALID_TRANSITIONS`) se mantienen
  **desacoplados**. Un pago `approved` no fuerza `Nuevo → Aceptado` — sigue siendo el
  fabricante quien acepta el pedido. La única excepción es `rejected`: si el pedido
  sigue en `Nuevo` (nadie lo aceptó todavía), se cancela automáticamente
  (`rejectionReason: 'Pago rechazado por Mercado Pago'`), porque no tiene sentido que un
  fabricante prepare un pedido cuyo pago fue rechazado. B, al venir de un enum de
  estados en inglés sin este matiz (`CONFIRMED`/`PREPARING`/...), sí mapeaba
  `approved → CONFIRMED` directo; no se portó ese acoplamiento.
- `OrdersService.create()`: si `dto.paymentMethod === MERCADO_PAGO`, crea la preferencia
  después de guardar el pedido (necesita `order.id` para `external_reference`) y guarda
  `mpPreferenceId`/`paymentUrl`. Si Mercado Pago falla, **no bloquea la creación del
  pedido** — el pago puede coordinarse por otro medio.
- `Order` entity gana `paymentMethod` (enum `Efectivo | Transferencia | MercadoPago`,
  default `Efectivo`), `mpPreferenceId`, `mpPaymentId`, `paymentUrl`, `paymentStatus`.
- Frontend (`checkout/page.tsx`): tercera opción de pago real (antes el método elegido
  viajaba como texto libre en `notes`, ver comentario removido que citaba `ADR-003`).
  Si el pedido creado devuelve `paymentUrl`, se redirige ahí (`window.location.href`)
  en vez de ir a `/order-confirmation`.

### 3. Notificaciones push — Firebase FCM (`packages/backend/src/modules/notifications/`)

- `NotificationsService`: Firebase Admin SDK, inicializado desde `FIREBASE_SERVICE_ACCOUNT`
  (JSON completo del service account). Si no está configurado, deshabilita push
  silenciosamente (best-effort en todo el flujo, nunca bloquea la operación principal).
- `Buyer` entity gana `fcmToken` (nullable). Nuevo endpoint
  `POST /buyer-auth/fcm-token` (autenticado) para que el frontend/mobile registre el
  token del dispositivo tras el login.
- `notifyOrderStatus()` se re-mapeó al enum español de `OrderStatus` de A
  (`Aceptado`/`Preparacion`/`Despachado`/`Entregado`/`Cancelado`), distinto del inglés
  de B.
- Hook en `OrdersService.updateStatus()`: al cambiar de estado, se busca el `fcmToken`
  del comprador y se dispara la notificación de forma asíncrona (no se espera dentro de
  la transacción — un FCM caído no debe hacer fallar el cambio de estado).

### 4. Búsqueda — Elasticsearch (`packages/backend/src/modules/search/`)

- `SearchService`: índice `obraya_products`, analizador `spanish`, con fallback
  automático (`isAvailable()`) si Elasticsearch no responde al arrancar.
- **A diferencia de B**, el documento indexado **no incluye precio ni stock** — en A el
  precio final depende de `PriceType` (B2B/B2C), cantidad y descuentos resueltos por
  `PricesService`, y el stock disponible se calcula sumando reservas; ninguno de los dos
  es un valor estático por producto. `SearchService.search()` devuelve únicamente IDs
  ordenados por relevancia; `MarketplacePublicService` resuelve precio/stock/empresa
  activa contra Postgres para esos IDs (Postgres sigue siendo la fuente de verdad).
- Hooks de indexado en `ProductsService.create()`/`update()`/`remove()` (best-effort,
  no bloquean la operación si Elasticsearch falla).
- `MarketplacePublicService.findAllProducts()`: si hay término de búsqueda y
  Elasticsearch está disponible, usa `SearchService`; si no, cae al `ILIKE` sobre
  Postgres que ya existía (comportamiento sin cambios cuando ES está caído).

### Dependencia con versión fija: `@nestjs/elasticsearch`

`@nestjs/elasticsearch@12` es **ESM-only** (`"type": "module"`, sin condición
`"require"` en su `package.json`) y el backend compila a CommonJS
(`tsconfig.json` → `"module": "commonjs"`). Se fijó la dependencia en
**`@nestjs/elasticsearch@11.1.0`** (última versión con soporte CJS, compatible con
`@nestjs/common@11` y `@elastic/elasticsearch@9`).

## Justificación

- Portar en vez de descartar B evita rehacer desde cero integraciones reales
  (Checkout Pro, FCM, ES) que ya estaban resueltas y probadas ahí.
- Desacoplar `paymentStatus` del `Order.status` respeta la máquina de estados existente
  de A (`VALID_TRANSITIONS`) en vez de forzar un mapeo directo que no tenía sentido de
  negocio (el pago lo confirma Mercado Pago; la aceptación del pedido la decide el
  fabricante).
- Mantener Elasticsearch como capa de relevancia pura (solo IDs) y no como fuente de
  precio/stock evita divergencias entre lo que muestra la búsqueda y lo que realmente
  puede comprarse.

## Consecuencias

- El backend ahora depende de tres servicios externos opcionales en desarrollo
  (Mercado Pago, Firebase, Elasticsearch): todos con fallback/best-effort para no
  bloquear el flujo principal si no están configurados o disponibles.
- `docker-compose.yml` ya tenía el servicio `elasticsearch` definido pero no se estaba
  usando — pasa a ser necesario levantarlo para tener búsqueda relevante (si no, cae a
  `ILIKE`, funcional pero sin fuzzy/relevancia).
- `.env.example` se actualizó con `FRONTEND_URL`, `BACKEND_URL`, `ALLOWED_ORIGINS`,
  `LOG_LEVEL`, `FIREBASE_SERVICE_ACCOUNT`, `ELASTICSEARCH_NODE`.

## Riesgos

- ~~**Medio**: sin reindexado masivo (`reindexAll`)~~ — **Resuelto** (2026-09-19):
  `ProductsService.reindexAll()` + `POST /admin/search/reindex` (solo super-admin, ver
  `AdminController`), en batches de 500 para no cargar toda la tabla en memoria. Botón
  "Reindexar búsqueda" en `/superadmin/products` del frontend.
- **Bajo**: el pin de `@nestjs/elasticsearch@11.1.0` requiere revisión manual la próxima
  vez que se actualicen dependencias — un `npm update` sin cuidado puede volver a traer
  la v12 ESM-only y romper el build de CommonJS.
