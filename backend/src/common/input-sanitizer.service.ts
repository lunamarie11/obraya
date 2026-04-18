import { Injectable } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';

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
    /--/g, // SQL comments
    /\/\*.*?\*\//g, // SQL comments
    /\.\./g, // Directory traversal
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

    // Remover caracteres de control
    let sanitized = input.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    // Verificar patrones maliciosos
    const isMalicious = this.maliciousPatterns.some(pattern => pattern.test(sanitized));

    if (isMalicious) {
      console.warn(`🚨 Contenido malicioso detectado en input: ${input.substring(0, 100)}...`);
      throw new BadRequestException('Contenido no permitido detectado');
    }

    // Sanitizar caracteres especiales
    sanitized = sanitized
      .replace(/[<>]/g, '') // Remover < >
      .replace(/['"]/g, '') // Remover comillas
      .trim();

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
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitizar keys también
        const sanitizedKey = this.sanitizeString(key);
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && !this.maliciousPatterns.some(pattern => pattern.test(email));
  }

  validatePhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{8,}$/;
    return phoneRegex.test(phone) && !this.maliciousPatterns.some(pattern => pattern.test(phone));
  }

  validatePassword(password: string): boolean {
    // Mínimo 6 caracteres, al menos una letra y un número
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
    return passwordRegex.test(password);
  }
}