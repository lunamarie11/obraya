import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

// Digito verificador real de AFIP (modulo 11). Solo valida el checksum del
// CUIT/CUIL, no verifica que exista en el padron (eso lo hace AfipService,
// ver ADR-010).
export function isValidCuit(cuit: string): boolean {
  if (!/^\d{11}$/.test(cuit)) return false;

  const digits = cuit.split('').map(Number);
  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = digits
    .slice(0, 10)
    .reduce((acc, digit, i) => acc + digit * multipliers[i], 0);

  const mod = 11 - (sum % 11);
  const checkDigit = mod === 11 ? 0 : mod === 10 ? 9 : mod;

  return checkDigit === digits[10];
}

@ValidatorConstraint({ name: 'isValidCuit', async: false })
class IsValidCuitConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && isValidCuit(value);
  }

  defaultMessage(): string {
    return 'El CUIT no es válido (dígito verificador incorrecto)';
  }
}

export function IsValidCuit(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidCuitConstraint,
    });
  };
}
