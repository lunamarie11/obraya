# Spec: Ruteo optimizado para repartidores (Fase 4d)

**Modulo:** Logistica / Backoffice (roles `Admin`, `Logistica`)
**Prioridad:** Fase 4 (post-lanzamiento), sub-fase 4d
**Estado:** Implementado (Opcion B, ver ADR-022)
**Ultima actualizacion:** 2026-11-16

---

## Objetivo

Cuando un repartidor (`Logistica`) tiene **mas de un pedido `Despachado`
asignado al mismo tiempo**, hoy los ve en `/delivery` en una lista simple
ordenada por fecha de creacion (`ORDER BY createdAt DESC`), sin ningun
criterio de cercania geografica. Esta sub-fase agrega una sugerencia de
**en que orden conviene entregarlos** y un **ETA aproximado**, dejando
pospuesto desde ADR-018 (Fase 4b) exactamente esto: *"Google Maps sigue
siendo la opcion planeada para ruteo optimizado, Fase 4d, que si necesita
geocoding/routing de verdad"*.

## Punto de partida (investigado antes de disenar esto)

- **`Order.deliveryAddress` es JSON de texto libre** (`street`, `city`,
  `province`, `postalCode`, `notes`), **sin `lat`/`lng`**. No existe
  geocoding en ningun lado del backend hoy — ADR-012 confirmo
  explicitamente "match exacto de codigo postal, sin geocoding" para zonas
  de envio.
- **`DriverLocation`** (ADR-018) guarda la ultima posicion conocida del
  repartidor (`lat`/`lng` via Geolocation API del navegador), sin
  historial.
- **`OrdersService.findActiveAssignments(companyId)`** devuelve solo
  `{ orderId, orderNumber, assignedDriverId }` de pedidos `Despachado` con
  repartidor asignado — no trae direccion. Para direccion completa hay que
  usar `findAll()` con `assignedToMe=true`.
- **No hay ninguna dependencia de Google Maps instalada** (ni API key, ni
  variable de entorno, ni paquete) en ningun package. El mapa actual
  (`/delivery/map`, `DriverMap.tsx`) usa Leaflet + OpenStreetMap
  exclusivamente para mostrar un marcador, sin routing.

## Decision de diseno (a confirmar antes de implementar)

**Dos piezas nuevas son inevitables para que esto funcione: geocoding
(texto → lat/lng) y calculo de ruta/orden optimo.** La pregunta real es
*cuanto* de eso se resuelve con la API de pago de Google y cuanto se le
delega a la app de Google Maps del repartidor. Dos alternativas:

**Opcion A — Integracion completa con Directions/Geocoding API de
Google (de pago).** El backend geocodea cada `deliveryAddress` (Geocoding
API), calcula el orden optimo y el ETA por parada (Directions API con
`optimizeWaypoints`), y el frontend dibuja la ruta sobre el mapa Leaflet
existente. Requiere:
- Dar de alta facturacion en Google Cloud (tarjeta real) — algo que ADR-008,
  ADR-012 y ADR-018 evitaron explicitamente hasta ahora por ser pre-seed.
- Guardar `lat`/`lng` geocodeados en `Order` (nueva migracion) para no
  re-geocodear el mismo pedido en cada consulta (Geocoding API se cobra
  por llamada).
- Manejo de cuota/limite de costo (caps de billing en Google Cloud) para
  no exponerse a una factura inesperada.

**Opcion B — Delegar el ruteo a la app de Google Maps del repartidor via
deep link, sin API de pago (Recomendado).** El backend NO calcula la ruta
ni geocodea nada. En `/delivery`, cuando el repartidor tiene 2+ pedidos
`Despachado` asignados, aparece un boton "Abrir ruta en Google Maps" que
arma una URL del tipo:
```
https://www.google.com/maps/dir/?api=1&destination=<ultima_direccion>&waypoints=<direccion_1>|<direccion_2>|...&travelmode=driving
```
usando las direcciones de texto (`deliveryAddress`) tal cual estan guardadas
— Google Maps geocodea y optimiza el orden de las waypoints internamente
(soporta `waypoints=optimize:true|...`, aunque esa variante requiere la
Directions API para leer el resultado; para abrir la app simplemente
alcanza con pasar las direcciones y dejar que la app del celular/navegador
resuelva el orden visualmente, como hace cualquier repartidor hoy a mano).
Costo: **cero**, sin API key, sin facturacion. Limitacion: la "optimizacion"
depende de la heuristica de Google Maps al abrir el link, no es algo que
ObraYa calcule ni pueda mostrar como ETA dentro de su propia UI — el
repartidor sale de `/delivery` y entra a la app de Google Maps para
navegar.

**Si se prefiere la Opcion A, el resto de esta spec cambia** (hay que
sumar geocoding, columnas nuevas en `Order`, manejo de costo/cuota — mucho
mas grande que lo que sigue). Esta spec esta escrita asumiendo **Opcion
B**, consistente con el criterio ya aplicado en ADR-008/012/018 de no
abrir facturacion de Google Cloud en pre-seed mientras una alternativa sin
costo resuelva el mismo requisito. Confirmar esto antes de seguir.

## Que ya existe (no reimplementar)

- Asignacion de pedidos (`POST /orders/:id/claim`, `PUT
  /orders/:id/unassign`, ADR-017).
- `/delivery`: lista de pedidos asignados al repartidor actual
  (`assignedToMe=true`, estado `Despachado`), ordenados por `createdAt`.
- `/delivery/map`: mapa Leaflet con la posicion de cada repartidor activo
  (ADR-018).
- `Driver.isAvailable` y perfil de repartidor (ADR-019, Fase 4c) — sin
  relacion directa con esta sub-fase, no se toca.

## Explicitamente fuera de alcance de esta sub-fase

- Geocoding de direcciones y calculo de ETA dentro de la UI de ObraYa
  (queda pospuesto si en el futuro se decide pagar la Opcion A).
- Integracion con transportistas externos (Andreani, OCA) — sigue sin
  fecha, no forma parte de ningun 4-x todavia planificado en detalle.
- Ruta dibujada sobre el mapa Leaflet propio (`/delivery/map`) — el
  repartidor navega en la app externa de Google Maps, no en ObraYa.
- Reordenar pedidos de otros repartidores o a nivel flota completa
  (ruteo multi-vehiculo) — esto es ruteo individual, un repartidor a la
  vez, solo con sus propios pedidos asignados.
- Capacidad de carga por vehiculo, restricciones de peso/volumen.

## Cambios

### Backend

No hay modelo de datos nuevo ni endpoint nuevo: armar la URL de Google
Maps es pura concatenacion de strings con datos que el frontend ya tiene
(`deliveryAddress` de cada pedido de `GET /orders?assignedToMe=true`). No
se justifica mover esa logica al backend.

### Frontend (`/delivery`)

- Cuando el repartidor tiene **2 o mas** pedidos `Despachado` asignados
  (`assignedToMe=true`), aparece un boton "Abrir ruta en Google Maps"
  arriba de la lista.
- Al tocarlo, se abre (nueva pestana) una URL `https://www.google.com/maps/dir/?api=1&...`
  con:
  - `origin`: posicion actual del repartidor si el navegador tiene permiso
    de geolocalizacion concedido (reusa el mismo permiso que ya pide
    `/delivery` para `DriverLocation`, ADR-018); si no, se omite `origin` y
    Google Maps usa la ubicacion del dispositivo directamente.
  - `destination`: direccion del ultimo pedido de la lista actual.
  - `waypoints`: direcciones del resto de los pedidos, separadas por `|`.
  - Cada direccion se arma concatenando `street, city, province` (sin
    `postalCode` ni `notes`, que no aportan a la geocodificacion de Google
    y pueden confundir el match).
- Con 0 o 1 pedido asignado, el boton no aparece (no hay nada que
  "ordenar").
- No se agrega ETA dentro de `/delivery` en esta sub-fase (ver Opcion A
  descartada).

## Migracion

Ninguna. No hay modelo de datos nuevo.

## Decisiones documentadas

- ADR-022 (ver `docs/adrs/ADR-022-ruteo-repartidores-google-maps-deeplink.md`):
  por que se delega el ruteo a la app de Google Maps via deep link en vez de
  integrar la Directions/Geocoding API de pago, y bajo que condicion
  (volumen real, necesidad de ETA dentro de la UI) valdria la pena revisar
  esa decision mas adelante.

## Nota de implementacion (2026-11-16)

El punto de partida de esta spec ("hoy los ve en `/delivery` en una lista
simple... sin ningun criterio de cercania geografica") quedo desactualizado
por un cambio posterior (Fase 4c): el frontend paso a ocultar la lista de
"Pedidos disponibles" mientras habia una entrega activa, bloqueando de hecho
que un repartidor tuviera 2+ pedidos asignados a la vez. Para que el boton
de ruteo tenga sentido, esta implementacion tambien relaja esa restriccion
(ver ADR-022): un repartidor puede tomar varios pedidos `Despachado` a la
vez; el primero mantiene el timeline paso a paso existente, el resto se
muestra como tarjetas simples con un boton directo "Marcar entregado".
