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
  billable: boolean;
  status?: 'active' | 'archived';
  budget?: number; // Presupuesto total del proyecto
  budgetHours?: number; // Horas presupuestadas
  actualCost?: number; // Costo real acumulado
  actualHours?: number; // Horas reales acumuladas
  hourlyRate?: number; // Tarifa de venta por hora (si es billable)
  currency?: string; // Moneda del proyecto
  profit?: number; // Ganancia calculada
  profitMargin?: number; // Margen de ganancia %
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
  project?: Project;
  assignee?: User;
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
