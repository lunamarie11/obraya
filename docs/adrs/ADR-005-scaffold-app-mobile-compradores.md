# ADR-005: Scaffold de la app mobile de compradores (Expo Router)

**Estado:** Aceptado
**Fecha:** 2026-08-31
**Decidido por:** Fundadores ObraYa

## Contexto

`packages/mobile` existía como scaffold vacío: `package.json` con `expo`, `react-native`
y `expo-router` como dependencias declaradas, pero sin `app.json`, sin configuración de
Babel/TypeScript y sin un solo archivo dentro de `src/components`, `src/navigation`,
`src/screens`, `src/services` ni `src/utils`. No corría ni se podía abrir.

En paralelo, `packages/frontend` ya tiene un flujo de comprador funcional (marketplace,
ficha de tienda, producto, carrito, checkout, `/my-orders`, ver ADR-003/ADR-004 y
`docs/specs/marketplace-comprador.md`). La decisión del negocio es construir la app
nativa ahora, en paralelo al backlog web, en vez de tratarla como un proyecto futuro
separado.

## Decisión

Bootstrapear `packages/mobile` como una app Expo Router (SDK 50, alineado a las
versiones de `react`/`react-native` ya declaradas), replicando el mismo flujo de
comprador que ya existe en `packages/frontend`, consumiendo la misma API y los mismos
tipos de `@obraya/shared`.

Decisiones concretas de arquitectura:

- **Routing:** `expo-router` (file-based, ya era la dependencia elegida). Un stack raíz
  (`app/_layout.tsx`) que envuelve un grupo de tabs (`app/(tabs)/_layout.tsx`: Home,
  Pedidos, Carrito, Perfil — mismo mapa que `BottomTabBar` del frontend) y pantallas de
  detalle fuera del grupo (`company/[id]`, `product/[id]`, `checkout`,
  `order-confirmation`, `my-orders/[id]`) que se apilan sobre los tabs.
- **Estilo:** `StyleSheet` de React Native + un archivo único de tokens de diseño
  (`src/theme.ts`) que replica los valores ya usados en `globals.css` del frontend
  (`#f97316` primario, radios `16px`/`24px` tipo `card-ios`/`btn-ios`). Se evaluó
  NativeWind (Tailwind para RN) para tener paridad 1:1 con las clases del frontend,
  pero se descartó **para este pase**: agrega configuración de Babel/Metro/PostCSS
  adicional que no se puede validar en este entorno (sin simulador ni Metro corriendo),
  y el riesgo de un bundler mal configurado es peor que perder algo de paridad visual
  literal. Si el equipo confirma que NativeWind corre bien localmente, migrar los
  estilos es un cambio aislado por pantalla, no arquitectónico.
- **Persistencia local:** `@react-native-async-storage/async-storage` en vez de
  `localStorage` (no existe en RN). `src/lib/cart.ts` y `src/lib/orders.ts` replican
  exactamente la lógica de `packages/frontend/src/lib/cart.ts` y `lib/orders.ts`
  (mismas claves conceptuales, mismo formato de datos) para que el historial de
  pedidos (ADR-004) sea portable si en el futuro se sincroniza entre dispositivos.
- **Cliente API:** `axios` + interceptor de token igual al de `lib/api.ts` del
  frontend (mismo refresh-on-401), apuntando a `EXPO_PUBLIC_API_URL` (Expo solo expone
  al bundle las env vars con prefijo `EXPO_PUBLIC_`, equivalente a `NEXT_PUBLIC_` en
  Next.js).
- **Tipos:** se agrega `@obraya/shared` como dependencia de workspace, igual que en
  `packages/frontend` — no se duplican las interfaces `Order`, `OrderItem`,
  `PublicCompany`, `PublicProduct`.
- **Alcance de pantallas de este pase:** paridad con el MVP web actual — home/listado
  de marketplace con categorías y búsqueda, ficha de fabricante, detalle de producto,
  carrito, checkout, `/my-orders` (lista + detalle con tracking y "repetir pedido"),
  login (reusa `/auth/login` y `/auth/demo`, igual que `DemoCredentials` del frontend).
  Favoritos, libreta de direcciones y perfil completo quedan pendientes igual que en
  la versión web (ver `docs/specs/marketplace-comprador.md`).

## Justificación

- Reusar el mismo backend y los mismos tipos compartidos evita divergencia de reglas
  de negocio entre web y mobile (precios, transiciones de estado de pedido, etc.).
- `expo-router` ya era la dependencia elegida en el `package.json` original; no se
  introduce una librería de navegación nueva.
- Priorizar una arquitectura simple y verificable (TypeScript + StyleSheet) sobre una
  con más piezas de configuración, dado que este entorno no tiene forma de levantar un
  simulador/Metro para probar visualmente antes de entregar.

## Consecuencias

- No hay paridad visual pixel-perfect con el frontend (misma paleta y radios, pero no
  las mismas clases utilitarias). Aceptable para este pase.
- `npm install --workspace=packages/mobile` corrió sin errores y `npx tsc --noEmit`
  pasa limpio con las 13 pantallas implementadas (home, ficha de tienda, producto,
  carrito, checkout, order-confirmation, my-orders lista+detalle, perfil/login demo).
  Sigue sin probarse en un simulador/dispositivo real ni con Metro corriendo — este
  entorno no tiene esa capacidad — así que puede haber errores de runtime (layout,
  linking nativo) que el typecheck no detecta.
- Cualquier cambio de reglas de negocio (precios, stock, transición de estados) hecho
  solo en `packages/frontend` sin tocar `packages/mobile` puede generar
  inconsistencia — al no compartir componentes de UI (solo tipos y, potencialmente,
  lógica pura), hay que recordar actualizar ambos.

## Riesgos

- **Medio**: el código compila (TypeScript limpio) pero no se ejecutó nunca en Metro
  ni en un simulador/dispositivo. El primer paso al retomar este trabajo localmente
  debe ser `npm run dev:mobile` (o `npx expo start` dentro de `packages/mobile`) y
  corregir lo que la falta de entorno no permitió detectar acá (layout real en
  pantalla, linking de módulos nativos como `react-native-reanimated`/`gesture-handler`,
  comportamiento de `AsyncStorage` en dispositivo).
