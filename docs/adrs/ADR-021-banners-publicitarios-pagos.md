# ADR-021: Banners publicitarios pagos en el home (mobile y web)

**Estado:** Aceptado
**Fecha:** 2026-10-31
**Decidido por:** Fundadores ObraYa

## Contexto

El home del comprador ya tiene dos carruseles que muestran contenido
dinámico derivado de datos existentes: "Pedí de nuevo" (ADR-008) y el
carrusel de promos a partir de `scheduledDiscount` (ADR-009). Ninguno de los
dos resuelve un caso distinto: un fabricante o distribuidor que quiere pagarle
a ObraYa por aparecer destacado en el home, sin que eso dependa de tener un
descuento real cargado.

A diferencia del caso de ADR-009 — donde crear una entidad de banners fue
descartado como sobre-ingeniería porque ya existía `Price.scheduledDiscount`
— acá no hay ningún dato existente que modele "este anunciante pagó por
aparecer, con este título y este texto". El contenido lo define el
anunciante/el equipo comercial de ObraYa, no se deriva de un precio ni de un
pedido. Por eso sí se justifica una entidad nueva.

## Decisión

- Nueva entidad `SponsoredBanner` (`companyId`, `title`, `subtitle?`,
  `imageUrl?`, `ctaLabel`, `startDate`, `endDate`, `priority`, `isActive`),
  con migración `CreateSponsoredBanners`.
- Nuevo método `MarketplacePublicService.findActiveSponsoredBanners(limit =
  5)`: filtra por `isActive = true`, rango `startDate`/`endDate` vigente y
  empresa `ACTIVE`, ordenado por `priority DESC`.
- Nuevo endpoint público `GET /public/sponsored-banners` (sin JWT, ver
  ADR-003).
- CRUD en `/admin/sponsored-banners` (`JwtAuthGuard` + `SuperAdminGuard`) para
  que el equipo ObraYa dé de alta/gestione los banners pagos manualmente — no
  hay todavía un flujo de autoservicio con cobro vía MercadoPago para que un
  fabricante compre su propio espacio.
- Nuevo tipo compartido `SponsoredBanner` en `packages/shared`.
- Un solo banner activo (rotación automática cada 5s si hay más de uno) se
  muestra en:
  - **Web** (`app/page.tsx`): entre el subtítulo del hero ("Materiales de
    construcción directo de fabricantes y distribuidores.") y el buscador.
  - **Mobile** (`app/(tabs)/index.tsx`): debajo del header con buscador (el
    home mobile no tiene el bloque de hero con texto que sí tiene la web).
- El click en el banner nunca sale de la app: navega a la ficha del
  comercio anunciante (`/marketplace/:companyId` en web, `/company/:id` en
  mobile), igual que el resto de las cards de tienda del marketplace.
- Se marca explícitamente con la etiqueta "Publicidad" para distinguirlo del
  carrusel de promos (que son ofertas reales, no contenido pago).

## Justificación

- Separar `SponsoredBanner` de `PromotionBanner` evita mezclar dos conceptos
  de negocio distintos (publicidad pagada vs. descuento real) bajo el mismo
  modelo, lo que habría forzado campos opcionales sin sentido en uno u otro
  caso (ej. `discountPercent` no aplica a un banner institucional).
- Gestión manual desde `/admin` (en vez de autoservicio) es consistente con
  el estado actual del producto: no hay flujo de pago de publicidad
  implementado todavía, y no se construye por adelantado (mismo criterio
  anti-sobre-ingeniería de ADR-009).
- Navegar siempre dentro de la app (nunca a una URL externa) evita que
  ObraYa pierda control de la experiencia del comprador y evita superficie
  de riesgo (links externos no auditados por el equipo).

## Consecuencias

- Para que un fabricante aparezca en el banner, el equipo ObraYa tiene que
  darlo de alta manualmente vía `/admin/sponsored-banners` — no es
  autoservicio.
- El home (web y mobile) depende de un endpoint público adicional
  (`GET /public/sponsored-banners`); si no hay ningún banner activo, la
  sección simplemente no se renderiza (no hay fallback genérico, a diferencia
  de ADR-009, porque no tiene sentido inventar un banner publicitario falso).

## Riesgos

- **Bajo**: si el equipo ObraYa carga fechas `startDate`/`endDate` mal
  puestas, el banner simplemente no aparece — mismo riesgo ya aceptado en
  ADR-009 para las promos.
