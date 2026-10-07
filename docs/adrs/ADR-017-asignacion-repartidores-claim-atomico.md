# ADR-017: Asignacion de pedidos a repartidores via claim atomico

**Estado:** Aceptado
**Fecha:** 2026-09-29
**Decidido por:** Fundadores ObraYa

## Contexto

El flujo de reparto actual (`/delivery`, `/delivery/[id]`, rol `Logistica`) lista
todos los pedidos `Despachado` de la empresa a cualquier usuario `Logistica`, y
cualquiera de ellos puede marcarlos `Entregado` via `PUT /orders/:id/status`. El
boton "Tomar pedido" del frontend (`takeOrder()`) solo cambia estado local
(`setActiveOrderId`), sin ningun efecto en el backend.

Esto genera un problema real de concurrencia: dos repartidores pueden "tomar" el
mismo pedido en sus pantallas sin que el sistema lo sepa, y ambos ven el boton para
marcarlo entregado. Es la base identificada para arrancar Fase 4 (logistica real,
ver `docs/roadmap-estado-actual.md`), sub-fase 4a, spec en
`docs/specs/fase4a-repartidores-asignacion.md`.

Se evaluaron tres formas de resolver la asignacion:

1. **Tabla `driver_assignments` separada** (historial de quien tomo/solto cada
   pedido).
2. **Lock explicito de fila** (`SELECT ... FOR UPDATE`) + logica de asignacion en
   la capa de aplicacion.
3. **Columnas `assignedDriverId`/`assignedAt` en `Order`** + update SQL atomico y
   condicional (`UPDATE ... WHERE assigned_driver_id IS NULL`).

## Decision

Se elige la opcion 3: agregar `assignedDriverId` (nullable, FK a
`company_users.id`, `ON DELETE SET NULL`) y `assignedAt` (nullable) directamente en
`Order`, y resolver el "tomar pedido" (`POST /orders/:id/claim`) con un único
`UPDATE` condicional:

```sql
UPDATE orders SET assigned_driver_id = :userId, assigned_at = now()
WHERE id = :id AND company_id = :companyId
  AND status = 'Despachado' AND assigned_driver_id IS NULL
```

usando `createQueryBuilder().update()` de TypeORM y chequeando `result.affected`. Si
`affected === 0`, se interpreta como "ya lo tomo otro" (o no existe / no esta
`Despachado`) y se responde `409 Conflict`, sin distinguir el motivo exacto.

`PUT /orders/:id/unassign` limpia ambos campos sin tocar `status`. La transicion a
`Entregado` (`PUT /orders/:id/status`) valida que, si el actor es `Logistica`,
`order.assignedDriverId === user.id`.

## Justificacion

- El `UPDATE` condicional es atomico a nivel de fila en Postgres sin necesitar un
  lock explicito ni una transaccion multi-statement: dos requests concurrentes de
  `claim` sobre el mismo pedido resuelven la carrera en la base, no en el codigo de
  la aplicacion (evita el patron read-then-write, que si tendria una ventana de
  carrera entre el `SELECT` y el `UPDATE`).
- Dos columnas nuevas en `Order` son mas simples que una tabla de asignaciones
  separada para lo que hoy se necesita (un pedido tiene a lo sumo un repartidor
  activo a la vez). Una tabla de historial de asignaciones queda abierta para el
  futuro si aparece un caso de uso real (ej. reportes de reasignaciones), no se
  construye especulativamente ahora.
- Reusa el rol `Logistica` de `CompanyUser` que ya existe como "repartidor", en vez
  de crear una entidad `Driver` nueva — no hay hoy ningun atributo propio de
  repartidor (vehiculo, licencia, etc.) que justifique el modelo separado.
- `ON DELETE SET NULL` en la FK evita que borrar/desactivar un usuario deje pedidos
  "huerfanos" bloqueados; el pedido simplemente vuelve a quedar disponible.

## Consecuencias

- `Order` gana dos columnas nullable; no rompe pedidos existentes (quedan con
  `assignedDriverId = NULL`, visibles como "disponibles").
- El frontend de `/delivery` deja de mostrar "todos los Despachado" como una sola
  lista: pasa a separar "Disponibles" (`unassigned=true`) de "Mis pedidos"
  (`assignedToMe=true`), y el boton "Tomar pedido" pasa a llamar al backend en vez
  de ser puramente local.
- La comision hardcodeada (`COMMISSION = 0.08`) se reemplaza por
  `Company.driverCommissionPercent` (default `8`), configurable a futuro sin
  redeploy del frontend.
- `ADMIN` mantiene override total (puede reclamar, liberar y marcar entregado
  cualquier pedido sin el chequeo de propiedad) para destrabar casos manuales.

## Riesgos

- **Bajo**: si dos requests de `claim` llegan practicamente al mismo tiempo, gana
  el que efectivamente ejecuta el `UPDATE` primero en Postgres; el otro recibe
  `409` de forma consistente — es el comportamiento esperado, no un riesgo real de
  doble asignacion.
- **Bajo**: `VENDEDOR` conserva el permiso existente de marcar `Entregado` sin
  chequeo de propiedad (no participa del flujo de reparto en la practica, pero no
  se le retira el rol por no ser parte del alcance de este cambio).
