# Architecture Decision Records (ADRs)

Registro de decisiones arquitectonicas del proyecto ObraYa.

| # | Titulo | Estado | Fecha |
|---|--------|--------|-------|
| 001 | Eleccion del Stack Tecnologico | Aceptado | 2026-04-09 |
| 002 | Arquitectura Inicial: Monolito Modular | Aceptado | 2026-04-09 |
| 003 | Endpoint publico de solo lectura para el marketplace del comprador | Aceptado | 2026-07-21 |
| 004 | Historial de "Mis pedidos" del comprador sin entidad Buyer | Aceptado | 2026-08-31 |
| 005 | Scaffold de la app mobile de compradores (Expo Router) | Aceptado | 2026-08-31 |
| 006 | Cuenta de comprador real (entidad Buyer) | Aceptado | 2026-08-31 |
| 007 | Port de Mercado Pago, seguridad de produccion, notificaciones FCM y busqueda Elasticsearch | Aceptado | 2026-09-02 |
| 008 | Reseñas/rating real y home dinámica (Pedí de nuevo, mejor calificados) | Aceptado | 2026-09-03 |
| 009 | Banners dinámicos del home a partir de descuentos programados reales | Aceptado | 2026-09-03 |
| 010 | Integración AFIP: validación de CUIT y facturación electrónica | Aceptado | 2026-09-19 |
| 011 | Email transaccional con AWS SES (invitaciones, notificaciones de pedido) | Aceptado | 2026-09-19 |
| 012 | Configuración logística por zona (costos y tiempos de envío) | Aceptado | 2026-09-23 |
| 013 | Observabilidad mínima — reporte de errores con Sentry | Aceptado | 2026-09-23 |
| 014 | Fail-fast de configuración crítica en producción | Aceptado | 2026-09-23 |

## Como agregar un ADR

1. Crear archivo `ADR-NNN-titulo-corto.md`
2. Usar el template: Contexto, Decision, Justificacion, Consecuencias, Riesgos
3. Actualizar esta tabla
4. Registrar en `CHANGELOG.md`
