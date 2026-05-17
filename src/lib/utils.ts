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

/**
 * Obtiene las fechas de inicio y fin de una semana específica
 */
export function getWeekDates(weekNumber: number, year: number): { 
  start: string; 
  end: string;
  days: string[];
} {
  const simple = new Date(year, 0, 1 + (weekNumber - 1) * 7);
  const dow = simple.getDay();
  const weekStart = simple;
  if (dow <= 4) {
    weekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    weekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const formatDate = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };
  
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    days.push(String(d.getDate()).padStart(2, '0'));
  }
  
  return {
    start: formatDate(weekStart),
    end: formatDate(weekEnd),
    days,
  };
}