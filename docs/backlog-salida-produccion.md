# Backlog para salir a producción (go-live real)

**Fecha:** 2026-11-17
**Contexto:** la infraestructura de producción ya está desplegada y
funcionando (`terraform apply` corrido, EC2 + Docker Compose + Caddy
levantados, DNS apuntando, HTTPS funcionando, migración de base de datos
ejecutada, smoke test de `api.`/`admin.`/`app.obraya.com.ar` en `200 OK`).
Ver `docs/checklist-deploy-produccion.md` para el detalle de cómo se llegó
a este punto — ese documento ya está resuelto en su mayoría.

Este backlog es distinto: es lo que falta para operar de verdad con
clientes y plata real, no para que el código esté arriba. Ordenado por
prioridad.

---

## P0 — Bloqueante para facturar y cobrar en serio

1. ~~**AFIP: certificado real + CUIT real de la empresa.**~~ **Resuelto
   (2026-11-17).** CUIT real (monotributo) + certificado de producción
   configurados. Bugs encontrados y corregidos probando un pedido real de
   punta a punta: faltaba `AFIP_ACCESS_TOKEN` (proxy de AfipSDK) y el tipo
   de comprobante se calculaba mal (ver ADR-010, CHANGELOG 0.33.1/0.33.2).
   AFIP devolvió CAE real, Factura C emitida correctamente.

2. ~~**Verificar que el token de Mercado Pago cargado sea de
   PRODUCCIÓN, no de prueba.**~~ **Resuelto (2026-11-17).** Era de
   producción real (prefijo `APP_USR-`), pero estaba corrupto en Secrets
   Manager (el placeholder quedó pegado antes del token en vez de
   reemplazarlo). Corregido y validado contra la API de Mercado Pago
   (ver CHANGELOG 0.33.3).

3. ~~**AWS SES sigue en modo sandbox.**~~ **Resuelto (2026-11-17).**
   Dominio `obraya.com.ar` verificado (DKIM + MAIL FROM, `infra/terraform/ses.tf`).
   Solicitud de salida de sandbox enviada y aprobada automáticamente —
   cuota actual 50.000 emails/día (ver CHANGELOG 0.33.4).

## P1 — Importante, no bloquea el lanzamiento pero es riesgo real

4. ~~**No hay backup de la base de datos.**~~ **Resuelto (2026-11-17).**
   `pg_dump` diario (cron 6am UTC) a bucket S3 dedicado
   (`obraya-backups-production`, cifrado, privado, retención 30 días). Ver
   `infra/terraform/backups.tf` y CHANGELOG 0.33.4. Pendiente: el script y
   el cron están instalados a mano en la instancia (no en `user_data`) —
   si la instancia EC2 se recrea, hay que reinstalarlos.

5. ~~**No hay alarma de presupuesto en AWS.**~~ **Resuelto (2026-11-17).**
   `aws_budgets_budget` mensual (USD 50 default), alerta por email a 80%
   real / 100% proyectado / 100% real. Ver `infra/terraform/budget.tf`.

6. **El deploy de código a producción es manual.** Lo hice a mano esta vez
   (build de Docker, push a ECR, conectar por SSM, levantar los
   contenedores). El workflow de CI (`.github/workflows/ci.yml`) solo
   valida el código (lint/tests), no lo despliega. Cada cambio futuro va a
   requerir repetir ese proceso manual hasta que se automatice.

7. **El health check (`/api/v1/health`) marca "degraded" aunque todo
   funcione bien.** Revisa Elasticsearch y MinIO, que directamente no
   están desplegados en este diseño de instancia única (se usan
   alternativas: búsqueda cae a Postgres, archivos van a S3). No es un
   bug que afecte a los usuarios, pero si algún día se conecta un monitor
   automático a ese endpoint, va a reportar "problema" todo el tiempo sin
   que haya uno real. Conviene ajustar ese chequeo para que sea honesto con
   el diseño actual.

## P2 — Decisiones pendientes, no urgentes

8. **Elasticsearch no está desplegado.** La búsqueda de productos funciona
   igual (cae a una búsqueda simple en Postgres), pero es más lenta a
   medida que haya muchos productos. Es una decisión de cuándo vale la
   pena prender un cluster real, no un bug.

## Fuera de código — operación y negocio

Esto no lo puedo hacer yo porque no es código, pero sin esto tampoco hay
lanzamiento real:

9. ~~**Primer fabricante real dado de alta y aprobado.**~~ **Resuelto
   (2026-11-18).** Certeza ya se dio de alta y fue aprobado (flujo manual
   `Company.status` pending → active).
10. **Canal de soporte/atención al cliente** — hoy no hay nada definido
    sobre quién responde si un comprador o un fabricante tiene un
    problema.
11. ~~**Términos y condiciones + política de privacidad publicados**~~
    **Resuelto (2026-11-17).** Publicadas en `https://app.obraya.com.ar/terminos`
    y `/privacidad` (código en `packages/frontend/src/app/terminos/` y
    `.../privacidad/`), accesibles sin login, linkeadas desde el footer del
    home. Cubren rol de intermediario de ObraYa, pagos vía Mercado Pago,
    facturación AFIP/ARCA y Ley 25.326 de protección de datos. **Importante:**
    es un borrador inicial (lo dice el propio texto de las páginas) — falta
    que un abogado matriculado en Argentina lo revise antes de considerarlo
    definitivo. Ver CHANGELOG 0.33.5.

---

## Resumen para decidir por dónde arrancar

**Todo el P0 (1, 2, 3) y el P1 técnico rápido (4, 5) ya está resuelto**
(2026-11-17) — ver CHANGELOG 0.33.1 a 0.33.4. ObraYa puede facturar,
cobrar y notificar por email a clientes reales.

Lo que queda:
- **P1:** 6 (automatizar CI/CD) y 7 (health check honesto) — no bloquean,
  son deuda técnica operativa.
- **P2:** 8 (Elasticsearch) — decisión a futuro, no urgente.
- **Fuera de código:** 9 (alta del primer fabricante) ya está resuelto
  (Certeza). 10 (definir quién da soporte) sigue pendiente y lo tiene que
  resolver el equipo de ObraYa. 11 (términos/privacidad) ya está publicado
  (ver arriba), pendiente de revisión legal profesional antes de ser
  definitivo.
