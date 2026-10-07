# Spec: Tracking en vivo de repartidores (Fase 4b)

**Modulo:** Logistica / Backoffice (roles `Admin`, `Logistica`)
**Prioridad:** Fase 4 (post-lanzamiento), sub-fase 4b
**Estado:** En progreso
**Ultima actualizacion:** 2026-10-07

---

## Objetivo

Que `Admin`/`Logistica` puedan ver en un mapa donde esta, en tiempo
aproximado, cada repartidor que tiene un pedido `Despachado` asignado. Es la
continuacion directa de Fase 4a (asignacion de pedidos), que dejo esto
explicitamente fuera de alcance.

## Que ya existe (no reimplementar)

- Asignacion de pedidos (`POST /orders/:id/claim`, `PUT /orders/:id/unassign`,
  columnas `Order.assignedDriverId`/`assignedAt`, ver ADR-017).
- `/delivery` (rol `Logistica`): pantalla donde el repartidor ve sus pedidos
  disponibles/asignados, con polling cada 30s.
- Rol `Logistica` como concepto de "repartidor" (no hay entidad `Driver`
  separada, ver ADR-017 — se mantiene igual en esta sub-fase).

## Explicitamente fuera de alcance de esta sub-fase

- App mobile de repartidor con geolocalizacion en background (pantalla
  bloqueada). El reporte de posicion depende de que `/delivery` este
  abierto en el navegador (ver ADR-018).
- WebSockets / push verdadero — se usa polling REST (ver ADR-018).
- Historial/recorrido de la entrega (solo se guarda la ultima posicion
  conocida por repartidor, no un trail).
- Tracking visible para el comprador en `/my-orders`.
- Integracion con transportistas externos (Andreani, OCA) — Fase 4c.
- Ruteo optimizado con Google Maps — Fase 4d.

## Modelo de datos

### `DriverLocation` (entidad nueva, modulo `logistics`)

| Campo | Tipo | Notas |
|---|---|---|
| `companyUserId` | `uuid`, PK | FK a `company_users.id`, `ON DELETE CASCADE`. Un registro por repartidor (upsert), no historial (ver ADR-018). |
| `companyId` | `uuid` | Denormalizado para poder scopear la query por empresa sin join extra. |
| `lat` | `decimal(9,6)` | |
| `lng` | `decimal(9,6)` | |
| `accuracy` | `float`, nullable | Precision en metros reportada por `navigator.geolocation`. |
| `recordedAt` | `timestamptz` | Momento en que el navegador tomo la lectura (puede diferir levemente de `updatedAt`). |
| `updatedAt` | `timestamptz` | Momento en que el backend proceso el upsert. |

## Endpoints nuevos (modulo `logistics`)

### `PUT /logistics/location`

- Roles: `LOGISTICA`, `ADMIN`.
- Body: `{ lat, lng, accuracy?, recordedAt? }`.
- Upsert del registro del usuario autenticado (`companyUserId = user.id`).
  No valida que el usuario tenga un pedido asignado en este momento — esa
  regla se aplica del lado de la consulta (`GET /logistics/locations`), no
  al escribir. El frontend solo llama a este endpoint mientras hay un
  pedido activo (`isMine`), pero el backend no depende de esa disciplina
  del cliente para decidir que mostrar.

### `GET /logistics/locations`

- Roles: `LOGISTICA`, `ADMIN`.
- Devuelve la ultima posicion de cada repartidor de la empresa **que tiene
  un pedido `Despachado` asignado en este momento**: cruce entre
  `DriverLocation` (por `companyId`) y
  `OrdersService.findActiveAssignments(companyId)` (pedidos `Despachado`
  con `assignedDriverId` no nulo). Si un repartidor no tiene pedido activo,
  no aparece en la respuesta aunque tenga una fila en `DriverLocation`.
- Respuesta por item: `{ companyUserId, firstName, lastName, lat, lng,
  accuracy, recordedAt, orderId, orderNumber }`.

### `OrdersService.findActiveAssignments(companyId)` (metodo nuevo, no endpoint)

Lectura simple: `Despachado` + `assignedDriverId IS NOT NULL`, devuelve
`{ orderId, orderNumber, assignedDriverId }[]`. Usado solo por
`LogisticsService` via inyeccion de `OrdersModule` (comunicacion entre
modulos por DI, no acceso directo al repositorio de `Order` desde
`logistics`, ver `CLAUDE.md`).

## Frontend

### `/delivery` (reporte de posicion del propio repartidor)

- Mientras `isMine` (hay un pedido `Despachado` asignado al usuario
  actual), un efecto dispara `navigator.geolocation.watchPosition` y manda
  `PUT /logistics/location` con throttle (minimo ~15s entre envios).
- Si el usuario no tiene pedido activo, o revoca/niega el permiso del
  navegador, no se manda nada — no bloquea el resto del flujo (patron
  best-effort, igual que notificaciones push/email cuando falta
  configuracion).
- Se limpia (`clearWatch`) al desmontar o al dejar de tener pedido activo.

### `/delivery/map` (nueva, `Admin`/`Logistica`)

- Mapa Leaflet + tiles de OpenStreetMap, un marcador por repartidor activo.
- Datos via `GET /logistics/locations`, polling cada 15s
  (`refetchInterval`), mismo patron que el resto del backoffice.
- Si no hay repartidores activos, estado vacio ("Sin repartidores en ruta
  en este momento").
- Gate de rol client-side (si no es `Admin`/`Logistica`, redirect a
  `/dashboard`), agregado a `Sidebar.tsx` (nav para ambos roles).

## Decisiones documentadas

- ADR-018: origen del dato (Geolocation API del navegador, no app mobile),
  mecanismo de actualizacion (polling, no WebSockets), proveedor de mapas
  (Leaflet/OSM, no Google Maps) y criterio de visibilidad (solo
  repartidores con pedido activo, cruzando con `OrdersService`).
