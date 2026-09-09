import { isValidCuit } from './cuit.validator';

describe('isValidCuit', () => {
  it('acepta CUITs reales con checksum correcto', () => {
    // CUIT publico de homologacion de AFIP (ver ADR-010)
    expect(isValidCuit('20409378472')).toBe(true);
  });

  it('acepta el caso limite donde el digito verificador es 0', () => {
    expect(isValidCuit('27123456780')).toBe(true);
  });

  it('acepta el caso limite donde el digito verificador es 9', () => {
    expect(isValidCuit('27123456799')).toBe(true);
  });

  it('rechaza un CUIT con el digito verificador incorrecto', () => {
    expect(isValidCuit('20409378471')).toBe(false);
    expect(isValidCuit('27123456781')).toBe(false);
  });

  it('rechaza strings que no tienen 11 digitos', () => {
    expect(isValidCuit('2040937847')).toBe(false);
    expect(isValidCuit('204093784722')).toBe(false);
  });

  it('rechaza strings con caracteres no numericos', () => {
    expect(isValidCuit('2040937847a')).toBe(false);
    expect(isValidCuit('20-40937847-2')).toBe(false);
  });
});
