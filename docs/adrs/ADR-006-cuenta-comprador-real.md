# ADR-006: Cuenta de comprador real (entidad Buyer)

**Estado:** Aceptado
**Fecha:** 2026-08-31
**Decidido por:** Fundadores ObraYa

## Contexto

`docs/specs/marketplace-comprador.md` (#2) marca "Cuenta de comprador real" como el
siguiente item del backlog, con la nota explícita de que requiere su propio ADR antes
de empezar por ser un cambio de arquitectura grande.

Investigando el flujo de compra actual se confirmó que es más limitado de lo que
`ADR-004` documentaba:

- `OrdersController` tiene `@UseGuards(JwtAuthGuard, RolesGuard)` a nivel de clase,
  usando el JWT de `CompanyUser` (usuario de empresa/fabricante) — el único sistema de
  login que existe.
- `POST /orders` crea el pedido con `companyId = user.companyId` y
  `buyerId = user.id`, es decir, usa la propia empresa del usuario logueado como
  `companyId` del pedido, **no** la del fabricante cuyo catálogo se está comprando. El
  carrito (`lib/cart.ts`) tampoco distingue a qué fabricante pertenece cada producto.
- En la práctica, esto solo "funciona" hoy porque la demo usa la cuenta
  `buyer@obraya.com` con rol `Vendedor` de una empresa fija (ver `DemoCredentials.tsx` /
  `profile.tsx` de mobile) — no hay ningún concepto real de comprador en el backend.
- `Order.buyerId` ya tiene el comentario `"ID del comprador (usuario del marketplace,
  entidad Buyer en Fase 2)"` desde que se creó la entidad.
- `ADR-004` documentó el historial de "Mis pedidos" como una solución liviana
  (`localStorage`) explícitamente **hasta que exista `Buyer`**, dejando dicho que ese
  día `/my-orders` debe migrar a un endpoint autenticado por comprador.

## Decisión

### Modelo de datos

Nueva entidad `Buyer` (tabla `buyers`, módulo nuevo `packages/backend/src/modules/buyers/`),
desacoplada de `CompanyUser`:

- `id` (uuid), `email` (unique), `passwordHash`, `firstName`, `lastName`,
  `phone` (nullable), `isActive`, `createdAt`, `updatedAt`.
- Mismo patrón de hashing que `CompanyUser` (`bcrypt`, 12 rounds).
- `Order.buyerId` sigue siendo un `varchar` sin FK a nivel de base de datos (igual que
  hoy con `CompanyUser.id`) — no se agrega constraint dura para no arriesgar los pedidos
  demo ya sembrados que hoy tienen `buyerId` de un `CompanyUser`. Es una referencia
  "blanda", documentada en el entity, igual que ya estaba.
- Sin migración manual: el proyecto usa `synchronize: true` en desarrollo
  (`database.module.ts`), TypeORM crea la tabla sola al levantar el backend.

### Autenticación

Sistema de JWT completamente separado del de `CompanyUser`, para no tocar guards ni
rutas existentes del backoffice:

- `BuyerJwtStrategy` registrada con nombre `'jwt-buyer'` (vs `'jwt'` de `CompanyUser`),
  reutiliza el mismo `jwt.secret` de configuración (no se justifica un secreto nuevo
  para este pase).
- `BuyerJwtAuthGuard extends AuthGuard('jwt-buyer')`.
- `BuyerAuthController` (prefijo `/buyer-auth`, separado de `/auth` que ya usan las
  empresas):
  - `POST /buyer-auth/register` — nombre, apellido, email, password (sin verificación
    de email en este pase, igual de fricción que el registro de empresas actual).
  - `POST /buyer-auth/login`
  - `POST /buyer-auth/refresh`
  - `POST /buyer-auth/demo` — mismo mecanismo que `/auth/demo` (gateado por
    `ENABLE_DEMO`/`DEMO_SECRET`), con una cuenta demo `comprador@obraya.com` sembrada
    para reemplazar el uso de `buyer@obraya.com` (que sigue existiendo pero ya no debe
    usarse desde el flujo de comprador).

### Checkout: cuenta obligatoria

Para comprar hace falta estar logueado como `Buyer` (no se habilita guest checkout en
este pase, misma decisión que ya tomaba `ADR-003`, ahora con un mecanismo real para
resolverla). El botón "Ingresar" del marketplace deja de apuntar al login de empresas.

### Checkout: pedido correcto por fabricante

El carrito (`lib/cart.ts` en frontend y mobile) ahora guarda `companyId` por ítem
(ya disponible en `PublicProduct.companyId`). Al confirmar el checkout, el frontend
agrupa el carrito por `companyId` y hace **un `POST /buyer-orders` por fabricante**
(dirección de entrega y método de pago son los mismos para todos los grupos, se
reusan; lo único que cambia es qué ítems y qué `companyId` viaja en cada request).
`order-confirmation` pasa a aceptar una lista de `orderIds` y muestra un tracker por
pedido creado.

`CreateOrderDto` gana un campo `companyId` obligatorio (antes lo tomaba del JWT de la
empresa logueada, que ya no aplica).

### Endpoints de pedidos del comprador

Se agrega `BuyerOrdersController` (prefijo `/buyer-orders`, guardado con
`BuyerJwtAuthGuard`), sin tocar el `OrdersController` existente (que sigue siendo el
del backoffice del vendedor, sin cambios de comportamiento):

- `POST /buyer-orders` — crea un pedido para el fabricante indicado en el body.
- `GET /buyer-orders` — lista los pedidos del comprador logueado (todas las empresas).
- `GET /buyer-orders/:id` — detalle de un pedido propio.

`/my-orders` y `/my-orders/:id` del frontend/mobile dejan de resolver contra
`localStorage` + `GET /orders/:id` (mecanismo de `ADR-004`) y pasan a usar
`GET /buyer-orders` / `GET /buyer-orders/:id`. **`ADR-004` queda reemplazado por este
documento** (se actualiza su estado).

## Justificación

- Reutiliza el mismo patrón de auth que ya existe para `CompanyUser` (misma librería,
  mismo estilo de guard/strategy/controller), minimizando piezas nuevas.
- Separar `BuyerJwtStrategy`/`BuyerJwtAuthGuard` de `JwtAuthGuard` evita tocar ninguna
  ruta ni guard del backoffice — el riesgo de regresión sobre Fase 1 es cercano a cero.
- Agrupar el carrito por `companyId` en el momento del checkout resuelve el bug de
  fondo (pedidos atados a la empresa del usuario logueado en vez de al fabricante
  vendedor) sin necesitar restringir el carrito a un solo fabricante a la vez.
- No se agrega verificación de email en este pase: mismo estándar de fricción que ya
  se acepta hoy para el registro de empresas (`RegisterCompanyDto`), y es aditivo
  agregarla después sin romper el modelo de datos.

## Consecuencias

- El botón "Perfil" del `BottomTabBar` (web) y la pestaña "Perfil" del mobile pasan a
  manejar una sesión de `Buyer`, separada de la sesión de `CompanyUser` que ya
  gestionaban `/login` y `DemoCredentials.tsx`. Un mismo navegador puede tener ambas
  sesiones activas en simultáneo (localStorage keys distintas), pensado para que los
  fundadores puedan seguir probando el backoffice y el marketplace sin pisarse.
- Favoritos y libreta de direcciones (backlog #3 y #4) ya tienen sobre qué anclarse
  (`buyerId` real) si más adelante se decide guardarlos server-side en vez de
  `localStorage`.
- Checkout con carrito multi-fabricante genera N pedidos en una sola confirmación —
  `order-confirmation` y el mail/notificación (cuando exista) deben pensarse como
  "N confirmaciones", no una sola. Se acepta como el comportamiento correcto de un
  marketplace multi-vendor real.
- `Order.buyerId` sigue sin FK dura a nivel de base de datos — si en el futuro se
  quiere integridad referencial real, hace falta una migración explícita que limpie
  los `buyerId` huérfanos de la demo actual.

## Riesgos

- **Bajo-medio**: dos sistemas de JWT en paralelo (`'jwt'` y `'jwt-buyer'`) sobre el
  mismo secreto de configuración. Mientras el payload incluya un discriminador propio
  de cada estrategia (cada una resuelve contra su propio repositorio — `CompanyUser` vs
  `Buyer` — por `sub`), no hay colisión real, pero es una superficie de auth más grande
  para mantener a futuro.
- **Bajo**: `synchronize: true` crea la tabla `buyers` sola en desarrollo; en el momento
  que se pase a usar migraciones reales (mencionado como pendiente en `ADR-005`/CHANGELOG),
  hay que escribir la migración inicial de esta tabla a mano.
