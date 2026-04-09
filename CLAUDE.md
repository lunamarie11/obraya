# ObraYa - Contexto para Claude Code

## Que es este proyecto

ObraYa es un marketplace B2B2C de materiales de construccion para Argentina. Conecta fabricantes/distribuidores con compradores finales (particulares, constructoras, profesionales). Modelo tipo PedidosYa/Rappi pero para construccion.

**Estado actual:** Pre-seed, Fase 0 (Setup y Arquitectura). No hay codigo funcional aun, solo scaffold y documentacion.

## Estructura del monorepo

```
packages/backend/    - API NestJS (monolito modular, ver ADR-002)
packages/frontend/   - Web app Next.js (catalogo + backoffice admin)
packages/mobile/     - App React Native (compradores)
packages/shared/     - Tipos TypeScript compartidos entre todos los packages
infra/               - Docker, Kubernetes, Terraform, scripts
docs/                - Plan tecnico, ADRs, specs, research
```

## Stack tecnologico (ver ADR-001)

- **Backend:** NestJS + TypeScript + TypeORM
- **Frontend:** Next.js + React + Tailwind + React Query
- **Mobile:** React Native
- **DB:** PostgreSQL 16 + Redis 7
- **Busqueda:** Elasticsearch 8
- **Mensajeria:** Bull queues (Redis) en MVP, migrar a Kafka post-validacion
- **Pagos:** MercadoPago
- **Cloud:** AWS sa-east-1 (Sao Paulo)
- **CI/CD:** GitHub Actions + ArgoCD

## Arquitectura (ver ADR-002)

Monolito modular en NestJS. Cada dominio es un modulo independiente:
- Users, Products, Orders, Payments, Logistics, Notifications, Analytics
- Los modulos se comunican via inyeccion de dependencias (no HTTP/Kafka en MVP)
- Post-validacion se extraen a microservicios

## Prioridades de desarrollo

1. **Fase 1 (MVP - Jun-Ago 2026):** Backoffice fabricantes. Ver `docs/specs/MVP-backoffice-fabricantes.md`
2. **Fase 2 (Sep-Nov 2026):** Front de usuarios (catalogo, carrito, checkout, tracking)
3. **Fase 3 (Dic 2026):** Lanzamiento en AMBA

## Convenciones

- **Idioma del codigo:** Ingles (nombres de variables, funciones, clases)
- **Idioma de docs:** Espanol
- **Commits:** Conventional Commits en espanol (feat:, fix:, docs:, etc.)
- **Tipos compartidos:** Definir en `packages/shared/src/types/` y importar desde ahi
- **API prefix:** Todos los endpoints bajo `/api/v1/`
- **Validacion:** class-validator + class-transformer en DTOs de NestJS
- **Base de datos:** TypeORM con migrations, no sync automatico

## Archivos clave para entender el proyecto

- `docs/plan-tecnico/ObraYa_Plan_Tecnico_v1.0.docx` - Plan completo original
- `docs/adrs/` - Decisiones arquitectonicas
- `docs/specs/MVP-backoffice-fabricantes.md` - Spec del primer modulo a construir
- `CHANGELOG.md` - Historial de cambios y decisiones
- `packages/shared/src/types/index.ts` - Modelo de datos compartido

## Reglas para Claude Code

- Antes de implementar algo nuevo, verificar si hay un spec en `docs/specs/`
- Si una decision no esta documentada, crear un ADR en `docs/adrs/`
- Registrar todo cambio significativo en `CHANGELOG.md`
- No instalar dependencias sin justificacion (documentar en ADR si es una decision de stack)
- Usar los tipos compartidos de `packages/shared`, no duplicar interfaces
- Tests obligatorios para logica de negocio (services), opcionales para controllers
- Variables de entorno van en `.env.example`, nunca hardcodeadas

## Integraciones externas importantes

- **AFIP:** Validacion de CUIT y facturacion electronica (facturas A y B)
- **MercadoPago:** Pagos con tarjeta, transferencia, cuotas, split de pagos
- **Firebase FCM:** Push notifications
- **AWS S3 + CloudFront:** Imagenes de productos y archivos
- **Google Maps API:** Geolocalizacion y ruteo de entregas (Fase 4)
