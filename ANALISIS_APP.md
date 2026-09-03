# Análisis de ObraYa - Estado Actual vs Roadmap

**Fecha:** 2026-06-27  
**Versión:** 0.3.0  
**Estado General:** Pre-seed, Fase 1 (MVP Backoffice) 70% completada

---

## 1. ESTADO ACTUAL

### Backend (NestJS v11)
✅ **Completado:**
- Autenticación: JWT + refresh tokens, roles (Admin/Vendedor/Logística/Contabilidad)
- Modulo Users: registro, login, invitación por email, permisos por rol
- Modulo Products: CRUD, upload imágenes (hasta 10), upload ficha técnica PDF, import CSV masivo
- Modulo Stock: CRUD por depósito, historial de movimientos, alertas de bajo stock, actualización masiva JSON/CSV
- Modulo Prices: B2C/B2B, precios por volumen, descuentos programados, resolución con precedencia, historial
- Modulo Orders: flujo de estados validado (Nuevo→Aceptado→Preparacion→Despachado→Entregado), chat con mensajes, cambio de estado con motivo obligatorio
- Modulo Dashboard: KPIs (ventas, ticket medio, pedidos, productos top), comparativa con período anterior
- Modulo Reports: exportación CSV (ventas + stock), BOM para compatibilidad Excel
- **Tests:** 22 tests (8 Prices Service + 14 Orders Service) pasando ✅

⏳ **En construcción:**
- Modulo Payments: stub (falta MercadoPago integration)
- Modulo Logistics: stub (falta gestión de repartidores, tracking)
- Modulo Notifications: stub (falta emails, push FCM)
- Modulo Analytics: stub
- Modulo Admin: stub
- Modulo Monitoring: stub

❌ **Falta:**
- Integración AFIP (validación CUIT, facturación electrónica)
- Webhooks para eventos (pedidos, pagos)
- Rate limiting + seguridad avanzada
- Caching distribuido (Redis)

### Frontend (Next.js 14 + App Router)
✅ **Completado:**
- Landing page con hero, features, screenshots, CTA
- Autenticación: login, register, logout, middleware de protección
- **Marketplace público:** listado, búsqueda, paginación, filtros (categoría, marca, precio, orden)
- **Detalle de producto:** galería de imágenes, variantes, precios con descuentos, stock, agregar al carrito
- **Carrito local:** localStorage, evento `cart:update`, badge con contador
- **Demo-login:** endpoint seguro + botón en landing con toast de confirmación
- **Backoffice (parcial):**
  - Dashboard: KPIs con selector de período, comparativa
  - Órdenes: listado + filtros
  - Productos: grid con edición/desactivación
  - Stock: tabla con highlight de bajo stock
  - Reports: descarga de CSV
  - Settings: stub

⏳ **En construcción:**
- Página de carrito (detalle, cantidad, eliminar, checkout)
- Checkout: formulario de entrega, resumen, confirmación
- Detalle de orden (tracking, chat)
- Backoffice: creación de productos, gestion de usuarios, configuración

❌ **Falta:**
- Página de tracking (mapa con ubicación en tiempo real)
- Notificaciones (toast con eventos servidor)
- Búsqueda avanzada (Elasticsearch)
- Mobile: React Native (stub solo)
- Accesibilidad completa (i18n, WCAG AA)

### Infraestructura
✅ **Implementado:**
- Docker Compose: PostgreSQL 16, Redis 7, MinIO local
- Base de datos: TypeORM con migrations (preparadas, sin ejecutar aún)
- Almacenamiento: MinIO S3-compatible en dev, listo para AWS S3 en prod
- CI/CD: stub (preparado para GitHub Actions)

❌ **Falta:**
- Kubernetes manifests
- Terraform para AWS
- Secrets management (Vault, AWS Secrets Manager)
- Monitoring: Prometheus, Grafana
- Logging: ELK stack o similar
- TLS/HTTPS en dev

### Datos y Seeds
✅ **Completado:**
- Script seed-users.ts: crea usuarios demo (password: obraya123)
- Script seed-mock-data.ts: empresas, productos, variantes, precios, stock, órdenes

❌ **Falta:**
- Más datos realistas (100+ productos, múltiples empresas, historial de órdenes)
- Categorías y subcategorías estándar (CIIU construcción)
- Imágenes reales de productos
- Data de fabricantes piloto

---

## 2. MATRIZ DE TAREAS: PRIORIDAD vs ESFUERZO

### Leyenda
- 🔴 **Alta prioridad** | 🟡 **Media** | 🟢 **Baja**
- ⚡ **Bajo esfuerzo** | 🔧 **Esfuerzo medio** | 🏗️ **Alto esfuerzo**

---

### CUADRANTE 1: Alta Prioridad + Bajo Esfuerzo (HACER YA)

| Tarea | Prioridad | Esfuerzo | Descripción | Impacto |
|-------|-----------|----------|-------------|---------|
| Datos seed más realistas | 🔴 | ⚡ | 100+ productos, 3-5 empresas, órdenes con historial | MVP funcional con data de prueba creíble |
| Mejorar landing (screenshots reales) | 🔴 | ⚡ | Capturar pantallas reales de backoffice, marketplace | Convicción de inversores / demostración |
| Link "Carrito" en header | 🔴 | ⚡ | Página `/cart` con listado de items, cantidad, subtotal | UX completa para buyers |
| Tests E2E básicos | 🟡 | ⚡ | Cypress/Playwright: login → marketplace → carrito | Confianza en flujos críticos |
| Validación cliente de formularios | 🟡 | ⚡ | react-hook-form + class-validator en DTOs | UX mejorada |
| Fix URLs fallback en interceptor (api.ts) | 🔴 | ⚡ | Asegurar consistencia http://localhost:3010 vs 3000 | Evitar bugs en dev |

**Esfuerzo total:** ~1-2 días  
**ROI:** Muy alto (demostrabilidad MVP)

---

### CUADRANTE 2: Alta Prioridad + Esfuerzo Medio (SEGUIDO)

| Tarea | Prioridad | Esfuerzo | Descripción | Impacto |
|-------|-----------|----------|-------------|---------|
| **Carrito y Checkout** | 🔴 | 🔧 | UI: carrito con qty, descuentos, envío; backend: POST /orders | MVP completado (buyers pueden comprar) |
| **Integración MercadoPago** | 🔴 | 🔧 | Webhooks, procesamiento de pagos, confirmación | Ingresos reales; transacciones seguras |
| **Órdenes: flujo completo** | 🔴 | 🔧 | Frontend detalle, cambio estado, chat; backend ya existe | Control del vendedor sobre pedidos |
| **Backoffice: dashboard mejorado** | 🔴 | 🔧 | KPIs tiempo real, filtros avanzados, graficos | Visibilidad de negocio |
| **Notificaciones: emails** | 🟡 | 🔧 | SendGrid/SES, plantillas transaccionales (nuevo pedido, estado) | Engagement + recordar a usuarios |
| **Página `/cart` completa** | 🔴 | 🔧 | Formulario de entrega, cálculo de envío, resumen | UX checkout sin fricciones |
| **Catálogo: filtros en backend** | 🟡 | 🔧 | Endpoints GET /products/filters, soporte minPrice/maxPrice/sort en BD | Filtros más rápidos en catálogos grandes |
| **Backoffice: crear/editar productos** | 🟡 | 🔧 | Formulario completo, upload imágenes, variantes | Vendedores pueden poblar catálogo sin API |

**Esfuerzo total:** ~2-3 semanas  
**ROI:** Crítico (MVP vendible)

---

### CUADRANTE 3: Alta Prioridad + Alto Esfuerzo (PLANEADO PARA FASE 1.5)

| Tarea | Prioridad | Esfuerzo | Descripción | Impacto |
|-------|-----------|----------|-------------|---------|
| **Delivery: tracking en mapa** | 🔴 | 🏗️ | Repartidores, asignaciones automáticas, Google Maps API | Diferenciador clave vs competencia |
| **Integración AFIP** | 🔴 | 🏗️ | Validación CUIT, facturación A/B, catálogo de servicios | Legal + credibilidad en Argentina |
| **Elasticsearch: búsqueda avanzada** | 🟡 | 🏗️ | Indexación de productos, relevancia, filtros FTS | Performance en catálogos 1M+ SKUs |
| **Mobile: React Native (buyers)** | 🟡 | 🏗️ | App iOS/Android con marketplace, carrito, tracking | Engagement en mobile (80% del tráfico) |
| **CI/CD: GitHub Actions + ArgoCD** | 🟡 | 🏗️ | Deploy automático, testing, rollback | Deployments confiables y rápidos |

**Esfuerzo total:** ~4-6 semanas  
**ROI:** Muy alto a largo plazo (diferenciadores)

---

### CUADRANTE 4: Media/Baja Prioridad + Bajo Esfuerzo (NICE-TO-HAVE)

| Tarea | Prioridad | Esfuerzo | Descripción | Impacto |
|-------|-----------|----------|-------------|---------|
| Documentación API (Swagger) | 🟢 | ⚡ | Generar automáticamente con `@nestjs/swagger` | Facilita integraciones |
| Design system: componentes reutilizables | 🟡 | ⚡ | Botones, inputs, cards consistency | Velocidad de dev |
| i18n básica (ES/EN) | 🟢 | ⚡ | next-i18n-router para rutas | Escalabilidad geográfica |
| WCAG AA compliance | 🟢 | ⚡ | Accesibilidad: labels, colores, navegación | Inclusividad |
| Sentry integration | 🟡 | ⚡ | Error tracking en producción | Debugging en prod |

**Esfuerzo total:** ~3-5 días

---

### CUADRANTE 5: Media/Baja Prioridad + Alto Esfuerzo (POST-MVP)

| Tarea | Prioridad | Esfuerzo | Descripción | Impacto |
|-------|-----------|----------|-------------|---------|
| Monitorización: Prometheus + Grafana | 🟢 | 🏗️ | Métricas de negocio y técnicas | Observabilidad en producción |
| Caching avanzado: Redis + CDN | 🟡 | 🏗️ | Cache de productos, precios, búsquedas | Performance (p99 < 100ms) |
| Kubernetes manifests + Terraform AWS | 🟡 | 🏗️ | IaC completa, multi-region ready | Escalabilidad automática |
| Jaeger: distributed tracing | 🟢 | 🏗️ | Trazado de requests entre servicios | Debug de latencias |
| Refactorización a microservicios | 🟢 | 🏗️ | Extracción de Orders, Payments, Logistics a services | Escalabilidad independiente (Fase 3+) |

**Esfuerzo total:** Post-MVP (no incluido en cronograma Fase 1)

---

## 3. ORDEN RECOMENDADO (PRÓXIMAS 2-3 SEMANAS)

### Sprint 1 (1 semana)
```
Semana del 2026-06-27 al 2026-07-04
```
1. **Crear `/cart` page completa** ⚡ (1 día)
   - Listar items del localStorage, qty, precio con descuento, subtotal
   - Botón "Proceder a checkout"

2. **Mejorar datos seed** ⚡ (1-2 días)
   - 100+ productos con categorías realistas
   - 5 empresas vendedoras
   - 50 órdenes con historial

3. **Fix URLs en interceptor** ⚡ (unas horas)
   - Asegurar que api.ts apunta a http://localhost:3010 consistentemente

4. **Tests E2E básicos** ⚡ (1-2 días)
   - Flujo: login → marketplace → producto → carrito → checkout

5. **Validación de formularios** 🔧 (1 día)
   - Aplicar react-hook-form en checkout y formularios del backoffice

---

### Sprint 2 (1-2 semanas)
```
Semana del 2026-07-05 al 2026-07-18
```
1. **Checkout + crear órdenes** 🔧 (3-4 días)
   - Formulario de entrega (dirección, teléfono, instrucciones)
   - Cálculo de envío (mock: tarifa fija por zona)
   - Confirmación y POST `/orders` (backend ya existe)

2. **Integración MercadoPago** 🔧 (3-4 días)
   - SDK de MP en checkout
   - Webhooks para confirmar pago
   - Actualizar estado de orden a "Aceptado" al pagar

3. **Notificaciones: emails** 🔧 (2-3 días)
   - SendGrid integration
   - Plantillas: nuevo pedido, cambio de estado

4. **Backoffice: crear productos** 🔧 (3-4 días)
   - Formulario completo de productos
   - Upload de imágenes
   - Manejo de variantes en UI

---

### Sprint 3 (1-2 semanas)
```
Semana del 2026-07-19 al 2026-08-01
```
1. **Delivery: repartidores + tracking** 🏗️ (5-7 días)
   - CRUD de repartidores
   - Asignación automática de órdenes
   - Mapa con ubicación en tiempo real (Google Maps)

2. **Integración AFIP** 🏗️ (5-7 días)
   - Validación de CUIT
   - Facturación electrónica A/B
   - Tests con web service de AFIP

---

## 4. RESUMEN DE PROGRESO

| Categoría | % Completado | Detalle |
|-----------|------------|---------|
| **MVP Backoffice (Fase 1)** | 70% | Auth ✅, Products ✅, Stock ✅, Prices ✅, Orders ✅, Dashboard ✅, Reports ✅; Falta: Delivery, AFIP, Notificaciones |
| **MVP Marketplace (Fase 2)** | 50% | Landing ✅, Listado ✅, Detalle ✅, Carrito ✅; Falta: Checkout, Pagos, Tracking |
| **Tests** | 40% | 22 tests backend; Falta: E2E, frontend unitarios, integración |
| **Infra** | 50% | Docker ✅, DB schema ✅; Falta: K8s, Terraform, Monitoring, Logging |
| **Documentación** | 60% | ADRs ✅, Specs ✅, Plan técnico ✅; Falta: API docs generadas, Runbooks |
| **Seguridad** | 40% | JWT ✅, Roles ✅; Falta: Rate limiting, AFIP, encriptación de datos sensibles |

---

## 5. RECOMENDACIONES INMEDIATAS

### 🔴 CRÍTICA
1. **Terminar Checkout + MercadoPago** antes de invitar primera ola de users (es lo que diferencia MVP demo de MVP productivo)
2. **Mejorar datos seed** para que demos sean convincentes
3. **Integrar AFIP** cuando sea legal obligatorio (validación CUIT en registro)

### 🟡 IMPORTANTE
1. Tests E2E para evitar regresiones críticas
2. Notificaciones (emails) para engagement
3. Backoffice mejorado para que vendedores usen sin soporte

### 🟢 NICE-TO-HAVE (pero no bloquea MVP)
1. Mobile app (los users la usarán pero no es MVP1)
2. Elasticsearch (busca en catálogos pequeños ya es rápida)
3. Monitorización avanzada (en MVP no hay suficiente tráfico)

---

## 6. ESTIMACIÓN TOTAL A LANZAMIENTO (AMBA)

**Scope:** MVP Backoffice + Marketplace + Delivery (Fase 1 completa)

| Componente | Semanas | Riesgo |
|-----------|---------|--------|
| Checkout + MercadoPago | 2 | Bajo (APIs bien documentadas) |
| Delivery + Tracking | 3 | Medio (complejidad de asignación) |
| AFIP + Facturación | 2 | Medio (AFIP API inestable) |
| Testing + QA | 2 | Bajo |
| Deploy en AWS | 1 | Bajo |
| **TOTAL** | **10-12 semanas** | - |

**Target:** Lanzamiento en AMBA: **Ago 31, 2026** ✅ (dentro del plan original)

---

## 7. MÉTRICAS DE ÉXITO (MVP)

- [ ] 2+ fabricantes piloto registrados y activos
- [ ] 100+ SKUs en el catálogo
- [ ] 10+ órdenes procesadas end-to-end (creación → pago → entrega → confirmación)
- [ ] Dashboard mostrando KPIs correctos
- [ ] <1% error rate en transacciones de pago
- [ ] Tiempo de respuesta: p99 < 500ms en marketplace
- [ ] Uptime: 99.5% en período de 2 semanas
- [ ] NPS > 50 entre fabricantes piloto

