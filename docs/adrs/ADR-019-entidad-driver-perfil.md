# ADR-019: Entidad `Driver` como perfil 1:1 de repartidor (Fase 4c)

**Estado:** Aceptado
**Fecha:** 2026-10-18
**Decidido por:** Fundadores ObraYa

## Contexto

ADR-017 (Fase 4a, asignacion de pedidos) dejo anotado como limitacion
conocida: *"no hay entidad `Driver` separada, se sigue usando el rol
`Logistica` como repartidor"*, y explico por que no se construyo en ese
momento: *"no hay hoy ningun atributo propio de repartidor (vehiculo,
licencia, etc.) que justifique el modelo separado"*.

`docs/roadmap-estado-actual.md` seguia listando este punto como gap de
Fase 4. Esta spec (`docs/specs/fase4c-entidad-driver.md`) agrega los
primeros atributos propios de repartidor (tipo de vehiculo, patente,
telefono, disponibilidad) y, con ellos, la entidad que los contiene.

## Decision

1. **`Driver` es un perfil 1:1 que extiende `CompanyUser`, no una identidad
   nueva.** La PK de `Driver` es `companyUserId` (mismo patron que
   `DriverLocation`, ver ADR-018), con FK a `company_users.id` `ON DELETE
   CASCADE`. El repartidor sigue logueandose como `CompanyUser` con rol
   `Logistica`; `Driver` solo guarda los datos que `CompanyUser` no tiene.

   Se descarta la alternativa de una identidad de repartidor completamente
   separada (con login propio, al estilo `Buyer` de ADR-006) porque los
   repartidores internos siempre son empleados de la empresa fabricante/
   distribuidora que ya tienen que loguearse al backoffice para ver
   `/delivery`, y porque los transportistas externos (Andreani, OCA — Fase
   4d) se integran contra una API externa, no contra un usuario que loguea
   en ObraYa — un `Driver` con identidad propia no ayuda a ese caso futuro.

2. **Creacion perezosa (lazy/upsert), sin fila al invitar un `CompanyUser`
   con rol `Logistica`.** La fila se crea la primera vez que el repartidor
   guarda su perfil o togglea disponibilidad. Leer el perfil de un
   repartidor sin fila devuelve los defaults (`vehicleType/licensePlate/
   phone: null`, `isAvailable: true`) sin crear la fila solo por leer.
   Mismo criterio que `DriverLocation` (ADR-018).

3. **Sin historial de disponibilidad.** Se guarda solo el estado actual
   (una fila por repartidor), no un trail de cuando se prendio/apago.
   Mismo criterio que ADR-017/018 de no construir especulativamente una
   tabla de historial sin caso de uso real hoy.

4. **La disponibilidad bloquea `claim`, no `unassign`/`Entregado`.**
   `OrdersService.claimOrder()` consulta `DriversService.isAvailable()`
   antes del `UPDATE` atomico existente (ADR-017) y responde `403` si el
   repartidor se marco no disponible. Si no tiene fila en `Driver`, se
   trata como disponible (`true`, el default) para no bloquear a nadie que
   nunca toco su perfil. `unassign` y la transicion a `Entregado` no
   chequean disponibilidad: un repartidor puede liberar o entregar un
   pedido que ya tenia asignado aunque despues se haya marcado no
   disponible.

5. **Comunicacion entre modulos via DI con `forwardRef`, no acceso directo
   a repositorios.** `OrdersModule` ya importaba `LogisticsModule` en
   sentido inverso para `findActiveAssignments` (ADR-018); ahora
   `LogisticsModule` tambien necesita `OrdersModule`... en realidad el caso
   nuevo es al reves: `OrdersService` necesita `DriversService` (de
   `LogisticsModule`), que ya depende de `OrdersModule`. Para resolver el
   ciclo sin acoplar los modulos por acceso directo a repositorios, ambos
   `@Module({ imports })` usan `forwardRef(() => X)` y la inyeccion en el
   constructor de `OrdersService` usa `@Inject(forwardRef(() =>
   DriversService))`. Se respeta la regla de `CLAUDE.md` de comunicacion
   entre modulos por inyeccion de dependencias, no HTTP/acceso a
   repositorios ajenos.

## Justificacion

- Agregar los atributos de repartidor directamente a `CompanyUser` hubiera
  mezclado datos de login/autenticacion con datos de logistica, y hubiera
  afectado a roles que no son repartidores (columnas siempre null para
  `Admin`/`Comprador`).
- Una identidad separada con login propio es mucho mas costosa (JWT propio,
  flujo de alta, migracion de `Order.assignedDriverId`) y no esta
  justificada por ningun caso de uso actual: los transportistas externos
  futuros (Fase 4d) no van a ser filas de `Driver`, van a ser una
  integracion contra una API externa.
- `forwardRef` en ambos sentidos es la solucion estandar de NestJS para
  dependencias circulares entre modulos cuando la alternativa (fusionar
  los modulos, o un tercer modulo compartido) agrega mas complejidad de la
  que resuelve para dos metodos de lectura puntuales.

## Consecuencias

- Nueva tabla `drivers` (migracion TypeORM), nuevo `DriversService` en el
  modulo `logistics`, 4 endpoints nuevos (`GET/PUT /logistics/drivers/me`,
  `PUT /logistics/drivers/me/availability`, `GET /logistics/drivers`).
- `OrdersModule` y `LogisticsModule` quedan con dependencia circular
  explicita via `forwardRef` en ambos sentidos — cualquier cambio futuro en
  cualquiera de los dos modulos debe tener en cuenta esto al tocar sus
  `imports`.
- `/delivery` gana un panel de disponibilidad/perfil; `/settings` (Admin)
  gana 3 columnas en la tabla de usuarios existente — no se crean pantallas
  nuevas, mismo criterio que ADR-016.

## Riesgos

- **Bajo**: la dependencia circular entre `OrdersModule` y
  `LogisticsModule` (ya existia una, ahora hay dos en sentidos opuestos)
  aumenta el acoplamiento entre ambos modulos. Si esto sigue creciendo,
  evaluar extraer un modulo compartido (ej. `FleetModule`) para romper el
  ciclo — no se justifica todavia con solo dos puntos de cruce.
- **Bajo**: el default `isAvailable: true` para repartidores sin fila
  significa que, si `DriversService.isAvailable()` tuviera un bug que
  devuelva `false` incorrectamente, un repartidor nuevo quedaria bloqueado
  de tomar pedidos sin haber tocado su perfil nunca — mitigado por el test
  explicito de ese caso en `drivers.service.spec.ts`.
