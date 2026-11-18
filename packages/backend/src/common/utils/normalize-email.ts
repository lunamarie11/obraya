// Normaliza un email para usarlo como clave de búsqueda/unicidad en toda la
// app (registro y login de las 3 identidades: CompanyUser, Buyer, Delivery).
// Bug real en producción: un cliente se registró, el email quedó guardado
// tal cual lo tipeó, y al loguearse con una capitalización distinta (muy
// común: autocapitalización del teclado, copy/paste) el `findOne` por email
// no encontraba la fila -> "Credenciales inválidas" (mensaje genérico, se
// percibe como "contraseña inválida" aunque el problema es el email).
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
