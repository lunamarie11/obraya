# ADR-012: Configuración logística por zona (costos y tiempos de envío)

**Estado:** Aceptado
**Fecha:** 2026-09-23
**Decidido por:** Fundadores ObraYa

## Contexto

`Company.coverageZones: string[]` solo guardaba una lista de códigos postales,
sin costo ni tiempo de envío. El frontend/mobile ya usaban esto como
heurística (`StoreCard.tsx`: "cuantas más zonas, ETA más corta") — un
placeholder que la spec del marketplace (`docs/specs/marketplace-comprador.md`)
marcaba explícitamente como "fuera de alcance, requiere modelo de logística
real". Tampoco existía ningún concepto de costo de envío en `Order`: el total
del pedido se calculaba únicamente sumando los ítems.

El módulo `logistics` (Fase 4, ruteo con Google Maps) sigue siendo un stub
comentado y está fuera de alcance de este cambio — esto es solo la
configuración manual de zonas por parte del fabricante, sin geocoding ni
polígonos.

## Decision

- **`DeliveryZone` reemplaza a `coverageZones: string[]`** en `Company`
  (`packages/backend/src/modules/users/entities/company.entity.ts`):
  ```ts
  interface DeliveryZone {
    id: string;
    name: string;
    zipCodes: string[];       // match exacto, sin geocoding/polígonos
    promisedHours: number;
    fleetType: 'propia' | 'tercerizada' | 'retiro_local';
    shippingCost: number;     // centavos de ARS, misma convención que Order.totalAmount
  }
  ```
  `coverageZones` se mantiene como **getter derivado** (`deliveryZones.flatMap(z => z.zipCodes)`)
  para que `StoreCard.tsx` (frontend + mobile) no requiera ningún cambio.
- **`resolveDeliveryZone(zones, postalCode)`**: función pura de matching exacto
  (sin geocoding). Si no hay zonas configuradas o el código postal no matchea
  ninguna, devuelve `null` — nunca bloquea el checkout, solo no cotiza envío.
- **Cotización pública**: `GET /public/companies/:id/shipping-quote?postalCode=X`
  (`MarketplacePublicService.getShippingQuote`), solo lectura, sin JWT (mismo
  criterio que el resto del catálogo público, ver ADR-003). Devuelve
  `{ available: false }` si no matchea.
- **Cálculo server-side real**: `OrdersService.create()` inyecta el repo de
  `Company`, resuelve la zona contra `dto.deliveryAddress.postalCode` y suma
  `shippingCost` a `totalAmount`. **Nunca se confía en un costo de envío
  enviado por el cliente** — el endpoint de cotización es solo informativo
  para mostrarlo en el checkout antes de confirmar.
- **`Order` agrega `shippingCost` y `shippingZoneName`** para dejar registro
  de qué se cobró y por qué zona, y ese costo también se incluye como ítem
  adicional en la preferencia de Mercado Pago cuando corresponde (ver ADR-007).
- **Backoffice**: la sección "Zonas de cobertura" en `settings/page.tsx` se
  rehizo para gestionar zonas completas (nombre, flota, tiempo estimado,
  costo, códigos postales) en vez de una simple lista de chips.
- **Checkout (frontend + mobile, paridad completa)**: al ingresar el código
  postal, se cotiza el envío por cada fabricante presente en el carrito
  (`getCartGroupedByCompany`) y se suma al total mostrado. Si la cotización
  falla o no hay zona, se muestra "A coordinar" sin bloquear la compra.

## Justificacion

- Mismo patrón "no bloqueante" que AFIP/FCM/SES: la ausencia de configuración
  nunca debe impedir crear un pedido, solo degradar a costo $0 / sin ETA.
- Getter de compatibilidad (`coverageZones`) minimiza el blast radius: evita
  tocar componentes de UI que solo necesitan un conteo de zonas.
- Cálculo de costo estrictamente server-side evita que un comprador manipule
  el `shippingCost` antes de crear el pedido.
- Match exacto por código postal (sin geocoding) es suficiente para el
  volumen y granularidad actual (fabricantes definen sus propias zonas
  manualmente) y no introduce una dependencia nueva (Google Maps queda para
  Fase 4, ver plan técnico).

## Consecuencias

- Migración de datos: instalaciones existentes con `coverageZones: string[]`
  pierden esos códigos postales al pasar a `deliveryZones: DeliveryZone[]`
  (columna nueva, sin migración automática de datos — aceptable en Fase 0/1,
  sin datos de producción todavía, `synchronize: true`).
- Tipos compartidos actualizados en `packages/shared/src/types/index.ts`
  (`DeliveryZone`, `FleetType`, `ShippingQuote`, `Order.shippingCost/shippingZoneName`).

## Riesgos

- **Bajo**: match exacto de código postal es rígido (no soporta rangos ni
  prefijos). Si un fabricante quiere cubrir "todo CABA" tiene que listar cada
  código postal a mano. Aceptable para el volumen inicial de fabricantes.
- **Bajo**: sin geocoding, un comprador con un código postal mal tipeado
  simplemente no recibe cotización (degradación silenciosa, no error visible).
