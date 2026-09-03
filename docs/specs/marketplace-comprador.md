# Spec: Experiencia de Comprador (Marketplace estilo PedidosYa)

**Modulo:** Front de usuarios / Marketplace
**Prioridad:** Fase 2 (Sep-Nov 2026), adelantado parcialmente sobre el cierre de Fase 1
**Estado:** En progreso
**Ultima actualizacion:** 2026-08-31

---

## Objetivo

Que un comprador (particular, constructora, profesional) pueda navegar el catalogo de
fabricantes/distribuidores, armar un carrito, hacer checkout y hacer seguimiento de sus
pedidos, con una experiencia de nivel PedidosYa/Rappi aplicada a materiales de
construccion.

## Que ya existe (no reimplementar)

- `/` y `/marketplace`: home y busqueda global cruzando empresas activas, con chips de
  categoria, filtros de precio y orden (`app/marketplace/page.tsx`).
- `/marketplace/[companyId]`: ficha de fabricante con catalogo agrupado por categoria.
- `/marketplace/products/[id]`: detalle de producto (galeria, variantes, stock real,
  quick add).
- `/cart`: carrito con edicion de cantidades (localStorage, `lib/cart.ts`).
- `/checkout`: flujo de 3 pasos (Direccion -> Metodo de pago -> Resumen). Requiere
  cuenta de comprador (`Buyer`) y crea un pedido por fabricante si el carrito mezcla
  productos de varias empresas (ver ADR-006).
- `/order-confirmation`: pantalla post-compra con `OrderStatusStepper` (soporta uno o
  varios pedidos via `?orderIds=`).
- `/account` y `/account/register`: login/registro de comprador (ver ADR-006).
- `/my-orders` y `/my-orders/[id]`: listado y detalle de pedidos del comprador logueado
  (`GET /buyer-orders`, ver ADR-006). Prefijo `my-` porque `/orders` ya lo usa el
  backoffice del vendedor.
- Endpoints publicos sin JWT para catalogo (`/public/*`, ver ADR-003).
- Design system compartido: `.card-ios`, `.btn-ios`, `.glass`, color primario
  `#f97316`, `BottomTabBar` mobile.

## Backlog priorizado

| # | Item | Estado | Notas |
|---|------|--------|-------|
| 1 | Historial de "Mis pedidos" (`/my-orders`, `/my-orders/[id]`, "repetir pedido") | **Implementado** | Ver ADR-004 (reemplazado por ADR-006). Ahora usa la entidad `Buyer` real en vez de `localStorage`. |
| 2 | Cuenta de comprador real (registro/login propio, entidad `Buyer`) | **Implementado (frontend + backend)** | Ver ADR-006. Registro/login simple (nombre, email, password), JWT propio, checkout obligatorio con cuenta, pedidos agrupados por fabricante. Falta mirror en mobile. |
| 3 | Libreta de direcciones (guardar/reusar direcciones de entrega) | **Implementado (backend + frontend + mobile)** | Entidad `BuyerAddress` scopeada por `buyerId` (sin FK dura, mismo criterio que `Order.buyerId`), CRUD en `/buyer-addresses` guardado con `BuyerJwtAuthGuard`. Checkout permite elegir una direccion guardada, marcar predeterminada, agregar una nueva y guardarla, o borrar. |
| 4 | Favoritos (productos/fabricantes) | **Implementado (backend + frontend)** | Entidad `BuyerFavorite` scopeada por `buyerId`, CRUD en `/buyer-favorites` guardado con `BuyerJwtAuthGuard`, pagina `/favorites`. Se descarto la version liviana con `localStorage`: la entidad `Buyer` ya existia. Falta mirror en mobile. |
| 5 | Home mas dinamica: "Pedi de nuevo", fabricantes mejor calificados, banners dinamicos | Pendiente | Los banners de la home hoy son 3 cards estaticas. |
| 6 | Rating y tiempo de entrega reales (hoy son placeholders derivados, ver `StoreCard.tsx`) | Pendiente | Requiere modelo de reviews/logistica real en el backend; no expandir el placeholder mientras tanto. |
| 7 | Pagos reales via MercadoPago en checkout | Pendiente | Hoy el paso "Metodo de pago" es solo UI (ver CHANGELOG 0.4.0). |

## Decisiones documentadas

- ADR-003: endpoint publico de solo lectura para el catalogo.
- ADR-004: historial de pedidos liviano sin entidad Buyer (reemplazado por ADR-006).
- ADR-006: cuenta de comprador real (entidad `Buyer`, JWT propio, checkout
  multi-fabricante obligatorio con cuenta).

## Fuera de alcance de este documento

- Backoffice de fabricantes (ver `docs/specs/MVP-backoffice-fabricantes.md`).
- App mobile (`packages/mobile`) — tiene su propia decision de arquitectura en
  ADR-005 y replica este mismo backlog (favoritos, libreta de direcciones, etc.
  quedan pendientes ahi tambien).
