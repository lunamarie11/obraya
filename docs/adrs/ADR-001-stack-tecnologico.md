# ADR-001: Eleccion del Stack Tecnologico

**Estado:** Aceptado
**Fecha:** 2026-04-09
**Decidido por:** Fundadores ObraYa

## Contexto

ObraYa necesita un stack que permita:
- Desarrollo rapido del MVP (equipo chico, 4-7 devs)
- Escalar a microservicios sin reescribir
- Compartir codigo entre web y mobile
- Operar con baja latencia en Argentina
- Integrarse con MercadoPago, AFIP y carriers locales

## Decision

| Componente | Tecnologia | Alternativas evaluadas |
|-----------|-----------|----------------------|
| Backend | NestJS (Node.js) | Django (Python), Spring Boot (Java), Express.js |
| Frontend Web | Next.js (React) | Nuxt.js (Vue), SvelteKit, Remix |
| Mobile | React Native | Flutter, Native (Swift/Kotlin) |
| DB principal | PostgreSQL | MySQL, MongoDB |
| Cache | Redis | Memcached |
| Busqueda | Elasticsearch | Algolia, Meilisearch |
| Mensajeria | Apache Kafka | RabbitMQ, AWS SQS |
| Cloud | AWS (sa-east-1) | GCP, Azure, DigitalOcean |
| CI/CD | GitHub Actions + ArgoCD | GitLab CI, CircleCI |

## Justificacion

**NestJS** sobre Express: arquitectura modular con decoradores, soporte nativo de microservicios, inyeccion de dependencias. Ideal para evolucionar de monolito a microservicios.

**Next.js** sobre Nuxt/Svelte: ecosistema React mas maduro en Argentina (mas facil contratar), SSR para SEO del catalogo, compatibilidad con React Native via shared types.

**React Native** sobre Flutter: codigo compartido con el frontend web (tipos, logica de negocio), ecosistema npm, mas devs disponibles en el mercado argentino.

**PostgreSQL** sobre MongoDB: datos altamente relacionales (productos-categorias-proveedores-pedidos-usuarios), transacciones ACID para pagos, extensiones como PostGIS para geolocalizacion.

**Kafka** sobre RabbitMQ: mayor throughput para eventos de alta frecuencia (stock updates, tracking), log persistente para replay de eventos, escalabilidad horizontal.

**AWS sa-east-1** (Sao Paulo): menor latencia hacia Argentina (~20ms), cumplimiento PDPA, servicios maduros (EKS, RDS, S3, CloudFront).

## Consecuencias

- El equipo necesita experiencia en TypeScript (backend + frontend + mobile).
- Kafka agrega complejidad operativa; en el MVP se puede usar una cola mas simple (Bull/Redis) y migrar a Kafka en Fase 2.
- AWS tiene costos mas altos que alternativas; se compensa con Free Tier y reserved instances.

## Riesgos

- Dependencia fuerte de TypeScript como unico lenguaje. Mitigacion: es el lenguaje mas demandado en el mercado argentino.
- Kafka es overkill para el MVP. Mitigacion: usar Bull queues inicialmente, migrar cuando el volumen lo justifique.
