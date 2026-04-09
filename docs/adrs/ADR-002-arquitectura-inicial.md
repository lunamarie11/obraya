# ADR-002: Arquitectura Inicial - Monolito Modular hacia Microservicios

**Estado:** Aceptado
**Fecha:** 2026-04-09
**Decidido por:** Fundadores ObraYa

## Contexto

El plan tecnico define una arquitectura de microservicios. Sin embargo, con un equipo de 4-7 personas y sin product-market fit validado, arrancar con microservicios completos genera overhead innecesario.

## Decision

Arrancar con un **monolito modular** en NestJS que se pueda descomponer en microservicios cuando sea necesario.

### Fase 0-1 (MVP): Monolito Modular
- Un solo servicio NestJS con modulos independientes (Users, Products, Orders, etc.)
- Cada modulo tiene su propia carpeta con controller, service, repository, DTOs
- Comunicacion entre modulos via inyeccion de dependencias (no HTTP/Kafka)
- Una sola base PostgreSQL con schemas separados por dominio
- Deploy: un solo container en ECS o EC2

### Fase 2-3 (Post-validacion): Extraer servicios criticos
- Extraer primero: Orders y Payments (mayor carga, requisitos de SLA distintos)
- Introducir Kafka para eventos entre los servicios extraidos
- Cada servicio con su propia DB (database-per-service)

### Fase 4+: Microservicios completos
- Logistics, Notifications, Analytics como servicios independientes
- API Gateway (Kong o AWS API Gateway)
- Service mesh si la complejidad lo justifica

## Justificacion

- Un monolito modular bien estructurado se deploya, debuggea y opera con un equipo chico
- Los limites de modulos de NestJS hacen que la extraccion a microservicios sea mecanica
- Evita el overhead de orquestacion, networking y observabilidad distribuida antes de tener traccion

## Consecuencias

- Los modulos DEBEN respetar limites claros: no importar servicios entre modulos directamente, usar interfaces
- Se necesita disciplina para no crear acoplamiento entre modulos
- La migracion a microservicios requiere refactor de la capa de comunicacion (DI -> Kafka/HTTP)
