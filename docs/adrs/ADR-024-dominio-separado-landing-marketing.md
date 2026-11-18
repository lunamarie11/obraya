# ADR-024: Dominio separado para la landing de marketing

**Estado:** Aceptado
**Fecha:** 2026-11-17
**Decidido por:** Fundadores ObraYa

## Contexto

La landing de marketing (`UnicornLanding`, ver CHANGELOG 0.33.6) se
desplegó originalmente en `app.obraya.com.ar`, mostrándose en `/` solo en
viewport desktop (`hidden md:block`) mientras que mobile iba directo a la
app de compra. Mezclar landing y app en el mismo dominio generaba
confusión: `app.obraya.com.ar` es la URL que se comparte con compradores y
fabricantes para *usar* el marketplace, no para ver material de marketing.

## Decisión

- La landing de marketing se sirve en el dominio apex **`obraya.com.ar`**
  (sin subdominio). `app.obraya.com.ar` vuelve a mostrar siempre la app de
  compra en `/`, sin split responsive — el mismo contenido para desktop y
  mobile.
- No se duplica el despliegue: ambos dominios apuntan al mismo contenedor
  `obraya-frontend` (mismo Next.js, misma imagen). El middleware
  (`packages/frontend/src/middleware.ts`) inspecciona el header `Host` y
  hace `rewrite` de `/` → `/landing` cuando el host es `obraya.com.ar` o
  `www.obraya.com.ar`. `/landing` es una ruta nueva que renderiza
  `UnicornLanding`.
- Los links internos de `UnicornLanding` a rutas de la app
  (`/marketplace`, `/account`, `/register`) pasan a ser absolutos a
  `https://app.obraya.com.ar/...`, porque ya no están en el mismo dominio.
  Los links a `/terminos`/`/privacidad` siguen siendo relativos: esas
  páginas existen en el mismo Next.js y resuelven igual en cualquiera de
  los dos dominios.
- Infra: nuevo registro `aws_route53_record.apex` en
  `infra/terraform/route53.tf` (tipo A, mismo Elastic IP que
  `app./admin./api.`), y un bloque nuevo en `infra/docker/Caddyfile` para
  `obraya.com.ar` (mismo `reverse_proxy frontend:3001`, Caddy emite su
  propio certificado Let's Encrypt para este dominio igual que para los
  demás).

## Justificación

- Separar por dominio (en vez de por viewport) es más simple de entender
  para quien comparte el link: `obraya.com.ar` es "la vidriera", `app.` es
  "la herramienta". Evita además que un comprador mobile llegue a
  `app.obraya.com.ar` desde una campaña y nunca vea el pitch de marketing
  completo (antes solo lo veían los desktop).
- Reusar el mismo contenedor/imagen en vez de desplegar un sitio estático
  aparte evita duplicar infraestructura (otro ECR repo, otro
  docker-compose, otro certificado) por una sola página — el costo
  marginal es un `if` en el middleware.
- Hacer el split por `Host` en middleware en vez de en cada página
  mantiene la decisión en un solo lugar y es trivial de extender si en el
  futuro se agrega `www.obraya.com.ar` como alias real (hoy solo está
  contemplado en el middleware, no tiene registro DNS propio todavía).

## Consecuencias

- `app.obraya.com.ar/` ya no tiene lógica responsive de landing/app — es
  más simple, pero cualquier cambio de copy de marketing ahora vive
  exclusivamente en `/landing` (servida en `obraya.com.ar`), no en
  `page.tsx`.
- Quien comparta `app.obraya.com.ar` para marketing (redes, ads) va a
  llevar directo a la app sin pasar por el pitch — hay que actualizar esos
  links a `obraya.com.ar` donde corresponda (fuera de alcance de código,
  es un pendiente operativo/de marketing).

## Riesgos

- **Bajo:** `www.obraya.com.ar` está contemplado en el middleware pero no
  tiene registro DNS creado — si alguien lo escribe hoy, no resuelve. Crear
  el registro cuando haga falta (mismo patrón que `apex` en
  `route53.tf`).
