# ObraYa - Roadmap: estado actual y pendientes para el lanzamiento

**Fecha:** 2026-09-19
**Objetivo:** foto del estado real del código vs. el plan de fases de `CLAUDE.md`, para saber
qué falta para cerrar Fase 2 y llegar a Fase 3 (lanzamiento AMBA, Dic 2026).

---

## Fase 1 - MVP Backoffice Fabricantes (Jun-Ago 2026)

Ver `docs/specs/MVP-backoffice-fabricantes.md`.

| Item | Estado |
|---|---|
| Registro de empresa (CUIT, razón social, banco) | Implementado |
| Validación de CUIT contra AFIP | Implementado (ADR-010) |
| CRUD de productos + variantes + imágenes | Implementado |
| Import masivo de productos por CSV | Implementado (`POST /products/import`) |
| Gestión de stock (por depósito, alertas, CSV masivo) | Implementado |
| Precios B2B/B2C, por volumen, descuentos programados | Implementado |
| Gestión de pedidos (estados, rechazo, chat con comprador) | Implementado (`order-message.entity`) |
| Facturación electrónica (Factura B/C) | Implementado (ADR-010), **Factura A no soportada** (limitación de modelo, no bug) |
| Dashboard de ventas + KPIs | Implementado |
| Reportes (ventas, stock) exportables | Implementado |
| Roles y permisos (Admin/Vendedor/Logística/Contabilidad) | Implementado a nivel de rol (`RolesGuard`), con permisos granulares por sección donde la spec lo requiere: Logística puede configurar zonas de entrega sin acceso a datos bancarios/perfil, que son Admin-only (ver ADR-016, 2026-09-29) |
| Invitación de usuarios por email | Implementado (ADR-011): `EmailService` envía por AWS SES, patrón best-effort (se deshabilita solo si faltan credenciales); usado en `UsersService.inviteUser()` |
| Configuración logística (zonas, tiempos, costo de envío) | Implementado (ADR-012): `Company.deliveryZones` con `promisedHours`, `shippingCost` y `fleetType` por zona; `coverageZones` quedó como getter derivado para compatibilidad |

**Fase 1 está funcionalmente cerrada.** Esta tabla quedó desactualizada respecto al resumen ejecutivo (que sí reflejaba el estado real); corregido el 2026-09-29.

---

## Fase 2 - Front de Usuarios / Marketplace Comprador (Sep-Nov 2026)

Ver `docs/specs/marketplace-comprador.md`. Todo el backlog priorizado (7 items) está
**Implementado** en backend + frontend + mobile:

1. Historial de pedidos (`/my-orders`)
2. Cuenta de comprador real (`Buyer`, JWT propio) — ADR-006
3. Libreta de direcciones
4. Favoritos
5. Home dinámica ("Pedí de nuevo", mejor calificados, banners de promos reales) — ADR-008/009
6. Rating/reseñas reales
7. **Mercado Pago (Checkout Pro) en checkout** — ADR-007, ya integrado

Fase 2 está funcionalmente **cerrada**. Lo único fuera de alcance por diseño:
- ~~Tiempo de entrega real en la ficha de fabricante (placeholder; requiere logística real).~~
  Resuelto (2026-09-29, ver ADR-012 "Actualización"): `StoreCard.tsx` (web y mobile) ya
  muestra `min/maxPromisedHours` real agregado de `Company.deliveryZones`, no un
  placeholder. Sigue faltando el ETA en vivo de un repartidor (eso sí requiere
  logística real, Fase 4).
- Home dinámica en mobile (arquitectura distinta a la web, decisión tomada en ADR-005).

---

## Infraestructura transversal (portada desde el codebase B, ver ADR-007)

| Item | Estado |
|---|---|
| Mercado Pago (Checkout Pro + webhook) | Implementado |
| Notificaciones push (Firebase FCM) | Implementado (best-effort si no hay credenciales) |
| Búsqueda (Elasticsearch) | Implementado, con fallback a `ILIKE` si ES no está disponible |
| Seguridad de producción (CORS por entorno, rate limiting, sanitización XSS, Winston, helmet) | Implementado |

**Deuda técnica anotada:**
- ~~Elasticsearch: falta endpoint/script de reindexado masivo (`reindexAll`).~~
  Resuelto: `ProductsService.reindexAll()` (batches de 500) + `POST
  /admin/search/reindex` (`SuperAdminGuard`), con botón en
  `/superadmin/products` (ver ADR-007). Este doc quedó desactualizado —
  ya estaba resuelto desde antes del snapshot de 2026-09-19.
- Pin de `@nestjs/elasticsearch@11.1.0` (v12 es ESM-only, rompe el build CJS) — revisar al actualizar dependencias.

---

## Fase 3 - Lanzamiento AMBA (Dic 2026)

No hay spec propio todavía en `docs/specs/`. Los pendientes de Fase 1 (email
transaccional, config logística mínima) ya están resueltos (ver tabla arriba).
Para llegar a un lanzamiento real en AMBA faltaría definir:

- ~~Aprobación manual de fabricantes~~ — **Implementado**: `Company.status = PENDING`,
  `AdminService.updateCompanyStatus()` aprueba/rechaza (`approvedAt`/`approvedBy`).
- Monitoreo/observabilidad en producción más allá de lo que ya hay en `modules/monitoring/`.
- Checklist de deploy (env vars de producción, `JWT_SECRET` nuevo — ver memoria de recordatorios de producción).

---

## Fase 4 - Logística real (post-lanzamiento)

`packages/backend/src/modules/logistics/logistics.module.ts` es **enteramente un stub**
(comentado): sin entidades, sin controllers, sin services. Fleet management,
integración con transportistas (Andreani, OCA), ruteo con Google Maps e
integración con transportistas siguen sin empezar. Es coherente con el plan
(Fase 4, post-validación).

**Corrección (2026-09-29):** ya existe un flujo básico de repartidor: rol
`Logistica` con rutas `/delivery`, `/delivery/[id]` y `/delivery/history`
en el frontend (backoffice), que lista pedidos en estado `Despachado` y
permite marcarlos como `Entregado` (`PUT /orders/:id/status`).

**Fase 4a (2026-09-29, ver ADR-017 y `docs/specs/fase4a-repartidores-asignacion.md`):**
implementada la asignación real de pedidos: `POST /orders/:id/claim`
(claim atómico, evita que dos repartidores tomen el mismo pedido) y
`PUT /orders/:id/unassign`; `GET /orders` soporta filtros `unassigned` y
`assignedToMe`; solo el repartidor que tiene el pedido asignado (o un
`Admin`) puede marcarlo `Entregado`. La comisión ahora es configurable por
empresa (`Company.driverCommissionPercent`, default 8%), ya no está
hardcodeada en el frontend. **Limitaciones que siguen pendientes:** no hay
entidad `Driver` separada (se sigue usando el rol `Logistica` como
repartidor), no hay tracking en vivo ni geolocalización, y no hay
integración con transportistas externos — eso queda para Fase 4b/c/d.

**Fase 4b (2026-10-07, ver ADR-018 y `docs/specs/fase4b-tracking-repartidores.md`):**
implementado tracking en vivo de repartidores. Mientras un repartidor tiene
un pedido `Despachado` asignado, `/delivery` reporta su posición (Geolocation
API del navegador, sin app mobile nueva) vía `PUT /logistics/location` cada
~15s; `GET /logistics/locations` devuelve solo repartidores con pedido activo
en este momento (cruce con `OrdersService.findActiveAssignments`, no solo la
última fila de `DriverLocation`). Nueva pantalla `/delivery/map` (Admin y
Logística) muestra las posiciones en un mapa Leaflet + OpenStreetMap, con
polling de 15s (mismo patrón que el resto de `/delivery`). Sin WebSockets, sin
tabla de historial (upsert de una sola fila por repartidor), sin Google Maps.
**Limitaciones que siguen pendientes:** no cubre pantalla bloqueada/pestaña
cerrada, no hay recorrido/replay de la entrega, no hay tracking para el
comprador, y sigue sin existir integración con transportistas externos ni
ruteo optimizado — eso queda para Fase 4c/4d.

---

## Resumen ejecutivo

**Nota (2026-09-29):** esta sección quedó desactualizada respecto al resto del
documento — los 4 gaps listados abajo ya se resolvieron en commits
posteriores (ver CHANGELOG 0.11.0 a 0.18.0 y ADR-011/012/014). Ver
`docs/checklist-deploy-produccion.md` para el estado real y actualizado de
lo que falta antes de un deploy a producción (ese sí se mantiene al día).

- **Fase 1 y Fase 2:** funcionalmente completas. Mercado Pago, AFIP, marketplace de
  comprador (web + mobile) y backoffice de fabricantes ya están implementados.
- ~~**Gaps concretos antes de un lanzamiento real:**~~
  1. ~~Email transaccional real (invitaciones, notificaciones) — hoy no se envía nada.~~ Resuelto, ver ADR-011.
  2. ~~Reindexado masivo de Elasticsearch.~~ Resuelto.
  3. ~~Config logística por zona (costos, tiempos) más allá del array simple de `coverageZones`.~~ Resuelto, ver ADR-012.
  4. ~~Checklist de producción (secrets, monitoreo).~~ Resuelto, ver ADR-014 y `docs/checklist-deploy-produccion.md` (incluye ahora también la migration inicial de TypeORM, generada y verificada el 2026-09-29).
- **Logística real (Fase 4)** es la pieza grande que falta desde cero, pero está fuera de
  alcance hasta después del lanzamiento según el plan original.
