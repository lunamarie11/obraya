# ADR-020: Infraestructura de deploy pre-lanzamiento (EC2 single-instance, revisa ADR-015)

**Estado:** Aceptado
**Fecha:** 2026-10-25
**Decidido por:** ObraYa Dev (con Claude Code)

## Contexto

ADR-015 fijó ECS Fargate + RDS + ElastiCache + ALB + OpenSearch opcional
como infraestructura de producción, y ese Terraform ya se escribió
completo en `infra/terraform/` (ver PR #3). Al cotizarlo con los valores
reales de `variables.tf`, el costo mensual aproximado es ~110-120 USD/mes
(NAT Gateway ~35, RDS ~15, ElastiCache ~12, Fargate ~25, ALB ~20,
S3+CloudFront+ECR ~6) — sin contar OpenSearch.

El proyecto sigue en pre-seed, Fase 0/1, sin tráfico real todavía: no hay
usuarios, no hay ingresos, y ADR-015 ya estableció el criterio de empezar
simple y escalar cuando el volumen lo justifique. Pagar ~110-120 USD/mes
por alta disponibilidad (multi-AZ, auto-scaling) que no tiene nada que
escalar todavía es sobrecosto innecesario en esta etapa. Tampoco existe
aún cuenta de AWS con método de pago configurada — este es el momento de
elegir el diseño más barato antes del primer `terraform apply` real, no
después.

Se evaluó además salir de AWS por completo (Hetzner, Fly.io, Railway) para
bajar costo aún más, pero se descartó: ninguno tiene región en Sudamérica
(contradice la justificación de latencia de ADR-001), y StorageService/SES
ya están integrados específicamente contra APIs de AWS (S3, SES, IAM
roles) — migrar de proveedor implicaría reescribir esas integraciones, más
costoso en tiempo que el ahorro en infraestructura.

## Decision

Reemplazar ECS Fargate + RDS + ElastiCache + ALB por **una sola instancia
EC2** (`t4g.small`, Graviton/ARM) corriendo Postgres, Redis, backend y
frontend como contenedores de Docker Compose, con **Caddy** de reverse
proxy emitiendo y renovando certificados TLS automáticamente vía Let's
Encrypt (HTTP-01) para `app./admin./api.obraya.com.ar`.

| Componente ADR-015 (Fargate) | Componente ADR-020 (EC2 single-instance) |
|---|---|
| ECS Fargate (backend + frontend) | Contenedores Docker Compose en la misma instancia |
| RDS PostgreSQL 16 | Contenedor Postgres 16 local, con volumen EBS |
| ElastiCache Redis | Contenedor Redis 7 local |
| ALB + ACM (certs app./admin./api.) | Caddy (Let's Encrypt automático, sin ACM para estos dominios) |
| NAT Gateway + subnets privadas | Solo subnets públicas, instancia con IP elástica propia |
| S3 + CloudFront | Sin cambios |
| ECR | Sin cambios (igual se buildean imágenes, Caddy/Compose las bajan de ahí) |
| OpenSearch (opcional) | Sin cambios |
| Acceso remoto: ninguno definido | SSM Session Manager (sin SSH, sin puerto 22 abierto) |

CloudFront sigue necesitando su certificado ACM en `us-east-1` (no soporta
Let's Encrypt) — ese es el único cert que sigue pasando por ACM.

## Justificacion

- **Costo:** ~20-25 USD/mes vs ~110-120 USD/mes. A este volumen (cero
  usuarios reales todavía) la diferencia no compra nada — ni Fargate ni
  RDS Multi-AZ tienen carga que justifique su auto-scaling/HA.
- **Caddy sobre ALB+ACM para los dominios de la app:** HTTPS automático
  sin pasos manuales de validación DNS por certificado (a diferencia de
  ACM, que exige CNAME de validación antes de poder usar el cert) ni costo
  de ALB (~20 USD/mes fijos). CloudFront es la excepción obligada porque
  no soporta Let's Encrypt.
- **Sin NAT Gateway:** la instancia tiene IP pública propia, no necesita
  salir a internet via NAT — elimina ~35 USD/mes que no cumplían ninguna
  función de seguridad adicional (la instancia ya está en una subnet
  pública con security group restrictivo).
- **SSM Session Manager sobre SSH:** mismo patrón que ya usaba el IAM role
  original — sin puerto 22 abierto ni key pair que rotar/perder.
- **Se mantiene en AWS (no se migra de cloud):** evita reescribir
  StorageService (S3)/emails (SES), y preserva la justificación de
  latencia `sa-east-1` de ADR-001.

## Consecuencias

- **Sin alta disponibilidad:** una sola instancia es punto único de falla.
  Si se cae (reboot de AWS, fallo de hardware), la app entera queda
  inaccesible hasta que EC2 la recupere automáticamente (no hay segunda
  instancia ni failover). Aceptable para pre-lanzamiento sin SLA
  comprometido con usuarios reales.
- **Sin auto-scaling:** si el tráfico crece, hay que subir manualmente el
  `instance_type` (vertical) en vez de agregar instancias (horizontal).
- **Backups de Postgres ya no son automáticos de RDS:** quedan a cargo de
  un snapshot manual del volumen EBS o un cron de `pg_dump` — pendiente de
  implementar, no cubierto por este ADR (ver `docs/checklist-deploy-produccion.md`).
- **Deploy menos automatizado:** sin ECS `update-service`, el redeploy de
  una imagen nueva requiere conectarse por SSM y correr
  `docker-compose up -d` a mano (ver `infra/terraform/README.md`) hasta que
  se extienda CI para automatizarlo.
- Se elimina de `infra/terraform/`: `ecs.tf`, `alb.tf`, `rds.tf`,
  `elasticache.tf`, `cloudwatch.tf`. Se agrega: `ec2.tf`,
  `infra/docker/docker-compose.prod.yml`, `infra/docker/Caddyfile`.
- Esta decisión es explícitamente temporal: ADR-015 documenta el diseño de
  destino (Fargate + RDS + ElastiCache + ALB) para cuando el volumen post-
  lanzamiento lo justifique. No se borra ADR-015, se marca como superseded
  por este ADR mientras tanto.

## Riesgos

- Punto único de falla sin HA (ver consecuencias). Mitigación: monitorear
  con Sentry/CloudWatch básico, y tener el runbook de `terraform apply`
  del diseño original de ADR-015 ya escrito y listo para migrar si hace
  falta reaccionar rápido.
- Sin backup automático de la base de datos hasta que se implemente un cron
  de `pg_dump` a S3 — riesgo de pérdida de datos ante fallo de disco.
  Pendiente, debe resolverse antes de tener datos reales de producción.
- Si el volumen crece más rápido de lo esperado, migrar de EC2
  single-instance a Fargate/RDS/ElastiCache implica downtime de migración
  de datos (a diferencia de escalar Fargate, que es incremental). Mitigación:
  revisar este ADR tan pronto haya tráfico real sostenido, no esperar a
  que la instancia sature.
