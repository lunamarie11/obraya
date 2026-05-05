import { BadRequestException } from '@nestjs/common';
import { InputSanitizerService } from './input-sanitizer.service';

describe('InputSanitizerService', () => {
  let sanitizer: InputSanitizerService;

  beforeEach(() => {
    sanitizer = new InputSanitizerService();
  });

  it('should sanitize plain values and remove safe markup characters', () => {
    const input = '  Hello <b>World</b>  ';
    const sanitized = sanitizer.sanitizeString(input);

    expect(sanitized).toBe('Hello bWorld/b');
  });

  it('should sanitize nested objects and object keys', () => {
    const payload = {
      '<name>': '<i>Alice</i>',
      details: {
        phone: '+56 9 1234 5678',
        notes: ['<u>good</u>', 'safe'],
      },
    };

    const result = sanitizer.sanitizeObject(payload);

    expect(result).toEqual({
      name: 'iAlice/i',
      details: {
        phone: '+56 9 1234 5678',
        notes: ['ugood/u', 'safe'],
      },
    });
  });

  it('should reject non-string values passed to sanitizeString', () => {
    expect(() => sanitizer.sanitizeString(123 as unknown as string)).toThrow(BadRequestException);
  });

  it('should validate email, phone, and password correctly', () => {
    expect(sanitizer.validateEmail('user@example.com')).toBe(true);
    expect(sanitizer.validateEmail('not-an-email')).toBe(false);
    expect(sanitizer.validatePhone('+56 9 1234 5678')).toBe(true);
    expect(sanitizer.validatePhone('drop table')).toBe(false);
    expect(sanitizer.validatePassword('Pass123')).toBe(true);
    expect(sanitizer.validatePassword('short')).toBe(false);
  });
});
