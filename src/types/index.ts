export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'member';
  password?: string; // Hashed password
  isActive: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  client?: string;
  description?: string;
  billable: boolean;
  status?: 'active' | 'on_hold' | 'completed' | 'archived';
  startDate?: string;
  endDate?: string;
  budget?: number;
  budgetHours?: number;
  actualCost?: number;
  actualHours?: number;
  hourlyRate?: number;
  currency?: string;
  profit?: number;
  profitMargin?: number;
  baselineStart?: string;
  baselineEnd?: string;
  baselineBudget?: number;
  progress?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  activity: string;
  notes?: string;
  billable: boolean;
  weekNumber: number;
  year: number;
  hours: {
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
    sun: number;
  };
  total: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  project?: Project;
  createdAt?: number;
  updatedAt?: number;
}

export interface TimeEntryWithDetails extends TimeEntry {
  user?: User;
  project?: Project;
}

export interface ApprovalRequest {
  id: string;
  userId: string;
  approverId?: string;
  weekNumber: number;
  year: number;
  totalHours: number;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  comments?: string;
  submittedAt?: number;
  reviewedAt?: number;
  createdAt?: number;
}

export interface ApprovalWithDetails extends ApprovalRequest {
  user?: User;
  approver?: User;
  entries?: TimeEntryWithDetails[];
}

export interface Resource {
  id: string;
  userId: string;
  capacity: number;
  skills?: string[];
  hourlyRate: number; // Costo por hora (salario/hora)
  monthlySalary?: number; // Salario mensual opcional
  currency: string; // Moneda (USD, EUR, etc.)
  user?: User;
}

export interface ResourceAllocation {
  id: string;
  resourceId: string;
  projectId: string;
  weekNumber: number;
  year: number;
  allocatedHours: number;
  resource?: Resource;
  project?: Project;
}

export interface Task {
  id: string;
  projectId: string;
  parentId?: string;
  phaseId?: string;
  name: string;
  description?: string;
  assigneeId?: string;
  startDate: string;
  endDate: string;
  estimatedHours: number;
  actualHours: number;
  remainingHours?: number;
  overHours?: number;
  variance?: number;
  progress: number;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  dependencies: string[];
  hasSubtasks?: boolean;
  subtaskCount?: number;
  subtasks?: Task[];
  timeStatus?: 'on_track' | 'over_budget' | 'under_budget' | 'not_started';
  // Jira-style issue tracking
  type?: IssueType;
  sprintId?: string;        // si no tiene, está en el backlog
  project?: Project;
  assignee?: User;
}

export type IssueType = 'epic' | 'story' | 'task' | 'bug';

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal?: string;
  status: 'planned' | 'active' | 'completed';
  startDate?: string;
  endDate?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface Job {
  id: string;
  type: 'export' | 'sync' | 'close' | 'report';
  initiatedBy: string;
  startedAt: number;
  completedAt?: number;
  durationMs?: number;
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  parameters?: Record<string, unknown>;
  result?: string;
  error?: string;
}

export interface Document {
  id: string;
  name: string;
  type: 'xlsx' | 'pdf' | 'csv' | 'template';
  folder: string;
  createdBy: string;
  createdAt: number;
  sizeBytes: number;
  storageKey?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  userId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  createdAt: number;
}

export interface KPI {
  id: string;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export const PROJECT_PHASES = [
  { id: 'activity', name: 'Actividad', order: 1 },
  { id: 'prototype_delivery', name: 'Elaboración y Entrega de Prototipos', order: 2 },
  { id: 'prototype_presentation', name: 'Presentación de Prototipo', order: 3 },
  { id: 'prototype_approval', name: 'Aprobación de prototipo', order: 4 },
  { id: 'development_testing', name: 'Desarrollo y Pruebas', order: 5 },
  { id: 'sb_delivery', name: 'Entrega en SB a cliente', order: 6 },
  { id: 'client_testing', name: 'Pruebas del cliente, solución de obs y correcciones', order: 7 },
  { id: 'production_release', name: 'Pase a producción', order: 8 },
  { id: 'client_confirmation', name: 'Confirmación cliente', order: 9 },
  { id: 'closure', name: 'Cierre', order: 10 },
] as const;

export type PhaseId = typeof PROJECT_PHASES[number]['id'];

export interface ProjectPhase {
  id: string;
  projectId: string;
  phaseId: PhaseId;
  name: string;
  order: number;
  status: 'pending' | 'in_progress' | 'completed';
  approvedAt?: string;
  approvedBy?: string;
  estimatedHours?: number;
  actualHours?: number;
  actualCost?: number;
  createdAt: number;
  updatedAt?: number;
}

export interface PhaseApproval {
  id: string;
  projectPhaseId: string;
  approvedAt: string;
  approvedBy: string;
  callDate?: string;
  callTime?: string;
  callPerson?: string;
  callNotes?: string;
  notes?: string;
  createdAt: number;
}

export interface ApprovalFile {
  id: string;
  phaseApprovalId: string;
  name: string;
  type: string;
  size: number;
  data: string;
  uploadedBy: string;
  uploadedAt: number;
}

export interface Client {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  createdAt: number;
  updatedAt?: number;
}

export type NotificationType = 'phase_approved' | 'phase_rejected' | 'hours_reminder' | 'project_assigned' | 'deadline_warning';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  projectId?: string;
  phaseId?: string;
  read: boolean;
  readAt?: number;
  createdAt: number;
}

export interface ProjectWithPhases extends Project {
  phases: ProjectPhase[];
  clientData?: Client;
}

export interface PhaseWithApproval extends ProjectPhase {
  approval?: PhaseApproval;
  approvalFiles?: ApprovalFile[];
  tasks?: Task[];
  taskCount?: number;
}

// ---------------------------------------------------------------------------
// OKRs (Objectives & Key Results)
// Modelo inspirado en Viva Goals / Asana Goals: jerarquía de 3 niveles
// (empresa → equipo → individuo), Objetivos con Resultados Clave medibles e
// Iniciativas (el trabajo, vinculado a proyectos/tareas que TimeOS ya tiene).
// El % de avance del Objetivo se calcula por roll-up ponderado de sus KR.
// ---------------------------------------------------------------------------
export type OkrLevel = 'company' | 'team' | 'individual';
export type OkrPeriodType = 'annual' | 'quarterly';
export type ObjectiveType = 'aspirational' | 'committed';
export type ObjectiveStatus = 'draft' | 'on_track' | 'at_risk' | 'behind' | 'done';
/** Tema estratégico que conecta la visión de la empresa con el objetivo. */
export type StrategicTheme = 'blue_ocean' | 'red_ocean' | 'growth' | 'efficiency' | 'customer' | 'none';
export type KeyResultType = 'metric' | 'binary';
export type Confidence = 'on_track' | 'at_risk' | 'off_track';

export interface Objective {
  id: string;
  title: string;
  description?: string;
  level: OkrLevel;
  ownerId: string;
  parentId?: string;        // alineación / cascada con un objetivo superior
  period: string;           // p.ej. "Q3 2026" o "Anual 2026"
  periodType: OkrPeriodType;
  type: ObjectiveType;      // aspiracional (target 0.7) vs comprometido (1.0)
  strategicTheme: StrategicTheme;
  status: ObjectiveStatus;
  progress: number;         // 0–100, CALCULADO (roll-up de KRs), no se ingresa
  createdAt: number;
  updatedAt?: number;
}

export interface KeyResult {
  id: string;
  objectiveId: string;
  title: string;
  type: KeyResultType;      // métrico (de X a Y) o binario (hecho/no hecho)
  unit?: string;            // %, $, clientes, ...
  startValue: number;
  targetValue: number;
  currentValue: number;
  weight: number;           // peso en el roll-up del objetivo (default 1)
  confidence: Confidence;
  ownerId?: string;
  projectId?: string;       // KR vinculado a un proyecto de TimeOS
  lastCheckinNote?: string;
  lastCheckinAt?: number;
  createdAt: number;
  updatedAt?: number;
}

export interface Initiative {
  id: string;
  objectiveId: string;
  keyResultId?: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  projectId?: string;       // vínculo al trabajo real en TimeOS
  taskId?: string;
  ownerId?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface KeyResultWithScore extends KeyResult {
  score: number;            // 0–1 derivado de start/current/target
}

export interface ObjectiveWithDetails extends Objective {
  keyResults: KeyResultWithScore[];
  initiatives: Initiative[];
  owner?: User;
  children?: ObjectiveWithDetails[];
}
