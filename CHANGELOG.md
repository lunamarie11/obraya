# ObraYa - Registro de Cambios y Decisiones

Cada cambio importante del proyecto se documenta aqui. Las decisiones arquitectonicas formales van en `docs/adrs/`.

---

## [0.3.0] - 2026-04-09

### Decisiones Tomadas

- **App Router de Next.js 14:** Se usa el sistema de rutas con carpetas `(auth)` y `(backoffice)` como route groups para separar layouts sin afectar la URL.
- **Token en localStorage:** Decisión de MVP. En v2 migrar a httpOnly cookies para protección contra XSS. El middleware actualmente verifica cookie (no localStorage) — en v2 unificar.
- **React Query para estado server:** Todo dato del servidor se maneja con `useQuery`/`useMutation`. Sin Redux ni Context para datos remotos.
- **Precios en centavos en el frontend:** `formatARS()` convierte centavos a pesos ARS con `Intl.NumberFormat`. Nunca se hace aritmética en la UI con los valores raw.
- **22/22 tests pasando:** PricesService (8 tests: descuentos scheduled, por volumen, precedencia) y OrdersService (14 tests: transiciones válidas e inválidas, cancelación, mensajes).

### Agregado

- **Tests unitarios (22 tests, 0 fallos):**
  - `prices.service.spec.ts`: 8 casos para resolución de descuentos (volumen, programado, precedencia, fuera de fecha)
  - `orders.service.spec.ts`: 14 casos para flujo de estados (transiciones válidas/inválidas, cancelación con/sin motivo, mensajes en estado final)

- **Infraestructura:**
  - MinIO agregado al `docker-compose.yml` (puerto 9000 API, 9001 consola web)
  - `jest.config.js` configurado para el backend

- **Frontend Next.js 14 (App Router):**
  - Route groups `(auth)` y `(backoffice)` con layouts separados
  - `globals.css` con Tailwind + clases reutilizables (`.card`, `.btn-primary`, `.badge-*`)
  - `lib/api.ts`: cliente Axios con interceptor de token y auto-refresh
  - `lib/auth.ts`: login, register, logout, getStoredUser
  - Sidebar con navegación activa y color de marca (naranja ObraYa)
  - Header con avatar de usuario y rol
  - **Páginas implementadas:**
    - `/login` — formulario de login con manejo de errores
    - `/register` — registro de empresa + admin con confirmación
    - `/dashboard` — KPIs con selector de período (hoy/semana/mes), comparativa vs anterior, top productos, alerta de bajo stock
    - `/orders` — tabla paginada con filtros por estado y búsqueda, badges de estado con color
    - `/products` — grid de productos con imágenes, variantes, edición y desactivación
    - `/stock` — tabla de stock con highlight de bajo stock
    - `/reports` — descarga directa de CSV de ventas (con rango de fechas) y stock
  - `middleware.ts` para protección de rutas (redirige a /login si no hay token)
  - `tailwind.config.ts` y `next.config.js` configurados

### Pendiente

- Páginas de detalle: `/orders/:id` (detalle + chat), `/products/:id` (edición + upload imágenes)
- Página `/products/new` (formulario de creación)
- Página `/settings` (usuarios de la empresa, invitaciones)
- Migrar auth de localStorage a httpOnly cookies
- Instalar dependencias frontend (`npm install` en packages/frontend)

---

## [0.2.0] - 2026-04-09

### Decisiones Tomadas

- **Precios en centavos:** `basePrice` se almacena como entero (bigint) en centavos de ARS para evitar errores de punto flotante. $1500 → 150000. Se convierte a decimal solo al exportar.
- **Descuento programado tiene precedencia sobre volumen:** Si hay un descuento activo por fecha, no se aplica el de volumen. Evita conflictos y es el comportamiento más predecible para el usuario.
- **Soft delete en Orders nunca:** Los pedidos no se eliminan, solo se cancelan con motivo obligatorio. Requerimiento legal/auditoría.
- **Transiciones de estado validadas en backend:** La lógica de `VALID_TRANSITIONS` vive en el service, no en el frontend. El frontend no puede saltar estados inválidos aunque lo intente.
- **BOM en CSV exportados:** Se agrega `\uFEFF` al inicio del CSV para que Excel (Windows) abra correctamente los acentos sin configuración extra.
- **Dashboard compara contra período anterior:** El endpoint retorna el período actual Y el anterior para mostrar variación porcentual sin un segundo request.
- **Reportes como descarga directa:** Los endpoints de reportes responden con `Content-Disposition: attachment` para descarga directa desde el browser o Postman, no base64.

### Agregado

- **Módulo Prices:**
  - Entidad `Price` (tipo B2C/B2B, precio en centavos, precios por volumen JSONB, descuento programado JSONB)
  - Entidad `PriceHistory` (historial de cambios con motivo y usuario)
  - `GET  /api/v1/products/:id/prices` — ver precios actuales
  - `POST /api/v1/products/:id/prices` — crear o actualizar precio (upsert)
  - `GET  /api/v1/products/:id/prices/resolve?type=B2C&quantity=50` — precio final aplicando descuentos
  - `GET  /api/v1/products/:id/prices/history` — historial de cambios
  - Resolución de descuentos: primero programado, luego volumen, luego base

- **Módulo Orders:**
  - Entidades `Order`, `OrderItem`, `OrderMessage`
  - Flujo de estados validado: Nuevo→Aceptado→Preparacion→Despachado→Entregado (+ Cancelado desde cualquier estado activo)
  - `GET  /api/v1/orders` — listar con filtros (estado, fecha, búsqueda)
  - `GET  /api/v1/orders/:id` — detalle con items y mensajes
  - `PUT  /api/v1/orders/:id/status` — cambiar estado (valida transición, requiere motivo si cancela)
  - `POST /api/v1/orders/:id/messages` — enviar mensaje al comprador
  - `GET  /api/v1/orders/:id/messages` — historial del chat
  - Mensaje de sistema automático en cada cambio de estado

- **Dashboard:**
  - `GET /api/v1/dashboard/summary?period=today|week|month`
  - KPIs: ingresos totales, cantidad de pedidos, ticket medio
  - Variación porcentual vs período anterior
  - Top 10 productos por revenue
  - Pedidos por estado
  - Alertas de bajo stock (top 5)

- **Reportes:**
  - `GET /api/v1/reports/sales?from=2026-01-01&to=2026-12-31` → descarga CSV de ventas
  - `GET /api/v1/reports/stock` → descarga CSV de stock valorizado
  - CSV con BOM para compatibilidad con Excel

### Pendiente

- Migrations SQL (generar con `npm run migration:generate`)
- MinIO en docker-compose para imágenes en dev
- Tests unitarios de OrdersService (flujo de estados) y PricesService (resolución de descuentos)
- Integración AFIP para validación de CUIT al registrar empresa
- Notificaciones push/email al cambiar estado de pedido

---

## [0.1.0] - 2026-04-09

### Decisiones Tomadas

- **NestJS v11:** Se actualizó el scaffold de NestJS v10 a v11 (versión actual) para compatibilidad con `@nestjs/swagger` v11.
- **MinIO como S3 local:** Para dev se usa MinIO (docker) como reemplazo de AWS S3. El StorageService abstrae la diferencia — en producción se cambia la config sin tocar código.
- **Soft delete en productos:** `DELETE /products/:id` marca `isActive=false` en lugar de borrar la fila. Preserva historial de pedidos referenciando el producto.
- **Stock con depósito "principal" por defecto:** En MVP se trabaja con un único depósito. El modelo ya soporta múltiples (`warehouseId`), listo para expansión en Fase 2.
- **Historial de movimientos de stock:** Toda modificación de stock genera un registro en `stock_movements`. Permite auditoría y reportes de rotación.
- **Null en campos opcionales de invitación:** Al aceptar invitación se setean `inviteToken` e `inviteExpiresAt` a `null` mediante cast TypeScript (TypeORM persiste correctamente como NULL en DB).
- **ConfigModule global:** Toda la configuración se carga desde `.env` vía `@nestjs/config`. Nunca hay valores hardcodeados en código fuente.

### Agregado

- **Módulo Users:**
  - Entidad `Company` (CUIT, razón social, estado de aprobación, zonas de cobertura, datos bancarios)
  - Entidad `CompanyUser` (email, passwordHash, rol, token de invitación)
  - Roles: Admin, Vendedor, Logística, Contabilidad
  - `POST /api/v1/auth/register` — registro de empresa con usuario admin inicial
  - `POST /api/v1/auth/login` — login con JWT (access + refresh token)
  - `POST /api/v1/auth/refresh` — renovar access token
  - `POST /api/v1/companies/:id/users/invite` — invitar usuario por email
  - `POST /api/v1/companies/accept-invite` — aceptar invitación y configurar contraseña
  - JwtStrategy, JwtAuthGuard, RolesGuard
  - Decoradores: `@CurrentUser()`, `@Roles()`

- **Módulo Products:**
  - Entidad `Product` (nombre, SKU, categoría, imágenes[], ficha técnica PDF)
  - Entidad `ProductVariant` (nombre, atributos flexibles JSONB: color, tamaño, presentación)
  - CRUD completo paginado: `GET/POST/PUT/DELETE /api/v1/products`
  - Upload de imágenes (máx 10): `POST /api/v1/products/:id/images`
  - Upload de ficha técnica PDF: `POST /api/v1/products/:id/technical-sheet`
  - Import masivo CSV: `POST /api/v1/products/import`
  - `StorageService` con MinIO (dev) / S3 (prod)

- **Módulo Stock:**
  - Entidad `Stock` (por producto + variante + depósito, cantidad, reservado, alerta)
  - Entidad `StockMovement` (historial: entrada, salida, reserva, liberación, ajuste)
  - `GET /api/v1/stock` — stock actual de todos los productos
  - `GET /api/v1/stock/alerts` — productos con bajo stock
  - `GET /api/v1/stock/:productId` — stock por depósito de un producto
  - `GET /api/v1/stock/:productId/movements` — historial de movimientos
  - `PUT /api/v1/stock/:productId` — actualizar stock con registro de movimiento
  - `POST /api/v1/stock/bulk-update` — actualización masiva JSON
  - `POST /api/v1/stock/bulk-update/csv` — actualización masiva CSV

- **Infraestructura backend:**
  - Node.js v20 LTS instalado via nvm
  - `ConfigModule` con configs por dominio (app, database, jwt, storage)
  - `DatabaseModule` con TypeORM async, migrations habilitadas, sync=false
  - `data-source.ts` para TypeORM CLI
  - `main.ts` con ValidationPipe, Swagger en `/api/docs`, CORS para dev
  - `.env.example` actualizado con todas las variables

### Pendiente

- Migrations SQL de la DB (generar con `npm run migration:generate`)
- Módulo Orders (Fase 1b)
- Módulo Prices (Fase 1b)
- Integración AFIP para validación de CUIT
- MinIO en docker-compose para dev
- Tests unitarios de UsersService y StockService

---

## [0.0.1] - 2026-04-09

### Decisiones Tomadas

- **Estructura del proyecto:** Monorepo con documentacion + scaffold de codigo. Todo centralizado en `~/Documents/ObraYa/`.
- **Enfoque inicial:** Organizar toda la documentacion y arquitectura antes de escribir codigo.
- **Tipo de scaffold:** Docs completos + estructura de carpetas de codigo sin implementacion, para visualizar la arquitectura desde el dia 1.
- **Ubicacion:** `~/Documents/ObraYa/` como carpeta raiz del proyecto.
- **Herramienta de iteracion:** El proyecto esta preparado para trabajar con Claude Code via `CLAUDE.md` en la raiz.

### Agregado

- Estructura de carpetas completa: `docs/`, `packages/`, `infra/`, `tools/`
- Plan tecnico original (`docs/plan-tecnico/`)
- README principal del proyecto
- CLAUDE.md para contexto de Claude Code
- ADR-001: Eleccion de stack tecnologico
- Scaffold de codigo: backend (NestJS), frontend (Next.js), mobile (React Native)
- Specs iniciales del MVP Backoffice

### Pendiente

- Definir identidad visual (logo, paleta, design system)
- Validar modelo con fabricantes ancla
- Detallar API contracts del backoffice
- Schema de base de datos PostgreSQL
- Configuracion de CI/CD (GitHub Actions)

---

## Formato

Cada entrada sigue:
```
## [version] - YYYY-MM-DD
### Decisiones Tomadas
### Agregado / Cambiado / Eliminado
### Pendiente
```
