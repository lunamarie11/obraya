# ADR-009: Banners dinámicos del home a partir de descuentos programados reales

**Estado:** Aceptado
**Fecha:** 2026-09-03
**Decidido por:** Fundadores ObraYa

## Contexto

`docs/specs/marketplace-comprador.md` backlog #5 ("Home más dinámica") quedó
"implementado parcial" en ADR-008: "Pedí de nuevo" y "Mejor calificados" ya
consumían datos reales, pero el carrusel de promos seguía siendo 3 cards
estáticas hardcodeadas (`PROMOS` en `app/page.tsx`), sin relación con ninguna
oferta real vigente.

La alternativa obvia — crear una entidad/CMS de banners administrable por el
equipo ObraYa — es sobre-ingeniería en esta etapa: ya existe un dato real de
"producto en oferta ahora" en `Price.scheduledDiscount` (`discountPercent`,
`startDate`, `endDate`, `label` opcional), usado desde el MVP de precios
(`PricesService.resolve()`) para calcular el precio final que ve el
comprador. Ningún fabricante lo estaba usando todavía para comunicarlo en el
home.

## Decisión

- Nuevo método `MarketplacePublicService.findActivePromotions(limit = 6)`:
  busca `Price` con `scheduledDiscount` no nulo, `type = B2C`, `isActive =
  true`, cuyo producto esté activo y pertenezca a una empresa `ACTIVE`, y cuyo
  rango `startDate`/`endDate` incluya el momento actual (comparación de fechas
  dentro del JSONB vía `(price.scheduledDiscount->>'startDate')::timestamptz`,
  mismo enfoque que ya usa `PricesService.resolve()` en memoria — acá se hace
  en SQL porque se filtra contra todas las empresas, no un solo precio ya
  cargado). Devuelve un array de banners: `productId`, `productName`, `image`,
  `companyId`, `companyName`, `label`, `discountPercent`, `basePrice`,
  `finalPrice`.
- Nuevo endpoint público `GET /public/promotions` (sin JWT, mismo criterio que
  el resto de `/public/*`, ver ADR-003).
- Nuevo tipo compartido `PromotionBanner` en `packages/shared`.
- `app/page.tsx`: el carrusel de promos ahora pide `GET /public/promotions`.
  Si hay resultados, muestra esas ofertas reales (click navega al producto).
  Si no hay ninguna (nadie programó un descuento todavía — esperable en
  desarrollo/staging sin datos sembrados), cae a los 3 banners genéricos de
  propuesta de valor que ya existían ("Envío el mismo día", etc.), que no son
  data falsa sino afirmaciones generales del negocio.

## Justificación

- Reusar `scheduledDiscount` evita crear una entidad nueva y un panel de
  administración para algo que el modelo de precios ya resuelve — mismo
  criterio anti-sobre-ingeniería aplicado en ADR-008 para "Mejor calificados"
  (reusar `/public/companies` en vez de un endpoint nuevo). Si en el futuro el
  negocio necesita banners sin un producto asociado (ej. institucionales), eso
  sí ameritaría una entidad propia — no se construye por adelantado.
- El fallback a los banners genéricos (en vez de ocultar la sección) evita que
  el hero del home quede vacío en un marketplace temprano sin fabricantes que
  todavía programen descuentos, sin inventar una oferta que no existe.

## Consecuencias

- Para que un fabricante aparezca en el carrusel de promos del home, alcanza
  con cargar un `scheduledDiscount` en cualquiera de sus precios B2C — no
  requiere ninguna acción adicional del equipo ObraYa.
- El home depende de una query SQL con casteo de JSONB a timestamp; si el
  volumen de precios con descuentos programados crece mucho, conviene
  indexar por fecha (no es necesario al volumen actual).

## Riesgos

- **Bajo**: si un fabricante carga un descuento con fechas mal puestas (ej.
  `endDate` en el pasado), el producto simplemente no aparece — no hay
  validación de que `startDate < endDate` en `SetPriceDto` todavía. No bloquea
  el uso pero podría generar confusión ("cargué la promo y no aparece").
