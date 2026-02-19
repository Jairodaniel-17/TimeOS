import { luma } from './luma';

// Migration SQL to recreate tables with new schema
const MIGRATION_SQL = `
-- Drop old tables if they exist with old schema
DROP TABLE IF EXISTS task_time_entries;
DROP TABLE IF EXISTS tasks;
`;

const SCHEMA_SQL = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  client TEXT,
  billable INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

-- Time entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  activity TEXT NOT NULL,
  notes TEXT,
  billable INTEGER DEFAULT 1,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  mon REAL DEFAULT 0,
  tue REAL DEFAULT 0,
  wed REAL DEFAULT 0,
  thu REAL DEFAULT 0,
  fri REAL DEFAULT 0,
  sat REAL DEFAULT 0,
  sun REAL DEFAULT 0,
  total REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Approval requests table
CREATE TABLE IF NOT EXISTS approval_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  approver_id TEXT,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  total_hours REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  comments TEXT,
  submitted_at INTEGER,
  reviewed_at INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (approver_id) REFERENCES users(id)
);

-- Resources table
CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  capacity REAL DEFAULT 40,
  skills TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Resource allocations table
CREATE TABLE IF NOT EXISTS resource_allocations (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  allocated_hours REAL NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (resource_id) REFERENCES resources(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Tasks table with hierarchy support
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  parent_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  assignee_id TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  estimated_hours REAL DEFAULT 0,
  actual_hours REAL DEFAULT 0,
  progress INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'todo',
  dependencies TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (parent_id) REFERENCES tasks(id),
  FOREIGN KEY (assignee_id) REFERENCES users(id)
);

-- Task time entries - for tracking hours per task
CREATE TABLE IF NOT EXISTS task_time_entries (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  hours REAL NOT NULL,
  date TEXT NOT NULL,
  description TEXT,
  billable INTEGER DEFAULT 1,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  initiated_by TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  duration_ms INTEGER,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  parameters TEXT,
  result TEXT,
  error TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  folder TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  size_bytes INTEGER DEFAULT 0,
  storage_key TEXT,
  metadata TEXT,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`;

const SEED_DATA = {
  users: [
    { id: '1', name: 'Ana García', email: 'ana.garcia@timeos.com', role: 'admin' },
    { id: '2', name: 'Carlos López', email: 'carlos.lopez@timeos.com', role: 'member' },
    { id: '3', name: 'María Rodríguez', email: 'maria.rodriguez@timeos.com', role: 'member' },
    { id: '4', name: 'Pedro Sánchez', email: 'pedro.sanchez@timeos.com', role: 'member' },
    { id: '5', name: 'Laura Martínez', email: 'laura.martinez@timeos.com', role: 'member' },
  ],
  projects: [
    { id: '1', name: 'Portal Clientes', code: 'PORT-001', client: 'Acme Corp', billable: 1 },
    { id: '2', name: 'App Móvil', code: 'MOB-002', client: 'TechStart', billable: 1 },
    { id: '3', name: 'Integración NetSuite', code: 'INT-003', billable: 0 },
    { id: '4', name: 'Dashboard Analytics', code: 'DASH-004', client: 'DataCorp', billable: 1 },
    { id: '5', name: 'Migración Cloud', code: 'MIG-005', billable: 0 },
  ],
  resources: [
    { id: 'res_1', user_id: '2', capacity: 40, skills: 'React, TypeScript, Node.js' },
    { id: 'res_2', user_id: '3', capacity: 40, skills: 'Figma, UI/UX, Design Systems' },
    { id: 'res_3', user_id: '4', capacity: 40, skills: 'Python, SQL, Backend' },
    { id: 'res_4', user_id: '5', capacity: 40, skills: 'Testing, QA, Automation' },
  ],
  allocations: [
    { id: 'alloc_1', resource_id: 'res_1', project_id: '1', week_number: 8, year: 2025, allocated_hours: 32 },
    { id: 'alloc_2', resource_id: 'res_1', project_id: '2', week_number: 8, year: 2025, allocated_hours: 8 },
    { id: 'alloc_3', resource_id: 'res_2', project_id: '2', week_number: 8, year: 2025, allocated_hours: 40 },
    { id: 'alloc_4', resource_id: 'res_3', project_id: '1', week_number: 8, year: 2025, allocated_hours: 20 },
    { id: 'alloc_5', resource_id: 'res_3', project_id: '4', week_number: 8, year: 2025, allocated_hours: 20 },
    { id: 'alloc_6', resource_id: 'res_4', project_id: '1', week_number: 8, year: 2025, allocated_hours: 16 },
  ],
  tasks: [
    // Portal Clientes Project - Tasks with hierarchy
    { id: 'task_epic_1', project_id: '1', parent_id: null, name: 'Fase 1: Análisis y Diseño', description: 'Epic: Fase inicial del proyecto', assignee_id: null, start_date: '2025-02-17', end_date: '2025-03-07', estimated_hours: 120, actual_hours: 110, progress: 100, priority: 'high', status: 'done', dependencies: '' },
    { id: 'task_1', project_id: '1', parent_id: 'task_epic_1', name: 'Análisis de requerimientos', description: 'Documentar todos los requerimientos del cliente', assignee_id: '2', start_date: '2025-02-17', end_date: '2025-02-21', estimated_hours: 40, actual_hours: 38, progress: 100, priority: 'high', status: 'done', dependencies: '' },
    { id: 'task_2', project_id: '1', parent_id: 'task_epic_1', name: 'Diseño de UI/UX', description: 'Crear mockups y prototipos', assignee_id: '3', start_date: '2025-02-24', end_date: '2025-03-07', estimated_hours: 80, actual_hours: 72, progress: 100, priority: 'high', status: 'done', dependencies: 'task_1' },
    
    { id: 'task_epic_2', project_id: '1', parent_id: null, name: 'Fase 2: Desarrollo', description: 'Epic: Desarrollo del sistema', assignee_id: null, start_date: '2025-03-03', end_date: '2025-04-11', estimated_hours: 320, actual_hours: 145, progress: 45, priority: 'high', status: 'in_progress', dependencies: 'task_epic_1' },
    { id: 'task_3', project_id: '1', parent_id: 'task_epic_2', name: 'Desarrollo Frontend', description: 'Implementación de interfaces', assignee_id: '2', start_date: '2025-03-03', end_date: '2025-03-21', estimated_hours: 120, actual_hours: 85, progress: 75, priority: 'high', status: 'in_progress', dependencies: 'task_2' },
    { id: 'task_3_1', project_id: '1', parent_id: 'task_3', name: 'Login y Autenticación', description: 'Pantalla de login y sistema de auth', assignee_id: '2', start_date: '2025-03-03', end_date: '2025-03-07', estimated_hours: 24, actual_hours: 26, progress: 100, priority: 'high', status: 'done', dependencies: '' },
    { id: 'task_3_2', project_id: '1', parent_id: 'task_3', name: 'Dashboard Principal', description: 'Pantalla principal del sistema', assignee_id: '2', start_date: '2025-03-10', end_date: '2025-03-14', estimated_hours: 32, actual_hours: 28, progress: 90, priority: 'medium', status: 'in_progress', dependencies: 'task_3_1' },
    { id: 'task_3_3', project_id: '1', parent_id: 'task_3', name: 'Módulo de Reportes', description: 'Generación de reportes', assignee_id: '2', start_date: '2025-03-17', end_date: '2025-03-21', estimated_hours: 40, actual_hours: 12, progress: 30, priority: 'medium', status: 'todo', dependencies: 'task_3_2' },
    { id: 'task_4', project_id: '1', parent_id: 'task_epic_2', name: 'Desarrollo Backend', description: 'APIs y lógica de negocio', assignee_id: '4', start_date: '2025-03-03', end_date: '2025-03-28', estimated_hours: 160, actual_hours: 48, progress: 30, priority: 'high', status: 'in_progress', dependencies: 'task_2' },
    { id: 'task_4_1', project_id: '1', parent_id: 'task_4', name: 'API Authentication', description: 'Endpoints de autenticación', assignee_id: '4', start_date: '2025-03-03', end_date: '2025-03-07', estimated_hours: 16, actual_hours: 18, progress: 100, priority: 'high', status: 'done', dependencies: '' },
    { id: 'task_4_2', project_id: '1', parent_id: 'task_4', name: 'API Clientes', description: 'CRUD de clientes', assignee_id: '4', start_date: '2025-03-10', end_date: '2025-03-14', estimated_hours: 24, actual_hours: 15, progress: 65, priority: 'high', status: 'in_progress', dependencies: 'task_4_1' },
    { id: 'task_4_3', project_id: '1', parent_id: 'task_4', name: 'API Reportes', description: 'Endpoints de reportes', assignee_id: '4', start_date: '2025-03-17', end_date: '2025-03-28', estimated_hours: 40, actual_hours: 0, progress: 0, priority: 'medium', status: 'todo', dependencies: 'task_4_2' },
    
    { id: 'task_epic_3', project_id: '1', parent_id: null, name: 'Fase 3: Testing', description: 'Epic: QA y pruebas', assignee_id: null, start_date: '2025-03-24', end_date: '2025-04-11', estimated_hours: 80, actual_hours: 0, progress: 0, priority: 'medium', status: 'todo', dependencies: 'task_epic_2' },
    { id: 'task_5', project_id: '1', parent_id: 'task_epic_3', name: 'Testing QA Manual', description: 'Pruebas funcionales manuales', assignee_id: '5', start_date: '2025-03-24', end_date: '2025-04-04', estimated_hours: 60, actual_hours: 0, progress: 0, priority: 'medium', status: 'todo', dependencies: 'task_3,task_4' },
    { id: 'task_5_1', project_id: '1', parent_id: 'task_5', name: 'Testing Login', description: 'Pruebas del módulo de login', assignee_id: '5', start_date: '2025-03-24', end_date: '2025-03-26', estimated_hours: 8, actual_hours: 0, progress: 0, priority: 'high', status: 'todo', dependencies: '' },
    { id: 'task_5_2', project_id: '1', parent_id: 'task_5', name: 'Testing Dashboard', description: 'Pruebas del dashboard', assignee_id: '5', start_date: '2025-03-27', end_date: '2025-03-31', estimated_hours: 16, actual_hours: 0, progress: 0, priority: 'medium', status: 'todo', dependencies: 'task_5_1' },
    { id: 'task_6', project_id: '1', parent_id: 'task_epic_3', name: 'Automatización de Tests', description: 'Scripts de testing automatizado', assignee_id: '5', start_date: '2025-04-01', end_date: '2025-04-11', estimated_hours: 20, actual_hours: 0, progress: 0, priority: 'low', status: 'todo', dependencies: 'task_5' },
    
    // App Móvil Project
    { id: 'task_m_1', project_id: '2', parent_id: null, name: 'Research y Discovery', description: 'Fase de investigación', assignee_id: '3', start_date: '2025-02-17', end_date: '2025-02-28', estimated_hours: 60, actual_hours: 54, progress: 90, priority: 'high', status: 'in_progress', dependencies: '' },
    { id: 'task_m_2', project_id: '2', parent_id: null, name: 'Wireframes', description: 'Esbozos de pantallas', assignee_id: '3', start_date: '2025-03-03', end_date: '2025-03-14', estimated_hours: 40, actual_hours: 0, progress: 0, priority: 'medium', status: 'todo', dependencies: 'task_m_1' },
    { id: 'task_m_3', project_id: '2', parent_id: null, name: 'Prototipo interactivo', description: 'Prototype clickable', assignee_id: '3', start_date: '2025-03-17', end_date: '2025-03-28', estimated_hours: 48, actual_hours: 0, progress: 0, priority: 'medium', status: 'todo', dependencies: 'task_m_2' },
  ],
  task_time_entries: [
    // Carlos López - Portal Clientes
    { id: 'tte_1', task_id: 'task_1', user_id: '2', project_id: '1', hours: 8, date: '2025-02-17', description: 'Reunión con cliente', week_number: 8, year: 2025 },
    { id: 'tte_2', task_id: 'task_1', user_id: '2', project_id: '1', hours: 8, date: '2025-02-18', description: 'Documentación de reqs', week_number: 8, year: 2025 },
    { id: 'tte_3', task_id: 'task_1', user_id: '2', project_id: '1', hours: 8, date: '2025-02-19', description: 'Análisis técnico', week_number: 8, year: 2025 },
    { id: 'tte_4', task_id: 'task_1', user_id: '2', project_id: '1', hours: 6, date: '2025-02-20', description: 'Documentación final', week_number: 8, year: 2025 },
    { id: 'tte_5', task_id: 'task_1', user_id: '2', project_id: '1', hours: 8, date: '2025-02-21', description: 'Review con equipo', week_number: 8, year: 2025 },
    
    // María Rodríguez - Diseño
    { id: 'tte_6', task_id: 'task_2', user_id: '3', project_id: '1', hours: 8, date: '2025-02-24', description: 'Sketching inicial', week_number: 9, year: 2025 },
    { id: 'tte_7', task_id: 'task_2', user_id: '3', project_id: '1', hours: 8, date: '2025-02-25', description: 'Wireframes baja fidelidad', week_number: 9, year: 2025 },
    { id: 'tte_8', task_id: 'task_2', user_id: '3', project_id: '1', hours: 8, date: '2025-02-26', description: 'Wireframes alta fidelidad', week_number: 9, year: 2025 },
    { id: 'tte_9', task_id: 'task_2', user_id: '3', project_id: '1', hours: 8, date: '2025-02-27', description: 'Diseño UI', week_number: 9, year: 2025 },
    { id: 'tte_10', task_id: 'task_2', user_id: '3', project_id: '1', hours: 8, date: '2025-02-28', description: 'Prototipo Figma', week_number: 9, year: 2025 },
    { id: 'tte_11', task_id: 'task_2', user_id: '3', project_id: '1', hours: 8, date: '2025-03-03', description: 'Ajustes finales', week_number: 10, year: 2025 },
    { id: 'tte_12', task_id: 'task_2', user_id: '3', project_id: '1', hours: 8, date: '2025-03-04', description: 'Handoff a dev', week_number: 10, year: 2025 },
    { id: 'tte_13', task_id: 'task_2', user_id: '3', project_id: '1', hours: 8, date: '2025-03-05', description: 'Revisión con stakeholders', week_number: 10, year: 2025 },
    
    // Carlos - Frontend
    { id: 'tte_14', task_id: 'task_3_1', user_id: '2', project_id: '1', hours: 8, date: '2025-03-03', description: 'Setup proyecto', week_number: 10, year: 2025 },
    { id: 'tte_15', task_id: 'task_3_1', user_id: '2', project_id: '1', hours: 9, date: '2025-03-04', description: 'Componente Login', week_number: 10, year: 2025 },
    { id: 'tte_16', task_id: 'task_3_1', user_id: '2', project_id: '1', hours: 9, date: '2025-03-05', description: 'Integración auth', week_number: 10, year: 2025 },
    { id: 'tte_17', task_id: 'task_3_2', user_id: '2', project_id: '1', hours: 8, date: '2025-03-10', description: 'Layout dashboard', week_number: 11, year: 2025 },
    { id: 'tte_18', task_id: 'task_3_2', user_id: '2', project_id: '1', hours: 8, date: '2025-03-11', description: 'Widgets dashboard', week_number: 11, year: 2025 },
    { id: 'tte_19', task_id: 'task_3_2', user_id: '2', project_id: '1', hours: 8, date: '2025-03-12', description: 'Charts y gráficas', week_number: 11, year: 2025 },
    { id: 'tte_20', task_id: 'task_3_2', user_id: '2', project_id: '1', hours: 4, date: '2025-03-13', description: 'Responsive', week_number: 11, year: 2025 },
    
    // Pedro - Backend
    { id: 'tte_21', task_id: 'task_4_1', user_id: '4', project_id: '1', hours: 8, date: '2025-03-03', description: 'Setup API', week_number: 10, year: 2025 },
    { id: 'tte_22', task_id: 'task_4_1', user_id: '4', project_id: '1', hours: 10, date: '2025-03-04', description: 'JWT implementation', week_number: 10, year: 2025 },
    { id: 'tte_23', task_id: 'task_4_2', user_id: '4', project_id: '1', hours: 8, date: '2025-03-10', description: 'Modelo clientes', week_number: 11, year: 2025 },
    { id: 'tte_24', task_id: 'task_4_2', user_id: '4', project_id: '1', hours: 7, date: '2025-03-11', description: 'Endpoints clientes', week_number: 11, year: 2025 },
  ],
};

export async function initializeDatabase(): Promise<void> {
  console.log('Initializing database...');
  
  // First, create tables with IF NOT EXISTS
  const statements = SCHEMA_SQL.split(';').filter(s => s.trim());
  
  for (const statement of statements) {
    try {
      await luma.exec(statement);
    } catch (error) {
      console.error('Error executing statement:', statement, error);
    }
  }

  // Run migrations to add missing columns
  console.log('Running migrations...');
  const migrationStatements = MIGRATION_SQL.split(';').filter(s => s.trim());
  
  for (const statement of migrationStatements) {
    try {
      await luma.exec(statement);
    } catch (error) {
      // Ignore errors for columns that already exist
      console.log('Migration note:', (error as Error).message);
    }
  }

  console.log('Seeding initial data...');
  
  for (const user of SEED_DATA.users) {
    try {
      await luma.exec(
        `INSERT OR IGNORE INTO users (id, name, email, role) VALUES (?, ?, ?, ?)`,
        [user.id, user.name, user.email, user.role]
      );
    } catch (error) {
      console.error('Error inserting user:', error);
    }
  }

  for (const project of SEED_DATA.projects) {
    try {
      await luma.exec(
        `INSERT OR IGNORE INTO projects (id, name, code, client, billable) VALUES (?, ?, ?, ?, ?)`,
        [project.id, project.name, project.code, project.client || null, project.billable]
      );
    } catch (error) {
      console.error('Error inserting project:', error);
    }
  }

  // Insert resources
  for (const resource of SEED_DATA.resources) {
    try {
      await luma.exec(
        `INSERT OR IGNORE INTO resources (id, user_id, capacity, skills) VALUES (?, ?, ?, ?)`,
        [resource.id, resource.user_id, resource.capacity, resource.skills]
      );
    } catch (error) {
      console.error('Error inserting resource:', error);
    }
  }

  // Insert allocations
  for (const allocation of SEED_DATA.allocations) {
    try {
      await luma.exec(
        `INSERT OR IGNORE INTO resource_allocations (id, resource_id, project_id, week_number, year, allocated_hours) VALUES (?, ?, ?, ?, ?, ?)`,
        [allocation.id, allocation.resource_id, allocation.project_id, allocation.week_number, allocation.year, allocation.allocated_hours]
      );
    } catch (error) {
      console.error('Error inserting allocation:', error);
    }
  }

  // Insert tasks with new schema
  for (const task of SEED_DATA.tasks) {
    try {
      await luma.exec(
        `INSERT OR IGNORE INTO tasks (id, project_id, parent_id, name, description, assignee_id, start_date, end_date, estimated_hours, actual_hours, progress, priority, status, dependencies) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [task.id, task.project_id, task.parent_id || null, task.name, task.description || null, task.assignee_id || null, task.start_date, task.end_date, task.estimated_hours, task.actual_hours, task.progress, task.priority, task.status, task.dependencies]
      );
    } catch (error) {
      console.error('Error inserting task:', error);
    }
  }

  // Insert task time entries
  for (const entry of SEED_DATA.task_time_entries) {
    try {
      await luma.exec(
        `INSERT OR IGNORE INTO task_time_entries (id, task_id, user_id, project_id, hours, date, description, week_number, year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [entry.id, entry.task_id, entry.user_id, entry.project_id, entry.hours, entry.date, entry.description || null, entry.week_number, entry.year]
      );
    } catch (error) {
      console.error('Error inserting task time entry:', error);
    }
  }

  console.log('Database initialized successfully');
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await luma.query('SELECT 1 as test');
    return true;
  } catch {
    return false;
  }
}
