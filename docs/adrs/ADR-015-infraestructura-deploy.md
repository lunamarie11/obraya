# ADR-015: Infraestructura de deploy (ECS Fargate, no EKS/ArgoCD por ahora)

**Estado:** Aceptado
**Fecha:** 2026-09-29
**Decidido por:** ObraYa Dev (con Claude Code)

## Contexto

`docs/checklist-deploy-produccion.md` (sección 6) identificó que no existe
ninguna infraestructura de deploy en el repo: sin `docker-compose.prod.yml`,
sin Dockerfile de frontend, sin CI/CD, sin reverse proxy/SSL. Antes de
construir cualquiera de esas piezas hace falta decidir dónde corre la app.

ADR-001 ya fijó `AWS sa-east-1` como cloud (menor latencia a Argentina,
servicios maduros) y mencionó `GitHub Actions + ArgoCD` como CI/CD — lo cual
implica Kubernetes (EKS) como orquestador, aunque nunca se formalizó un ADR
específico de infraestructura.

El proyecto sigue en pre-seed: no hay equipo de SRE/infra dedicado (hoy es
un dev + Claude Code), y el propio ADR-001 ya estableció el criterio de
**empezar simple y escalar cuando el volumen lo justifique** — el mismo
razonamiento que llevó a usar Bull queues en vez de Kafka en el MVP. Se
aplica ese criterio también a la infraestructura de deploy: EKS + ArgoCD
requiere gestionar el control plane, RBAC, manifests/Helm charts y un
operador de GitOps — sobrecarga operativa desproporcionada para el tamaño
de equipo y el volumen de tráfico actual (pre-lanzamiento).

## Decision

**AWS ECS Fargate** como orquestador de contenedores, en `sa-east-1`, con
servicios managed de AWS reemplazando lo que hoy corre self-hosted en
`docker-compose.yml`:

| Componente dev (Docker Compose) | Componente producción (AWS) |
|---|---|
| Backend NestJS (contenedor) | ECS Fargate (servicio + task definition) |
| Frontend Next.js (contenedor nuevo) | ECS Fargate (servicio + task definition) |
| Postgres 16 (contenedor) | RDS PostgreSQL 16 |
| Redis 7 (contenedor) | ElastiCache Redis |
| MinIO (contenedor) | S3 real + CloudFront (cierra el gap de `StorageService`, ver checklist sección 3) |
| Elasticsearch 8 (contenedor) | Amazon OpenSearch Service (managed) |
| — | Application Load Balancer (routing + SSL/TLS, reemplaza nginx/certbot manual) |
| — | ECR (registry de imágenes) |

**CI/CD:** GitHub Actions (build + test en cada PR; build + push a ECR +
`aws ecs update-service` en merge a `main`). Se descarta ArgoCD por ahora:
es una herramienta de GitOps pensada para Kubernetes, no aplica sin un
cluster EKS.

## Justificacion

- **Fargate sobre EKS:** sin servers ni control plane que administrar/
  parchear. Escala horizontalmente por CPU/memoria o requests sin tocar
  infraestructura. Un equipo de 1-2 devs puede operarlo sin conocimiento
  previo de Kubernetes.
- **Fargate sobre EC2 + Docker Compose:** con Compose en una sola instancia
  no hay auto-scaling, hay un único punto de falla, y el patching de OS/TLS
  queda a mano. Fargate da alta disponibilidad (múltiples AZs) y
  auto-scaling desde el día uno, con configuración declarativa (task
  definitions) en vez de acceso SSH a servers.
- **Fargate sobre Railway/Render:** esas plataformas no tienen región en
  Sudamérica — implicaría mayor latencia hacia Argentina y contradecir la
  justificación de `sa-east-1` de ADR-001 sin una razón de peso. Además
  fragmentaría el cloud (parte AWS por S3/SES/etc., parte otro proveedor).
- **RDS/ElastiCache/OpenSearch managed** sobre self-hosted en EC2: backups
  automáticos, patching y alta disponibilidad gestionados por AWS — resuelve
  también el pendiente de "backups automáticos" anotado en la sección 2 del
  checklist de deploy.
- **GitHub Actions sin ArgoCD:** un pipeline imperativo (build → push a ECR
  → actualizar el servicio ECS) es suficiente para el volumen actual y no
  requiere mantener un cluster Kubernetes solo para tener GitOps.

## Consecuencias

- Se desvía de la línea de CI/CD de ADR-001 (`GitHub Actions + ArgoCD`).
  Este ADR reemplaza esa decisión puntual; el resto de ADR-001 (stack,
  lenguajes, DB, cloud) no cambia.
- Hay que escribir: `Dockerfile.frontend` (Next.js), workflows de GitHub
  Actions (test en PR, build+deploy en merge a `main`), y la infraestructura
  de AWS en sí (cluster ECS, task definitions, RDS, ElastiCache, OpenSearch,
  ALB, ECR) — probablemente como Terraform, dado que `infra/` y `.gitignore`
  ya anticipan Terraform (`*.tfstate`, `.terraform/`).
- Provisionar estos recursos en AWS tiene costo real y requiere acceso a la
  cuenta de AWS del proyecto — queda fuera del alcance de este ADR, es el
  siguiente paso concreto y requiere aprobación explícita antes de crear
  recursos que generen costo.

## Riesgos

- Fargate es más caro que EC2 crudo por unidad de cómputo. Mitigación:
  volumen esperado en pre-lanzamiento es bajo; el costo absoluto es
  manejable y evita necesitar a alguien dedicado a mantener servers.
- Si el volumen post-lanzamiento (Fase 4, logística real) requiere
  workloads que Fargate no cubre bien (colas de alto throughput, jobs de
  larga duración con necesidades de GPU/hardware específico, o necesidad
  real de multi-tenancy con Kubernetes), habrá que revisar esta decisión y
  migrar a EKS — mismo patrón de "revisar cuando el volumen lo justifique"
  que Kafka en ADR-001.
