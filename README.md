# ObraYa

Plataforma de ultima milla para materiales de construccion - Argentina.

**Estado:** Pre-seed / Fase 0 - Setup y Arquitectura
**Version:** 0.0.1
**Ultima actualizacion:** 2026-04-09

---

## Que es ObraYa

Marketplace B2B2C que conecta fabricantes, distribuidores y corralones con compradores finales (particulares, constructoras y profesionales). Experiencia tipo PedidosYa/Rappi pero 100% orientada al rubro construccion.

## Estructura del Proyecto

```
ObraYa/
|-- README.md              # Este archivo
|-- CHANGELOG.md           # Registro de cambios y decisiones
|-- CLAUDE.md              # Contexto para Claude Code
|
|-- docs/
|   |-- plan-tecnico/      # Plan tecnico original y versiones
|   |-- adrs/              # Architecture Decision Records
|   |-- specs/             # Specs funcionales por modulo
|   |-- research/          # Investigacion de mercado, competencia
|   |-- assets/            # Diagramas, mockups, recursos visuales
|
|-- packages/
|   |-- backend/           # API NestJS (microservicios)
|   |-- frontend/          # Web app Next.js
|   |-- mobile/            # App React Native
|   |-- shared/            # Tipos, constantes y utils compartidos
|
|-- infra/
|   |-- docker/            # Dockerfiles y compose
|   |-- k8s/               # Manifiestos Kubernetes
|   |-- terraform/         # IaC para AWS
|   |-- scripts/           # Scripts de setup y deploy
|
|-- tools/                 # Herramientas internas, seeds, migrations
```

## Stack Tecnologico

| Capa | Tecnologia |
|------|-----------|
| Frontend Web | React.js + Next.js |
| App Mobile | React Native |
| Backend API | NestJS (Node.js) |
| Base de Datos | PostgreSQL + Redis |
| Busqueda | Elasticsearch |
| Mensajeria | Apache Kafka |
| Pagos | MercadoPago + Prisma Pay |
| Infra | AWS (Sao Paulo) |
| CI/CD | GitHub Actions + ArgoCD |

## Roadmap

| Fase | Periodo | Descripcion |
|------|---------|-------------|
| Fase 0 - Setup | Abr-May 2026 | Infra base, repos, CI/CD, DB schema, API design |
| Fase 1 - MVP Backoffice | Jun-Ago 2026 | Backoffice fabricantes: ABM productos, stock, pedidos |
| Fase 2 - Front Usuarios | Sep-Nov 2026 | App + web: catalogo, carrito, checkout, tracking |
| Fase 3 - Lanzamiento BA | Dic 2026 | AMBA con 20+ fabricantes, campana marketing |
| Fase 4 - Logistica | Ene-Mar 2027 | Driver App, flota propia, integracion carriers |
| Fase 5 - Oficios | Abr-Jun 2027 | Modulo profesionales, escrow, matching |
| Fase 6 - Expansion | Jul 2027+ | Cordoba, Rosario, Mendoza. Gobierno y licitaciones |

## Como trabajar en este proyecto

1. **Documentacion primero:** Cualquier cambio importante se documenta en `docs/` y se registra en `CHANGELOG.md`.
2. **ADRs para decisiones:** Decisiones arquitectonicas van en `docs/adrs/` con formato estandar.
3. **Claude Code:** Abri el proyecto con `claude` desde esta carpeta. El archivo `CLAUDE.md` le da contexto completo.
4. **Versionado:** Usamos SemVer. Cada release incrementa la version en CHANGELOG.

## Proximos pasos

Ver `CHANGELOG.md` seccion "Pendiente" para la lista actualizada.
