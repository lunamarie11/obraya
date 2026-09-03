# ADR-003: Endpoint público de solo lectura para el marketplace del comprador

**Estado:** Aceptado
**Fecha:** 2026-07-21
**Decidido por:** Fundadores ObraYa

## Contexto

El rediseño de la experiencia de comprador (estilo Rappi/PedidosYa: grid de fabricantes, catálogo por tienda, búsqueda global) necesita navegación anónima, sin login.

Investigando el backend actual se confirmó que `GET /products` y `GET /products/:id` (`ProductsController`) están protegidos con `JwtAuthGuard` a nivel de clase y scopeados siempre a `user.companyId` — es decir, son la API de inventario del backoffice (cada empresa ve solo su propio catálogo), reutilizada hasta ahora como si fuera el marketplace. No existe ningún endpoint que liste empresas o productos cruzando compañías, ni una ruta pública sin JWT.

## Decisión

Se agrega un módulo nuevo y aditivo, `MarketplaceModule` (`packages/backend/src/modules/marketplace/`), con un controller sin guards (`MarketplacePublicController`, prefijo `/public`):

- `GET /public/companies` — empresas con `status = ACTIVE`.
- `GET /public/companies/:id` — detalle de una empresa activa.
- `GET /public/companies/:id/products` — catálogo activo de una empresa (paginado, búsqueda, categoría).
- `GET /public/products` — búsqueda/listado de productos cruzando todas las empresas activas (paginado, búsqueda, categoría). Es lo que permite que `/marketplace` funcione como "buscar en todos los fabricantes", igual que el buscador global de Rappi/PedidosYa.
- `GET /public/products/:id` — detalle público de un producto. Acepta `?variantId=&quantity=` opcionales para resolver el precio final (igual que `/products/:id/prices/resolve`, pero sin requerir JWT), así el selector de variante y el stepper de cantidad del detalle de producto también funcionan para un visitante anónimo. También devuelve `availableStock` (suma de `quantity - reservedQuantity` de todos los depósitos, sin exponer detalle interno de depósitos/alertas).

### Bug encontrado y corregido tras el primer deploy

El detalle de producto original reutilizaba `GET /stock/:productId` (módulo Stock) para mostrar disponibilidad. Ese endpoint requiere JWT y está scopeado al `companyId` del usuario logueado (pensado para que cada empresa vea solo su propio inventario). Al habilitar la navegación cruzando empresas, cualquier usuario logueado (ej. una cuenta demo de un fabricante) veía **"sin stock" en TODOS los productos que no fueran de su propia empresa**, aunque tuvieran stock real — rompiendo "Agregar al carrito" para casi todo el catálogo. Se corrigió agregando `availableStock` al `GET /public/products/:id` (suma sin scoping por compañía, ya que es información pública de disponibilidad, no de gestión de inventario) y el frontend dejó de llamar a `GET /stock/:productId` desde el detalle de producto.

No se modifica `ProductsController`, `AdminController` ni ningún guard existente. No hay migraciones: el módulo reutiliza columnas ya existentes de `Company` y `Product`, y reusa `PricesService.resolve()` (sin duplicar la lógica de descuentos) para adjuntar el precio B2C resuelto a cada producto.

`Company` no tiene (ni se le agregan) campos de `rating` ni de tiempo estimado de entrega. Esos valores se muestran en el frontend como placeholders derivados (ej. ETA a partir de la cantidad de `coverageZones`), nunca como datos fabricados en el backend.

## Justificación

- Mantiene el principio de "no tocar rutas guardadas existentes": agregar una ruta pública dentro de `ProductsController` hubiera obligado a mover el guard de clase a nivel de método en cada ruta ya existente.
- Es mecánicamente extraíble más adelante (ver ADR-002) si el catálogo público crece en complejidad.
- Evita agregar campos especulativos (rating/ETA) al modelo de datos antes de tener una fuente real de esa información.

## Consecuencias

- El comprador anónimo puede navegar el catálogo completo, pero el checkout (`POST /orders`) sigue requiriendo sesión autenticada — no se habilita guest checkout en este pase (decisión explícita, ver `docs/specs/MVP-backoffice-fabricantes.md` y el plan de rediseño de comprador).
- `GET /stock/:id` sigue protegido; el detalle de producto para visitantes anónimos debe degradar el bloque de stock en vez de fallar.
- Cuando exista un modelo real de rating/ETA (repartidores, reviews), este ADR debe actualizarse para reemplazar los placeholders del frontend por datos reales expuestos acá.
