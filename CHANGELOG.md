# ObraYa - Registro de Cambios y Decisiones

Cada cambio importante del proyecto se documenta aqui. Las decisiones arquitectonicas formales van en `docs/adrs/`.

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
