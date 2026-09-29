# ADR-008: Reseñas/rating real y home dinámica (Pedí de nuevo, mejor calificados)

**Estado:** Aceptado
**Fecha:** 2026-09-03
**Decidido por:** Fundadores ObraYa

## Contexto

`docs/specs/marketplace-comprador.md` tenía dos items del backlog pendientes y
relacionados entre sí:

- **#6 Rating y tiempo de entrega reales**: `StoreCard.tsx` calculaba un rating
  "placeholder" determinístico (hash del `id` de la empresa, número entre 4.0 y 4.9)
  porque no existía ningún modelo de reviews. El spec era explícito en no expandir ese
  placeholder mientras tanto.
- **#5 Home más dinámica**: "Pedí de nuevo" y "fabricantes mejor calificados" —
  este segundo punto depende directamente de #6 (no se puede mostrar "mejor
  calificados" sin un rating real).

Por esa dependencia se resolvieron en el mismo cambio: primero el modelo de rating
real (#6), después las secciones dinámicas del home (#5) que lo consumen.

El tiempo de entrega (ETA) sigue siendo placeholder — requiere un modelo de logística
real (rutas, zonas, tiempos históricos) que está fuera de alcance de este ADR y de la
Fase 2 (Google Maps queda planificado recién para Fase 4 según `CLAUDE.md`).

## Decisión

### 1. Modelo de reseñas (`packages/backend/src/modules/reviews/`)

- Entidad `Review` (tabla `reviews`): `buyerId`, `companyId`, `orderId` (único — un
  pedido admite como máximo una reseña), `rating` (1-5), `comment` (opcional),
  `createdAt`. Sin FK dura a `Buyer`/`Order`/`Company`, mismo criterio que
  `BuyerFavorite`/`BuyerAddress`/`Order` (ver ADR-006).
- `ReviewsService.create()` valida, contra el repositorio de `Order` inyectado
  directamente (no vía `OrdersService`, para no crear una dependencia circular con
  `OrdersModule` — mismo patrón que `PaymentsController` en ADR-007): que el pedido
  exista, que pertenezca al comprador (`ForbiddenException` si no), que esté en estado
  `Entregado` (`BadRequestException` si no) y que no tenga ya una reseña
  (`ConflictException` si la tiene).
- `BuyerReviewsController` (`/buyer-reviews`, `BuyerJwtAuthGuard`): `POST` para
  calificar, `GET /mine` para listar las reseñas propias.
- `ReviewsService.getAggregatesForCompanies()` resuelve `averageRating`/`reviewCount`
  en batch (una sola query con `GROUP BY companyId`) para evitar N+1 al listar varias
  empresas; `getAggregateForCompany()` es el caso de una sola empresa.

### 2. Rating real en el marketplace público

- `MarketplacePublicService` inyecta `ReviewsService` (vía `ReviewsModule` importado en
  `MarketplaceModule`) y extiende `toPublicCompany()` con `averageRating`/`reviewCount`
  reales, tanto en `findActiveCompanies()` (batch) como en `findActiveCompany()`
  (individual).
- Nuevo endpoint público `GET /public/companies/:id/reviews` (paginado) para listar las
  reseñas de una empresa.
- `StoreCard.tsx` y la ficha de fabricante (`/marketplace/[companyId]`) muestran el
  rating real; si `reviewCount === 0` se muestra "Nuevo" en vez de inventar un número.
  El placeholder de ETA no se tocó (sigue fuera de alcance, ver Contexto).
- Formulario de calificación en `/my-orders/[id]`: solo visible si `order.status ===
  'Entregado'`; si el comprador ya calificó ese pedido, se muestra en modo lectura.

### 3. Home dinámica (`packages/frontend/src/app/page.tsx`)

- **"Mejor calificados"**: no se agregó ningún endpoint nuevo — se reordena
  client-side la respuesta ya existente de `GET /public/companies` (que ahora trae
  `averageRating` real) filtrando por `reviewCount > 0` y tomando el top 6. Evita una
  ruta redundante que devolvería exactamente el mismo dato reordenado en el backend.
- **"Pedí de nuevo"**: solo para comprador logueado con pedidos previos. Se derivan los
  `productId` distintos de los pedidos más recientes (`GET /buyer-orders`, ya existente)
  y se re-resuelven contra `GET /public/products/:id` (con `useQueries` en paralelo)
  para mostrar precio/imagen/stock **actuales**, no los del pedido histórico — mismo
  criterio de "Postgres como fuente de verdad" que ya aplica en ADR-007 para precio y
  stock del catálogo. Si un producto fue dado de baja, la query individual falla
  silenciosamente (`retry: false`) y simplemente no aparece en la sección.

## Justificación

- Resolver #6 antes que #5 no es solo orden de backlog: es una dependencia de datos
  real (no se puede ordenar por rating sin que el rating exista).
- Reusar `GET /public/companies` para "mejor calificados" y `GET /buyer-orders` para
  derivar "pedí de nuevo" evita endpoints nuevos que duplicarían lógica ya resuelta —
  consistente con no crear abstracciones para necesidades que ya cubre el dato existente.
- Mantener el ETA como placeholder explícito (en vez de inventar un modelo de logística
  apurado) es la misma decisión ya tomada en el spec original: mejor un placeholder
  honesto que un dato falso con apariencia de real.

## Consecuencias

- El marketplace público (`/public/companies*`) ahora depende de `ReviewsModule` —
  cualquier cambio futuro a la agregación de rating impacta directamente el home y las
  fichas de fabricante.
- Sin reseñas todavía sembradas en desarrollo/staging, "Mejor calificados" no se
  muestra (la sección se oculta por completo si `topRated.length === 0`), y todas las
  empresas muestran "Nuevo" en el badge de rating.
- "Pedí de nuevo" agrega hasta 8 requests en paralelo a `/public/products/:id` en la
  home cuando el comprador tiene historial — aceptable al volumen actual de catálogo;
  si se vuelve un problema de performance, la alternativa es un endpoint batch
  `GET /public/products?ids=...`, no implementado por no ser necesario todavía.

## Riesgos

- **Bajo**: `Review.orderId` único a nivel de columna en vez de índice compuesto
  `(buyerId, orderId)` — es intencional (un pedido pertenece a un solo comprador, así
  que son equivalentes), pero si en el futuro un pedido pudiera tener múltiples
  compradores asociados, este constraint dejaría de ser correcto.
- **Bajo**: sin reseñas de prueba sembradas (`seed-users.ts` no fue tocado), el rating
  real es indistinguible del placeholder anterior hasta que haya reseñas reales en la
  base — no bloquea el uso, pero conviene sembrar algunas para validar la UI antes de
  mostrarla a fabricantes piloto.
