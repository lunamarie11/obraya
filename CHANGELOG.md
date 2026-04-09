# ObraYa - Registro de Cambios y Decisiones

Cada cambio importante del proyecto se documenta aqui. Las decisiones arquitectonicas formales van en `docs/adrs/`.

---

## [0.0.1] - 2026-04-09

### Decisiones Tomadas

- **Estructura del proyecto:** Monorepo con documentacion + scaffold de codigo. Todo centralizado en `~/Documents/ObraYa/`.
- **Enfoque inicial:** Organizar toda la documentacion y arquitectura antes de escribir codigo.
- **Tipo de scaffold:** Docs completos + estructura de carpetas de codigo sin implementacion, para visualizar la arquitectura desde el dia 1.
- **Ubicacion:** `~/Documents/ObraYa/` como carpeta raiz del proyecto.
- **Herramienta de iteracion:** El proyecto esta preparado para trabajar con Claude Code via `CLAUDE.md` en la raiz.

### Agregado

- Estructura de carpetas completa: `docs/`, `packages/`, `infra/`, `tools/`
- Plan tecnico original (`docs/plan-tecnico/`)
- README principal del proyecto
- CLAUDE.md para contexto de Claude Code
- ADR-001: Eleccion de stack tecnologico
- Scaffold de codigo: backend (NestJS), frontend (Next.js), mobile (React Native)
- Specs iniciales del MVP Backoffice

### Pendiente

- Definir identidad visual (logo, paleta, design system)
- Validar modelo con fabricantes ancla
- Detallar API contracts del backoffice
- Schema de base de datos PostgreSQL
- Configuracion de CI/CD (GitHub Actions)

---

## Formato

Cada entrada sigue:
```
## [version] - YYYY-MM-DD
### Decisiones Tomadas
### Agregado / Cambiado / Eliminado
### Pendiente
```
