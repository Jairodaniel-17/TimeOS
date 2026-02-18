import { luma } from './luma';

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

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  assignee_id TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  dependencies TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (assignee_id) REFERENCES users(id)
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
};

export async function initializeDatabase(): Promise<void> {
  console.log('Initializing database...');
  
  const statements = SCHEMA_SQL.split(';').filter(s => s.trim());
  
  for (const statement of statements) {
    try {
      await luma.exec(statement);
    } catch (error) {
      console.error('Error executing statement:', statement, error);
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
