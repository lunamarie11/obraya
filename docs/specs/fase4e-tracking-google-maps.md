# Spec: Tracking end-to-end con Google Maps (Fase 4e)

**Modulo:** Logistica / Backoffice / Marketplace comprador
**Prioridad:** Fase 4 (post-lanzamiento), sub-fase 4e
**Estado:** Propuesto (pendiente de aprobacion antes de implementar)
**Ultima actualizacion:** 2026-11-18

---

## Objetivo

Pedido explicito del negocio, con tres partes:

1. El **comercio** (Admin/Logistica de una empresa) tiene que poder ver,
   dentro de ObraYa, como se esta entregando un pedido despachado —no solo
   un punto en el mapa como hoy, sino la ruta.
2. El **repartidor** (`Driver` interno o `Delivery` independiente, ver
   ADR-026) tiene que seguir la ruta **dentro de la app de ObraYa**. Nada
   de redirigir a la app externa de Google Maps (eso es lo que hace hoy
   `/delivery`, ver ADR-022 — se reemplaza).
3. El **comprador** tiene que ver, en tiempo real, como viene su pedido
   hacia el. Hoy esto no existe en absoluto (ver ADR-018, quedo
   explicitamente fuera de alcance).

Esto implica pasar de Leaflet/OpenStreetMap a Google Maps en las tres
superficies, y agregar la Directions API para calcular y dibujar la ruta.
Ver ADR-027 para la decision completa (reemplaza partes de ADR-018 y
ADR-022).

## Que ya existe (no reimplementar)

- `DriverLocation` (`driver_locations`, ADR-018): ultima posicion conocida
  de un repartidor interno (`CompanyUser` con rol `Logistica`), upsert sin
  historial. `PUT /logistics/location` la actualiza (Geolocation API del
  navegador, watch continuo mientras `/delivery` esta abierto). `GET
  /logistics/locations` la expone al comercio.
- `/delivery/map`: mapa Leaflet con un marcador por repartidor activo
  (visible para Admin/Logistica, cruza `driver_locations` con pedidos
  activos).
- `/delivery`: lista de pedidos `Despachado` asignados al repartidor
  actual (`assignedToMe=true`). Con 2+ pedidos asignados, boton "Abrir
  ruta en Google Maps" (deep link externo, ADR-022) — **se elimina en esta
  sub-fase**.
- `OrderStatusStepper` en `/my-orders/[id]` (web) y en mobile: timeline
  textual de estados (`Pendiente` → `Confirmado` → ... → `Entregado`), sin
  mapa ni posicion.
- `Order.deliveryAddress`: JSON de texto libre (`street`, `city`,
  `province`, `postalCode`, `notes`), sin `lat`/`lng` (ADR-012: sin
  geocoding hasta ahora).
- `Company.address`: direccion de texto libre de la empresa (ya existe,
  se usa como origen de la ruta).
- `Delivery` (ADR-026): identidad independiente de repartidor, marketplace
  completo, sin tracking de posicion propio todavia (deuda tecnica
  explicita de ese ADR).
- No hay ninguna dependencia de Google Maps instalada hoy en ningun
  package, ni API key, ni facturacion de Google Cloud activada.

## Explicitamente fuera de alcance de esta sub-fase

- **Mobile (`packages/mobile`, Expo).** No tiene `react-native-maps` ni
  pipeline de build nativo (EAS) armado. El comprador ve el tracking
  solamente en la web (`/my-orders`) por ahora; agregarlo a mobile implica
  compilar binarios nativos con sus propias API keys (restringidas por
  SHA-1 en Android, por bundle id en iOS) — esfuerzo mayor, deuda tecnica
  conocida para cuando el roadmap de mobile lo priorice.
- **Geocoding persistente de direcciones.** No se agrega `lat`/`lng` a
  `Order` ni se llama a la Geocoding API por separado — Directions API
  geocodea las direcciones de texto como parte de la misma llamada
  facturable que calcula la ruta.
- **Recalculo continuo de la ruta mientras el repartidor se mueve.** La
  ruta (polyline + distancia + duracion) se calcula **una sola vez**,
  cuando el pedido pasa a `Despachado` con repartidor asignado, y se
  cachea. El marcador de posicion del repartidor se sigue actualizando
  por polling (como hoy), pero no se vuelve a llamar a Directions API en
  cada poll — eso multiplicaria el costo por el numero de polls sin
  necesidad real (la ruta de calles no cambia; el ETA aproximado alcanza
  con el que devuelve el calculo inicial).
- **Re-ruteo dinamico si el repartidor se desvia** (recalcular porque tomo
  otro camino). No hay pedido de negocio para esto todavia.
- **Toggle de disponibilidad, comision o asignacion para `Delivery`
  independiente** — fuera de esta sub-fase, ya estaba marcado como deuda
  en ADR-026.
- **WebSockets.** Se mantiene polling REST (10-15s), igual que ADR-018.

## Modelo de datos

### Nueva tabla: `delivery_locations`

Espejo de `driver_locations`, pero para la identidad `Delivery`
independiente (ADR-026). Se separan en dos tablas (no una polimorfica)
siguiendo el mismo criterio que ya uso ADR-026 con columnas paralelas.

| Columna       | Tipo                  | Notas                                  |
|---------------|-----------------------|-----------------------------------------|
| delivery_id   | uuid, PK              | FK a `deliveries.id`                    |
| lat           | decimal(9,6)          |                                          |
| lng           | decimal(9,6)          |                                          |
| accuracy      | float, nullable       |                                          |
| recorded_at   | timestamptz           | igual semantica que `driver_locations`  |
| updated_at    | timestamptz           | `@UpdateDateColumn`                     |

### Nuevas columnas en `Order` (aditivas, nullable)

Cachean el resultado de Directions API para no volver a pagarlo en cada
poll de posicion.

| Columna                 | Tipo          | Notas                                            |
|--------------------------|---------------|---------------------------------------------------|
| route_polyline           | text, nullable | Polyline codificado que devuelve Directions API   |
| route_distance_meters     | int, nullable  |                                                    |
| route_duration_seconds    | int, nullable  | ETA estimado al momento del calculo (no se actualiza) |
| route_calculated_at       | timestamptz, nullable | Cuando se llamo a Directions API             |

## Endpoints nuevos/modificados

### `logistics` (backend ya existente, se extiende)

- `PUT /logistics/location` — **sin cambios de contrato**, pero ahora
  tambien puede resolverse desde el guard JWT de `Delivery`
  (`jwt-delivery`), no solo desde `CompanyUser`: escribe en
  `driver_locations` o `delivery_locations` segun que identidad esta
  autenticada.
- `GET /logistics/locations` — sin cambios de contrato para el comercio;
  internamente ahora cruza ambas tablas (`driver_locations` +
  `delivery_locations`) para mostrar cualquier repartidor que tenga un
  pedido activo de esa empresa, sea interno o independiente.
- Nuevo: cuando `OrdersService` marca un pedido como `Despachado` y ya
  tiene repartidor asignado (interno o independiente), dispara el calculo
  de ruta (Directions API, `Company.address` → `Order.deliveryAddress`,
  ambos como texto) y guarda el resultado en las 4 columnas nuevas de
  `Order`. Si Directions API falla (direccion no geocodificable, timeout),
  se guarda `route_calculated_at = null` y el frontend cae al
  comportamiento actual (marcador sin ruta dibujada) — no bloquea el
  despacho del pedido.

### `buyer-orders` (nuevo endpoint de lectura)

- `GET /buyer-orders/:id/tracking` — devuelve `{ driverLat, driverLng,
  routePolyline, routeDistanceMeters, routeDurationSeconds }` **solo si**
  el pedido pertenece al comprador autenticado, esta en estado
  `Despachado`, y tiene un repartidor asignado (interno o independiente)
  con una fila en `driver_locations`/`delivery_locations`. En cualquier
  otro caso (otro estado, sin repartidor, sin posicion todavia) devuelve
  `404` — el frontend interpreta eso como "todavia no hay tracking
  disponible" y muestra el stepper textual existente sin mapa.

## Frontend

### `/delivery/map` (comercio, Admin/Logistica)

- Se reemplaza Leaflet por Google Maps JavaScript API (`@react-google-maps/api`
  o equivalente — evaluar en implementacion, no se fija libreria en esta
  spec).
- Ademas del marcador de posicion (igual que hoy), si el pedido
  seleccionado tiene `routePolyline`, se dibuja la ruta sobre el mapa.

### `/delivery` (repartidor, web)

- Se elimina el boton "Abrir ruta en Google Maps" (ADR-022).
- Se agrega un mapa embebido (mismo Google Maps JS API) con la posicion
  actual del repartidor y, si existe, la ruta hacia el proximo destino
  (`routePolyline` del pedido activo). El repartidor ya no sale de la app.

### `/my-orders/[id]` (comprador, web)

- Nuevo bloque de mapa, visible solo si `GET
  /buyer-orders/:id/tracking` devuelve 200 (pedido `Despachado` con
  repartidor asignado y posicion conocida). Polling cada 10-15s, igual
  patron que el comercio.
- Si el endpoint devuelve 404 (cualquier otro estado), se muestra
  unicamente el `OrderStatusStepper` actual, sin mapa — comportamiento de
  hoy, sin romper nada.

## Costo de Google Maps (respuesta directa a "cuanto sale por mes")

Google Maps Platform cobra por SKU, cada uno con su propio free tier
mensual. Para esta spec hacen falta dos:

| API                          | Precio (tramo bajo) | Free tier mensual        | Uso en esta spec                                  |
|-------------------------------|----------------------|---------------------------|-----------------------------------------------------|
| Maps JavaScript API (web)     | USD 7,00 / 1.000 cargas de mapa | 10.000 cargas/mes | Cada vez que se renderiza el mapa en `/delivery/map`, `/delivery` o `/my-orders/[id]` (web) |
| Directions API                | USD 5,00 / 1.000 requests | 10.000 requests/mes   | Una llamada por pedido, cuando pasa a `Despachado` (no se repite en cada poll) |
| Maps SDK Android/iOS (nativo) | **Gratis, sin limite** | — | No aplica: mobile queda fuera de alcance de esta sub-fase |

**Estimacion para ObraYa hoy (pre-seed, bajo volumen):**

- Directions API: 1 llamada por pedido despachado. Con cualquier volumen
  razonable de pedidos/mes en esta etapa (muy por debajo de 10.000/mes),
  **cae entero dentro del free tier → USD 0**.
- Maps JavaScript API: se factura por carga de mapa, no por poll de
  posicion (el polling es una llamada REST propia de ObraYa, no cuenta
  como "carga"). Cada vez que un comercio abre `/delivery/map`, un
  repartidor abre `/delivery`, o un comprador abre `/my-orders/[id]` con
  tracking activo, se cuenta 1 carga. Con el volumen actual de usuarios
  activos simultaneos, **tambien queda dentro de los 10.000/mes gratis →
  USD 0**.

**Conclusion: el costo real esperado al lanzar esto es USD 0/mes.** El
riesgo no es el costo en si, sino que por primera vez hay que:

1. Activar facturacion en Google Cloud (tarjeta de la empresa).
2. Configurar una alerta de presupuesto (sugerido: USD 50/mes) para
   enterarse antes de que un pico de uso real factura algo.
3. Restringir las API keys: la publica (JS API) por dominio (HTTP
   referrer) de ObraYa, la privada de backend (Directions API) por IP del
   servidor.

**Si el volumen crece mucho** (varios miles de pedidos despachados
simultaneos por mes, o mucho trafico de mapa), el costo escala de forma
lineal y con descuento por volumen (ej. Maps JavaScript API baja a USD
0,53/1.000 cargas pasado el millon de cargas/mes) — a esa escala ObraYa ya
no seria pre-seed y el costo seria un porcentaje irrelevante de la
operacion.

## Migracion

- Nueva tabla `delivery_locations` (ver modelo de datos).
- Nuevas columnas en `orders`: `route_polyline`, `route_distance_meters`,
  `route_duration_seconds`, `route_calculated_at` (todas nullable,
  default null — no rompe pedidos existentes).

## Variables de entorno nuevas

- `GOOGLE_MAPS_API_KEY` — publica, usada en el frontend para Maps
  JavaScript API. Restringida por HTTP referrer en Google Cloud Console.
- `GOOGLE_MAPS_SERVER_API_KEY` — privada, usada solo desde el backend para
  Directions API. Restringida por IP del servidor. **Nunca** se expone al
  frontend.

## Decisiones documentadas

- ADR-027 (`docs/adrs/ADR-027-google-maps-tracking-en-app.md`): decision
  completa de adoptar Google Maps Platform, reemplazando el proveedor de
  mapa de ADR-018 y el deep link externo de ADR-022, y habilitando el
  tracking del comprador que ADR-018 habia dejado fuera de alcance.
