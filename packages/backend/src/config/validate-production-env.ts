// Ver ADR-014. Estos son los mismos valores por defecto de packages/backend/src/config/app.config.ts
// y de infra/docker/docker-compose.yml — si `NODE_ENV=production` arranca con
// alguno de ellos, es casi seguro un secret que nadie configuro (o el que se
// compartio por error en el chat durante desarrollo), no una eleccion real.
const DEFAULT_JWT_SECRET = 'change-me-in-production';
const DEFAULT_JWT_REFRESH_SECRET = 'change-me-refresh-in-production';
const DEFAULT_DATABASE_PASSWORD = 'password';
const MIN_SECRET_LENGTH = 32;

// Validacion fail-fast: en produccion, arrancar con un JWT_SECRET adivinable
// o con la password default de Postgres es un incidente de seguridad, no un
// warning que se pueda ignorar (a diferencia del resto de las integraciones
// best-effort del proyecto, que se degradan solas si falta configuracion).
// Devuelve la lista de errores encontrados; vacia si no corre en produccion
// o si la configuracion es valida.
export function validateProductionEnv(env: NodeJS.ProcessEnv = process.env): string[] {
  if (env.NODE_ENV !== 'production') return [];

  const errors: string[] = [];

  const checkSecret = (name: string, defaultValue: string) => {
    const value = env[name];
    if (!value) {
      errors.push(`${name} no esta configurado.`);
    } else if (value === defaultValue) {
      errors.push(`${name} sigue usando el valor por defecto de desarrollo (generar uno nuevo, ej. "openssl rand -base64 48").`);
    } else if (value.length < MIN_SECRET_LENGTH) {
      errors.push(`${name} tiene menos de ${MIN_SECRET_LENGTH} caracteres.`);
    }
  };

  checkSecret('JWT_SECRET', DEFAULT_JWT_SECRET);
  checkSecret('JWT_REFRESH_SECRET', DEFAULT_JWT_REFRESH_SECRET);

  if (env.DATABASE_PASSWORD === DEFAULT_DATABASE_PASSWORD) {
    errors.push('DATABASE_PASSWORD sigue usando el valor por defecto de desarrollo.');
  }

  return errors;
}
