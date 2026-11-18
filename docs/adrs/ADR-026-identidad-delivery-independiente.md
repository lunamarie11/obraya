# ADR-026: Identidad `Delivery` independiente con registro publico (reemplaza el alcance de ADR-019)

**Estado:** Aceptado
**Fecha:** 2026-11-18
**Decidido por:** Fundadores ObraYa

## Contexto

ADR-019 decidio que el repartidor NO es una identidad separada: es un perfil
`Driver` 1:1 de un `CompanyUser` con rol `Logistica`, invitado por el Admin
de una empresa fabricante/distribuidora. La justificacion fue que "los
repartidores internos siempre son empleados de la empresa... un `Driver` con
identidad propia no ayuda a ningun caso de uso actual".

Ese razonamiento asumia reparto **interno** (empleado de UNA empresa que
reparte SUS pedidos). El modelo de negocio real que se pidio ahora es otro:
un repartidor tipo PedidosYa/Rappi que se registra solo desde la landing,
no es empleado de ningun fabricante, y puede entregar pedidos de
**cualquier** comercio del marketplace. Ese caso de uso no existia cuando se
escribio ADR-019 y rompe su invariante central (reparto limitado a la propia
empresa, ver `OrdersService.claimOrder`: `WHERE company_id = :companyId`).

## Decision

1. **`Delivery` es una identidad nueva, separada, con login propio** (mismo
   patron que `Buyer`, ver ADR-006): tabla propia (`deliveries`), JWT propio
   (estrategia `'jwt-delivery'`), sin FK a ninguna `Company`. Se registra
   publicamente desde la landing con datos personales + tipo de vehiculo
   (reusa el enum `VehicleType` de `logistics/entities/driver.entity.ts`,
   son los mismos 5 valores).

2. **El modelo `Driver` de ADR-019 NO se elimina.** Sigue existiendo para
   empresas que prefieren tener repartidores propios (empleados que ya se
   loguean al backoffice como `CompanyUser`/`Logistica`). Ambos modelos
   convinen: un pedido puede ser reclamado por un repartidor interno
   (`assignedDriverId`, scope = su empresa) O por un repartidor independiente
   (`assignedDeliveryId`, scope = todo el marketplace), nunca ambos a la vez.

3. **Nuevas columnas en `Order`, aditivas:** `assignedDeliveryId` (uuid,
   nullable, FK a `deliveries.id` ON DELETE SET NULL) y
   `assignedDeliveryAt` (timestamptz, nullable). No se toca
   `assignedDriverId`/`assignedAt` existentes.

4. **Exclusion mutua vía el UPDATE atomico existente.** Se agrega
   `AND assigned_delivery_id IS NULL` al WHERE de `claimOrder()` (repartidor
   interno) para que no pueda tomar un pedido ya tomado por un delivery
   independiente. El nuevo `claimOrderForDelivery()` espeja la misma
   tecnica: `AND assigned_driver_id IS NULL AND assigned_delivery_id IS
   NULL`, pero **sin** filtro de `company_id` (busca en toda la plataforma).

5. **Nuevo controller `DeliveryOrdersController`** (`/delivery-orders/*`),
   protegido por `DeliveryJwtAuthGuard`, separado de `OrdersController`
   (backoffice) y `BuyerOrdersController` (comprador) para no tocar sus
   guards/rutas existentes — mismo criterio que ya se uso para separar
   `BuyerOrdersController`.

6. **Sin empresa, sin `isAvailable` bloqueante por ahora.** A diferencia de
   `Driver` (que bloquea `claim` si `isAvailable=false`, ver fase4c), el
   delivery independiente arranca siempre disponible; el toggle de
   disponibilidad se puede agregar en una iteracion futura si hace falta
   (no se construye especulativamente, ver CLAUDE.md).

## Justificacion

- Reusar el patron `Buyer` (identidad propia, JWT propio, registro publico)
  es el camino de menor riesgo: ya esta probado en produccion y no requiere
  tocar la autenticacion de `CompanyUser`.
- Mantener `assignedDriverId` intacto y agregar `assignedDeliveryId` en
  paralelo evita modificar ninguna ruta/logica de reparto interno ya en
  produccion (los fabricantes que ya usan repartidores propios, ej.
  Certezza en el futuro, no se ven afectados).
- La decision de permitir reparto marketplace-wide (sin scope de empresa)
  para `Delivery` es intencional: el comprador elige el comercio, pero
  cualquier repartidor de la plataforma puede entregar ese pedido — asi lo
  describio el negocio explicitamente.

## Consecuencias

- Quedan DOS sistemas de reparto coexistiendo (`Driver` interno vs
  `Delivery` independiente). Si en el futuro se decide que todo el reparto
  pasa a ser marketplace-wide, se podria deprecar `Driver`/`assignedDriverId`
  en un ADR posterior — no se hace ahora porque hay logica productiva
  (fase4a/b/c) que depende de el.
- `Delivery` no tiene toggle de disponibilidad, comision, ni ruteo
  (ADR-022) todavia — queda como deuda tecnica conocida para una fase
  siguiente si el volumen de delivery independiente lo justifica.
