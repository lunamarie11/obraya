# ObraYa - Registro de Cambios y Decisiones

Cada cambio importante del proyecto se documenta aqui. Las decisiones arquitectonicas formales van en `docs/adrs/`.

---

## [0.18.0] - 2026-09-23

### Decisiones Tomadas

- **Checklist de deploy a producción** (`docs/checklist-deploy-produccion.md`),
  ver ADR-014. Cierra el tercer y último gap de la priorización de roadmap del
  2026-09-23 (fix de `/health` → observabilidad con Sentry → esto).
- **Fail-fast de configuración crítica**: la app ya no arranca en
  `NODE_ENV=production` con `JWT_SECRET`/`JWT_REFRESH_SECRET`/`DATABASE_PASSWORD`
  sin configurar o con el valor default de desarrollo.

### Agregado

- `validateProductionEnv()` (`config/validate-production-env.ts`), invocada en
  `main.ts` antes de crear la app. Verificado manualmente: sin `.env` presente
  (simulando un contenedor real con env vars inyectadas por el orquestador),
  `NODE_ENV=production node dist/main.js` corta inmediatamente con el error
  claro, sin intentar conectarse a la base de datos.
- `docs/checklist-deploy-produccion.md`: auditoría completa del estado actual
  (no de memoria) — secrets, integraciones externas pendientes de pasar a
  modo producción, y dos gaps grandes encontrados en la auditoría:
  - **No existe ninguna migration todavía** (`synchronize: true` corrió desde
    siempre en desarrollo) — la base de producción quedaría sin tablas si se
    despliega tal cual hoy.
  - **`StorageService` solo soporta MinIO**, nunca implementó S3 real pese a
    que `.env.example` sugería `AWS_S3_BUCKET`/`AWS_S3_REGION` como si fuera
    un toggle ya cableado.
  - Documentado también que no existe infraestructura de deploy (CI/CD,
    `docker-compose.prod.yml`, Dockerfile de frontend, SSL) — no asumir que
    solo falta completar variables de entorno.
- Test: `validate-production-env.spec.ts`.

### Corregido

- `migration:generate` en `packages/backend/package.json` no tenía el flag
  `-d` (nunca se había usado realmente, dado que no hay migrations todavía).

### Verificado

- `tsc --noEmit` limpio, `npx jest` 72/72 tests OK.

---

## [0.17.0] - 2026-09-23

### Decisiones Tomadas

- **Observabilidad mínima con Sentry**, ver ADR-013. Cierra el segundo gap
  identificado en la priorización de roadmap del 2026-09-23 (el primero fue el
  fix del health check en `[0.16.1]`): hasta ahora no había forma de enterarse
  de un error en producción sin revisar los logs de Winston a mano.

### Agregado

- `ErrorTrackingService` (`common/error-tracking/`): wrapper best-effort sobre
  `@sentry/node`, mismo patrón que `AfipService`/`EmailService` — si falta
  `SENTRY_DSN` queda deshabilitado silenciosamente y no bloquea nada.
- `AllExceptionsFilter`: filtro global de excepciones (`APP_FILTER`) que loguea
  todo error no controlado en Winston y reporta a Sentry solo los que son
  status `>= 500` o no son `HttpException` (los 400/404 de negocio no son
  incidentes).
- `process.on('uncaughtException'/'unhandledRejection')` en `main.ts` como red
  de seguridad para errores fuera del ciclo request/response. El primero
  cierra el proceso (`process.exit(1)`), el segundo solo loguea/reporta.
- `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE` en
  `.env.example`.
- Tests: `error-tracking.service.spec.ts`, `all-exceptions.filter.spec.ts`.

### Verificado

- `tsc --noEmit` limpio, `npx jest` 67/67 tests OK.
- Levantado el server localmente: sin `SENTRY_DSN` arranca con el warning
  esperado y `/api/v1/health` sigue respondiendo `200`; una ruta inexistente
  sigue devolviendo el 404 estándar de Nest a través del nuevo filtro.

---

## [0.16.1] - 2026-09-23

### Corregido

- **Bug en `/health`**: `MonitoringService.checkDatabase()` usaba el `AppDataSource`
  standalone de `database/data-source.ts` (pensado solo para el CLI de migrations),
  que nunca se inicializa en runtime. Esto hacía que `/api/v1/health` reportara
  `database.ok: false` (y `status: degraded`) permanentemente aunque la app
  funcionara bien — riesgo real si un orquestador (k8s/ECS) usa ese endpoint para
  liveness/readiness: reiniciaría contenedores sanos en un loop.
- Ahora usa el `DataSource` real de Nest/TypeORM vía `@InjectDataSource()`
  (disponible globalmente porque `TypeOrmCoreModule` es `@Global()`, no hace
  falta importar `TypeOrmModule` en `MonitoringModule`).
- Verificado manualmente: `/api/v1/health` contra la DB local ahora responde
  `database.ok: true`.

---

## [0.16.0] - 2026-09-23

### Decisiones Tomadas

- **Configuración logística por zona**, ver ADR-012. Reemplaza el viejo
  `Company.coverageZones: string[]` (solo códigos postales, usado como
  heurística de ETA en `StoreCard.tsx`) por `deliveryZones: DeliveryZone[]`,
  con costo de envío, tiempo estimado y tipo de flota por zona. El costo que
  se cobra siempre se calcula server-side en `OrdersService.create()`, nunca
  se confía en lo que informe el cliente; la cotización pública es solo
  informativa para mostrarla antes de confirmar el pedido.

### Agregado

- `DeliveryZone`/`FleetType`/`resolveDeliveryZone()` en `Company` entity
  (match exacto por código postal, sin geocoding). `coverageZones` queda como
  getter derivado para no romper `StoreCard.tsx`.
- `GET /public/companies/:id/shipping-quote?postalCode=X` (sin JWT, ver ADR-003).
- `Order.shippingCost`/`shippingZoneName`, sumados al `totalAmount` y a la
  preferencia de Mercado Pago cuando corresponde (ver ADR-007).
- Backoffice (`settings/page.tsx`): editor de zonas de entrega completo
  (nombre, flota, tiempo estimado, costo, códigos postales).
- Checkout (frontend + mobile, paridad completa): cotiza el envío por
  fabricante en el carrito al ingresar el código postal y lo suma al total.
- Tipos compartidos en `packages/shared`: `DeliveryZone`, `FleetType`,
  `ShippingQuote`, `Order.shippingCost`/`shippingZoneName`.

### Verificado

- `npx tsc --noEmit` sin errores en backend, frontend y mobile.
- Suite completa de Jest: 60 tests pasando (+3 nuevos para el cálculo de
  envío en `OrdersService.create()`: sin zona, con zona matcheando, y código
  postal fuera de zona).

---

## [0.15.0] - 2026-09-19

### Decisiones Tomadas

- **Reindexado masivo de Elasticsearch**: resuelve el riesgo pendiente anotado en
  ADR-007 (productos cargados con ES caído no aparecían en la búsqueda hasta editarse).
  Se expuso como acción manual de super-admin en vez de un job automático porque es un
  caso operativo puntual (ES se cayó y volvió a levantar), no algo que deba correr
  solo/periódicamente.

### Agregado

- `ProductsService.reindexAll()`: relee todos los productos de Postgres en batches de
  500 y los reindexa via `SearchService.bulkIndex()`. No hace nada si Elasticsearch no
  está disponible (`isAvailable()`).
- `POST /admin/search/reindex` (`AdminController`, protegido por `SuperAdminGuard`).
- Botón "Reindexar búsqueda" en `/superadmin/products` del frontend.

### Verificado

- `npx tsc --noEmit` sin errores en backend y frontend.
- Suite completa de Jest: 57 tests pasando (sin nuevos, no se agregó lógica de negocio
  con ramas condicionales más allá del guard de `isAvailable()` ya cubierto
  implícitamente por el resto de tests de `SearchService`).

---

## [0.14.0] - 2026-09-19

### Decisiones Tomadas

- **Email transaccional con AWS SES**, ver ADR-011. Se eligió SES sobre SendGrid porque
  el proyecto ya usa AWS para S3 y sa-east-1 como cloud target; reutiliza las mismas
  credenciales (`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`). Mismo patrón best-effort
  que `NotificationsService`/`AfipService`: sin credenciales, el envío queda
  deshabilitado sin bloquear el flujo principal.

### Agregado

- `packages/backend/src/modules/email/` (`EmailModule`/`EmailService`): envío genérico
  de HTML por SES, más dos casos de uso concretos:
  - `UsersService.inviteUser()` ahora envía el link de invitación
    (`${FRONTEND_URL}/accept-invite?token=...`) al email invitado — antes generaba el
    token pero nadie lo recibía.
  - `OrdersService.updateStatus()` envía un email al comprador en paralelo al push de
    FCM existente (mismos estados: Aceptado/Preparación/Despachado/Entregado/Cancelado).
- Variables de entorno: `AWS_SES_REGION`, `EMAIL_FROM`.

### Verificado

- `npx tsc --noEmit` sin errores en `packages/backend`.
- Suite de Jest actualizada (mock de `EmailService` en `orders.service.spec.ts`).

---

## [0.13.0] - 2026-09-03

### Decisiones Tomadas

- **Integración AFIP completa** (checksum de CUIT + arquitectura de módulo + facturación
  electrónica real), ver ADR-010. Se optó por el patrón best-effort ya usado por
  `PaymentsService`/`NotificationsService`: el módulo se deshabilita solo si faltan
  credenciales, sin bloquear el resto de la app.
- **Solo Factura B/C, nunca Factura A**: `Buyer` no tiene CUIT propio (siempre consumidor
  final ante AFIP), así que Factura A no es posible con el modelo de datos actual.
  Documentado como limitación conocida en ADR-010, no como bug.
- **Disparador de facturación: transición a `Despachado`** (no `Aceptado` ni `Entregado`):
  es el estado más cercano al movimiento real de la mercadería y no puede revertirse a un
  estado anterior, evitando el riesgo de tener que anular una factura ya emitida.
- **Sin migration manual**: se siguió la convención ya establecida en el repo (carpeta
  `migrations/` vacía, `synchronize: true` en desarrollo) para los nuevos campos de
  `Company` y `Order`.

### Agregado

- `packages/backend/src/common/validators/cuit.validator.ts`: checksum real de CUIT
  (mod 11) + decorador `@IsValidCuit()`, aplicado en `RegisterCompanyDto`.
- `packages/backend/src/modules/afip/` (`AfipModule`/`AfipService`): wrapper sobre
  `@afipsdk/afip.js` — `getTaxpayerDetails()` (padrón, best-effort) y `createInvoice()`
  (Factura B/C vía WSFEv1, `ElectronicBilling.createNextVoucher`). Funciona out-of-the-box
  en `AFIP_ENV=testing` contra los servidores reales de homologación de AFIP usando el
  CUIT público `20409378472`, sin certificado propio.
- `Company.ivaCondition` (`RESPONSABLE_INSCRIPTO` | `MONOTRIBUTO` | `EXENTO`): determina
  el tipo de factura a emitir.
- `Order` agrega `afipCae`, `afipCaeExpiration`, `afipInvoiceNumber`, `afipInvoiceType`,
  `afipStatus` (mismo patrón que los campos `mp*` de Mercado Pago, ver ADR-007).
- `UsersService.registerCompany()` valida el CUIT contra el padrón de AFIP (best-effort,
  no bloqueante). `OrdersService.updateStatus()` emite la factura al pasar a `Despachado`
  (best-effort, no bloquea el cambio de estado si AFIP falla).
- Variables de entorno: `AFIP_CUIT`, `AFIP_PTO_VTA` (`AFIP_CERT_PATH`/`AFIP_KEY_PATH`/
  `AFIP_ENV` ya existían declaradas sin usar).

### Verificado

- `npx tsc --noEmit` sin errores en `packages/backend`.
- Suite completa de Jest: 57 tests pasando (incluye 6 nuevos de checksum de CUIT y 7 de
  `AfipService`, más el ajuste del mock de `AfipService`/`Company` en
  `orders.service.spec.ts` para la nueva dependencia).

---

## [0.12.0] - 2026-09-03

### Decisiones Tomadas

- **Cierre de paridad mobile vs. frontend**: `packages/mobile` ya tenía cuenta de
  comprador real y libreta de direcciones al día; faltaban favoritos, rating
  real/reseñas y Mercado Pago en checkout. Se replicaron los tres siguiendo el patrón
  ya establecido ("espejo" del frontend, mismos endpoints y tipos de `@obraya/shared`).
  Se descartó replicar la home dinámica de ADR-008/ADR-009 en mobile: su home
  (`app/(tabs)/index.tsx`) es la grilla de búsqueda del marketplace, arquitectónicamente
  distinta de la home promocional de `packages/frontend/src/app/page.tsx` (ver ADR-005).
  Ver addendum en ADR-005.

### Agregado

- **Favoritos en mobile**: `src/lib/favorites.ts`, `src/hooks/useFavorites.ts`,
  `app/favorites.tsx`, botón de corazón en `StoreCard`, `ProductCard`, `Header` y en el
  perfil logueado. Registrado en el stack raíz (`app/_layout.tsx`).
- **Rating real en mobile**: `StoreCard` reemplaza el placeholder de rating por
  `averageRating`/`reviewCount` reales; formulario de calificación (estrellas +
  comentario opcional, modo lectura si ya existe reseña) en `app/my-orders/[id].tsx`
  cuando el pedido está `Entregado`; badge de rating + lista de reseñas de compradores
  en `app/company/[id].tsx`.
- **Mercado Pago en checkout mobile**: tercera opción de pago en `app/checkout.tsx`
  (antes solo efectivo/transferencia); el método viaja como campo real `paymentMethod`
  al crear el pedido (antes viajaba como texto libre embebido en `notes`). Si el pedido
  devuelve `paymentUrl`, se abre con `Linking.openURL` (equivalente mobile de
  `window.location.href` en web) y el comprador queda en `/order-confirmation` dentro
  de la app.

### Verificado

- Mobile: `npx tsc --noEmit` sin errores.
- Frontend: `npx tsc --noEmit` sin errores (sin cambios funcionales, solo verificación
  de que no se rompió nada en este pase).

---

## [0.11.0] - 2026-09-03

### Decisiones Tomadas

- **Banners de promos reutilizando `Price.scheduledDiscount`**: en vez de crear una
  entidad/CMS de banners administrable, se detectó que ya existía un dato real de
  "producto en oferta ahora" (`scheduledDiscount`, usado desde el MVP de precios para
  resolver el precio final) que ningún fabricante estaba comunicando en el home
  todavía. Ver ADR-009.

### Agregado

- **`GET /public/promotions`**: productos con `scheduledDiscount` activo ahora
  (dentro de su rango `startDate`/`endDate`), de empresas activas.
  `MarketplacePublicService.findActivePromotions()`.
- **Carrusel de promos dinámico** en el home (`app/page.tsx`): muestra ofertas reales
  con precio final/tachado y navega al producto al hacer click; si no hay ninguna
  promo activa, cae a los 3 banners genéricos de propuesta de valor que ya existían
  (no se oculta la sección para no dejar el hero vacío).
- Nuevo tipo compartido `PromotionBanner` en `packages/shared`.

### Verificado

- Backend: `npx tsc --noEmit` sin errores. `npx jest` — 44/44 tests OK (4 suites).
- Frontend: `npx tsc --noEmit` sin errores.

---

## [0.10.0] - 2026-09-03

### Decisiones Tomadas

- **Rating real antes que home dinámica**: `docs/specs/marketplace-comprador.md`
  marcaba "Home más dinámica" (#5, incluye "fabricantes mejor calificados") y
  "Rating y tiempo de entrega reales" (#6) como pendientes. Se resolvió primero #6
  porque #5 depende de tener un rating real para poder ordenar por calificación. Ver
  ADR-008 para el detalle completo.

### Agregado

- **Módulo de reseñas** (`packages/backend/src/modules/reviews/`): entidad `Review`
  (un pedido admite una sola reseña, solo calificable en estado `Entregado` y por su
  propio comprador), `POST /buyer-reviews`, `GET /buyer-reviews/mine`,
  `GET /public/companies/:id/reviews`.
- **Rating real en el marketplace público**: `GET /public/companies` y
  `GET /public/companies/:id` devuelven `averageRating`/`reviewCount` agregados desde
  `Review` (antes eran un placeholder determinístico en el frontend). `StoreCard.tsx`
  y la ficha de fabricante muestran el rating real ("Nuevo" si todavía no tiene
  reseñas); nueva sección de reseñas en la ficha de fabricante.
- **Calificar pedido**: en `/my-orders/:id`, si el pedido está `Entregado`, formulario
  de estrellas + comentario opcional; si ya fue calificado, se muestra en modo lectura.
- **Home dinámica**: sección "Pedí de nuevo" (productos de pedidos previos del
  comprador logueado, re-resueltos contra el catálogo actual para precio/imagen
  vigentes) y sección "Mejor calificados" (top 6 empresas por `averageRating`, ambas
  ocultas si no hay datos para mostrar).

### Verificado

- Backend: `npx tsc --noEmit` sin errores. `npx jest` — 42/42 tests OK (4 suites).
- Frontend: `npx tsc --noEmit` sin errores.

---

## [0.9.0] - 2026-09-02

### Decisiones Tomadas

- **Consolidacion de dos historias de git independientes sobre el mismo remoto**
  (`lunamarie11/obraya`): se detecto que existia una segunda codebase (Prisma,
  sin logica de negocio de Fase 1 ni mobile) con integraciones reales de pagos,
  notificaciones, busqueda y seguridad que esta codebase (TypeORM, con toda la
  logica de negocio y tests) no tenia. Se decidio consolidar sobre esta
  codebase como linea principal y portar manualmente esas piezas desde la otra
  (preservada integra en la rama `legacy/prisma-v1`). Ver ADR-007 para el
  detalle completo de cada pieza portada y las decisiones de diseno.

### Agregado

- **Mercado Pago real** (Checkout Pro): `PaymentsService`/`PaymentsController`
  (`packages/backend/src/modules/payments/`), webhook `POST /payments/webhook`.
  `Order` gana `paymentMethod`, `mpPreferenceId`, `mpPaymentId`, `paymentUrl`,
  `paymentStatus`. Checkout del frontend agrega Mercado Pago como tercera
  opcion real de pago y redirige a `paymentUrl` cuando corresponde.
- **Push notifications con Firebase FCM**: `NotificationsService`
  (`packages/backend/src/modules/notifications/`), hook en
  `OrdersService.updateStatus()`. `Buyer` gana `fcmToken`; nuevo endpoint
  `POST /buyer-auth/fcm-token`.
- **Busqueda con Elasticsearch**: `SearchService`
  (`packages/backend/src/modules/search/`), indexado en
  `ProductsService.create/update/remove`, usado por
  `MarketplacePublicService.findAllProducts()` cuando hay termino de busqueda
  y Elasticsearch esta disponible (con fallback automatico a `ILIKE` sobre
  Postgres si no lo esta).
- **Seguridad de produccion**: `SecureValidationPipe` + `InputSanitizerService`
  + `SanitizeMiddleware` (sanitizacion contra XSS/inyeccion), `CorsConfig` por
  entorno, `ThrottlingModule` (rate limiting por endpoint, `auth` aplicado a
  login de empresas y compradores), logging con Winston (rotacion de
  archivos), `helmet()`.

### Verificado

- Backend: `npx tsc --noEmit` sin errores. `npx jest` — 34/34 tests OK.
- Frontend: `npx tsc --noEmit` sin errores.

## [0.8.0] - 2026-08-31

### Decisiones Tomadas

- **Libreta de direcciones del comprador** (backlog #3 de
  `docs/specs/marketplace-comprador.md`): se descarto la opcion de guardarlas
  solo en `localStorage` (evaluada como paso intermedio en el backlog) y se
  implemento directamente con persistencia real en el backend, ya que la
  entidad `Buyer` con JWT propio ya existe desde ADR-006 y permite scopear las
  direcciones de forma segura sin depender del dispositivo/navegador.
- Una direccion por comprador puede marcarse como predeterminada
  (`isDefault`); al crear o editar una direccion con `isDefault: true` se
  desmarca automaticamente cualquier otra direccion default del mismo buyer.

### Agregado

- Backend: entidad `BuyerAddress` (`packages/backend/src/modules/buyers/entities/buyer-address.entity.ts`),
  sin FK dura a `Buyer` (mismo criterio que `Order.buyerId`, ver ADR-006).
  `BuyerAddressesService`/`BuyerAddressesController` (`GET/POST/PATCH/DELETE
  /buyer-addresses`), guardado con `BuyerJwtAuthGuard` y siempre scopeado por
  el `buyerId` del JWT.
- Frontend: `lib/addresses.ts` (`getBuyerAddresses`, `createBuyerAddress`,
  `deleteBuyerAddress`). `isBuyerRoute()` en `lib/api.ts` ahora incluye
  `/buyer-addresses` para usar el JWT de `Buyer` en esas rutas. `/checkout`
  (Step 0) muestra las direcciones guardadas como tarjetas seleccionables
  (con badge "Predeterminada" y borrado), permite agregar una nueva direccion
  con opcion de guardarla, y preselecciona la default al cargar.
- Mobile (`packages/mobile`): mismo flujo espejado — `src/lib/addresses.ts`,
  `isBuyerRoute()` actualizado en `src/lib/api.ts`, integracion equivalente en
  `app/checkout.tsx` con componentes nativos (`TouchableOpacity` en vez de
  botones/checkbox HTML).

### Verificado

- Backend: `npx tsc --noEmit` sin errores. Smoke test manual de
  `POST/GET /buyer-addresses` (200 con token de `Buyer` valido).
- Frontend: `npx tsc --noEmit` sin errores.
- Mobile: `npx tsc --noEmit` sin errores.

## [0.7.0] - 2026-08-31

### Decisiones Tomadas

- **Cuenta de comprador real, reemplazando el historial liviano de ADR-004** (ver
  ADR-006): se detecto que el checkout dependia de una sesion de `CompanyUser`
  (tipicamente la cuenta demo `buyer@obraya.com`) y creaba los pedidos bajo la empresa
  del usuario logueado en vez de la empresa vendedora — un bug de atribucion heredado
  del hack original. Se implemento una entidad `Buyer` real con su propio JWT
  (`'jwt-buyer'`), separado del JWT de `CompanyUser`, sin tocar guards ni rutas
  existentes del backoffice.
- Registro/login de comprador simple: nombre, email, password (sin verificacion de
  email en este pase).
- Checkout con **cuenta obligatoria** (no se habilita guest checkout en este pase).
- El carrito ahora trackea `companyId` por item (`CartItem.companyId`) y el checkout
  agrupa por fabricante: si el comprador tiene productos de varias empresas en el
  carrito, se crea un pedido por empresa contra `POST /buyer-orders`.

### Agregado

- Backend: modulo `buyers` (`packages/backend/src/modules/buyers/`) — entidad `Buyer`,
  `BuyersService` (bcrypt, 12 rounds, mismo patron que `UsersService`),
  `BuyerAuthService`/`BuyerAuthController` (`/buyer-auth/register|login|refresh|demo`),
  `BuyerJwtStrategy`/`BuyerJwtAuthGuard` (estrategia Passport `'jwt-buyer'`).
- Backend: `CreateOrderDto.companyId` ahora es explicito y obligatorio (antes se
  inferia de la sesion de `CompanyUser`). Nuevo `BuyerOrdersController`
  (`/buyer-orders`, guardado con `BuyerJwtAuthGuard`) con create/list/detail
  scopeados al `buyerId` del JWT.
- Frontend: `lib/buyer-auth.ts` (sesion de comprador en `localStorage`, claves
  separadas de `lib/auth.ts` para no pisar la sesion de `CompanyUser` en el mismo
  navegador) y soporte de token dual en el interceptor de `lib/api.ts` (rutas
  `/buyer-auth` y `/buyer-orders` usan el JWT de `Buyer`).
- Frontend: paginas `/account` (login + login demo) y `/account/register`.
- Frontend: `/my-orders`, `/my-orders/[id]`, `/checkout` y `/order-confirmation`
  migrados a `GET`/`POST /buyer-orders`. `/order-confirmation` acepta multiples
  `orderIds` (uno por fabricante).
- Frontend: `lib/cart.ts` con `CartItem.companyId` y `getCartGroupedByCompany()`.
  `BottomTabBar` y `MarketplaceHeader` usan la sesion de `Buyer` en vez de la de
  `CompanyUser` para el tab/boton "Perfil".
- Script `seed-users.ts`: siembra un comprador demo (`comprador@obraya.com`).

### Eliminado

- `packages/frontend/src/lib/orders.ts` (historial en `localStorage` de ADR-004, ya
  no se usa).

### Verificado

- Backend: `npx tsc --noEmit` sin errores. Smoke test manual de
  `POST /buyer-auth/register`, `POST /buyer-auth/login`, `GET /buyer-orders`
  (200 con token valido, 401 sin token).
- Frontend: `npx tsc --noEmit` sin errores.

- Mobile (`packages/mobile`): mismo flujo espejado con AsyncStorage —
  `src/lib/buyer-auth.ts`, interceptor de token dual en `src/lib/api.ts`,
  `CartItem.companyId` + `getCartGroupedByCompany()` en `src/lib/cart.ts`,
  `checkout.tsx`/`order-confirmation.tsx` multi-fabricante, `my-orders` contra
  `/buyer-orders`. Login/registro de comprador se unifico en `app/(tabs)/profile.tsx`
  (reemplaza el login demo de `CompanyUser` que tenia antes), en vez de crear rutas
  nuevas, ya que esa pantalla ya era el unico punto de auth del arbol de mobile.
  `src/lib/orders.ts` (historial de ADR-004) se elimino por quedar sin uso.

### Pendiente

- Probar `packages/mobile` en Metro/un simulador real (no disponible en este
  entorno) — sigue siendo el mismo riesgo abierto que ADR-005.
- Libreta de direcciones, favoritos, pagos reales via MercadoPago (backlog sin
  cambios, ver `docs/specs/marketplace-comprador.md`).

## [0.6.0] - 2026-08-31

### Decisiones Tomadas

- **Bootstrap completo de `packages/mobile`** (ver ADR-005): el scaffold estaba vacio
  (solo dependencias declaradas, cero archivos de codigo). Se construyo una app Expo
  Router con paridad funcional respecto al flujo de comprador de `packages/frontend`,
  reusando la misma API y los mismos tipos de `@obraya/shared`. Se opto por
  `StyleSheet` + `src/theme.ts` en vez de NativeWind, ya que este entorno no puede
  validar configuracion de Metro/Babel (razonado en detalle en ADR-005).

### Agregado

- `packages/mobile/src/lib/*`: version AsyncStorage de `api.ts`, `auth.ts`, `cart.ts`,
  `orders.ts` y `marketplace.ts`, espejo de sus equivalentes en `packages/frontend`.
- `packages/mobile/src/theme.ts`: tokens de diseno (colores, radios, sombras, colores
  de estado de pedido) alineados a `globals.css` del frontend.
- `packages/mobile/src/components/*`: `ProductCard`, `StoreCard`, `CategoryChips`,
  `OrderStatusStepper`, `StatusBadge`, `Header`, `CartStickyBar`.
- Navegacion: `app/_layout.tsx` (stack raiz + `QueryClientProvider`) y
  `app/(tabs)/_layout.tsx` (tabs Home/Pedidos/Carrito/Perfil, mismo mapa que
  `BottomTabBar` del frontend).
- Pantallas: home/marketplace (busqueda, categorias, grilla, paginacion), ficha de
  tienda (`company/[id]`), detalle de producto (`product/[id]`), carrito, checkout
  (3 pasos), order-confirmation, `my-orders` (lista + detalle con tracking y "repetir
  pedido"), perfil con login demo (mismas cuentas que `DemoCredentials` del frontend).
- Scripts `dev:mobile` y `typecheck:mobile` en el `package.json` raiz.

### Verificado

- `npm install --workspace=packages/mobile` y `npx tsc --noEmit` (dentro de
  `packages/mobile`) corren sin errores. No se probo en Metro/simulador — ver riesgos
  en ADR-005.

### Pendiente

- Ejecutar la app en Metro/un simulador real para validar layout y modulos nativos
  (`react-native-reanimated`, `gesture-handler`).
- Favoritos, libreta de direcciones y perfil completo en mobile — mismo backlog
  pendiente que la version web (`docs/specs/marketplace-comprador.md`).

## [0.5.0] - 2026-08-31

### Decisiones Tomadas

- **Historial de "Mis pedidos" del comprador, sin entidad `Buyer`** (ver ADR-004):
  investigado el backend, no existe login/registro de compradores ni FK real de
  `Order.buyerId` (queda comentado como "Fase 2" en la entity). En vez de construir
  esa entidad ahora, se implementa un historial liviano por navegador (`lib/orders.ts`,
  `localStorage`) que reutiliza `GET /orders/:id` sin tocar backend ni guards.
- Se creo `docs/specs/marketplace-comprador.md` consolidando el backlog priorizado de
  la experiencia de comprador (favoritos, libreta de direcciones, pagos reales, rating
  real, etc.), ya que no existia spec formal para ese modulo.
- `packages/shared/src/types/index.ts`: `Order` y `OrderItem` se extendieron con
  campos que ya existian en las entities del backend pero no estaban tipados
  (`buyerName`, `buyerEmail`, `buyerPhone`, `deliveryAddress`, `rejectionReason`,
  `productName`, `productSku`, `discountPercent`) para que las paginas nuevas no
  necesiten `any`.

### Agregado

- **`/my-orders`**: listado real de pedidos del comprador (reemplaza el placeholder del
  tab "Pedidos" del bottom nav, que apuntaba a `/order-confirmation`). Se usa el
  prefijo `my-` porque `/orders` ya lo usa el listado de pedidos del backoffice del
  vendedor.
- **`/my-orders/[id]`**: detalle de pedido con `OrderStatusStepper`, direccion de
  entrega, items y accion "Repetir pedido" (recarga los items al carrito).
- Checkout (`/checkout`) ahora guarda el `orderId` creado en el historial local antes
  de redirigir a `order-confirmation`.

### Pendiente

- Cuenta de comprador real (`Buyer`), libreta de direcciones, favoritos, home mas
  dinamica, rating/ETA reales y pagos con MercadoPago — ver backlog priorizado en
  `docs/specs/marketplace-comprador.md`.
- El historial de `/my-orders` queda atado al dispositivo/navegador hasta que exista
  `Buyer` (limitacion documentada en ADR-004).

---

## [0.4.0] - 2026-07-21

### Decisiones Tomadas

- **Endpoint público de solo lectura para el marketplace del comprador** (ver ADR-003): `GET /products` y `GET /products/:id` estaban scopeados al `companyId` del JWT (son en realidad la API de inventario del backoffice). Se agregó un módulo `MarketplaceModule` nuevo y aditivo (`/public/companies`, `/public/companies/:id`, `/public/companies/:id/products`, `/public/products`, `/public/products/:id`) sin tocar los controllers guardados existentes.
- **Rating y tiempo estimado de entrega son placeholders de frontend**, no campos nuevos en `Company` — se derivan de forma estable (hash del id / cantidad de `coverageZones`) hasta que exista un modelo real de reviews/logística.
- **Guest checkout no se habilita en este pase**: el checkout sigue requiriendo sesión autenticada (vía demo-login), tal como ya funcionaba.
- **Fix de infraestructura de tests del backend**: `tsconfig.json` tenía `"types": []`, lo que le sacaba los tipos de Jest a `ts-jest` y rompía silenciosamente toda la suite (`npx jest` fallaba con "Cannot find name 'expect'"). Se movió a `"types": ["node", "jest"]`.
- **`packages/shared/src/types/index.ts`** se extendió con `PublicCompany`, `PublicProduct` y un alias `OrderStatus` — primer consumo real de tipos compartidos desde las páginas de comprador (antes usaban `any`).
- **Bug encontrado en QA manual (cuenta demo `buyer@obraya.com`) y corregido**: el detalle de producto reutilizaba `GET /stock/:id`, scopeado al `companyId` del JWT (pensado para que cada empresa vea su propio inventario). Con el catálogo público cruzando empresas, cualquier usuario logueado veía "sin stock" en productos que no fueran de su propia empresa, aunque tuvieran stock real — rompía "Agregar al carrito" en casi todo el marketplace nuevo. Se agregó `availableStock` a `GET /public/products/:id` (suma de `quantity - reservedQuantity` de todos los depósitos, sin scoping por empresa ni exponer detalle interno) y el frontend dejó de llamar al endpoint viejo. Detalle completo en ADR-003.

### Agregado

- **Rediseño completo de la experiencia de comprador** (Rappi/PedidosYa aplicado a materiales de construcción), sin tocar `(backoffice)` ni `superadmin`:
  - Home (`/`): buscador prominente, chips de categoría, carrusel de promos, grid de fabricantes/distribuidores real (`StoreCard`).
  - Vista de fabricante (`/marketplace/[companyId]`): catálogo agrupado por categoría con buscador interno.
  - Marketplace (`/marketplace`): pasa a ser búsqueda global cruzando todas las empresas activas, ahora funciona realmente para un visitante anónimo.
  - Detalle de producto: usa el endpoint público (con resolución de precio y stock disponible por variante/cantidad, sin requerir sesión ni scoping por empresa).
  - Carrito: barra flotante inferior (`CartStickyBar`) que aparece apenas se agrega un ítem, con contador y total.
  - Checkout: pasos reordenados a Dirección → Método de pago → Resumen, con edición inline de cantidades; se corrigió que se descartaba el `id` del pedido creado.
  - Seguimiento de pedido: `order-confirmation` ahora muestra el pedido real con un stepper visual de 5 estados (`OrderStatusStepper`), reutilizando el enum de `OrderStatus` sin tocar la lógica de transiciones del backend.
  - Bottom tab bar mobile (Home/Pedidos/Carrito/Perfil), oculto en desktop vía `md:hidden`, sin sistema de feature flags.
- Fix puntual: `DemoCredentials` no guardaba `user` ni las cookies de sesión (solo los tokens), por lo que el header seguía mostrando "Ingresar" después del demo-login. Se extrajo `persistSession()` en `lib/auth.ts`, reutilizada por `login()` y el demo-login.

### Pendiente

- Pagos reales (MercadoPago) — el paso de "Método de pago" en checkout es solo UI.
- Listado real de "Mis pedidos" (el tab "Pedidos" del bottom nav es un placeholder).
- `CreateOrderDto` sigue confiando en `unitPrice`/`discountPercent` enviados por el cliente sin re-resolverlos server-side.
- `packages/shared` sigue teniendo interfaces (`Company`, `Price`) desactualizadas respecto a las entidades reales — no se reconciliaron en este pase.

---

## [0.3.0] - 2026-04-09

### Decisiones Tomadas

- **App Router de Next.js 14:** Se usa el sistema de rutas con carpetas `(auth)` y `(backoffice)` como route groups para separar layouts sin afectar la URL.
- **Token en localStorage:** Decisión de MVP. En v2 migrar a httpOnly cookies para protección contra XSS. El middleware actualmente verifica cookie (no localStorage) — en v2 unificar.
- **React Query para estado server:** Todo dato del servidor se maneja con `useQuery`/`useMutation`. Sin Redux ni Context para datos remotos.
- **Precios en centavos en el frontend:** `formatARS()` convierte centavos a pesos ARS con `Intl.NumberFormat`. Nunca se hace aritmética en la UI con los valores raw.
- **22/22 tests pasando:** PricesService (8 tests: descuentos scheduled, por volumen, precedencia) y OrdersService (14 tests: transiciones válidas e inválidas, cancelación, mensajes).

### Agregado

- **Tests unitarios (22 tests, 0 fallos):**
  - `prices.service.spec.ts`: 8 casos para resolución de descuentos (volumen, programado, precedencia, fuera de fecha)
  - `orders.service.spec.ts`: 14 casos para flujo de estados (transiciones válidas/inválidas, cancelación con/sin motivo, mensajes en estado final)

- **Infraestructura:**
  - MinIO agregado al `docker-compose.yml` (puerto 9000 API, 9001 consola web)
  - `jest.config.js` configurado para el backend

- **Frontend Next.js 14 (App Router):**
  - Route groups `(auth)` y `(backoffice)` con layouts separados
  - `globals.css` con Tailwind + clases reutilizables (`.card`, `.btn-primary`, `.badge-*`)
  - `lib/api.ts`: cliente Axios con interceptor de token y auto-refresh
  - `lib/auth.ts`: login, register, logout, getStoredUser
  - Sidebar con navegación activa y color de marca (naranja ObraYa)
  - Header con avatar de usuario y rol
  - **Páginas implementadas:**
    - `/login` — formulario de login con manejo de errores
    - `/register` — registro de empresa + admin con confirmación
    - `/dashboard` — KPIs con selector de período (hoy/semana/mes), comparativa vs anterior, top productos, alerta de bajo stock
    - `/orders` — tabla paginada con filtros por estado y búsqueda, badges de estado con color
    - `/products` — grid de productos con imágenes, variantes, edición y desactivación
    - `/stock` — tabla de stock con highlight de bajo stock
    - `/reports` — descarga directa de CSV de ventas (con rango de fechas) y stock
  - `middleware.ts` para protección de rutas (redirige a /login si no hay token)
  - `tailwind.config.ts` y `next.config.js` configurados

### Pendiente

- Páginas de detalle: `/orders/:id` (detalle + chat), `/products/:id` (edición + upload imágenes)
- Página `/products/new` (formulario de creación)
- Página `/settings` (usuarios de la empresa, invitaciones)
- Migrar auth de localStorage a httpOnly cookies
- Instalar dependencias frontend (`npm install` en packages/frontend)

---

## [0.2.0] - 2026-04-09

### Decisiones Tomadas

- **Precios en centavos:** `basePrice` se almacena como entero (bigint) en centavos de ARS para evitar errores de punto flotante. $1500 → 150000. Se convierte a decimal solo al exportar.
- **Descuento programado tiene precedencia sobre volumen:** Si hay un descuento activo por fecha, no se aplica el de volumen. Evita conflictos y es el comportamiento más predecible para el usuario.
- **Soft delete en Orders nunca:** Los pedidos no se eliminan, solo se cancelan con motivo obligatorio. Requerimiento legal/auditoría.
- **Transiciones de estado validadas en backend:** La lógica de `VALID_TRANSITIONS` vive en el service, no en el frontend. El frontend no puede saltar estados inválidos aunque lo intente.
- **BOM en CSV exportados:** Se agrega `\uFEFF` al inicio del CSV para que Excel (Windows) abra correctamente los acentos sin configuración extra.
- **Dashboard compara contra período anterior:** El endpoint retorna el período actual Y el anterior para mostrar variación porcentual sin un segundo request.
- **Reportes como descarga directa:** Los endpoints de reportes responden con `Content-Disposition: attachment` para descarga directa desde el browser o Postman, no base64.

### Agregado

- **Módulo Prices:**
  - Entidad `Price` (tipo B2C/B2B, precio en centavos, precios por volumen JSONB, descuento programado JSONB)
  - Entidad `PriceHistory` (historial de cambios con motivo y usuario)
  - `GET  /api/v1/products/:id/prices` — ver precios actuales
  - `POST /api/v1/products/:id/prices` — crear o actualizar precio (upsert)
  - `GET  /api/v1/products/:id/prices/resolve?type=B2C&quantity=50` — precio final aplicando descuentos
  - `GET  /api/v1/products/:id/prices/history` — historial de cambios
  - Resolución de descuentos: primero programado, luego volumen, luego base

- **Módulo Orders:**
  - Entidades `Order`, `OrderItem`, `OrderMessage`
  - Flujo de estados validado: Nuevo→Aceptado→Preparacion→Despachado→Entregado (+ Cancelado desde cualquier estado activo)
  - `GET  /api/v1/orders` — listar con filtros (estado, fecha, búsqueda)
  - `GET  /api/v1/orders/:id` — detalle con items y mensajes
  - `PUT  /api/v1/orders/:id/status` — cambiar estado (valida transición, requiere motivo si cancela)
  - `POST /api/v1/orders/:id/messages` — enviar mensaje al comprador
  - `GET  /api/v1/orders/:id/messages` — historial del chat
  - Mensaje de sistema automático en cada cambio de estado

- **Dashboard:**
  - `GET /api/v1/dashboard/summary?period=today|week|month`
  - KPIs: ingresos totales, cantidad de pedidos, ticket medio
  - Variación porcentual vs período anterior
  - Top 10 productos por revenue
  - Pedidos por estado
  - Alertas de bajo stock (top 5)

- **Reportes:**
  - `GET /api/v1/reports/sales?from=2026-01-01&to=2026-12-31` → descarga CSV de ventas
  - `GET /api/v1/reports/stock` → descarga CSV de stock valorizado
  - CSV con BOM para compatibilidad con Excel

### Pendiente

- Migrations SQL (generar con `npm run migration:generate`)
- MinIO en docker-compose para imágenes en dev
- Tests unitarios de OrdersService (flujo de estados) y PricesService (resolución de descuentos)
- Integración AFIP para validación de CUIT al registrar empresa
- Notificaciones push/email al cambiar estado de pedido

---

## [0.1.0] - 2026-04-09

### Decisiones Tomadas

- **NestJS v11:** Se actualizó el scaffold de NestJS v10 a v11 (versión actual) para compatibilidad con `@nestjs/swagger` v11.
- **MinIO como S3 local:** Para dev se usa MinIO (docker) como reemplazo de AWS S3. El StorageService abstrae la diferencia — en producción se cambia la config sin tocar código.
- **Soft delete en productos:** `DELETE /products/:id` marca `isActive=false` en lugar de borrar la fila. Preserva historial de pedidos referenciando el producto.
- **Stock con depósito "principal" por defecto:** En MVP se trabaja con un único depósito. El modelo ya soporta múltiples (`warehouseId`), listo para expansión en Fase 2.
- **Historial de movimientos de stock:** Toda modificación de stock genera un registro en `stock_movements`. Permite auditoría y reportes de rotación.
- **Null en campos opcionales de invitación:** Al aceptar invitación se setean `inviteToken` e `inviteExpiresAt` a `null` mediante cast TypeScript (TypeORM persiste correctamente como NULL en DB).
- **ConfigModule global:** Toda la configuración se carga desde `.env` vía `@nestjs/config`. Nunca hay valores hardcodeados en código fuente.

### Agregado

- **Módulo Users:**
  - Entidad `Company` (CUIT, razón social, estado de aprobación, zonas de cobertura, datos bancarios)
  - Entidad `CompanyUser` (email, passwordHash, rol, token de invitación)
  - Roles: Admin, Vendedor, Logística, Contabilidad
  - `POST /api/v1/auth/register` — registro de empresa con usuario admin inicial
  - `POST /api/v1/auth/login` — login con JWT (access + refresh token)
  - `POST /api/v1/auth/refresh` — renovar access token
  - `POST /api/v1/companies/:id/users/invite` — invitar usuario por email
  - `POST /api/v1/companies/accept-invite` — aceptar invitación y configurar contraseña
  - JwtStrategy, JwtAuthGuard, RolesGuard
  - Decoradores: `@CurrentUser()`, `@Roles()`

- **Módulo Products:**
  - Entidad `Product` (nombre, SKU, categoría, imágenes[], ficha técnica PDF)
  - Entidad `ProductVariant` (nombre, atributos flexibles JSONB: color, tamaño, presentación)
  - CRUD completo paginado: `GET/POST/PUT/DELETE /api/v1/products`
  - Upload de imágenes (máx 10): `POST /api/v1/products/:id/images`
  - Upload de ficha técnica PDF: `POST /api/v1/products/:id/technical-sheet`
  - Import masivo CSV: `POST /api/v1/products/import`
  - `StorageService` con MinIO (dev) / S3 (prod)

- **Módulo Stock:**
  - Entidad `Stock` (por producto + variante + depósito, cantidad, reservado, alerta)
  - Entidad `StockMovement` (historial: entrada, salida, reserva, liberación, ajuste)
  - `GET /api/v1/stock` — stock actual de todos los productos
  - `GET /api/v1/stock/alerts` — productos con bajo stock
  - `GET /api/v1/stock/:productId` — stock por depósito de un producto
  - `GET /api/v1/stock/:productId/movements` — historial de movimientos
  - `PUT /api/v1/stock/:productId` — actualizar stock con registro de movimiento
  - `POST /api/v1/stock/bulk-update` — actualización masiva JSON
  - `POST /api/v1/stock/bulk-update/csv` — actualización masiva CSV

- **Infraestructura backend:**
  - Node.js v20 LTS instalado via nvm
  - `ConfigModule` con configs por dominio (app, database, jwt, storage)
  - `DatabaseModule` con TypeORM async, migrations habilitadas, sync=false
  - `data-source.ts` para TypeORM CLI
  - `main.ts` con ValidationPipe, Swagger en `/api/docs`, CORS para dev
  - `.env.example` actualizado con todas las variables

### Pendiente

- Migrations SQL de la DB (generar con `npm run migration:generate`)
- Módulo Orders (Fase 1b)
- Módulo Prices (Fase 1b)
- Integración AFIP para validación de CUIT
- MinIO en docker-compose para dev
- Tests unitarios de UsersService y StockService

---

## [0.0.1] - 2026-04-09

### Decisiones Tomadas

- **Estructura del proyecto:** Monorepo con documentacion + scaffold de codigo. Todo centralizado en `~/Documents/ObraYa/`.
- **Enfoque inicial:** Organizar toda la documentacion y arquitectura antes de escribir codigo.
- **Tipo de scaffold:** Docs completos + estructura de carpetas de codigo sin implementacion, para visualizar la arquitectura desde el dia 1.
- **Ubicacion:** `~/Documents/ObraYa/` como carpeta raiz del proyecto.
- **Herramienta de iteracion:** El proyecto esta preparado para trabajar con Claude Code via `CLAUDE.md` en la raiz.

### Agregado

- Estructura de carpetas completa: `docs/`, `packages/`, `infra/`, `tools/`
- Plan tecnico original (`docs/plan-tecnico/`)
- README principal del proyecto
- CLAUDE.md para contexto de Claude Code
- ADR-001: Eleccion de stack tecnologico
- Scaffold de codigo: backend (NestJS), frontend (Next.js), mobile (React Native)
- Specs iniciales del MVP Backoffice

### Pendiente

- Definir identidad visual (logo, paleta, design system)
- Validar modelo con fabricantes ancla
- Detallar API contracts del backoffice
- Schema de base de datos PostgreSQL
- Configuracion de CI/CD (GitHub Actions)

---

## Formato

Cada entrada sigue:
```
## [version] - YYYY-MM-DD
### Decisiones Tomadas
### Agregado / Cambiado / Eliminado
### Pendiente
```
