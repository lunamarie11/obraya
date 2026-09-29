import { validateProductionEnv } from '../validate-production-env';

const VALID_SECRET = 'a'.repeat(40);

describe('validateProductionEnv', () => {
  it('no valida nada fuera de producción', () => {
    expect(validateProductionEnv({ NODE_ENV: 'development' })).toEqual([]);
    expect(validateProductionEnv({})).toEqual([]);
  });

  it('devuelve errores si faltan JWT_SECRET/JWT_REFRESH_SECRET en producción', () => {
    const errors = validateProductionEnv({ NODE_ENV: 'production' });
    expect(errors.some((e) => e.includes('JWT_SECRET'))).toBe(true);
    expect(errors.some((e) => e.includes('JWT_REFRESH_SECRET'))).toBe(true);
  });

  it('rechaza los valores por defecto de desarrollo', () => {
    const errors = validateProductionEnv({
      NODE_ENV: 'production',
      JWT_SECRET: 'change-me-in-production',
      JWT_REFRESH_SECRET: 'change-me-refresh-in-production',
      DATABASE_PASSWORD: 'password',
    });
    expect(errors).toHaveLength(3);
  });

  it('rechaza secrets configurados pero demasiado cortos', () => {
    const errors = validateProductionEnv({
      NODE_ENV: 'production',
      JWT_SECRET: 'corto',
      JWT_REFRESH_SECRET: VALID_SECRET,
    });
    expect(errors.some((e) => e.includes('JWT_SECRET') && e.includes('32'))).toBe(true);
  });

  it('no devuelve errores con una configuración de producción válida', () => {
    const errors = validateProductionEnv({
      NODE_ENV: 'production',
      JWT_SECRET: VALID_SECRET,
      JWT_REFRESH_SECRET: VALID_SECRET,
      DATABASE_PASSWORD: 'un-password-real-y-largo',
    });
    expect(errors).toEqual([]);
  });
});
