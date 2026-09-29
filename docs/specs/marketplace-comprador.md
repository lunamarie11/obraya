# Spec: Experiencia de Comprador (Marketplace estilo PedidosYa)

**Modulo:** Front de usuarios / Marketplace
**Prioridad:** Fase 2 (Sep-Nov 2026), adelantado parcialmente sobre el cierre de Fase 1
**Estado:** En progreso
**Ultima actualizacion:** 2026-09-03 (paridad mobile: favoritos, reviews, Mercado Pago)

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
| 2 | Cuenta de comprador real (registro/login propio, entidad `Buyer`) | **Implementado (backend + frontend + mobile)** | Ver ADR-006. Registro/login simple (nombre, email, password), JWT propio, checkout obligatorio con cuenta, pedidos agrupados por fabricante. |
| 3 | Libreta de direcciones (guardar/reusar direcciones de entrega) | **Implementado (backend + frontend + mobile)** | Entidad `BuyerAddress` scopeada por `buyerId` (sin FK dura, mismo criterio que `Order.buyerId`), CRUD en `/buyer-addresses` guardado con `BuyerJwtAuthGuard`. Checkout permite elegir una direccion guardada, marcar predeterminada, agregar una nueva y guardarla, o borrar. |
| 4 | Favoritos (productos/fabricantes) | **Implementado (backend + frontend + mobile)** | Entidad `BuyerFavorite` scopeada por `buyerId`, CRUD en `/buyer-favorites` guardado con `BuyerJwtAuthGuard`, pagina `/favorites` (`app/favorites.tsx` en mobile, con boton de corazon en `StoreCard`/`ProductCard`/`Header`/perfil). Se descarto la version liviana con `localStorage`: la entidad `Buyer` ya existia. |
| 5 | Home mas dinamica: "Pedi de nuevo", fabricantes mejor calificados, banners dinamicos | **Implementado (backend + frontend)** | Ver ADR-008 y ADR-009. "Pedi de nuevo" y "Mejor calificados" listos. Banners de promos ahora salen de `Price.scheduledDiscount` real (`GET /public/promotions`); si no hay ninguna promo activa, cae a 3 banners genericos de propuesta de valor. No se replico en mobile: su home (`app/(tabs)/index.tsx`) es una grilla de busqueda, no la home promocional de `app/page.tsx` (ver ADR-005). |
| 6 | Rating real (hoy era placeholder derivado, ver `StoreCard.tsx`) | **Implementado (backend + frontend + mobile)** | Ver ADR-008. Entidad `Review`, `averageRating`/`reviewCount` reales en `/public/companies*`, formulario de calificacion en pedidos entregados (tambien en `app/my-orders/[id].tsx` y `app/company/[id].tsx` de mobile). Tiempo de entrega sigue siendo placeholder (requiere modelo de logistica real, fuera de alcance). |
| 7 | Pagos reales via MercadoPago en checkout | **Implementado (backend + frontend + mobile)** | Ver ADR-007. Checkout Pro real, `paymentUrl` devuelto al crear el pedido. En web hace `window.location.href`; en mobile abre el link con `Linking.openURL` y deja al comprador en `/order-confirmation` (el `back_urls` de Mercado Pago apunta al frontend web, no a un deep link de la app). |

## Decisiones documentadas

- ADR-003: endpoint publico de solo lectura para el catalogo.
- ADR-004: historial de pedidos liviano sin entidad Buyer (reemplazado por ADR-006).
- ADR-006: cuenta de comprador real (entidad `Buyer`, JWT propio, checkout
  multi-fabricante obligatorio con cuenta).
- ADR-008: reseñas/rating real y home dinámica ("Pedí de nuevo", mejor calificados).
- ADR-009: banners dinámicos del home a partir de descuentos programados reales.

## Fuera de alcance de este documento

- Backoffice de fabricantes (ver `docs/specs/MVP-backoffice-fabricantes.md`).
- App mobile (`packages/mobile`) — tiene su propia decision de arquitectura en
  ADR-005 y replica este mismo backlog. Ya al dia salvo el item 5 (home dinamica),
  fuera de alcance por diseno (ver nota en la tabla de arriba).
