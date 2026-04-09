# Spec: MVP Backoffice Fabricantes

**Modulo:** Backoffice Fabricantes / Distribuidores
**Prioridad:** MVP (Fase 1 - Jun-Ago 2026)
**Estado:** Borrador
**Ultima actualizacion:** 2026-04-09

---

## Objetivo

Construir el panel de control para que fabricantes y distribuidores gestionen su presencia en ObraYa. Es el primer modulo a desarrollar porque sin oferta no hay demanda.

## Usuarios del modulo

- **Admin de empresa:** Gestiona toda la cuenta (CUIT, datos bancarios, usuarios)
- **Vendedor:** Gestiona productos, precios y stock
- **Logistica:** Procesa pedidos y configura entregas
- **Contabilidad:** Accede a reportes y facturacion

## Funcionalidades MVP

### 1. Registro de Empresa
- Alta con CUIT, razon social, logo, datos bancarios
- Zonas de cobertura (seleccion en mapa o por codigo postal)
- Validacion de CUIT contra AFIP (web service)
- Aprobacion manual por equipo ObraYa en v1, automatica en v2

### 2. Gestion de Productos
- CRUD completo de productos
- Campos: nombre, SKU, descripcion, categoria, subcategoria, marca
- Imagenes multiples (hasta 10 por producto)
- Fichas tecnicas (PDF adjunto)
- Variantes: tamano, color, presentacion
- Import masivo via CSV

### 3. Gestion de Stock
- Stock por deposito/sucursal
- Alertas configurables de bajo stock
- Actualizacion masiva por CSV
- Historial de movimientos de stock
- Reserva automatica al confirmar pedido

### 4. Gestion de Precios
- Precio B2C (consumidor final con IVA)
- Precio B2B (mayorista, sin IVA)
- Precios por volumen (ej: >100 unidades = -10%)
- Descuentos programados (fecha inicio/fin)
- Historial de cambios de precio

### 5. Gestion de Pedidos
- Listado con filtros: estado, fecha, cliente, monto
- Flujo de estados: Nuevo -> Aceptado -> En preparacion -> Despachado -> Entregado
- Rechazo con motivo obligatorio
- Impresion de remito/orden de despacho
- Chat con el comprador (mensajes predefinidos + libre)

### 6. Dashboard de Ventas
- KPIs: ventas del dia/semana/mes, ticket medio, productos top 10
- Grafico de ventas por periodo
- Conversion: visitas al perfil vs pedidos
- Comparativa con periodo anterior

### 7. Reportes
- Exportacion a Excel/CSV
- Filtros: periodo, categoria, producto, estado de pedido
- Reporte de stock valorizado
- Reporte de ventas por producto/categoria

### 8. Configuracion Logistica
- Zonas de entrega (poligonos en mapa o codigos postales)
- Tiempos prometidos por zona
- Tipo de flota: propia, tercerizada, retiro en local
- Costo de envio por zona y peso/volumen

### 9. Gestion de Usuarios
- Roles: Admin, Vendedor, Logistica, Contabilidad
- Permisos granulares por seccion
- Invitacion por email
- Log de actividad por usuario

### 10. Notificaciones
- Nuevo pedido (push + email)
- Stock critico (push + email)
- Pedido cancelado/devolucion
- Configuracion de preferencias de notificacion

## Endpoints API (borrador)

```
POST   /api/v1/companies              # Registro de empresa
GET    /api/v1/companies/:id           # Detalle de empresa
PUT    /api/v1/companies/:id           # Actualizar empresa

GET    /api/v1/products                # Listar productos (paginado)
POST   /api/v1/products                # Crear producto
PUT    /api/v1/products/:id            # Actualizar producto
DELETE /api/v1/products/:id            # Eliminar producto
POST   /api/v1/products/import         # Import masivo CSV

GET    /api/v1/stock                   # Stock actual
PUT    /api/v1/stock/:productId        # Actualizar stock
POST   /api/v1/stock/bulk-update       # Actualizacion masiva

GET    /api/v1/orders                  # Listar pedidos
GET    /api/v1/orders/:id              # Detalle pedido
PUT    /api/v1/orders/:id/status       # Cambiar estado
POST   /api/v1/orders/:id/messages     # Enviar mensaje

GET    /api/v1/dashboard/summary       # KPIs del dashboard
GET    /api/v1/reports/sales           # Reporte de ventas
GET    /api/v1/reports/stock           # Reporte de stock
```

## Modelo de datos (entidades principales)

- Company: id, cuit, razon_social, logo_url, datos_bancarios, zonas_cobertura, status
- Product: id, company_id, sku, nombre, descripcion, categoria_id, marca, imagenes[], ficha_tecnica_url
- ProductVariant: id, product_id, nombre, sku_variante, atributos{}
- Stock: id, product_id, variant_id, deposito_id, cantidad, reservado, minimo_alerta
- Price: id, product_id, variant_id, tipo (B2C/B2B), precio, precio_volumen[], descuento_programado{}
- Order: id, company_id, buyer_id, items[], estado, total, direccion_entrega, created_at
- CompanyUser: id, company_id, user_id, rol, permisos[]

## Dependencias

- Integracion AFIP para validacion de CUIT
- MercadoPago para recibir pagos (Fase 2, pero el modelo de datos debe contemplarlo)
- Servicio de imagenes (S3 + CDN)
- Servicio de email transaccional (SES o SendGrid)

## Criterios de aceptacion del MVP

- Un fabricante puede registrarse, cargar 50+ productos con imagenes, y gestionar stock
- Un fabricante puede recibir un pedido de prueba y procesarlo hasta "entregado"
- El dashboard muestra KPIs actualizados en tiempo real
- Se pueden exportar reportes de ventas y stock a CSV
- Al menos 2 fabricantes piloto usan el backoffice por 2 semanas sin soporte continuo
