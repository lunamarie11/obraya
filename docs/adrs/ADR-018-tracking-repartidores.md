# ADR-018: Tracking en vivo de repartidores (Fase 4b)

**Estado:** Aceptado
**Fecha:** 2026-10-07
**Decidido por:** Fundadores ObraYa

## Contexto

ADR-017/Fase 4a resolvio la asignacion de pedidos a repartidores (`claim`/
`unassign`), pero dejo explicitamente fuera de alcance el "tracking en vivo /
geolocalizacion del repartidor" (Fase 4b, ver
`docs/specs/fase4a-repartidores-asignacion.md`). Hoy no hay forma de saber
donde esta un repartidor que ya tiene un pedido asignado; `Admin`/`Logistica`
solo ven la direccion de entrega como texto.

Se partio de cero en tres frentes (investigado antes de disenar esto):

- No hay ninguna app mobile de repartidor (`packages/mobile` es solo
  comprador) ni geolocalizacion en background.
- No hay canal real-time en el backend (sin WebSockets/Socket.io/SSE, solo
  REST + polling, patron ya usado en `/delivery` con `refetchInterval`).
- No hay SDK de mapas instalado en ningun package, ni decision tomada mas
  alla de "Google Maps" mencionado como plan a futuro en ADRs anteriores
  (ADR-001, ADR-008, ADR-012).

## Decision

1. **Origen del dato de posicion: Geolocation API del navegador**, desde el
   propio backoffice web (`/delivery`), no una app mobile nueva. El
   repartidor ya usa esa pantalla para gestionar su entrega; se reusa la
   pestana abierta para mandar `PUT /logistics/location` periodicamente
   mientras tiene un pedido activo asignado (`isMine`). No cubre el caso de
   pantalla bloqueada/app en background — se acepta como limitacion
   conocida de este incremento.

2. **Un solo registro por repartidor (upsert), sin tabla de historial.**
   `DriverLocation` (nueva entidad en el modulo `logistics`, que hasta ahora
   era un stub vacio) tiene `companyUserId` como clave unica: cada reporte
   de posicion pisa el anterior. Sigue el mismo criterio que ADR-017 (no
   construir especulativamente una tabla de historial sin caso de uso real
   hoy). Si en el futuro se necesita un recorrido/replay de la entrega
   (ej. para disputas), se agrega entonces.

3. **Polling REST (10-15s), no WebSockets.** Mismo patron que ya usa
   `/delivery` (`refetchInterval: 30_000`). No se agrega Socket.io ni un
   adapter de Redis para multi-instancia: para "ver donde esta el camion"
   no hace falta push verdadero, y evita sumar una pieza de infraestructura
   nueva a operar en pre-seed.

4. **Leaflet + OpenStreetMap, no Google Maps**, para renderizar el mapa en
   el backoffice. Gratis y sin necesidad de dar de alta facturacion de
   Google Cloud en esta etapa. Esto no descarta Google Maps a futuro (sigue
   siendo la opcion planeada para ruteo optimizado, Fase 4d, que si
   necesita geocoding/routing de verdad) — es una decision acotada a "mostrar
   un punto en un mapa" para este incremento.

5. **Solo se trackea mientras hay un pedido activo asignado**, y el
   endpoint de consulta (`GET /logistics/locations`) solo devuelve
   repartidores con un pedido `Despachado` asignado a ellos en este
   momento (cruce con `OrdersService`, no solo con la ultima fila de
   `DriverLocation`). Un repartidor sin pedido activo deja de aparecer en
   el mapa aunque su ultima posicion reportada siga en la tabla — evita
   mostrar una posicion "vieja" de alguien que ya no esta repartiendo.

6. **Visible para `Admin` y `Logistica` en el backoffice, no para el
   comprador.** El tracking en el front de comprador (`/my-orders`) queda
   fuera de alcance de este incremento.

## Justificacion

- Construir una app mobile de repartidor con tracking en background es un
  desarrollo grande aparte (performance, permisos de SO, battery) que no se
  justifica todavia sin validar primero si el dato en si (posicion en vivo)
  aporta valor al negocio.
- Agregar WebSockets implica una pieza de infraestructura nueva (adapter
  Redis para escalar horizontal, reconexion, etc.) sin volumen de trafico
  real que lo justifique hoy; el polling ya probado en `/delivery` es
  suficiente para la granularidad que necesita este caso de uso ("donde
  esta aproximadamente el repartidor", no telemetria de alta frecuencia).
- Abrir facturacion de Google Maps API antes de tener ingresos reales es un
  costo/riesgo evitable cuando Leaflet + OSM resuelve el mismo requisito
  ("mostrar un punto en un mapa") sin costo.
- Cruzar `DriverLocation` con pedidos activos en el momento de la consulta
  (en vez de limpiar la fila al completar la entrega) es mas simple: no
  requiere un hook adicional en `updateStatus`/`unassignOrder` para borrar
  posiciones, y el filtro ya es necesario de todos modos para no mostrar
  repartidores inactivos.

**Nota de implementacion:** `react-leaflet@5` requiere React 19; el frontend
sigue en React 18 (ver `package.json`), asi que se pinea
`react-leaflet@^4.2.1` (ultima version compatible con React 18) — mismo
criterio que el pin existente de `@nestjs/elasticsearch@11.1.0` por
incompatibilidad de major version, revisar al actualizar React.

## Consecuencias

- Primer codigo real dentro del modulo `logistics` (hasta ahora
  comentado/stub desde el scaffold inicial).
- Nueva tabla `driver_locations` (migracion TypeORM), nueva dependencia
  `leaflet`/`react-leaflet` en el frontend.
- `OrdersService` gana un metodo de lectura (`findActiveAssignments`) para
  que `LogisticsService` pueda cruzar posiciones con pedidos activos sin
  acceder directamente al repositorio de `Order` (se respeta la
  comunicacion entre modulos via inyeccion de dependencias, ver
  `CLAUDE.md`).
- El repartidor debe mantener la pestana de `/delivery` abierta y dar
  permiso de geolocalizacion al navegador; si lo niega, el tracking
  simplemente no se envia (patron best-effort, igual que email/push/FCM
  cuando falta configuracion) sin bloquear el resto del flujo de entrega.

## Riesgos

- **Medio**: si el repartidor cierra la pestana o bloquea el celular, la
  posicion reportada queda desactualizada hasta la proxima apertura de
  `/delivery` — conocido y aceptado, documentado como limitacion de este
  incremento (ver spec, seccion "Fuera de alcance").
- **Bajo**: precision del GPS del navegador (`accuracy` en metros) puede
  variar mucho segun el dispositivo; se expone el campo `accuracy` al
  frontend para que pueda mostrarse como referencia, sin bloquear nada si
  es baja.
