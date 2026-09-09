# ADR-010: Integración AFIP — validación real de CUIT y facturación electrónica

**Estado:** Aceptado
**Fecha:** 2026-09-03
**Decidido por:** Fundadores ObraYa

## Contexto

El roadmap de ObraYa siempre contempló "Validación de CUIT contra AFIP (web service)"
como dependencia del registro de empresas (ver `docs/specs/MVP-backoffice-fabricantes.md`
y ADR-001), pero nunca se había implementado: `RegisterCompanyDto.cuit` solo validaba
longitud/formato (`@Length(11,11)` + `@Matches(/^\d{11}$/)`), sin el dígito verificador
real de AFIP.

Se decidió avanzar con el alcance completo: (a) checksum real de CUIT, (b) un módulo
conectado a los web services reales de AFIP (padrón y facturación electrónica), que se
desactiva solo si no hay credenciales configuradas, y (c) emisión real de factura
electrónica (Factura B/C) vía WSFEv1.

Un hallazgo clave de la investigación previa a este ADR: la librería `@afipsdk/afip.js`
(v1.2.3) permite operar contra los servidores reales de **homologación** (testing) de
AFIP sin certificado propio, usando el CUIT público de pruebas `20409378472` — la propia
librería no exige `access_token` en runtime pese a que su declaración de tipos lo marca
como obligatorio (inexactitud de los `.d.ts` publicados, confirmada leyendo
`src/Afip.js`). Esto permitió construir y probar la integración de punta a punta contra
AFIP real, no solo simularla con mocks.

## Decisión

### 1. Checksum real de CUIT (mod 11)

`packages/backend/src/common/validators/cuit.validator.ts` implementa el algoritmo real
(multiplicadores `[5,4,3,2,7,6,5,4,3,2]`, casos especiales de resto 10→9 y 11→0) como
función pura `isValidCuit()` más un decorador `@IsValidCuit()` de `class-validator`,
aplicado en `RegisterCompanyDto.cuit` además de los validadores de formato existentes.

### 2. `Company.ivaCondition`

Nuevo enum `CompanyIvaCondition` (`RESPONSABLE_INSCRIPTO` | `MONOTRIBUTO` | `EXENTO`) en
`company.entity.ts`, con default `RESPONSABLE_INSCRIPTO`. Determina el tipo de factura a
emitir. Sin migration manual: el proyecto no tenía ninguna migration committeada todavía
(carpeta `migrations/` vacía salvo `.gitkeep`) y usa `synchronize: true` en desarrollo —
se sigue la misma convención ya establecida en el repo.

### 3. `AfipModule` / `AfipService`

Nuevo módulo `packages/backend/src/modules/afip/`, mismo patrón best-effort que
`PaymentsService`/`NotificationsService`:

- En modo no-producción (`AFIP_ENV !== 'production'`), si no hay `AFIP_CUIT` configurado
  usa por defecto el CUIT público de homologación `20409378472` — el módulo funciona
  out-of-the-box en desarrollo, contra los servidores reales de testing de AFIP.
- En producción, si falta `AFIP_CUIT`/`AFIP_CERT_PATH`/`AFIP_KEY_PATH` con archivos
  válidos, el servicio queda deshabilitado (`isEnabled() === false`): loguea un warning
  al iniciar y todos los métodos públicos devuelven `null` sin lanzar excepción.
- `getTaxpayerDetails(cuit)`: consulta el padrón de AFIP, best-effort. En homologación no
  es confiable para CUITs de terceros arbitrarios (limitación conocida de AFIP, no de esta
  integración), así que nunca bloquea el registro de una empresa — solo informa si hay
  datos disponibles.
- `createInvoice({ company, order })`: emite el comprobante vía
  `ElectronicBilling.createNextVoucher` (resuelve automáticamente el próximo número de
  comprobante). Cualquier error de AFIP se propaga; el caller decide qué hacer (igual que
  `PaymentsService.createPreference`).

### 4. Wiring

- `UsersService.registerCompany()`: llamada best-effort no bloqueante a
  `afipService.getTaxpayerDetails(dto.cuit)` tras crear la `Company`, solo para logging.
- `Order` agrega columnas `afipCae`, `afipCaeExpiration`, `afipInvoiceNumber`,
  `afipInvoiceType` (`'B' | 'C'`), `afipStatus` (`'emitida' | 'error'`) — mismo patrón que
  los campos `mp*` de Mercado Pago (ver ADR-007).
- `OrdersService.updateStatus()`: al transicionar a `Despachado`, intenta emitir la
  factura dentro de la misma transacción. Si AFIP falla, se marca `afipStatus = 'error'` y
  se loguea, pero **no bloquea** el cambio de estado del pedido.

**Por qué el disparador es `Despachado` y no `Aceptado` o `Entregado`:** es el estado más
cercano al movimiento real de la mercadería disponible en `VALID_TRANSITIONS`
(`order.entity.ts`), y es terminal salvo por `Entregado` — no hay riesgo de tener que
anular una factura por una cancelación posterior, ya que `Despachado` solo transiciona a
`Entregado`.

### 5. Limitación de datos conocida: solo Factura B o C, nunca Factura A

`Buyer` no tiene CUIT propio — siempre es consumidor final sin identificar ante AFIP
(`DocTipo: 99, DocNro: 0`). AFIP no permite emitir Factura A sin identificar al receptor
con su propio CUIT. Por lo tanto, con el modelo de datos actual, el sistema **solo puede
emitir Factura B** (si el fabricante es Responsable Inscripto, `CbteTipo: 6`) **o Factura
C** (Monotributo/Exento, `CbteTipo: 11`). Agregar CUIT opcional a `Buyer` para habilitar
Factura A queda fuera de alcance de este ADR — sería un cambio de alcance mayor.

### 6. Sin desglose de IVA

El modelo de precios actual (`Price`) no discrimina IVA del precio final. `createInvoice`
informa todo `order.totalAmount` como `ImpNeto`, con `ImpIVA: 0`. Es una simplificación
válida para Factura B/C a consumidor final (no exige discriminar IVA como sí lo requiere
Factura A), documentada acá para no confundirla con un bug.

## Justificación

- Reusar el patrón ya validado de `PaymentsService`/`NotificationsService` (deshabilitado
  gracioso sin credenciales) evita que una integración fiscal opcional bloquee el resto
  del sistema si todavía no hay certificado de producción.
- Probar contra homologación real (no mocks) da confianza genuina de que el wiring
  funciona, no solo de que compila.

## Consecuencias

- Sin certificado de producción configurado, ningún pedido en producción emite factura
  real — el campo `afipStatus` queda `null` indefinidamente hasta que se configure
  `AFIP_CERT_PATH`/`AFIP_KEY_PATH` con un certificado real de la empresa.
- Cada `Company` factura con el mismo CUIT/certificado configurado a nivel de variables de
  entorno (no hay certificado por empresa todavía) — para un MVP con pocos fabricantes
  esto puede ser aceptable operando ObraYa como intermediario de facturación, pero para
  escalar a que cada fabricante facture con su propio CUIT haría falta un modelo
  multi-tenant de credenciales (columnas `Company.afipCertPath`/`afipKeyPath`) y,
  legalmente, que cada fabricante autorice a ObraYa a facturar en su nombre ante AFIP
  ("facturación por terceros") — fuera de alcance de este ADR.
- Nunca se emite Factura A (ver limitación de datos arriba).

## Riesgos

- **Bajo (testing):** en homologación, `getTaxpayerDetails` puede devolver `null` para
  CUITs de terceros válidos — es un comportamiento esperado de AFIP en ese ambiente, no un
  bug de esta integración.
- **Medio (producción):** el modo producción no se probó contra un certificado real (no
  disponible en este entorno). El primer paso al configurar credenciales reales debe ser
  validar `createInvoice` contra un pedido de prueba antes de depender de él en
  operaciones reales.
