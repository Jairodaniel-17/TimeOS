import {
  createUser,
  createProject,
  createTask,
  createResource,
  createAllocation,
  createTaskTimeEntry,
  createTimeEntry,
  createApproval,
  createClient,
  createNotification,
  createProjectPhases,
  createObjective,
  createKeyResult,
  createInitiative,
  createSprint,
  getUsers,
  updateUser,
  getProjects,
  updateProject,
  getResources,
  updateResource,
  getApprovals,
} from './luma-docs';
import { getWeekNumber } from './utils';

// ---------------------------------------------------------------------------
// Date helpers — all data is anchored to the CURRENT week so the dashboard,
// timesheet, approvals and Gantt always look populated and "live", regardless
// of when the demo is run.
// ---------------------------------------------------------------------------
const MS_DAY = 86_400_000;

function mondayOfCurrentWeek(): Date {
  const d = new Date();
  const day = d.getDay() || 7; // Sun=0 -> 7
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (day - 1));
  return d;
}

const BASE_MONDAY = mondayOfCurrentWeek();

/** ISO date (YYYY-MM-DD) for `days` relative to the Monday of the current week. */
function isoOffset(days: number): string {
  const d = new Date(BASE_MONDAY.getTime() + days * MS_DAY);
  return d.toISOString().slice(0, 10);
}

/** week-number / year for a given offset (in weeks) from the current week. */
function weekYear(weekOffset: number): { weekNumber: number; year: number } {
  const d = new Date(BASE_MONDAY.getTime() + weekOffset * 7 * MS_DAY);
  return { weekNumber: getWeekNumber(d), year: d.getFullYear() };
}

type Hours = { mon: number; tue: number; wed: number; thu: number; fri: number; sat: number; sun: number };
const sumHours = (h: Hours) => h.mon + h.tue + h.wed + h.thu + h.fri + h.sat + h.sun;

// ---------------------------------------------------------------------------
// Static catalogs
// ---------------------------------------------------------------------------
const users = [
  { id: 'user_1', name: 'Ana García', email: 'ana.garcia@timeos.com', role: 'admin', password: 'admin123', isActive: true },
  { id: 'user_2', name: 'Carlos López', email: 'carlos.lopez@timeos.com', role: 'member', password: 'carlos123', isActive: true },
  { id: 'user_3', name: 'María Rodríguez', email: 'maria.rodriguez@timeos.com', role: 'member', password: 'maria123', isActive: true },
  { id: 'user_4', name: 'Pedro Sánchez', email: 'pedro.sanchez@timeos.com', role: 'member', password: 'pedro123', isActive: true },
  { id: 'user_5', name: 'Laura Martínez', email: 'laura.martinez@timeos.com', role: 'member', password: 'laura123', isActive: true },
  { id: 'user_6', name: 'Andrés Rejas', email: 'andres.rejas@orvanta.com', role: 'manager', password: 'andres123', isActive: true },
  { id: 'user_7', name: 'Edson Alvarado', email: 'edson.alvarado@orvanta.com', role: 'member', password: 'edson123', isActive: true },
  { id: 'user_8', name: 'Jairo Mendoza', email: 'jairo.mendoza@orvanta.com', role: 'admin', password: 'jairo123', isActive: true },
  // Segundo manager (PM) para cubrir aprobaciones/objetivos de equipo.
  { id: 'user_9', name: 'Lucía Fernández', email: 'lucia.fernandez@timeos.com', role: 'manager', password: 'lucia123', isActive: true },
  // Member SIN recurso asociado (caso "no monitoreado": registra horas pero no tiene tarifa/capacidad).
  { id: 'user_10', name: 'Diego Torres', email: 'diego.torres@timeos.com', role: 'member', password: 'diego123', isActive: true },
  // Usuario INACTIVO (no puede iniciar sesión; aparece en la lista como deshabilitado).
  { id: 'user_11', name: 'Rosa Núñez', email: 'rosa.nunez@timeos.com', role: 'member', password: 'rosa123', isActive: false },
];

const clients = [
  { id: 'client_1', name: 'Acme Corp', contact: 'John Carter', email: 'jcarter@acme.com', phone: '+1 555-0101' },
  { id: 'client_2', name: 'TechStart', contact: 'Emily Vance', email: 'emily@techstart.io', phone: '+1 555-0114' },
  { id: 'client_3', name: 'DataCorp', contact: 'Raj Patel', email: 'raj.patel@datacorp.com', phone: '+1 555-0190' },
  { id: 'client_4', name: 'Northwind Retail', contact: 'Sofía Méndez', email: 'sofia@northwind.com', phone: '+34 600-112-233' },
  { id: 'client_5', name: 'Globex', contact: 'Hank Scorpio', email: 'hank@globex.com', phone: '+1 555-0177' },
  { id: 'client_6', name: 'Initech', contact: 'Bill Lumbergh', email: 'bill@initech.com', phone: '+1 555-0199' },
  // Cliente con datos mínimos (solo nombre) para probar UI con campos opcionales vacíos.
  { id: 'client_7', name: 'Cliente Minimal' },
];

const projects = [
  { id: 'proj_1', name: 'Portal Clientes', code: 'PORT-001', client: 'Acme Corp', billable: true, status: 'active' as const, startDate: isoOffset(-35), endDate: isoOffset(35), budget: 50000, budgetHours: 520, hourlyRate: 120, currency: 'USD', progress: 48 },
  { id: 'proj_2', name: 'App Móvil', code: 'MOB-002', client: 'TechStart', billable: true, status: 'active' as const, startDate: isoOffset(-21), endDate: isoOffset(49), budget: 35000, budgetHours: 360, hourlyRate: 110, currency: 'USD', progress: 32 },
  { id: 'proj_3', name: 'Integración NetSuite', code: 'INT-003', client: 'Globex', billable: false, status: 'active' as const, startDate: isoOffset(-14), endDate: isoOffset(42), budget: 20000, budgetHours: 200, hourlyRate: 100, currency: 'USD', progress: 25 },
  { id: 'proj_4', name: 'Dashboard Analytics', code: 'DASH-004', client: 'DataCorp', billable: true, status: 'active' as const, startDate: isoOffset(-7), endDate: isoOffset(56), budget: 25000, budgetHours: 240, hourlyRate: 115, currency: 'USD', progress: 15 },
  { id: 'proj_5', name: 'Migración Cloud', code: 'MIG-005', client: 'Northwind Retail', billable: true, status: 'active' as const, startDate: isoOffset(-28), endDate: isoOffset(14), budget: 15000, budgetHours: 160, hourlyRate: 105, currency: 'USD', progress: 60 },
  { id: 'proj_6', name: 'Rediseño Web Corporativa', code: 'WEB-006', client: 'Acme Corp', billable: true, status: 'completed' as const, startDate: isoOffset(-120), endDate: isoOffset(-30), budget: 18000, budgetHours: 180, hourlyRate: 100, currency: 'USD', progress: 100 },
  { id: 'proj_7', name: 'Plataforma E-learning', code: 'EDU-007', client: 'TechStart', billable: true, status: 'on_hold' as const, startDate: isoOffset(-10), endDate: isoOffset(70), budget: 40000, budgetHours: 420, hourlyRate: 110, currency: 'USD', progress: 8 },
  // Proyecto ARCHIVADO (estado archived).
  { id: 'proj_8', name: 'Sitio Legacy 2024', code: 'LEG-008', client: 'Initech', billable: true, status: 'archived' as const, startDate: isoOffset(-300), endDate: isoOffset(-180), budget: 12000, budgetHours: 120, hourlyRate: 100, currency: 'USD', progress: 100 },
  // Proyecto NO FACTURABLE (interno) + sin cliente.
  { id: 'proj_9', name: 'Mejoras Internas DevEx', code: 'INT-009', client: undefined, billable: false, status: 'active' as const, startDate: isoOffset(-7), endDate: isoOffset(63), budget: 8000, budgetHours: 100, hourlyRate: 0, currency: 'USD', progress: 20 },
  // Proyecto SOBRE PRESUPUESTO (budget bajo + actualCost/actualHours altos forzados).
  { id: 'proj_10', name: 'Soporte Crítico Acme', code: 'SUP-010', client: 'Acme Corp', billable: true, status: 'active' as const, startDate: isoOffset(-45), endDate: isoOffset(7), budget: 6000, budgetHours: 60, hourlyRate: 120, currency: 'USD', progress: 75, actualCost: 9450, actualHours: 90, profit: -3450, profitMargin: -57.5 },
  // Proyecto NO INICIADO (progress 0, fechas en el futuro).
  { id: 'proj_11', name: 'Rediseño Marca Globex', code: 'BRD-011', client: 'Globex', billable: true, status: 'active' as const, startDate: isoOffset(14), endDate: isoOffset(84), budget: 30000, budgetHours: 300, hourlyRate: 110, currency: 'USD', progress: 0 },
  // Segundo proyecto on_hold con cliente minimal.
  { id: 'proj_12', name: 'Piloto IoT', code: 'IOT-012', client: 'Cliente Minimal', billable: true, status: 'on_hold' as const, startDate: isoOffset(-21), endDate: isoOffset(42), budget: 22000, budgetHours: 220, hourlyRate: 115, currency: 'USD', progress: 12 },
];

const resources = [
  { id: 'res_1', userId: 'user_2', capacity: 40, skills: ['React', 'TypeScript', 'Node.js'], hourlyRate: 45, monthlySalary: 7200, currency: 'USD' },
  { id: 'res_2', userId: 'user_3', capacity: 40, skills: ['Figma', 'UI/UX', 'Design Systems'], hourlyRate: 42, monthlySalary: 6720, currency: 'USD' },
  { id: 'res_3', userId: 'user_4', capacity: 40, skills: ['Python', 'SQL', 'Backend'], hourlyRate: 50, monthlySalary: 8000, currency: 'USD' },
  { id: 'res_4', userId: 'user_5', capacity: 40, skills: ['Testing', 'QA', 'Automation'], hourlyRate: 38, monthlySalary: 6080, currency: 'USD' },
  { id: 'res_5', userId: 'user_7', capacity: 40, skills: ['DevOps', 'AWS', 'CI/CD'], hourlyRate: 52, monthlySalary: 8320, currency: 'USD' },
  // Recurso del usuario inactivo (sigue existiendo el registro de costo histórico).
  { id: 'res_6', userId: 'user_11', capacity: 40, skills: ['Data', 'ETL'], hourlyRate: 44, monthlySalary: 7040, currency: 'USD' },
  // NOTA: user_10 (Diego Torres) NO tiene recurso a propósito — caso "miembro sin tarifa".
];

// ---------------------------------------------------------------------------
// Tasks — generated per active project as epics + subtasks with dates that
// span the current Gantt window (roughly -5 to +8 weeks).
// ---------------------------------------------------------------------------
type Priority = 'low' | 'medium' | 'high';
type Status = 'todo' | 'in_progress' | 'done';
type IssueType = 'epic' | 'story' | 'task' | 'bug';
interface SeedTask {
  id: string; projectId: string; parentId?: string; name: string; description?: string;
  assigneeId?: string; startDate: string; endDate: string; estimatedHours: number;
  actualHours: number; progress: number; priority: Priority; status: Status; dependencies: string[];
  type: IssueType; sprintId?: string; isMilestone?: boolean;
}
const SUB_TYPES: IssueType[] = ['story', 'task', 'bug', 'task'];

function statusFromProgress(p: number): Status {
  if (p >= 100) return 'done';
  if (p > 0) return 'in_progress';
  return 'todo';
}

function buildProjectTasks(
  projectId: string,
  startOffsetDays: number,
  assignees: string[],
  blueprint: { epic: string; subs: { name: string; days: number; est: number; prog: number; prio: Priority }[] }[],
): SeedTask[] {
  const tasks: SeedTask[] = [];
  let cursor = startOffsetDays;
  blueprint.forEach((epic, ei) => {
    const epicId = `${projectId}_e${ei + 1}`;
    const epicStart = cursor;
    const subTasks: SeedTask[] = [];
    let subCursor = cursor;
    epic.subs.forEach((s, si) => {
      const start = subCursor;
      const end = subCursor + s.days - 1;
      const assignee = assignees[(ei + si) % assignees.length];
      const est = s.est;
      const actual = Math.round((est * Math.min(s.prog, 100)) / 100);
      subTasks.push({
        id: `${epicId}_t${si + 1}`,
        projectId,
        parentId: epicId,
        name: s.name,
        description: `${s.name} — ${blueprint[ei].epic}`,
        assigneeId: assignee,
        startDate: isoOffset(start),
        endDate: isoOffset(end),
        estimatedHours: est,
        actualHours: actual,
        progress: s.prog,
        priority: s.prio,
        status: statusFromProgress(s.prog),
        dependencies: si > 0 ? [`${epicId}_t${si}`] : [],
        type: SUB_TYPES[si % SUB_TYPES.length],
      });
      subCursor = end + 1;
    });
    const epicEnd = subCursor - 1;
    const epicEst = epic.subs.reduce((a, s) => a + s.est, 0);
    const epicActual = subTasks.reduce((a, t) => a + t.actualHours, 0);
    const epicProg = epicEst > 0 ? Math.round((epicActual / epicEst) * 100) : 0;
    tasks.push({
      id: epicId,
      projectId,
      name: epic.epic,
      description: `Fase: ${epic.epic}`,
      startDate: isoOffset(epicStart),
      endDate: isoOffset(epicEnd),
      estimatedHours: epicEst,
      actualHours: epicActual,
      progress: epicProg,
      priority: 'high',
      status: statusFromProgress(epicProg),
      dependencies: ei > 0 ? [`${projectId}_e${ei}`] : [],
      type: 'epic',
    });
    tasks.push(...subTasks);
    cursor = epicEnd + 1;
  });
  return tasks;
}

const tasks: SeedTask[] = [
  ...buildProjectTasks('proj_1', -35, ['user_2', 'user_4', 'user_5'], [
    { epic: 'Análisis y Diseño', subs: [
      { name: 'Análisis de requerimientos', days: 5, est: 40, prog: 100, prio: 'high' },
      { name: 'Diseño de UI/UX', days: 9, est: 80, prog: 100, prio: 'high' },
    ] },
    { epic: 'Desarrollo', subs: [
      { name: 'Login y autenticación', days: 5, est: 40, prog: 100, prio: 'high' },
      { name: 'Dashboard principal', days: 7, est: 60, prog: 70, prio: 'high' },
      { name: 'Módulo de reportes', days: 7, est: 50, prog: 25, prio: 'medium' },
      { name: 'APIs de negocio', days: 9, est: 80, prog: 40, prio: 'high' },
    ] },
    { epic: 'Testing y Cierre', subs: [
      { name: 'QA manual', days: 7, est: 50, prog: 0, prio: 'medium' },
      { name: 'Pase a producción', days: 3, est: 20, prog: 0, prio: 'high' },
    ] },
  ]),
  ...buildProjectTasks('proj_2', -21, ['user_3', 'user_2'], [
    { epic: 'Research y Discovery', subs: [
      { name: 'Investigación de usuarios', days: 5, est: 30, prog: 100, prio: 'high' },
      { name: 'Wireframes', days: 7, est: 40, prog: 60, prio: 'medium' },
    ] },
    { epic: 'Desarrollo App', subs: [
      { name: 'Setup React Native', days: 4, est: 24, prog: 30, prio: 'high' },
      { name: 'Pantallas principales', days: 10, est: 80, prog: 10, prio: 'high' },
      { name: 'Integración API', days: 8, est: 60, prog: 0, prio: 'medium' },
    ] },
  ]),
  ...buildProjectTasks('proj_3', -14, ['user_4', 'user_7'], [
    { epic: 'Integración NetSuite', subs: [
      { name: 'Mapeo de entidades', days: 5, est: 30, prog: 60, prio: 'high' },
      { name: 'Conector SuiteTalk', days: 9, est: 70, prog: 20, prio: 'high' },
      { name: 'Pruebas de sincronización', days: 6, est: 40, prog: 0, prio: 'medium' },
    ] },
  ]),
  ...buildProjectTasks('proj_4', -7, ['user_3', 'user_4'], [
    { epic: 'Dashboard Analytics', subs: [
      { name: 'Modelo de datos', days: 5, est: 30, prog: 40, prio: 'high' },
      { name: 'Gráficas y KPIs', days: 8, est: 60, prog: 10, prio: 'medium' },
      { name: 'Exportación de reportes', days: 6, est: 40, prog: 0, prio: 'low' },
    ] },
  ]),
  ...buildProjectTasks('proj_5', -28, ['user_4', 'user_5', 'user_7'], [
    { epic: 'Migración Cloud', subs: [
      { name: 'Inventario de servidores', days: 4, est: 24, prog: 100, prio: 'high' },
      { name: 'Migración de base de datos', days: 8, est: 60, prog: 80, prio: 'high' },
      { name: 'Validación y cutover', days: 5, est: 40, prog: 30, prio: 'high' },
    ] },
  ]),
  // E-learning (on_hold) — su board debe tener cards aunque el proyecto esté en pausa.
  ...buildProjectTasks('proj_7', -10, ['user_3', 'user_2'], [
    { epic: 'Definición de cursos', subs: [
      { name: 'Estructura de currículo', days: 5, est: 30, prog: 20, prio: 'medium' },
      { name: 'Storyboards de lecciones', days: 7, est: 40, prog: 0, prio: 'low' },
    ] },
  ]),
  // Mejoras Internas DevEx (no facturable) — varias prioridades low.
  ...buildProjectTasks('proj_9', -7, ['user_7', 'user_4', 'user_2'], [
    { epic: 'Tooling interno', subs: [
      { name: 'Plantillas de PR', days: 3, est: 12, prog: 100, prio: 'low' },
      { name: 'Script de seed local', days: 4, est: 16, prog: 50, prio: 'low' },
      { name: 'Dashboard de métricas internas', days: 6, est: 30, prog: 0, prio: 'medium' },
    ] },
  ]),
  // Soporte Crítico Acme (sobre presupuesto) — muchos bugs.
  ...buildProjectTasks('proj_10', -45, ['user_4', 'user_5'], [
    { epic: 'Incidentes producción', subs: [
      { name: 'Hotfix caída de login', days: 2, est: 12, prog: 100, prio: 'high' },
      { name: 'Fuga de memoria en API', days: 5, est: 30, prog: 80, prio: 'high' },
      { name: 'Errores de facturación', days: 6, est: 36, prog: 60, prio: 'high' },
    ] },
  ]),
  // Piloto IoT (on_hold) — board con cards.
  ...buildProjectTasks('proj_12', -21, ['user_3', 'user_7'], [
    { epic: 'Prueba de concepto', subs: [
      { name: 'Selección de sensores', days: 4, est: 20, prog: 40, prio: 'medium' },
      { name: 'Gateway de ingesta', days: 7, est: 40, prog: 10, prio: 'medium' },
    ] },
  ]),
];

// ---------------------------------------------------------------------------
// Tareas de borde — cubren estados que el generador no produce: milestone,
// tarea vencida (overdue), sin asignar, prioridad explícita, todos los tipos
// de issue (epic/story/task/bug) y dependencias cruzadas.
// ---------------------------------------------------------------------------
const extraTasks: SeedTask[] = [
  // Milestone (hito) — duración de 1 día, sin progreso, en Portal Clientes.
  { id: 'proj_1_ms_launch', projectId: 'proj_1', name: 'Hito: Lanzamiento beta', description: 'Milestone de lanzamiento beta a usuarios piloto.', startDate: isoOffset(7), endDate: isoOffset(7), estimatedHours: 0, actualHours: 0, progress: 0, priority: 'high', status: 'todo', dependencies: ['proj_1_e2'], type: 'task', isMilestone: true },
  // Tarea VENCIDA (overdue): fecha fin en el pasado y status != done.
  { id: 'proj_2_overdue_qa', projectId: 'proj_2', name: 'Pruebas de regresión móvil', description: 'QA pendiente, ya pasó su fecha límite.', assigneeId: 'user_5', startDate: isoOffset(-14), endDate: isoOffset(-3), estimatedHours: 24, actualHours: 8, progress: 30, priority: 'high', status: 'in_progress', dependencies: [], type: 'bug' },
  // Tarea SIN ASIGNAR + prioridad low + backlog (sin sprint).
  { id: 'proj_2_unassigned_doc', projectId: 'proj_2', name: 'Documentar API pública', description: 'Sin responsable asignado todavía.', startDate: isoOffset(3), endDate: isoOffset(10), estimatedHours: 16, actualHours: 0, progress: 0, priority: 'low', status: 'todo', dependencies: [], type: 'story' },
  // Bug de alta prioridad EN PROGRESO en Dashboard Analytics, con dependencia.
  { id: 'proj_4_bug_chart', projectId: 'proj_4', name: 'Bug: gráfica no refresca en tiempo real', description: 'Bug reportado por el cliente.', assigneeId: 'user_3', startDate: isoOffset(-2), endDate: isoOffset(2), estimatedHours: 10, actualHours: 6, progress: 60, priority: 'high', status: 'in_progress', dependencies: ['proj_4_e1_t1'], type: 'bug' },
  // Story DONE de baja prioridad en Integración NetSuite.
  { id: 'proj_3_story_logs', projectId: 'proj_3', name: 'Logging básico del conector', description: 'Completada.', assigneeId: 'user_7', startDate: isoOffset(-12), endDate: isoOffset(-8), estimatedHours: 8, actualHours: 8, progress: 100, priority: 'low', status: 'done', dependencies: [], type: 'story' },
  // Tarea overdue adicional, sin asignar, en proyecto sobre presupuesto.
  { id: 'proj_10_overdue_inc', projectId: 'proj_10', name: 'Postmortem de incidentes', description: 'Vencida, sin responsable.', startDate: isoOffset(-9), endDate: isoOffset(-2), estimatedHours: 12, actualHours: 0, progress: 0, priority: 'medium', status: 'todo', dependencies: [], type: 'task' },
];
tasks.push(...extraTasks);

// Sprints (Scrum) para Portal Clientes, y asignación de issues al sprint activo.
const sprints: Parameters<typeof createSprint>[0][] = [
  { id: 'sprint_p1_1', projectId: 'proj_1', name: 'Sprint 1 · Fundamentos', goal: 'Login, dashboard y base de APIs', status: 'completed', startDate: isoOffset(-35), endDate: isoOffset(-21) },
  { id: 'sprint_p1_2', projectId: 'proj_1', name: 'Sprint 2 · Funcionalidad core', goal: 'Reportes, APIs de negocio y QA inicial', status: 'active', startDate: isoOffset(-14), endDate: isoOffset(0) },
  // Sprint PLANIFICADO (futuro) en Portal Clientes — cubre el estado 'planned'.
  { id: 'sprint_p1_3', projectId: 'proj_1', name: 'Sprint 3 · Cierre', goal: 'QA final y pase a producción', status: 'planned', startDate: isoOffset(1), endDate: isoOffset(14) },
  { id: 'sprint_p2_1', projectId: 'proj_2', name: 'Sprint 1 · Discovery', goal: 'Research y wireframes', status: 'active', startDate: isoOffset(-21), endDate: isoOffset(-7) },
  // Más proyectos con su propio sprint.
  { id: 'sprint_p4_1', projectId: 'proj_4', name: 'Sprint 1 · Datos', goal: 'Modelo de datos y primeras gráficas', status: 'active', startDate: isoOffset(-7), endDate: isoOffset(7) },
  { id: 'sprint_p10_1', projectId: 'proj_10', name: 'Sprint 1 · Estabilización', goal: 'Resolver incidentes críticos', status: 'completed', startDate: isoOffset(-30), endDate: isoOffset(-16) },
];
// Issues del épico 2 de Portal Clientes → sprint activo; los del épico 3 quedan en backlog.
// Algunos issues van a sprints activos/planificados; otros se quedan en backlog (sin sprintId).
tasks.forEach(t => {
  if (t.projectId === 'proj_1' && t.id.includes('_e2')) t.sprintId = 'sprint_p1_2';
  if (t.projectId === 'proj_1' && t.id === 'proj_1_ms_launch') t.sprintId = 'sprint_p1_3'; // milestone en sprint planificado
  if (t.projectId === 'proj_2' && t.id.includes('_e1')) t.sprintId = 'sprint_p2_1';
  if (t.projectId === 'proj_4' && t.id.includes('_e1')) t.sprintId = 'sprint_p4_1';
  if (t.projectId === 'proj_4' && t.id === 'proj_4_bug_chart') t.sprintId = 'sprint_p4_1';
  if (t.projectId === 'proj_10' && t.id.includes('_e1')) t.sprintId = 'sprint_p10_1';
  // proj_2_overdue_qa, proj_2_unassigned_doc, proj_3_*, proj_10_overdue_inc quedan en backlog.
});

// ---------------------------------------------------------------------------
// Weekly timesheets (the grid) — the data that powers the timesheet,
// approvals and dashboard. Generated for the last 5 weeks for each member,
// WITH worklog notes so the "qué hicieron" feature is visible in a demo.
// ---------------------------------------------------------------------------
interface MemberProfile {
  userId: string;
  rows: { projectId: string; activity: string; notes?: string; billable: boolean; weekday: Hours }[];
}

const profiles: MemberProfile[] = [
  { userId: 'user_2', rows: [
    { projectId: 'proj_1', activity: 'Desarrollo Frontend', billable: true, notes: 'Implementé el dashboard principal y los componentes de tabla; pendiente el responsive en móvil.', weekday: { mon: 8, tue: 8, wed: 7, thu: 8, fri: 6, sat: 0, sun: 0 } },
    { projectId: 'proj_2', activity: 'Setup React Native', billable: true, notes: 'Configuración del proyecto y navegación base. Bloqueado por credenciales del API.', weekday: { mon: 0, tue: 0, wed: 2, thu: 0, fri: 2, sat: 0, sun: 0 } },
  ] },
  { userId: 'user_3', rows: [
    { projectId: 'proj_2', activity: 'Diseño UI/UX', billable: true, notes: 'Wireframes de alta fidelidad para onboarding y home; revisión con el cliente el jueves.', weekday: { mon: 7, tue: 8, wed: 8, thu: 6, fri: 5, sat: 0, sun: 0 } },
    { projectId: 'proj_4', activity: 'Diseño de gráficas', billable: true, notes: 'Exploración visual de KPIs y paleta del dashboard de analytics.', weekday: { mon: 1, tue: 0, wed: 0, thu: 2, fri: 3, sat: 0, sun: 0 } },
  ] },
  { userId: 'user_4', rows: [
    { projectId: 'proj_1', activity: 'Desarrollo Backend', billable: true, notes: 'APIs de negocio: endpoints de proyectos y validación con Zod. Falta cobertura de tests.', weekday: { mon: 8, tue: 8, wed: 8, thu: 8, fri: 4, sat: 0, sun: 0 } },
    { projectId: 'proj_3', activity: 'Conector SuiteTalk', billable: false, notes: 'Mapeo de entidades NetSuite y primeras llamadas al conector.', weekday: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 4, sat: 0, sun: 0 } },
  ] },
  { userId: 'user_5', rows: [
    { projectId: 'proj_1', activity: 'Testing y QA', billable: true, notes: 'Casos de prueba del módulo de login; reporté 3 bugs de validación.', weekday: { mon: 6, tue: 6, wed: 8, thu: 8, fri: 6, sat: 0, sun: 0 } },
    { projectId: 'proj_5', activity: 'Validación de migración', billable: true, notes: 'Verificación de integridad de datos tras la migración de BD.', weekday: { mon: 2, tue: 2, wed: 0, thu: 0, fri: 2, sat: 0, sun: 0 } },
  ] },
  { userId: 'user_7', rows: [
    { projectId: 'proj_3', activity: 'DevOps / CI', billable: false, notes: 'Pipeline de CI para el conector y entorno de staging.', weekday: { mon: 4, tue: 6, wed: 6, thu: 6, fri: 4, sat: 0, sun: 0 } },
    { projectId: 'proj_5', activity: 'Infra Cloud', billable: true, notes: 'Aprovisionamiento de la infraestructura de cutover en AWS.', weekday: { mon: 4, tue: 2, wed: 2, thu: 2, fri: 0, sat: 0, sun: 0 } },
  ] },
  // Miembro SIN recurso (user_10): registra horas; algunas filas SIN notas; incluye
  // un día con >12h (sábado 13h) para disparar la alerta de sobretiempo del timesheet.
  { userId: 'user_10', rows: [
    { projectId: 'proj_9', activity: 'Tooling interno', billable: false, weekday: { mon: 8, tue: 8, wed: 8, thu: 8, fri: 6, sat: 13, sun: 0 } },
    { projectId: 'proj_10', activity: 'Soporte de incidentes', billable: true, notes: 'Guardia de fin de semana por incidente crítico.', weekday: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 2, sat: 0, sun: 4 } },
  ] },
];

// Per week-offset: the lifecycle status of that week's timesheet + approval.
const weekPlan: { offset: number; entryStatus: 'draft' | 'pending' | 'approved' | 'rejected'; approval?: 'pending' | 'approved' | 'rejected' | 'changes_requested'; comment?: string }[] = [
  { offset: -6, entryStatus: 'approved', approval: 'approved' },
  { offset: -5, entryStatus: 'rejected', approval: 'rejected', comment: 'Horas duplicadas con otro proyecto; corregir y reenviar.' }, // estado 'rejected' (distinto de changes_requested)
  { offset: -4, entryStatus: 'approved', approval: 'approved' },
  { offset: -3, entryStatus: 'rejected', approval: 'changes_requested', comment: 'Falta detallar las horas del proyecto Integración NetSuite del jueves.' },
  { offset: -2, entryStatus: 'approved', approval: 'approved' },
  { offset: -1, entryStatus: 'pending', approval: 'pending' },
  { offset: 0, entryStatus: 'draft' }, // current week in progress, not yet submitted
];

const timeEntries: Parameters<typeof createTimeEntry>[0][] = [];
const approvals: Parameters<typeof createApproval>[0][] = [];

profiles.forEach((profile, pIdx) => {
  weekPlan.forEach((plan, wIdx) => {
    const { weekNumber, year } = weekYear(plan.offset);
    let weekTotal = 0;
    profile.rows.forEach((row, rIdx) => {
      // Slightly vary hours by week so the data is not identical every week.
      const factor = plan.offset === 0 ? 0.85 : 1; // current week partially logged
      const hours: Hours = {
        mon: Math.round(row.weekday.mon * factor),
        tue: Math.round(row.weekday.tue * factor),
        wed: Math.round(row.weekday.wed * factor),
        thu: Math.round(row.weekday.thu * factor),
        fri: Math.round(row.weekday.fri * factor),
        sat: Math.round(row.weekday.sat * factor),
        sun: Math.round(row.weekday.sun * factor),
      };
      const total = sumHours(hours);
      weekTotal += total;
      timeEntries.push({
        id: `te_${profile.userId}_${plan.offset}_${rIdx}`,
        userId: profile.userId,
        projectId: row.projectId,
        activity: row.activity,
        notes: row.notes,
        billable: row.billable,
        weekNumber,
        year,
        hours,
        total,
        status: plan.entryStatus,
      });
    });
    if (plan.approval) {
      // Reparte revisores entre los dos managers/admin para variar la columna "aprobado por".
      const approverId = pIdx % 2 === 0 ? 'user_1' : 'user_9';
      approvals.push({
        id: `apr_${profile.userId}_${plan.offset}`,
        userId: profile.userId,
        approverId: plan.approval === 'pending' ? undefined : approverId,
        weekNumber,
        year,
        totalHours: weekTotal,
        status: plan.approval,
        comments: plan.comment,
        submittedAt: Date.now() - (Math.abs(plan.offset) + 1) * MS_DAY,
        reviewedAt: plan.approval === 'pending' ? undefined : Date.now() - Math.abs(plan.offset) * MS_DAY,
      });
    }
  });
  void pIdx;
});

// ---------------------------------------------------------------------------
// Allocations — current and upcoming weeks. Intentionally creates some
// over-allocation (>40h capacity) so the PM workload view has something to show.
// ---------------------------------------------------------------------------
const allocPlan: { resourceId: string; projectId: string; hours: number }[][] = [
  // week 0 (current) — cubre los tres casos de carga: sobreasignado, exacto y subasignado.
  [
    { resourceId: 'res_1', projectId: 'proj_1', hours: 32 },
    { resourceId: 'res_1', projectId: 'proj_2', hours: 14 }, // res_1 = 46h -> SOBREASIGNADO (>40)
    { resourceId: 'res_2', projectId: 'proj_2', hours: 24 },
    { resourceId: 'res_2', projectId: 'proj_4', hours: 16 }, // res_2 = 40h -> EXACTO (=40)
    { resourceId: 'res_3', projectId: 'proj_1', hours: 24 }, // res_3 = 24h -> SUBASIGNADO (<40)
    { resourceId: 'res_4', projectId: 'proj_1', hours: 12 }, // res_4 = 12h -> SUBASIGNADO (<40)
    { resourceId: 'res_5', projectId: 'proj_3', hours: 40 }, // res_5 = 40h -> EXACTO (=40)
    { resourceId: 'res_6', projectId: 'proj_5', hours: 8 },  // res_6 = 8h -> SUBASIGNADO (recurso de usuario inactivo)
  ],
  // week +1
  [
    { resourceId: 'res_1', projectId: 'proj_1', hours: 28 },
    { resourceId: 'res_2', projectId: 'proj_4', hours: 30 },
    { resourceId: 'res_3', projectId: 'proj_3', hours: 32 },
    { resourceId: 'res_4', projectId: 'proj_5', hours: 24 },
    { resourceId: 'res_5', projectId: 'proj_5', hours: 30 },
  ],
  // week +2
  [
    { resourceId: 'res_1', projectId: 'proj_2', hours: 36 },
    { resourceId: 'res_2', projectId: 'proj_4', hours: 40 },
    { resourceId: 'res_3', projectId: 'proj_1', hours: 30 },
    { resourceId: 'res_4', projectId: 'proj_1', hours: 16 },
  ],
];

const allocations: Parameters<typeof createAllocation>[0][] = [];
allocPlan.forEach((week, wOffset) => {
  const { weekNumber, year } = weekYear(wOffset);
  week.forEach((a, i) => {
    allocations.push({
      id: `alloc_${wOffset}_${i}`,
      resourceId: a.resourceId,
      projectId: a.projectId,
      weekNumber,
      year,
      allocatedHours: a.hours,
    });
  });
});

// ---------------------------------------------------------------------------
// Task time entries — feed project cost calculations for a couple of projects.
// ---------------------------------------------------------------------------
const taskTimeEntries: Parameters<typeof createTaskTimeEntry>[0][] = [];
{
  const cur = weekYear(0);
  const ttePlan = [
    { taskId: 'proj_1_e2_t2', userId: 'user_2', projectId: 'proj_1', hours: 8, day: -3, description: 'Dashboard principal' },
    { taskId: 'proj_1_e2_t2', userId: 'user_2', projectId: 'proj_1', hours: 7, day: -2, description: 'Widgets y charts' },
    { taskId: 'proj_1_e2_t4', userId: 'user_4', projectId: 'proj_1', hours: 8, day: -3, description: 'Endpoints de negocio' },
    { taskId: 'proj_1_e2_t4', userId: 'user_4', projectId: 'proj_1', hours: 6, day: -1, description: 'Validación Zod' },
    { taskId: 'proj_5_e1_t2', userId: 'user_4', projectId: 'proj_5', hours: 8, day: -4, description: 'Migración de BD' },
    { taskId: 'proj_5_e1_t3', userId: 'user_5', projectId: 'proj_5', hours: 5, day: -1, description: 'Validación de cutover' },
    // Proyecto sobre presupuesto: muchas horas reales para que el costo supere el budget.
    { taskId: 'proj_10_e1_t2', userId: 'user_4', projectId: 'proj_10', hours: 8, day: -4, description: 'Diagnóstico fuga de memoria' },
    { taskId: 'proj_10_e1_t3', userId: 'user_5', projectId: 'proj_10', hours: 7, day: -2, description: 'Corrección de facturación' },
    { taskId: 'proj_10_e1_t1', userId: 'user_4', projectId: 'proj_10', hours: 6, day: -1, description: 'Hotfix de login' },
  ];
  ttePlan.forEach((e, i) => {
    taskTimeEntries.push({
      id: `tte_${i + 1}`,
      taskId: e.taskId,
      userId: e.userId,
      projectId: e.projectId,
      hours: e.hours,
      date: isoOffset(e.day),
      description: e.description,
      weekNumber: cur.weekNumber,
      year: cur.year,
      billable: true,
    });
  });
}

// ---------------------------------------------------------------------------
// Notifications — a believable inbox for the PM and team.
// ---------------------------------------------------------------------------
const notifications: Parameters<typeof createNotification>[0][] = [
  { id: 'notif_1', userId: 'user_1', type: 'hours_reminder', title: 'Timesheets pendientes', message: 'Tienes 4 timesheets esperando tu aprobación esta semana.', read: false },
  { id: 'notif_2', userId: 'user_1', type: 'deadline_warning', title: 'Fecha límite cercana', message: 'El proyecto Migración Cloud vence en 2 semanas y está al 60%.', projectId: 'proj_5', read: false },
  { id: 'notif_3', userId: 'user_1', type: 'phase_approved', title: 'Fase aprobada', message: 'Se aprobó la fase de Desarrollo del Portal Clientes.', projectId: 'proj_1', read: true },
  { id: 'notif_4', userId: 'user_2', type: 'phase_rejected', title: 'Cambios solicitados', message: 'Tu timesheet de hace 3 semanas necesita correcciones.', read: false },
  { id: 'notif_5', userId: 'user_2', type: 'project_assigned', title: 'Nuevo proyecto asignado', message: 'Fuiste asignado a App Móvil (MOB-002).', projectId: 'proj_2', read: true },
  { id: 'notif_6', userId: 'user_3', type: 'hours_reminder', title: 'Registra tus horas', message: 'No has registrado horas para la semana actual.', read: false },
  // Más variedad: todos los tipos, mezcla leído/no leído, para varios usuarios.
  { id: 'notif_7', userId: 'user_9', type: 'hours_reminder', title: 'Timesheets por revisar', message: 'Tienes timesheets pendientes de aprobación asignados a ti.', read: false },
  { id: 'notif_8', userId: 'user_4', type: 'project_assigned', title: 'Nuevo proyecto asignado', message: 'Fuiste asignado a Soporte Crítico Acme (SUP-010).', projectId: 'proj_10', read: false },
  { id: 'notif_9', userId: 'user_4', type: 'deadline_warning', title: 'Tarea vencida', message: 'La tarea "Postmortem de incidentes" está vencida.', projectId: 'proj_10', read: true },
  { id: 'notif_10', userId: 'user_5', type: 'phase_rejected', title: 'Fase rechazada', message: 'La fase de Pruebas del cliente fue rechazada y requiere correcciones.', projectId: 'proj_2', read: false },
  { id: 'notif_11', userId: 'user_5', type: 'phase_approved', title: 'Fase aprobada', message: 'Se aprobó la fase de Aprobación de prototipo en App Móvil.', projectId: 'proj_2', read: true },
  { id: 'notif_12', userId: 'user_10', type: 'project_assigned', title: 'Bienvenido al equipo', message: 'Fuiste asignado a Mejoras Internas DevEx (INT-009).', projectId: 'proj_9', read: false },
  { id: 'notif_13', userId: 'user_2', type: 'deadline_warning', title: 'Fecha límite cercana', message: 'El hito "Lanzamiento beta" del Portal Clientes vence pronto.', projectId: 'proj_1', read: true },
  { id: 'notif_14', userId: 'user_7', type: 'hours_reminder', title: 'Registra tus horas', message: 'Recuerda completar tu timesheet de la semana.', read: true },
];

// ---------------------------------------------------------------------------
// OKRs — objetivos en cascada (empresa → equipo → individuo) con KRs métricos
// y binarios e iniciativas vinculadas a proyectos reales.
// ---------------------------------------------------------------------------
const okrPeriod = (() => {
  const d = new Date();
  return { q: `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`, year: `Anual ${d.getFullYear()}` };
})();

const objectives: Parameters<typeof createObjective>[0][] = [
  { id: 'obj_company', title: 'Convertirnos en la plataforma de gestión de tiempos referente en LATAM', description: 'Crear un océano azul: simplicidad + sin límite por usuario frente a Smartsheet/Jira.', level: 'company', ownerId: 'user_1', period: okrPeriod.year, periodType: 'annual', type: 'aspirational', strategicTheme: 'blue_ocean', status: 'on_track' },
  { id: 'obj_team_product', title: 'Lanzar la suite de estrategia (OKRs + reportes) que nos diferencie', parentId: 'obj_company', description: 'Iniciativa de diferenciación de producto.', level: 'team', ownerId: 'user_6', period: okrPeriod.q, periodType: 'quarterly', type: 'aspirational', strategicTheme: 'growth', status: 'on_track' },
  { id: 'obj_team_delivery', title: 'Mejorar la salud de entrega de proyectos', parentId: 'obj_company', description: 'Reducir desviaciones de presupuesto y plazos.', level: 'team', ownerId: 'user_6', period: okrPeriod.q, periodType: 'quarterly', type: 'committed', strategicTheme: 'efficiency', status: 'at_risk' },
  { id: 'obj_ind_carlos', title: 'Elevar la calidad del frontend del Portal Clientes', parentId: 'obj_team_product', description: 'Objetivo individual de Carlos.', level: 'individual', ownerId: 'user_2', period: okrPeriod.q, periodType: 'quarterly', type: 'committed', strategicTheme: 'customer', status: 'on_track' },
  // Objetivo de equipo en MERCADO ROJO (competir de frente con Jira/Smartsheet).
  { id: 'obj_team_sales', title: 'Ganar deals frente a la competencia directa', parentId: 'obj_company', description: 'Competir cabeza a cabeza en el océano rojo del mercado actual.', level: 'team', ownerId: 'user_9', period: okrPeriod.q, periodType: 'quarterly', type: 'committed', strategicTheme: 'red_ocean', status: 'behind' },
  // Objetivo de equipo SIN tema estratégico (none) y aún en borrador (draft, ~0%).
  { id: 'obj_team_ops', title: 'Ordenar la operación interna del equipo', parentId: 'obj_company', description: 'Mejoras operativas sin un tema estratégico asignado todavía.', level: 'team', ownerId: 'user_6', period: okrPeriod.q, periodType: 'quarterly', type: 'committed', strategicTheme: 'none', status: 'draft' },
  // Objetivo individual COMPLETADO (~100%, status done) — alineado al equipo de delivery.
  { id: 'obj_ind_pedro', title: 'Estabilizar el backend del Portal Clientes', parentId: 'obj_team_delivery', description: 'Objetivo individual de Pedro, ya cumplido.', level: 'individual', ownerId: 'user_4', period: okrPeriod.q, periodType: 'quarterly', type: 'committed', strategicTheme: 'efficiency', status: 'done' },
  // Objetivo individual ASPIRACIONAL de diseño, alineado al equipo de producto.
  { id: 'obj_ind_maria', title: 'Crear un sistema de diseño reutilizable', parentId: 'obj_team_product', description: 'Objetivo individual de María (diseño).', level: 'individual', ownerId: 'user_3', period: okrPeriod.q, periodType: 'quarterly', type: 'aspirational', strategicTheme: 'growth', status: 'at_risk' },
];

const keyResults: Parameters<typeof createKeyResult>[0][] = [
  // Company
  { id: 'kr_c1', objectiveId: 'obj_company', title: 'Aumentar el NPS de 30 a 50', type: 'metric', unit: '', startValue: 30, targetValue: 50, currentValue: 41, weight: 1, confidence: 'on_track', ownerId: 'user_1' },
  { id: 'kr_c2', objectiveId: 'obj_company', title: 'Llegar a 20 clientes activos de pago', type: 'metric', unit: ' clientes', startValue: 4, targetValue: 20, currentValue: 9, weight: 1, confidence: 'at_risk', ownerId: 'user_1' },
  { id: 'kr_c3', objectiveId: 'obj_company', title: 'Reducir el churn mensual de 8% a 3%', type: 'metric', unit: '%', startValue: 8, targetValue: 3, currentValue: 6, weight: 1, confidence: 'at_risk', ownerId: 'user_1' },
  // Team product
  { id: 'kr_tp1', objectiveId: 'obj_team_product', title: 'Entregar el módulo de OKRs a producción', type: 'binary', startValue: 0, targetValue: 1, currentValue: 1, weight: 2, confidence: 'on_track', ownerId: 'user_6', projectId: 'proj_4' },
  { id: 'kr_tp2', objectiveId: 'obj_team_product', title: 'Adopción de OKRs: 60% de los equipos con al menos 1 objetivo', type: 'metric', unit: '%', startValue: 0, targetValue: 60, currentValue: 25, weight: 1, confidence: 'at_risk', ownerId: 'user_6' },
  // Team delivery
  { id: 'kr_td1', objectiveId: 'obj_team_delivery', title: 'Desviación de presupuesto < 10% en proyectos activos', type: 'metric', unit: '%', startValue: 22, targetValue: 10, currentValue: 16, weight: 1, confidence: 'at_risk', ownerId: 'user_6' },
  { id: 'kr_td2', objectiveId: 'obj_team_delivery', title: 'Entregar Migración Cloud a tiempo', type: 'binary', startValue: 0, targetValue: 1, currentValue: 0, weight: 1, confidence: 'off_track', ownerId: 'user_4', projectId: 'proj_5' },
  // Individual
  { id: 'kr_ic1', objectiveId: 'obj_ind_carlos', title: 'Cobertura de tests del frontend de 20% a 80%', type: 'metric', unit: '%', startValue: 20, targetValue: 80, currentValue: 55, weight: 1, confidence: 'on_track', ownerId: 'user_2', projectId: 'proj_1' },
  { id: 'kr_ic2', objectiveId: 'obj_ind_carlos', title: 'Lighthouse de performance > 90', type: 'metric', unit: '', startValue: 62, targetValue: 90, currentValue: 78, weight: 1, confidence: 'on_track', ownerId: 'user_2', projectId: 'proj_1' },
  // Team sales (mercado rojo) — uno off_track, otro EXCEDIDO (current > target).
  { id: 'kr_ts1', objectiveId: 'obj_team_sales', title: 'Cerrar 5 deals ganados a la competencia', type: 'metric', unit: ' deals', startValue: 0, targetValue: 5, currentValue: 1, weight: 1, confidence: 'off_track', ownerId: 'user_9' },
  { id: 'kr_ts2', objectiveId: 'obj_team_sales', title: 'Demos realizadas (meta 10)', type: 'metric', unit: ' demos', startValue: 0, targetValue: 10, currentValue: 13, weight: 1, confidence: 'on_track', ownerId: 'user_9' }, // EXCEDIDO: current > target
  // Team ops (sin tema, draft, ~0%) — KRs en su valor inicial.
  { id: 'kr_to1', objectiveId: 'obj_team_ops', title: 'Documentar 8 procesos internos', type: 'metric', unit: ' procesos', startValue: 0, targetValue: 8, currentValue: 0, weight: 1, confidence: 'at_risk', ownerId: 'user_6' },
  { id: 'kr_to2', objectiveId: 'obj_team_ops', title: 'Definir el ritual de retro quincenal', type: 'binary', startValue: 0, targetValue: 1, currentValue: 0, weight: 1, confidence: 'off_track', ownerId: 'user_6' },
  // Individual Pedro (done, ~100%) — KRs cumplidos.
  { id: 'kr_ip1', objectiveId: 'obj_ind_pedro', title: 'Reducir errores 5xx de 40 a 5 por día', type: 'metric', unit: '/día', startValue: 40, targetValue: 5, currentValue: 4, weight: 1, confidence: 'on_track', ownerId: 'user_4', projectId: 'proj_1' }, // meta DECRECIENTE cumplida
  { id: 'kr_ip2', objectiveId: 'obj_ind_pedro', title: 'Migrar todos los endpoints a validación Zod', type: 'binary', startValue: 0, targetValue: 1, currentValue: 1, weight: 1, confidence: 'on_track', ownerId: 'user_4', projectId: 'proj_1' },
  // Individual María (aspiracional) — métrico y sin proyecto vinculado.
  { id: 'kr_im1', objectiveId: 'obj_ind_maria', title: 'Componentes en el sistema de diseño: de 0 a 30', type: 'metric', unit: ' componentes', startValue: 0, targetValue: 30, currentValue: 11, weight: 1, confidence: 'at_risk', ownerId: 'user_3' },
];

const initiatives: Parameters<typeof createInitiative>[0][] = [
  { id: 'init_1', objectiveId: 'obj_team_product', keyResultId: 'kr_tp1', title: 'Construir página /okrs con árbol de alineación', status: 'in_progress', projectId: 'proj_4', ownerId: 'user_6' },
  { id: 'init_2', objectiveId: 'obj_team_product', keyResultId: 'kr_tp2', title: 'Onboarding guiado de OKRs para PMs', status: 'todo', ownerId: 'user_6' },
  { id: 'init_3', objectiveId: 'obj_team_delivery', keyResultId: 'kr_td2', title: 'Plan de cutover de Migración Cloud', status: 'in_progress', projectId: 'proj_5', ownerId: 'user_4' },
  { id: 'init_4', objectiveId: 'obj_ind_carlos', keyResultId: 'kr_ic1', title: 'Añadir suite de tests con Vitest', status: 'in_progress', projectId: 'proj_1', ownerId: 'user_2' },
  // Iniciativa COMPLETADA (status done), vinculada a un proyecto y a una tarea concreta.
  { id: 'init_5', objectiveId: 'obj_ind_pedro', keyResultId: 'kr_ip2', title: 'Refactor de endpoints con Zod', status: 'done', projectId: 'proj_1', taskId: 'proj_1_e2_t4', ownerId: 'user_4' },
  // Iniciativa de ventas (mercado rojo), por hacer.
  { id: 'init_6', objectiveId: 'obj_team_sales', keyResultId: 'kr_ts1', title: 'Crear batería de demos comerciales', status: 'todo', ownerId: 'user_9' },
  // Iniciativa de diseño en progreso, sin KR específico.
  { id: 'init_7', objectiveId: 'obj_ind_maria', title: 'Auditoría de componentes existentes', status: 'in_progress', projectId: 'proj_2', ownerId: 'user_3' },
];

// ---------------------------------------------------------------------------
// Seeder
// ---------------------------------------------------------------------------
export async function seedDocumentStore() {
  console.log('Seeding Document Store...');

  // IMPORTANTE: las escrituras al document store de Luma se hacen de forma
  // SECUENCIAL a propósito. Bajo escrituras concurrentes en ráfaga, el índice
  // de `find` por campo de Luma queda inconsistente (los docs existen en un
  // scan completo, pero el filtro devuelve un subconjunto). Como toda la app
  // depende del filtrado server-side, la consistencia manda sobre la velocidad
  // del seed (acción de admin puntual).

  // Users
  const existingUsers = await getUsers();
  const existingUserIds = new Set(existingUsers.map(u => u.id));
  for (const user of users) {
    try {
      if (existingUserIds.has(user.id)) {
        await updateUser(user.id, { name: user.name, role: user.role, password: user.password, isActive: user.isActive });
      } else {
        await createUser(user);
      }
    } catch (error) {
      console.error('Error with user:', user.id, error);
    }
  }

  // Clients
  for (const client of clients) {
    try { await createClient(client); } catch { /* may exist */ }
  }

  // Projects (+ their 10 phases)
  const existingProjects = await getProjects();
  const existingProjectIds = new Set(existingProjects.map(p => p.id));
  for (const project of projects) {
    try {
      if (existingProjectIds.has(project.id)) {
        await updateProject(project.id, {
          name: project.name, client: project.client, status: project.status,
          startDate: project.startDate, endDate: project.endDate,
          budget: project.budget, budgetHours: project.budgetHours,
          hourlyRate: project.hourlyRate, currency: project.currency, progress: project.progress,
        });
      } else {
        await createProject(project);
      }
      await createProjectPhases(project.id);
    } catch (error) {
      console.error('Error with project:', project.id, error);
    }
  }

  // Resources
  const existingResources = await getResources();
  const existingResourceIds = new Set(existingResources.map(r => r.id));
  for (const resource of resources) {
    try {
      if (existingResourceIds.has(resource.id)) {
        await updateResource(resource.id, { hourlyRate: resource.hourlyRate, monthlySalary: resource.monthlySalary, currency: resource.currency, skills: resource.skills });
      } else {
        await createResource(resource);
      }
    } catch (error) {
      console.error('Error with resource:', resource.id, error);
    }
  }

  // Allocations
  for (const allocation of allocations) {
    try { await createAllocation(allocation); } catch { /* may exist */ }
  }

  // Sprints
  for (const sprint of sprints) {
    try { await createSprint(sprint); } catch { /* may exist */ }
  }

  // Tasks
  for (const task of tasks) {
    try { await createTask(task); } catch { /* may exist */ }
  }

  // Task time entries
  for (const entry of taskTimeEntries) {
    try { await createTaskTimeEntry(entry); } catch { /* may exist */ }
  }

  // Weekly timesheets
  for (const entry of timeEntries) {
    try { await createTimeEntry(entry); } catch { /* may exist */ }
  }

  // Approvals
  const existingApprovals = await getApprovals();
  const existingApprovalIds = new Set(existingApprovals.map(a => a.id));
  for (const approval of approvals) {
    try {
      if (!existingApprovalIds.has(approval.id)) await createApproval(approval);
    } catch { /* may exist */ }
  }

  // Notifications
  for (const notification of notifications) {
    try { await createNotification(notification); } catch { /* may exist */ }
  }

  // OKRs
  for (const objective of objectives) {
    try { await createObjective(objective); } catch { /* may exist */ }
  }
  for (const kr of keyResults) {
    try { await createKeyResult(kr); } catch { /* may exist */ }
  }
  for (const initiative of initiatives) {
    try { await createInitiative(initiative); } catch { /* may exist */ }
  }

  console.log(`Document Store seeded: ${users.length} users, ${clients.length} clients, ${projects.length} projects, ${tasks.length} tasks, ${timeEntries.length} timesheets, ${approvals.length} approvals, ${allocations.length} allocations, ${notifications.length} notifications`);
}
