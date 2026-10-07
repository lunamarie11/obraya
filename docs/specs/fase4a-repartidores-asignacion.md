# Spec: Repartidores - Asignacion de pedidos (Fase 4a)

**Modulo:** Logistica / Backoffice (rol `Logistica`)
**Prioridad:** Fase 4 (post-lanzamiento), sub-fase 4a
**Estado:** En progreso
**Ultima actualizacion:** 2026-09-29

---

## Objetivo

Resolver el problema de concurrencia/propiedad del flujo de entrega actual: que un
pedido `Despachado` sea tomado por **un solo** repartidor a la vez, y que solo ese
repartidor pueda marcarlo como `Entregado`. Es la base minima para que el flujo de
reparto ya existente deje de ser "cualquiera ve y marca cualquier cosa" y pase a ser
"cada repartidor tiene su cola de pedidos asignados".

## Que ya existe (no reimplementar)

- Rutas de backoffice para el rol `Logistica`: `/delivery` (lista de pendientes +
  historial), `/delivery/[id]` (detalle de un pedido).
- `GET /orders?status=Despachado` y `GET /orders?status=Entregado` para listar.
- `PUT /orders/:id/status` (`OrdersController.updateStatus`, con
  `@Roles(ADMIN, LOGISTICA, VENDEDOR)`) para marcar `Entregado`, ya con la maquina de
  estados `VALID_TRANSITIONS` (`Despachado -> Entregado` es la unica transicion legal
  desde ese estado).
- Calculo de comision del repartidor: hoy `const COMMISSION = 0.08` hardcodeado y
  duplicado en `delivery/page.tsx` y `delivery/[id]/page.tsx`.
- Estado local `DeliveryStep` (`available|heading|arrived|picked|delivering|done`) en
  el frontend: es un timeline puramente cosmetico, no se persiste en el backend. Se
  mantiene igual en esta fase (fuera de alcance tocarlo).

**Limitaciones actuales que esta spec ataca puntualmente:**
- No existe el concepto de "quien tiene este pedido". Cualquier usuario `Logistica` de
  la empresa ve todos los `Despachado` y puede marcarlos `Entregado`.
- `takeOrder()` en el frontend es 100% local (`setActiveOrderId`), no llama al backend.
  Dos repartidores pueden "tomar" el mismo pedido en sus pantallas sin que el otro se
  entere, y ambos podrian terminar marcandolo entregado (la segunda llamada a
  `PUT /orders/:id/status` fallaria solo porque el estado ya cambio a `Entregado`, no
  porque el sistema sepa que no era su pedido).
- La comision es un numero hardcodeado en el frontend, no configurable por empresa.

## Modelo de datos

### `Order` (nuevas columnas)

| Campo | Tipo | Notas |
|---|---|---|
| `assignedDriverId` | `uuid`, nullable | FK a `company_users.id`. `NULL` = sin asignar. |
| `assignedAt` | `timestamptz`, nullable | Se completa al reclamar el pedido, se limpia al liberarlo. |

Sin FK dura del lado de `Order` hacia `CompanyUser` que bloquee el borrado de usuarios
(criterio ya usado en `Order.buyerId`, ver spec de marketplace-comprador): se usa
`ON DELETE SET NULL` para que si se borra/desactiva un `CompanyUser`, el pedido vuelve
a quedar disponible para otro repartidor en vez de romper la fila.

### `Company` (nueva columna)

| Campo | Tipo | Notas |
|---|---|---|
| `driverCommissionPercent` | `int`, default `8` | Reemplaza el `COMMISSION = 0.08` hardcodeado del frontend. Rango esperado 0-100. |

## Endpoints nuevos

### `POST /orders/:id/claim`

- Roles: `LOGISTICA`, `ADMIN`.
- Reclama un pedido `Despachado` sin asignar para el usuario autenticado.
- Update atomico y condicional para evitar la carrera entre dos repartidores:
  ```sql
  UPDATE orders SET assigned_driver_id = :userId, assigned_at = now()
  WHERE id = :id AND company_id = :companyId
    AND status = 'Despachado' AND assigned_driver_id IS NULL
  ```
  Implementado con `createQueryBuilder().update()` (no read-then-write), chequeando
  `affected`. Si `affected === 0`: pedido no existe, no es `Despachado`, o ya esta
  tomado por otro -> `409 Conflict` con mensaje "Este pedido ya fue tomado por otro
  repartidor" (no se distingue el motivo exacto para no filtrar quien lo tiene).

### `PUT /orders/:id/unassign`

- Roles: `LOGISTICA` (solo si es el dueno de la asignacion), `ADMIN` (siempre, como
  override para destrabar pedidos).
- Libera el pedido (`assignedDriverId = NULL`, `assignedAt = NULL`) sin cambiar su
  `status`. No aplica sobre pedidos ya `Entregado`.

### `GET /orders` (filtros nuevos en `OrderQueryDto`)

| Campo | Tipo | Notas |
|---|---|---|
| `unassigned` | `boolean`, opcional | `true` -> solo `Despachado` con `assignedDriverId IS NULL`. Reemplaza el listado actual "todos los Despachado" en la pantalla de disponibles. |
| `assignedToMe` | `boolean`, opcional | `true` -> solo pedidos con `assignedDriverId = user.id`. Usado para la cola personal del repartidor. |

Se resuelven contra `user.id` desde `@CurrentUser()` en el controller, no como
parametro libre (un repartidor no puede pedir la cola de otro).

## Regla de propiedad en `PUT /orders/:id/status`

Al transicionar a `Entregado`, si `user.role === LOGISTICA`, se exige
`order.assignedDriverId === user.id`; si no coincide -> `403 Forbidden` ("Este pedido
esta asignado a otro repartidor"). `ADMIN` y `VENDEDOR` mantienen el comportamiento
actual sin este chequeo (override administrativo, y `VENDEDOR` no participa del flujo
de reparto en la practica pero no se le retira el permiso existente).

## Frontend (`packages/frontend`, rutas `/delivery` y `/delivery/[id]`)

- `/delivery`: separar en dos queries -> "Disponibles" (`unassigned=true`) y "Mis
  pedidos" (`assignedToMe=true`). El boton "Tomar pedido" pasa a llamar
  `POST /orders/:id/claim` (mutation con invalidacion de ambas queries) en vez de
  `setActiveOrderId` local. Si el `claim` devuelve 409, mostrar el pedido como
  "ya tomado" y refrescar la lista de disponibles.
- `/delivery/[id]`: el boton "Confirmar entrega" solo se muestra si
  `order.assignedDriverId === user.id`; si el pedido esta asignado a otro repartidor,
  mostrar un estado informativo en vez del boton.
- Reemplazar `const COMMISSION = 0.08` en ambos archivos por
  `company.driverCommissionPercent` (requiere exponer ese campo en el endpoint que ya
  trae los datos de la empresa del usuario logueado, o en el propio `order` si se
  prefiere evitar un fetch extra).

## Explicitamente fuera de alcance de esta sub-fase

- Tracking en vivo / geolocalizacion del repartidor (Fase 4b).
- Integracion con transportistas externos (Andreani, OCA) (Fase 4c).
- Fleet management, ruteo optimizado con Google Maps (Fase 4d).
- Entidad `Driver` separada de `CompanyUser`: se sigue usando el rol `Logistica` de
  `CompanyUser` como "repartidor", sin crear un modelo nuevo.
- Cambios al timeline cosmetico `DeliveryStep` del frontend (heading/arrived/picked).

## Decisiones documentadas

- ADR-017 (a crear junto con esta spec): eleccion del update atomico
  condicional (`UPDATE ... WHERE assigned_driver_id IS NULL`) sobre un lock
  read-then-write, para evitar la carrera entre repartidores sin necesitar
  locks explicitos de fila ni una tabla de asignaciones separada.
