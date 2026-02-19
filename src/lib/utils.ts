/**
 * Calcula el número de semana del año para una fecha dada
 * Basado en ISO 8601: semana comienza en lunes
 */
export function getWeekNumber(date: Date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Obtiene el año actual
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Formatea una fecha como "Semana X del YYYY"
 */
export function formatWeekDisplay(weekNumber: number, year: number): string {
  return `Semana ${weekNumber} del ${year}`;
}