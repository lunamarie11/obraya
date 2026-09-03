# ADR-004: Historial de "Mis pedidos" del comprador sin entidad Buyer

**Estado:** Reemplazado por ADR-006 (2026-08-31)
**Fecha:** 2026-08-31
**Decidido por:** Fundadores ObraYa

> **Actualizacion 2026-08-31:** este ADR queda reemplazado por
> [ADR-006](./ADR-006-cuenta-comprador-real.md), que implementa la entidad `Buyer` real
> anticipada en la seccion "Consecuencias" de este documento. `/my-orders` y el checkout
> ya no usan `localStorage`/`GET /orders/:id`: consumen `GET /buyer-orders` y
> `POST /buyer-orders` autenticados con JWT de `Buyer`. Se conserva este documento como
> registro historico de la decision intermedia.

## Contexto

El tab "Pedidos" del bottom nav (`BottomTabBar`) apuntaba a `/order-confirmation` como
placeholder (ver `Pendiente` del CHANGELOG 0.4.0: *"Listado real de 'Mis pedidos'"*).
No existe ningún listado real de pedidos para el comprador.

Investigando el backend actual (`packages/backend/src/modules/orders/`) se confirmó:

- `Order.buyerId` es un string libre, con el comentario explícito *"ID del comprador
  (usuario del marketplace, entidad Buyer en Fase 2)"* — no hay entidad `Buyer`.
- No existe ningún sistema de login/registro para compradores finales. El único login
  disponible es el de usuarios de empresa (`CompanyUser`, roles Admin/Vendedor/
  Logistica/Contabilidad), y el checkout del marketplace ya depende de esa sesión
  (ver ADR-003: *"Guest checkout no se habilita en este pase"*).
- `OrdersController` tiene `@UseGuards(JwtAuthGuard, RolesGuard)` a nivel de clase:
  todas las rutas, incluida `GET /orders/:id`, requieren JWT válido.
- `OrdersService.findOne(id, companyId)` y `.create(companyId, buyerId, dto)` usan el
  `companyId` del usuario logueado tanto para crear como para volver a leer el pedido
  — es decir, ya funciona como un historial "por sesión", solo que hoy únicamente
  expone el último pedido vía `orderId` en la URL de `order-confirmation`.

Construir una entidad `Buyer` real (registro/login propio, JWT con rol `Buyer`,
migración de `Order.buyerId` de texto libre a FK) es la solución correcta a largo
plazo, pero es un cambio de arquitectura grande (nueva tabla, nuevo flujo de auth,
coordinación con `buyerEmail`/`buyerName` como texto libre en el resto del sistema).
Se evaluó con el equipo y se decidió no abordarlo en este pase.

## Decisión

Implementar un historial de pedidos **liviano, sin cambios de backend ni de modelo de
datos**:

- El frontend guarda en `localStorage` (`lib/orders.ts`, mismo patrón que `lib/cart.ts`)
  la lista de `orderId` generados por el propio navegador al completar un checkout.
- `/my-orders` lista esos pedidos consultando `GET /orders/:id` (ya usado por
  `order-confirmation`) para cada uno. Se usa el prefijo `my-` porque `/orders` ya
  esta tomado por el listado de pedidos del backoffice del vendedor
  (`app/(backoffice)/orders`, un route group no cambia la URL).
- `/my-orders/:id` reutiliza `OrderStatusStepper` para el tracking y agrega "Repetir
  pedido" (vuelve a cargar los items al carrito).
- No se toca `OrdersController`, `OrdersService` ni ninguna guard existente.

## Justificación

- Cero riesgo sobre el backend: no hay migración ni endpoint nuevo.
- Se puede shippear en el día, desbloqueando el "Pendiente" más visible del rediseño
  de comprador sin esperar a la entidad `Buyer`.
- Es aditivo: el día que exista `Buyer` real, `/my-orders` y `/my-orders/:id` pasan a pedir
  `GET /my-orders` (o equivalente) en vez de leer `localStorage`, sin cambiar el
  diseño visual.

## Consecuencias

- **Historial atado al dispositivo/navegador**: un comprador que compra desde el
  celular y después entra desde la compu no ve el mismo historial. Se acepta como
  limitación conocida de este pase.
- Sigue dependiendo de que el visitante tenga una sesión válida de `CompanyUser`
  (típicamente la cuenta demo `buyer@obraya.com`, ver `DemoCredentials.tsx`) para que
  `GET /orders/:id` no devuelva 401 — la misma precondición que ya tenía
  `order-confirmation`. No se resuelve el guest checkout en este pase.
- Si el usuario borra el `localStorage` o cambia de navegador, pierde el historial
  visible (el pedido sigue existiendo en la base, solo deja de listarse localmente).
- Este ADR queda superado el día que se implemente la entidad `Buyer` real (ver
  comentario en `order.entity.ts`); en ese momento debe migrarse `/my-orders` a consumir
  el endpoint autenticado por comprador y este documento debe marcarse como
  reemplazado.

## Riesgos

- Bajo. El único riesgo es que el historial "desaparezca" para el usuario al cambiar
  de dispositivo, lo cual se comunica en la UI de `/my-orders` cuando la lista está vacía.
