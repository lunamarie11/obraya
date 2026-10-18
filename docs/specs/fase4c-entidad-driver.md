# Spec: Perfil de repartidor — entidad `Driver` (Fase 4c)

**Modulo:** Logistica / Backoffice (roles `Admin`, `Logistica`)
**Prioridad:** Fase 4 (post-lanzamiento), sub-fase 4c
**Estado:** Propuesta (sin implementar — pendiente de aprobacion)
**Ultima actualizacion:** 2026-10-18

---

## Objetivo

Resolver la limitacion anotada en ADR-017 y en `docs/roadmap-estado-actual.md`:
*"no hay entidad `Driver` separada, se sigue usando el rol `Logistica` como
repartidor"*. El propio ADR-017 dice por que no se creo antes: *"no hay hoy
ningun atributo propio de repartidor (vehiculo, licencia, etc.) que justifique
el modelo separado"*. Esta spec agrega esos atributos (vehiculo, telefono,
disponibilidad) y, con ellos, la entidad que los contiene.

## Decision de diseno (a confirmar antes de implementar)

**`Driver` es un perfil 1:1 que extiende `CompanyUser`, no una identidad
nueva.** La PK de `Driver` es `companyUserId` (mismo patron que
`DriverLocation`, ver ADR-018). El repartidor sigue logueandose como
`CompanyUser` con rol `Logistica`; `Driver` solo guarda los datos que
`CompanyUser` no tiene.

Se descarta la alternativa de una identidad de repartidor completamente
separada (con su propio login, al estilo `Buyer` de ADR-006) porque:
- Los repartidores internos siempre son empleados de la empresa fabricante/
  distribuidora, que ya tienen que loguearse al backoffice para ver
  `/delivery` — no hay un caso de uso hoy de repartidor sin cuenta de
  `CompanyUser`.
- Transportistas externos (Andreani, OCA — Fase 4d) no se van a modelar como
  filas de `Driver`: esa integracion es contra una API externa, no contra un
  usuario que loguea en ObraYa. Crear `Driver` como identidad separada no
  ayuda a ese caso futuro, asi que no vale la pena pagar ese costo hoy.

**Si no estas de acuerdo con este punto, el resto de la spec cambia** (habria
que decidir login propio, JWT propio, flujo de alta, etc. — mucho mas grande
que lo que sigue). Confirmar esto antes de seguir.

## Que ya existe (no reimplementar)

- Rol `Logistica` de `CompanyUser` como "repartidor" (ADR-017).
- `Order.assignedDriverId` / `assignedAt`, `POST /orders/:id/claim`, `PUT
  /orders/:id/unassign` (ADR-017, Fase 4a). Siguen apuntando a
  `company_users.id` — no cambian.
- `DriverLocation` (modulo `logistics`, ADR-018, Fase 4b) — ultima posicion
  conocida, tambien PK = `companyUserId`.
- `/delivery` (cola de pedidos del repartidor), `/delivery/map` (mapa para
  Admin/Logistica), `/settings` (Admin: lista de `CompanyUser`s de la
  empresa + invitacion + config de zonas, ver ADR-016).

## Explicitamente fuera de alcance de esta sub-fase

- Transportistas externos / integracion con Andreani, OCA (Fase 4d).
- Ruteo optimizado, capacidad de carga por vehiculo, Google Maps (Fase 4e).
- Historial de disponibilidad (cuando se prendio/apago) — solo se guarda el
  estado actual, igual criterio que `DriverLocation` (ultima fila, no trail).
- Documentacion/verificacion de licencia de conducir (upload de foto, 
  vencimiento) — queda como posible extension futura si aparece el caso de
  uso, no se construye especulativamente.
- Cambiar quien puede ser `Logistica` o el flujo de invitacion existente.

## Modelo de datos

### `Driver` (entidad nueva, modulo `logistics`)

| Campo | Tipo | Notas |
|---|---|---|
| `companyUserId` | `uuid`, PK | FK a `company_users.id`, `ON DELETE CASCADE`. Un perfil por repartidor. |
| `companyId` | `uuid` | Denormalizado, mismo criterio que `DriverLocation` (scope por empresa sin join extra). |
| `vehicleType` | `enum`, nullable | `Moto \| Auto \| Camioneta \| Bicicleta \| APie`. Nullable: el repartidor puede no haber completado su perfil todavia. |
| `licensePlate` | `varchar(10)`, nullable | Patente. Sin validacion de formato (AR no tiene un unico formato vigente entre patentes viejas/Mercosur) — texto libre. |
| `phone` | `varchar(20)`, nullable | Contacto del repartidor (no existe hoy en `CompanyUser`). |
| `isAvailable` | `boolean`, default `true` | "Disponible para recibir pedidos". Default `true` para no bloquear a nadie con la migracion. |
| `createdAt` | `timestamptz` | |
| `updatedAt` | `timestamptz` | |

**Creacion perezosa (lazy):** no se crea una fila al invitar/crear un
`CompanyUser` con rol `Logistica`. Se crea (upsert) la primera vez que el
repartidor guarda su perfil (`PUT /logistics/drivers/me`) o togglea
disponibilidad (`PUT /logistics/drivers/me/availability`). `GET
/logistics/drivers/me` sobre un repartidor sin fila devuelve un objeto con
`vehicleType/licensePlate/phone: null` e `isAvailable: true` (el default),
sin crear la fila solo por leer.

## Endpoints nuevos (modulo `logistics`)

### `GET /logistics/drivers/me`

- Roles: `LOGISTICA`.
- Devuelve el perfil del usuario autenticado (o los defaults si no tiene fila
  todavia, ver arriba).

### `PUT /logistics/drivers/me`

- Roles: `LOGISTICA`.
- Body: `{ vehicleType?, licensePlate?, phone? }`. Upsert sobre
  `companyUserId = user.id`. No permite tocar `isAvailable` (endpoint
  separado, ver abajo) para que el toggle rapido no dependa de mandar el
  resto de los campos.

### `PUT /logistics/drivers/me/availability`

- Roles: `LOGISTICA`.
- Body: `{ isAvailable: boolean }`. Upsert igual que el anterior, endpoint
  chico separado porque se llama mucho mas seguido (un switch) que la edicion
  de perfil.

### `GET /logistics/drivers`

- Roles: `ADMIN`.
- Lista los repartidores de la empresa (`CompanyUser` con `role=Logistica`,
  `isActive=true`) con su perfil (`LEFT JOIN` contra `Driver` — un
  `CompanyUser` sin fila en `Driver` aparece con los campos en default/null,
  no se excluye de la lista).
- Respuesta por item: `{ companyUserId, firstName, lastName, email,
  vehicleType, licensePlate, phone, isAvailable }`.

## Regla de negocio: disponibilidad bloquea el claim

`OrdersService.claimOrder()` (Fase 4a) gana una validacion adicional: antes
del `UPDATE` atomico, se consulta `Driver.isAvailable` para `userId`. Si existe
una fila y `isAvailable === false` → `403 Forbidden` ("Marcate disponible
para tomar pedidos antes de reclamar uno"). Si no existe fila, se trata como
`true` (default) — no rompe a repartidores que nunca tocaron su perfil.

Implementacion: `LogisticsModule` expone un metodo (`DriversService` o
metodo publico del `LogisticsService` existente) inyectado en
`OrdersModule`, mismo patron de comunicacion entre modulos por DI que
`OrdersService.findActiveAssignments()` usa hoy en sentido inverso (ver
ADR-018) — no se accede al repositorio de `Driver` directamente desde
`orders`.

`PUT /orders/:id/unassign` y la transicion a `Entregado` **no** chequean
disponibilidad (un repartidor puede entregar o liberar un pedido que ya tenia
asignado aunque despues se haya marcado no disponible).

## Frontend

### `/delivery` (repartidor)

- Nueva tarjeta/panel arriba de la lista de pedidos: switch "Disponible para
  recibir pedidos" (llama `PUT /logistics/drivers/me/availability`,
  invalida la query de perfil) y, debajo, un formulario chico colapsable
  para `vehicleType` (select) / `licensePlate` / `phone` (llama `PUT
  /logistics/drivers/me`).
- Si `isAvailable === false`: la lista "Disponibles" (`unassigned=true`)
  se sigue mostrando igual (otros repartidores disponibles la siguen viendo
  normal), pero el boton "Tomar pedido" para este usuario muestra un tooltip/
  mensaje "Marcate disponible para tomar pedidos" en vez de llamar al
  backend directamente — evita el roundtrip inutil al 403, aunque el backend
  igual lo bloquea si se intenta de otra forma.

### `/settings` (Admin)

- La tabla existente de usuarios de la empresa (ver
  `src/app/(backoffice)/settings/page.tsx`) agrega columnas `Vehiculo` /
  `Patente` / `Disponible` **solo para filas con rol `Logistica`** (el resto
  de los roles no tiene perfil de `Driver`, se muestra `—`). Fuente: `GET
  /logistics/drivers`, cruzado por `companyUserId` con la lista de usuarios
  que ya se pedia ahi. No es una pantalla nueva — se extiende la que ya
  existe, mismo criterio que ADR-016 (zonas de entrega) uso para no crear una
  pantalla de admin nueva por cada feature chica.

## Migracion

Tabla nueva `drivers`, sin tocar `orders` ni `company_users`. No hay
backfill: todas las filas se crean lazy la primera vez que cada repartidor
toca su perfil o el toggle.

## Decisiones documentadas

- ADR-019 (a crear junto con la implementacion, mismo criterio que ADR-017/
  018): por que `Driver` es un perfil 1:1 de `CompanyUser` y no una identidad
  separada, y por que la disponibilidad bloquea `claim` pero no
  `unassign`/`Entregado`.
