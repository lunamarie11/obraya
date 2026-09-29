# ADR-016: Permisos granulares — Logística puede configurar zonas de entrega

**Estado:** Aceptado
**Fecha:** 2026-09-29
**Decidido por:** Fundadores ObraYa

## Contexto

`docs/specs/MVP-backoffice-fabricantes.md` define 4 roles: Admin, Vendedor,
Logística ("procesa pedidos y configura entregas") y Contabilidad.
`docs/roadmap-estado-actual.md` marcaba como pendiente de verificar si esos
permisos por sección estaban implementados a fondo, más allá del rol.

Al auditar el código se encontró que `PUT /companies/:id`
(`UsersController.updateCompany`) era **Admin-only** y manejaba en un solo
endpoint tanto datos sensibles (`bankingData`) como `deliveryZones`
(zonas de entrega, ver ADR-012). Esto significaba que un usuario Logística
nunca podía configurar zonas de entrega pese a que la spec lo asigna
explícitamente a ese rol — el único camino era pedirle a un Admin que lo
hiciera. Además el endpoint usaba `@Body() dto: any` sin DTO ni
`class-validator`, violando la convención del proyecto (`CLAUDE.md`).

El campo `CompanyUser.permissions: Record<string, boolean>` existe en la
entidad pero está comentado como diferido a v2 ("por ahora el rol define
todo") — no se usa en ningún guard ni service. Este ADR no lo activa: sigue
fuera de alcance, la solución aquí es a nivel de rol, no de permiso
por-usuario.

## Decision

- **`PUT /companies/:id` se divide en dos endpoints**, cada uno con su
  propio DTO validado (`UpdateCompanyDto` / `UpdateDeliveryZonesDto`) y su
  propio scope de `@Roles()`:
  - `PUT /companies/:id` — perfil (`phone`, `address`, `city`, `province`)
    y `bankingData`. Sigue siendo `@Roles(Admin)`: los datos bancarios son
    sensibles y no forman parte de lo que la spec asigna a Logística.
  - `PUT /companies/:id/delivery-zones` — únicamente `deliveryZones`.
    `@Roles(Admin, Logistica)`.
- **`UsersService.updateCompany` se divide** en `updateCompanyProfile` (sin
  `deliveryZones`) y `updateDeliveryZones` (solo `deliveryZones`).
- **Frontend (`settings/page.tsx`)**: la tarjeta "Datos de la empresa" +
  "Datos bancarios" solo se renderiza si `role === 'Admin'`; la tarjeta
  "Zonas de entrega" se renderiza para `Admin` o `Logistica`, con su propio
  botón de guardado que llama al nuevo endpoint. La sección "Usuarios de la
  empresa" (invitar/listar) también se ocultó para no-Admin: esos endpoints
  ya eran Admin-only en el backend, mostrarla a Logística solo generaba un
  403 silencioso.
- **Sidebar**: se agrega un link "Zonas de entrega" al nav de Logística
  (`DELIVERY_NAV`), que antes solo tenía "Mis Entregas" e "Historial" y no
  tenía ninguna forma de llegar a `/settings`.
- **Tests nuevos**: `RolesGuard` (sin tests hasta ahora) y los dos métodos
  nuevos de `UsersService`.

## Justificacion

- Separar el endpoint por sensibilidad de datos (bancario vs. operativo) es
  más seguro y más simple que activar el sistema de permisos por-usuario
  (`CompanyUser.permissions`) para un solo caso puntual — ese sigue
  quedando para v2 si aparecen más casos de permisos finos dentro de un
  mismo rol.
- Mismo patrón que el resto del proyecto: `RolesGuard` + `@Roles()` ya
  existía, solo hacía falta usarlo con más granularidad en este endpoint
  puntual, no rediseñar el sistema de autorización.
- DTOs con `class-validator` en vez de `dto: any` corrige una desviación de
  la convención del proyecto, no solo el problema de permisos.

## Consecuencias

- Un cliente HTTP que antes mandaba `deliveryZones` junto con `bankingData`
  en un solo `PUT /companies/:id` ahora necesita dos llamadas. Sin impacto
  real: el único consumidor es el frontend propio, ya actualizado.
- Logística ahora tiene una entrada nueva en el sidebar y puede ver/guardar
  la tarjeta de zonas en `/settings`, pero no ve el resto de la página
  (datos de empresa, bancarios, usuarios).

## Riesgos

- **Bajo**: `GET /companies/:id` sigue sin `@Roles()` (cualquier usuario
  autenticado de cualquier rol puede leer perfil + bancario de su propia
  empresa). No se tocó en este cambio — la spec no restringe lectura por
  rol, solo escritura, y tocarlo es un cambio de alcance mayor no pedido.
