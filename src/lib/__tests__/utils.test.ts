import { describe, it, expect } from 'vitest';
import { getWeekNumber, getCurrentYear, getWeekDates, formatWeekDisplay } from '../utils';

describe('getWeekNumber (ISO 8601)', () => {
  it('semanas consecutivas difieren en 1', () => {
    const w1 = getWeekNumber(new Date('2026-06-15')); // lunes
    const w2 = getWeekNumber(new Date('2026-06-22')); // lunes siguiente
    expect(w2 - w1).toBe(1);
  });
  it('siempre entre 1 y 53', () => {
    for (const d of ['2026-01-05', '2026-03-15', '2026-06-19', '2026-12-31']) {
      const w = getWeekNumber(new Date(d));
      expect(w).toBeGreaterThanOrEqual(1);
      expect(w).toBeLessThanOrEqual(53);
    }
  });
});

describe('getCurrentYear', () => {
  it('devuelve el año actual', () => {
    expect(getCurrentYear()).toBe(new Date().getFullYear());
  });
});

describe('getWeekDates', () => {
  it('devuelve 7 días y rango start/end con formato dd/mm', () => {
    const r = getWeekDates(25, 2026);
    expect(r.days).toHaveLength(7);
    expect(r.start).toMatch(/^\d{2}\/\d{2}$/);
    expect(r.end).toMatch(/^\d{2}\/\d{2}$/);
  });
});

describe('formatWeekDisplay', () => {
  it('formatea "Semana X del YYYY"', () => {
    expect(formatWeekDisplay(25, 2026)).toBe('Semana 25 del 2026');
  });
});
