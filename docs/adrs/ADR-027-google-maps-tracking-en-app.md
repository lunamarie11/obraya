# ADR-027: Adopcion de Google Maps Platform para tracking end-to-end dentro de la app (reemplaza partes de ADR-018 y ADR-022)

**Estado:** Aceptado
**Fecha:** 2026-11-18
**Decidido por:** Fundadores ObraYa

## Contexto

ADR-018 (Fase 4b) eligio Leaflet + OpenStreetMap para el mapa de
repartidores, explicitamente para no abrir facturacion de Google Cloud en
pre-seed, y dejo el tracking del comprador fuera de alcance ("El tracking
en el front de comprador (`/my-orders`) queda fuera de alcance de este
incremento"). ADR-022 (Fase 4d) elige delegar el ruteo a la app externa de
Google Maps via deep link, tambien para evitar costo, con esta salvedad
explicita: *"si en el futuro el volumen de pedidos simultaneos por
repartidor crece mucho, la falta de ETA/ruta visible dentro de la UI de
ObraYa... puede quedar corta — en ese caso se revisaria la Opcion A
(Directions/Geocoding API de pago)"*.

El negocio pidio ahora, de forma explicita, las tres cosas que esas dos
ADRs habian dejado afuera por costo:

1. El comercio tiene que poder ver como se esta entregando su pedido (hoy
   ya ve un mapa, pero sin ruta).
2. El repartidor tiene que seguir la ruta **dentro de la app de ObraYa**,
   no que la app lo mande a Google Maps externo (lo que hace hoy ADR-022).
3. El comprador tiene que ver en tiempo real como viene su pedido hacia el
   (hoy no existe nada de esto).

Esto ya no se puede resolver gratis: los tres puntos requieren un mapa
embebido con ruta dibujada, y eso es exactamente lo que ADR-018/022
evitaron pagando. Se decide revisar ambas decisiones.

## Decision

1. **Se reemplaza Leaflet/OpenStreetMap por Google Maps JavaScript API**
   en las tres superficies web afectadas: `/delivery/map` (comercio),
   `/delivery` (repartidor) y la nueva vista de mapa en `/my-orders/[id]`
   (comprador). Supersede la eleccion de proveedor de mapa de ADR-018.

2. **Se agrega Directions API (llamada desde el backend) para calcular la
   ruta** (polyline + distancia + duracion estimada) cuando un pedido pasa
   a `Despachado` con repartidor asignado. El resultado se cachea en
   `Order` (no se recalcula en cada poll de posicion — ver spec para el
   detalle de columnas). Direccion de origen y destino se pasan como texto
   libre (`Company.address` y `Order.deliveryAddress`); Directions API
   geocodea internamente como parte de la misma llamada facturable, **no
   hace falta agregar Geocoding API por separado**.

3. **Se elimina el boton "Abrir ruta en Google Maps" (deep link externo)
   de ADR-022.** La ruta se dibuja arriba del mapa embebido en `/delivery`;
   el repartidor ya no sale de la app de ObraYa para navegar. Supersede la
   Opcion B de ADR-022/fase4d.

4. **Nuevo endpoint de lectura para el comprador** (`buyer-orders`):
   posicion actual del repartidor asignado + la ruta cacheada, visible
   unicamente mientras el pedido esta en estado `Despachado` y tiene un
   repartidor (interno o independiente) asignado. Esto es lo que ADR-018
   habia dejado fuera de alcance.

5. **El tracking de posicion se extiende para cubrir tambien `Delivery`
   independiente (ADR-026), no solo `Driver` interno (ADR-018).** Se
   agrega una tabla `delivery_locations`, espejo de `driver_locations`,
   siguiendo el mismo patron de columnas paralelas que ya uso ADR-026
   (`assignedDriverId`/`assignedDeliveryId`) en vez de una tabla
   polimorfica unica.

6. **Se sigue sin WebSockets.** Los tres consumidores (comercio, delivery,
   comprador) siguen resolviendo "tiempo real" con polling REST cada
   10-15s, igual que ADR-018. No hay volumen hoy que justifique el salto.

7. **Mobile (Expo, `packages/mobile`) queda fuera de alcance de este
   incremento.** No tiene pipeline de build nativo (EAS) ni
   `react-native-maps` instalado; agregar mapas ahi implica compilar
   binarios nativos con API keys restringidas por SHA-1 (Android) / bundle
   id (iOS), un esfuerzo bastante mayor que se evalua cuando el roadmap de
   mobile lo priorice. El comprador ve el tracking por ahora solo en la
   web (`/my-orders`).

8. **Requiere activar facturacion real en Google Cloud (tarjeta) por
   primera vez en el proyecto.** Se mitiga con una alerta/limite de
   presupuesto (sugerido USD 50/mes) y restringiendo las API keys: la key
   publica del JS API por HTTP referrer (dominio de ObraYa unicamente), la
   key de backend usada para Directions API por IP del servidor.

## Justificacion

- Cumple el pedido tal como se formulo: todo dentro de la app, sin mandar
  a nadie a una app externa.
- El costo real esperado a la escala actual es **USD 0/mes**: cada SKU de
  Google Maps Platform tiene su propio free tier mensual (10.000 "map
  loads" para Maps JavaScript API, 10.000 requests para Directions API);
  un marketplace pre-seed con bajo volumen de pedidos `Despachado` por mes
  queda holgadamente adentro de ambos free tiers (ver tabla de costos en
  `docs/specs/fase4e-tracking-google-maps.md`).
- Reutiliza patrones ya probados en vez de inventar mecanismos nuevos:
  upsert de ultima posicion sin historial (igual que `driver_locations` de
  ADR-018), columnas paralelas para dos identidades de repartidor (igual
  que ADR-026), polling REST (igual que ADR-018).
- Pasar la ruta por Directions API evita agregar Geocoding API aparte: la
  misma llamada que calcula la ruta resuelve las direcciones de texto
  libre a coordenadas.

## Consecuencias

- Primera dependencia de ObraYa de un servicio de pago de Google Cloud.
  Hay que dar de alta facturacion, configurar alertas de presupuesto y
  restringir las dos API keys nuevas (`GOOGLE_MAPS_API_KEY` publica,
  `GOOGLE_MAPS_SERVER_API_KEY` privada) antes de habilitar esto en
  produccion.
- Si el volumen de pedidos `Despachado` simultaneos crece mucho mas alla
  del free tier, el costo escala linealmente (ver spec) y hay que
  revisarlo — mismo tipo de condicion de disparo que ya anticipaba
  ADR-022, ahora ya ejecutada.
- Quedan dos tablas de ubicacion en paralelo (`driver_locations`,
  `delivery_locations`) en vez de una sola tabla polimorfica — mismo
  trade-off de simplicidad por sobre pureza de esquema que ya se acepto en
  ADR-026.
- El comprador en mobile (Expo) sigue sin tracking visual hasta que se
  decida invertir en el pipeline de build nativo — deuda tecnica conocida,
  no construida especulativamente.
