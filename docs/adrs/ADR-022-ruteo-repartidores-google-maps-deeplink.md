# ADR-022: Ruteo de repartidores via deep link a Google Maps

**Estado:** Aceptado
**Fecha:** 2026-11-16
**Decidido por:** Fundadores ObraYa

## Contexto

Desde ADR-018 (Fase 4b), `/delivery` ya reporta la posicion del repartidor
(Geolocation API del navegador) y `/delivery/map` la muestra en un mapa
Leaflet. Pero cuando un repartidor tiene varios pedidos `Despachado`
asignados a la vez, no hay ningun criterio de cercania geografica para
decidir en que orden conviene entregarlos: antes de este cambio, el
frontend ni siquiera permitia tomar un segundo pedido mientras habia uno
activo (ver `(backoffice)/delivery/page.tsx`, bloqueo introducido junto con
la Fase 4c). El spec `docs/specs/fase4d-ruteo-optimizado.md` identifica el
problema y propone dos alternativas.

## Decision

Se elige la **Opcion B** del spec: delegar el ruteo a la app de Google Maps
del repartidor via deep link, sin usar ninguna API de pago de Google.

- Se relaja la restriccion de "un solo pedido activo a la vez": un
  repartidor ahora puede tomar (`POST /orders/:id/claim`) más de un pedido
  `Despachado` asignado simultaneamente. El primero mantiene el timeline
  cosmetico paso a paso existente; el resto se muestra como lista simple
  con un boton "Marcar entregado" directo.
- Con 2 o mas pedidos asignados, aparece un boton "Abrir ruta en Google
  Maps" que arma una URL `https://www.google.com/maps/dir/?api=1&...` con
  `destination` (ultima direccion), `waypoints` (el resto, separadas por
  `|`) y, si el navegador tiene permiso de geolocalizacion, `origin` con la
  posicion actual (obtenida puntualmente al tocar el boton, no reusa el
  watch continuo de ADR-018).
- No hay geocoding, columnas nuevas, ni calculo de ETA propio: las
  direcciones se pasan como texto (`street, city, province`) y Google Maps
  resuelve el geocoding y el orden de las paradas internamente al abrir el
  link.

## Justificacion

- Cero costo: no requiere dar de alta facturacion de Google Cloud (mismo
  criterio ya aplicado en ADR-008, ADR-012 y ADR-018 para no abrir ese gasto
  en pre-seed).
- No se justifica construir geocoding ni un motor de ruteo propio para el
  volumen actual (pre-seed, sin trafico real de repartidores concurrentes).
- Reusa intocado el modelo de asignacion de ADR-017 (`assignedDriverId`) y
  el reporte de posicion de ADR-018; no agrega tablas ni endpoints nuevos.

## Consecuencias

- Un repartidor puede ver y gestionar varios pedidos asignados a la vez en
  `/delivery`; el boton "Tomar pedido" ya no se oculta al tener una entrega
  activa.
- La "optimizacion" del orden de entrega depende de la heuristica interna
  de Google Maps al abrir el link, no de un calculo propio de ObraYa — no
  se muestra ETA dentro de la UI de ObraYa.
- `/delivery/[id]` (detalle de un pedido puntual) no cambia: ya funciona
  por id independiente del resto de pedidos asignados.

## Riesgos

- **Bajo**: si el repartidor niega el permiso de geolocalizacion, el link
  se abre sin `origin` — Google Maps usa la ubicacion del dispositivo
  directamente, sin afectar la funcionalidad.
- **Medio**: si en el futuro el volumen de pedidos simultaneos por
  repartidor crece mucho, la falta de ETA/ruta visible dentro de la UI de
  ObraYa (el repartidor sale a la app externa) puede quedar corta — en ese
  caso se revisaria la Opcion A (Directions/Geocoding API de pago)
  descartada en el spec.
