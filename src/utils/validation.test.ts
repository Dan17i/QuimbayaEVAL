import { describe, it, expect } from 'vitest';
import { isValidEmail, isValidPassword, isNotEmpty } from './validation';

describe('validation utils', () => {
  describe('isValidEmail', () => {
    it('acepta correos electrónicos válidos', () => {
      expect(isValidEmail('usuario@sena.edu.co')).toBe(true);
      expect(isValidEmail('dan17i@uqvirtual.edu.co')).toBe(true);
      expect(isValidEmail('test.user@domain.com')).toBe(true);
    });

    it('rechaza correos inválidos', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalido')).toBe(false);
      expect(isValidEmail('@sena.edu.co')).toBe(false);
      expect(isValidEmail('usuario@')).toBe(false);
      expect(isValidEmail('usuario@dominio')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('valida que la contraseña tenga al menos 6 caracteres', () => {
      expect(isValidPassword('123456')).toBe(true);
      expect(isValidPassword('Sena2026!')).toBe(true);
      expect(isValidPassword('12345')).toBe(false);
      expect(isValidPassword('')).toBe(false);
    });
  });

  describe('isNotEmpty', () => {
    it('valida que la cadena contenga caracteres no vacíos', () => {
      expect(isNotEmpty('Hola')).toBe(true);
      expect(isNotEmpty(' a ')).toBe(true);
      expect(isNotEmpty('')).toBe(false);
      expect(isNotEmpty('   ')).toBe(false);
    });
  });
});
