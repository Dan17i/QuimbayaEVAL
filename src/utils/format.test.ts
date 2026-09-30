import { describe, it, expect } from 'vitest';
import {
  formatCalificacion,
  formatPercentage,
  formatDuracion,
  formatLargeNumber,
} from './format';

describe('format utils', () => {
  describe('formatCalificacion', () => {
    it('formatea notas en escala institucional 0.0 a 5.0', () => {
      expect(formatCalificacion(4.5, 5.0)).toBe('4.5/5.0');
      expect(formatCalificacion(3.8)).toBe('3.8/5.0');
      expect(formatCalificacion(5.0)).toBe('5.0/5.0');
      expect(formatCalificacion(0)).toBe('0.0/5.0');
    });
  });

  describe('formatPercentage', () => {
    it('formatea porcentajes con decimales configurables', () => {
      expect(formatPercentage(85.555, 1)).toBe('85.6%');
      expect(formatPercentage(100, 0)).toBe('100%');
      expect(formatPercentage(75, 1)).toBe('75.0%');
    });
  });

  describe('formatDuracion', () => {
    it('formatea duración en minutos para tiempos menores a 1 hora', () => {
      expect(formatDuracion(45)).toBe('45 min');
      expect(formatDuracion(15)).toBe('15 min');
    });

    it('formatea duración en horas y minutos para tiempos mayores a 1 hora', () => {
      expect(formatDuracion(60)).toBe('1h');
      expect(formatDuracion(90)).toBe('1h 30min');
      expect(formatDuracion(120)).toBe('2h');
    });
  });

  describe('formatLargeNumber', () => {
    it('abrevia números grandes en K o M', () => {
      expect(formatLargeNumber(500)).toBe('500');
      expect(formatLargeNumber(1500)).toBe('1.5K');
      expect(formatLargeNumber(2500000)).toBe('2.5M');
    });
  });
});
