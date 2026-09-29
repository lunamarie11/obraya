import { Injectable, BadRequestException } from '@nestjs/common';

// Ver ADR-007: sanitizacion global de inputs, portada desde el codebase
// paralelo (/Users/dely/obraya) que tenia esta capa de seguridad y este no.
@Injectable()
export class InputSanitizerService {
  // Patrones de ataque comunes
  private readonly maliciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // XSS scripts
    /javascript:/gi, // JavaScript URLs
    /vbscript:/gi, // VBScript URLs
    /onload\s*=/gi, // Event handlers
    /onerror\s*=/gi, // Event handlers
    /union\s+select/gi, // SQL injection
    /drop\s+table/gi, // SQL injection
    /\/\*.*?\*\//g, // SQL comments
    /\.\.\//g, // Directory traversal
    /base64,/gi, // Base64 encoded content
    /eval\s*\(/gi, // Code injection
    /Function\s*\(/gi, // Code injection
    /setTimeout\s*\(/gi, // Code injection
    /setInterval\s*\(/gi, // Code injection
  ];

  sanitize(input: string): string {
    return this.sanitizeString(input);
  }

  sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      throw new BadRequestException('Input must be a string');
    }

    // Remover caracteres de control (rango intencional, no es un typo)
    // eslint-disable-next-line no-control-regex
    let sanitized = input.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    // Verificar patrones maliciosos
    const isMalicious = this.maliciousPatterns.some((pattern) => pattern.test(sanitized));

    if (isMalicious) {
      throw new BadRequestException('Contenido no permitido detectado');
    }

    // Remover tags HTML crudos (pero conserva comillas: direcciones, nombres
    // y notas legitimas usan apostrofes y comillas con frecuencia)
    sanitized = sanitized.replace(/[<>]/g, '').trim();

    return sanitized;
  }

  sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }
}
