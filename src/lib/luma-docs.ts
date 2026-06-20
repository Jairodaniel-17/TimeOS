import bcrypt from 'bcryptjs';
import { luma } from './luma';

// Document Store Collections
const COLLECTIONS = {
  USERS: 'users',
  PROJECTS: 'projects',
  TASKS: 'tasks',
  TIME_ENTRIES: 'time_entries',
  TASK_TIME_ENTRIES: 'task_time_entries',
  RESOURCES: 'resources',
  ALLOCATIONS: 'allocations',
  APPROVALS: 'approvals',
  PROJECT_PHASES: 'project_phases',
  PHASE_APPROVALS: 'phase_approvals',
  APPROVAL_FILES: 'approval_files',
  CLIENTS: 'clients',
  NOTIFICATIONS: 'notifications',
  OBJECTIVES: 'objectives',
  KEY_RESULTS: 'key_results',
  INITIATIVES: 'initiatives',
  SPRINTS: 'sprints',
  COMMENTS: 'comments',
  ACTIVITY: 'activity',
  ORGANIZATIONS: 'organizations',
  PASSWORD_RESETS: 'password_resets',
} as const;

/**
 * Construye un filtro para el endpoint `/find` de Luma (igualdad exacta por
 * campo, server-side), descartando claves vacías. Esto evita el anti-patrón de
 * "traer toda la colección y filtrar en memoria", que no escala a muchos datos.
 */
function buildFilter(obj: Record<string, unknown>): Record<string, unknown> | undefined {
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return entries.length ? Object.fromEntries(entries) : undefined;
}

// Users
export interface UserDoc {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  password?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt?: number;
}

export async function getUsers() {
  const docs = await luma.findDocs<UserDoc>(COLLECTIONS.USERS, undefined, 1000);
  // Never expose password hashes through list/join reads. Auth uses
  // getUserByEmail and updates use getUserById, so neither is affected.
  return docs
    .map(({ doc }) => { const { password: _pw, ...safe } = doc; return safe; })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getUserById(id: string) {
  const result = await luma.getDoc<UserDoc>(COLLECTIONS.USERS, id);
  return result?.doc || null;
}

export async function getUserByEmail(email: string) {
  // Server-side exact match on the normalized (lowercased) email — emails are
  // stored lowercased on create/update so this scales without scanning users.
  const docs = await luma.findDocs<UserDoc>(COLLECTIONS.USERS, { email: email.toLowerCase() }, 1);
  return docs[0]?.doc || null;
}

export async function createUser(user: Omit<UserDoc, 'createdAt' | 'updatedAt'>) {
  const now = Date.now();
  let password = user.password;
  if (password && !password.startsWith('$2b$') && !password.startsWith('$2a$')) {
    password = await bcrypt.hash(password, 10);
  }
  const doc: UserDoc = {
    ...user,
    email: user.email.toLowerCase(),
    password,
    isActive: user.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  };
  await luma.putDoc(COLLECTIONS.USERS, user.id, doc);
  return doc;
}

export async function updateUser(id: string, updates: Partial<Omit<UserDoc, 'id' | 'createdAt'>>) {
  const existing = await getUserById(id);
  if (!existing) return null;

  // Hash password if it's being updated and isn't already hashed
  if (
    updates.password &&
    !updates.password.startsWith('$2b$') &&
    !updates.password.startsWith('$2a$')
  ) {
    updates = { ...updates, password: await bcrypt.hash(updates.password, 10) };
  }

  const doc: UserDoc = {
    ...existing,
    ...updates,
    ...(updates.email ? { email: updates.email.toLowerCase() } : {}),
    updatedAt: Date.now(),
  };
  await luma.putDoc(COLLECTIONS.USERS, id, doc);
  return doc;
}

// Authentication
export async function authenticateUser(email: string, password: string): Promise<UserDoc | null> {
  const user = await getUserByEmail(email);
  if (!user || !user.isActive) return null;
  if (!user.password) return null;

  const isBcrypt = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');

  if (isBcrypt) {
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;
  } else {
    // Legacy plaintext — compare and auto-upgrade on success
    if (user.password !== password) return null;
    bcrypt.hash(password, 10).then(hash => updateUser(user.id, { password: hash })).catch(() => null);
  }

  return user;
}

// Projects
export interface ProjectDoc {
  id: string;
  name: string;
  code: string;
  client?: string;
  description?: string;
  billable: boolean;
  status: string;
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
  createdAt: number;
  updatedAt?: number;
}

export async function getProjects() {
  const docs = await luma.findDocs<ProjectDoc>(COLLECTIONS.PROJECTS, undefined, 1000);
  return docs.map(d => d.doc).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getProjectById(id: string) {
  const result = await luma.getDoc<ProjectDoc>(COLLECTIONS.PROJECTS, id);
  return result?.doc || null;
}

export async function createProject(project: Omit<ProjectDoc, 'createdAt' | 'updatedAt'>) {
  const now = Date.now();
  const doc: ProjectDoc = {
    ...project,
    createdAt: now,
    updatedAt: now,
  };
  await luma.putDoc(COLLECTIONS.PROJECTS, project.id, doc);
  return doc;
}

export async function updateProject(id: string, updates: Partial<Omit<ProjectDoc, 'id' | 'createdAt'>>) {
  const existing = await getProjectById(id);
  if (!existing) return null;
  
  const doc: ProjectDoc = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };
  await luma.putDoc(COLLECTIONS.PROJECTS, id, doc);
  return doc;
}

// Calculate project costs
export async function calculateProjectCosts(projectId: string) {
  // Time entries for this project (server-side filtered) and the rate table
  // fetched ONCE — not per entry (was an N+1).
  const timeEntries = await getTaskTimeEntries({ projectId });
  const resources = await getResources();
  const rateByUser = new Map(resources.map(r => [r.userId, r.hourlyRate]));

  let totalHours = 0;
  let totalCost = 0;

  for (const entry of timeEntries) {
    totalHours += entry.hours;
    const rate = rateByUser.get(entry.userId);
    if (rate) totalCost += entry.hours * rate;
  }
  
  // Update project with calculated values
  const project = await getProjectById(projectId);
  if (project) {
    const profit = project.budget ? project.budget - totalCost : undefined;
    const profitMargin = project.budget ? (profit! / project.budget) * 100 : undefined;
    
    await updateProject(projectId, {
      actualHours: totalHours,
      actualCost: totalCost,
      profit,
      profitMargin,
    });
  }
  
  return { totalHours, totalCost };
}

// Tasks - with hierarchy support
export interface TaskDoc {
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
  progress: number;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  dependencies: string[];
  subtasks?: TaskDoc[];
  isEpic?: boolean;
  isMilestone?: boolean;
  type?: 'epic' | 'story' | 'task' | 'bug';
  sprintId?: string;
  createdAt: number;
  updatedAt: number;
}

export async function getTasks(filter?: { projectId?: string; assigneeId?: string; parentId?: string | null }) {
  // Push the equality filters server-side. `parentId: null` (top-level only)
  // can't be expressed as equality, so that case is filtered in memory.
  const f = buildFilter({
    projectId: filter?.projectId,
    assigneeId: filter?.assigneeId,
    parentId: typeof filter?.parentId === 'string' ? filter.parentId : undefined,
  });
  const allDocs = await luma.findDocs<TaskDoc>(COLLECTIONS.TASKS, f, 5000);
  let tasks = allDocs.map(d => d.doc);

  if (filter?.parentId === null) {
    tasks = tasks.filter(t => !t.parentId);
  }

  // Build hierarchy
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const rootTasks: TaskDoc[] = [];
  
  tasks.forEach(task => {
    if (task.parentId && taskMap.has(task.parentId)) {
      const parent = taskMap.get(task.parentId)!;
      if (!parent.subtasks) parent.subtasks = [];
      parent.subtasks.push(task);
    } else {
      rootTasks.push(task);
    }
  });
  
  return rootTasks.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

export async function getAllTasksFlat() {
  const allDocs = await luma.findDocs<TaskDoc>(COLLECTIONS.TASKS, undefined, 1000);
  return allDocs.map(d => d.doc).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

export async function getTaskById(id: string) {
  const result = await luma.getDoc<TaskDoc>(COLLECTIONS.TASKS, id);
  return result?.doc || null;
}

export async function createTask(task: Omit<TaskDoc, 'createdAt' | 'updatedAt'>) {
  const now = Date.now();
  const doc: TaskDoc = {
    ...task,
    createdAt: now,
    updatedAt: now,
  };
  await luma.putDoc(COLLECTIONS.TASKS, task.id, doc);
  return doc;
}

export async function updateTask(id: string, updates: Partial<Omit<TaskDoc, 'id' | 'createdAt'>>) {
  const existing = await getTaskById(id);
  if (!existing) return null;
  
  const doc: TaskDoc = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };
  await luma.putDoc(COLLECTIONS.TASKS, id, doc);
  return doc;
}

export async function deleteTask(id: string) {
  // Delete subtasks first
  const subtasks = await getTasks({ parentId: id });
  for (const subtask of subtasks) {
    await deleteTask(subtask.id);
  }
  
  // Delete related time entries
  const timeEntries = await getTaskTimeEntries({ taskId: id });
  for (const entry of timeEntries) {
    await luma.deleteDoc(COLLECTIONS.TASK_TIME_ENTRIES, entry.id);
  }
  
  await luma.deleteDoc(COLLECTIONS.TASKS, id);
}

// Task Time Entries
export interface TaskTimeEntryDoc {
  id: string;
  taskId: string;
  userId: string;
  projectId: string;
  hours: number;
  date: string;
  description?: string;
  billable: boolean;
  weekNumber: number;
  year: number;
  createdAt: number;
}

export async function getTaskTimeEntries(filter?: { taskId?: string; userId?: string; projectId?: string; weekNumber?: number; year?: number }) {
  const f = buildFilter({ taskId: filter?.taskId, userId: filter?.userId, projectId: filter?.projectId, weekNumber: filter?.weekNumber, year: filter?.year });
  const allDocs = await luma.findDocs<TaskTimeEntryDoc>(COLLECTIONS.TASK_TIME_ENTRIES, f, 5000);
  const entries = allDocs.map(d => d.doc);
  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function createTaskTimeEntry(entry: Omit<TaskTimeEntryDoc, 'createdAt'>) {
  const doc: TaskTimeEntryDoc = {
    ...entry,
    createdAt: Date.now(),
  };
  await luma.putDoc(COLLECTIONS.TASK_TIME_ENTRIES, entry.id, doc);
  
  // Update task actualHours
  const taskEntries = await getTaskTimeEntries({ taskId: entry.taskId });
  const totalHours = taskEntries.reduce((sum, e) => sum + e.hours, 0);
  await updateTask(entry.taskId, { actualHours: totalHours });
  
  return doc;
}

export async function updateTaskTimeEntry(id: string, updates: Partial<Omit<TaskTimeEntryDoc, 'id' | 'createdAt'>>) {
  const result = await luma.getDoc<TaskTimeEntryDoc>(COLLECTIONS.TASK_TIME_ENTRIES, id);
  if (!result) return null;
  const existing = result.doc;
  
  const doc: TaskTimeEntryDoc = { ...existing, ...updates };
  await luma.putDoc(COLLECTIONS.TASK_TIME_ENTRIES, id, doc);
  
  // Recalculate task actualHours
  const taskEntries = await getTaskTimeEntries({ taskId: existing.taskId });
  const totalHours = taskEntries.reduce((sum, e) => sum + e.hours, 0);
  await updateTask(existing.taskId, { actualHours: totalHours });
  
  return doc;
}

export async function deleteTaskTimeEntry(id: string) {
  const result = await luma.getDoc<TaskTimeEntryDoc>(COLLECTIONS.TASK_TIME_ENTRIES, id);
  const entry = result?.doc;
  
  if (entry) {
    await luma.deleteDoc(COLLECTIONS.TASK_TIME_ENTRIES, id);
    
    // Recalculate task actualHours
    const taskEntries = await getTaskTimeEntries({ taskId: entry.taskId });
    const totalHours = taskEntries.reduce((sum, e) => sum + e.hours, 0);
    await updateTask(entry.taskId, { actualHours: totalHours });
  }
}

// Resources
export interface ResourceDoc {
  id: string;
  userId: string;
  capacity: number;
  skills: string[];
  hourlyRate: number;
  monthlySalary?: number;
  currency: string;
  createdAt: number;
  updatedAt?: number;
}

export async function getResources() {
  const docs = await luma.findDocs<ResourceDoc>(COLLECTIONS.RESOURCES, undefined, 1000);
  return docs.map(d => d.doc);
}

export async function getResourceById(id: string) {
  const result = await luma.getDoc<ResourceDoc>(COLLECTIONS.RESOURCES, id);
  return result?.doc || null;
}

export async function getResourceByUserId(userId: string) {
  const docs = await luma.findDocs<ResourceDoc>(COLLECTIONS.RESOURCES, { userId }, 1);
  return docs[0]?.doc || null;
}

export async function createResource(resource: Omit<ResourceDoc, 'createdAt' | 'updatedAt'>) {
  const now = Date.now();
  const doc: ResourceDoc = {
    ...resource,
    currency: resource.currency || 'USD',
    createdAt: now,
    updatedAt: now,
  };
  await luma.putDoc(COLLECTIONS.RESOURCES, resource.id, doc);
  return doc;
}

export async function updateResource(id: string, updates: Partial<Omit<ResourceDoc, 'id' | 'createdAt'>>) {
  const existing = await getResourceById(id);
  if (!existing) return null;
  
  const doc: ResourceDoc = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };
  await luma.putDoc(COLLECTIONS.RESOURCES, id, doc);
  return doc;
}

// Allocations
export interface AllocationDoc {
  id: string;
  resourceId: string;
  projectId: string;
  weekNumber: number;
  year: number;
  allocatedHours: number;
  createdAt: number;
}

export async function getAllocations(filter?: { resourceId?: string; projectId?: string; weekNumber?: number; year?: number }) {
  const f = buildFilter({ resourceId: filter?.resourceId, projectId: filter?.projectId, weekNumber: filter?.weekNumber, year: filter?.year });
  const allDocs = await luma.findDocs<AllocationDoc>(COLLECTIONS.ALLOCATIONS, f, 5000);
  const allocations = allDocs.map(d => d.doc);
  return allocations.sort((a, b) => b.year - a.year || b.weekNumber - a.weekNumber);
}

export async function createAllocation(allocation: Omit<AllocationDoc, 'createdAt'>) {
  const doc = { ...allocation, createdAt: Date.now() };
  await luma.putDoc(COLLECTIONS.ALLOCATIONS, allocation.id, doc);
  return doc;
}

// Approvals
export interface ApprovalDoc {
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
  createdAt: number;
}

export async function getApprovals(filter?: { status?: string; userId?: string }) {
  const f = buildFilter({ status: filter?.status, userId: filter?.userId });
  const allDocs = await luma.findDocs<ApprovalDoc>(COLLECTIONS.APPROVALS, f, 5000);
  const approvals = allDocs.map(d => d.doc);
  return approvals.sort((a, b) => b.createdAt - a.createdAt);
}

export async function createApproval(approval: Omit<ApprovalDoc, 'createdAt'>) {
  const doc = { ...approval, createdAt: Date.now() };
  await luma.putDoc(COLLECTIONS.APPROVALS, approval.id, doc);
  return doc;
}

export async function updateApproval(id: string, updates: Partial<ApprovalDoc>) {
  const result = await luma.getDoc<ApprovalDoc>(COLLECTIONS.APPROVALS, id);
  if (!result) return null;
  const doc = { ...result.doc, ...updates };
  await luma.putDoc(COLLECTIONS.APPROVALS, id, doc);
  return doc;
}

// Time Entries (legacy timesheet)
export interface TimeEntryDoc {
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
  createdAt: number;
  updatedAt: number;
}

export async function getTimeEntries(filter?: { userId?: string; projectId?: string; weekNumber?: number; year?: number }, limit = 5000) {
  const f = buildFilter({ userId: filter?.userId, projectId: filter?.projectId, weekNumber: filter?.weekNumber, year: filter?.year });
  const docs = await luma.findDocs<TimeEntryDoc>(COLLECTIONS.TIME_ENTRIES, f, limit);
  return docs.map(d => d.doc).sort((a, b) => b.createdAt - a.createdAt);
}

export async function createTimeEntry(entry: Omit<TimeEntryDoc, 'createdAt' | 'updatedAt'>) {
  const now = Date.now();
  const doc = { ...entry, createdAt: now, updatedAt: now };
  await luma.putDoc(COLLECTIONS.TIME_ENTRIES, entry.id, doc);
  return doc;
}

export async function updateTimeEntry(id: string, updates: Partial<Omit<TimeEntryDoc, 'id' | 'createdAt'>>) {
  const result = await luma.getDoc<TimeEntryDoc>(COLLECTIONS.TIME_ENTRIES, id);
  if (!result) return null;
  const doc = { ...result.doc, ...updates, updatedAt: Date.now() };
  await luma.putDoc(COLLECTIONS.TIME_ENTRIES, id, doc);
  return doc;
}

export async function deleteTimeEntry(id: string) {
  await luma.deleteDoc(COLLECTIONS.TIME_ENTRIES, id);
}

// Initialize function
export async function initializeDocumentStore() {
  console.log('Initializing Document Store...');
  
  // Collections are created automatically when first document is added
  // But we can check health by trying to list each collection
  try {
    for (const collection of Object.values(COLLECTIONS)) {
      await luma.findDocs(collection, undefined, 1);
    }
    console.log('Document Store initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Document Store:', error);
    return false;
  }
}

export async function clearAllData() {
  console.log('Clearing all data...');
  
  for (const collection of Object.values(COLLECTIONS)) {
    const docs = await luma.findDocs(collection, undefined, 10000);
    for (const doc of docs) {
      await luma.deleteDoc(collection, doc.id);
    }
  }
  
  console.log('All data cleared');
}

export interface ProjectPhaseDoc {
  id: string;
  projectId: string;
  phaseId: string;
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

export async function getProjectPhases(projectId: string) {
  const docs = await luma.findDocs<ProjectPhaseDoc>(COLLECTIONS.PROJECT_PHASES, undefined, 1000);
  return docs
    .map(d => d.doc)
    .filter(p => p.projectId === projectId)
    .sort((a, b) => a.order - b.order);
}

export async function getProjectPhaseById(id: string) {
  const result = await luma.getDoc<ProjectPhaseDoc>(COLLECTIONS.PROJECT_PHASES, id);
  return result?.doc || null;
}

export async function createProjectPhases(projectId: string) {
  const now = Date.now();
  const phaseDefs = [
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
  ];

  const docs: ProjectPhaseDoc[] = phaseDefs.map(phase => ({
    id: `${projectId}_${phase.id}`,
    projectId,
    phaseId: phase.id,
    name: phase.name,
    order: phase.order,
    status: 'pending',
    createdAt: now,
  }));

  await Promise.all(docs.map(doc => luma.putDoc(COLLECTIONS.PROJECT_PHASES, doc.id, doc)));
  return docs;
}

export async function updateProjectPhase(id: string, updates: Partial<Omit<ProjectPhaseDoc, 'id' | 'createdAt'>>) {
  const existing = await getProjectPhaseById(id);
  if (!existing) return null;
  
  const doc: ProjectPhaseDoc = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };
  await luma.putDoc(COLLECTIONS.PROJECT_PHASES, id, doc);
  return doc;
}

export async function calculatePhaseCosts(projectId: string, phaseId: string) {
  // Tasks of this phase (server-side filtered), the project's time entries, and
  // the rate table — each fetched ONCE (was a tasks × entries × resources N+1).
  const taskDocs = await luma.findDocs<TaskDoc>(COLLECTIONS.TASKS, { projectId, phaseId }, 5000);
  const phaseTaskIds = new Set(taskDocs.map(d => d.doc.id));
  const projectEntries = await getTaskTimeEntries({ projectId });
  const resources = await getResources();
  const rateByUser = new Map(resources.map(r => [r.userId, r.hourlyRate]));

  let totalHours = 0;
  let totalCost = 0;

  for (const entry of projectEntries) {
    if (!phaseTaskIds.has(entry.taskId)) continue;
    totalHours += entry.hours;
    const rate = rateByUser.get(entry.userId);
    if (rate) totalCost += entry.hours * rate;
  }

  await updateProjectPhase(`${projectId}_${phaseId}`, {
    actualHours: totalHours,
    actualCost: totalCost,
  });
  
  return { totalHours, totalCost };
}

export interface PhaseApprovalDoc {
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

export async function getPhaseApproval(projectPhaseId: string) {
  const docs = await luma.findDocs<PhaseApprovalDoc>(COLLECTIONS.PHASE_APPROVALS, undefined, 1000);
  return docs.find(d => d.doc.projectPhaseId === projectPhaseId)?.doc || null;
}

export async function createPhaseApproval(approval: Omit<PhaseApprovalDoc, 'createdAt'>) {
  const doc: PhaseApprovalDoc = {
    ...approval,
    createdAt: Date.now(),
  };
  await luma.putDoc(COLLECTIONS.PHASE_APPROVALS, approval.id, doc);
  
  await updateProjectPhase(approval.projectPhaseId, {
    status: 'completed',
    approvedAt: approval.approvedAt,
    approvedBy: approval.approvedBy,
  });
  
  return doc;
}

export async function updatePhaseApproval(id: string, updates: Partial<Omit<PhaseApprovalDoc, 'id' | 'createdAt'>>) {
  const result = await luma.getDoc<PhaseApprovalDoc>(COLLECTIONS.PHASE_APPROVALS, id);
  if (!result) return null;
  const existing = result.doc;
  
  const doc: PhaseApprovalDoc = { ...existing, ...updates };
  await luma.putDoc(COLLECTIONS.PHASE_APPROVALS, id, doc);
  return doc;
}

export interface ApprovalFileDoc {
  id: string;
  phaseApprovalId: string;
  name: string;
  type: string;
  size: number;
  data: string;
  uploadedBy: string;
  uploadedAt: number;
}

export async function getApprovalFiles(phaseApprovalId: string) {
  const docs = await luma.findDocs<ApprovalFileDoc>(COLLECTIONS.APPROVAL_FILES, undefined, 1000);
  return docs
    .map(d => d.doc)
    .filter(f => f.phaseApprovalId === phaseApprovalId)
    .sort((a, b) => b.uploadedAt - a.uploadedAt);
}

export async function createApprovalFile(file: Omit<ApprovalFileDoc, 'uploadedAt'>) {
  const doc: ApprovalFileDoc = {
    ...file,
    uploadedAt: Date.now(),
  };
  await luma.putDoc(COLLECTIONS.APPROVAL_FILES, file.id, doc);
  return doc;
}

export async function deleteApprovalFile(id: string) {
  await luma.deleteDoc(COLLECTIONS.APPROVAL_FILES, id);
}

export interface ClientDoc {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  createdAt: number;
  updatedAt?: number;
}

export async function getClients() {
  const docs = await luma.findDocs<ClientDoc>(COLLECTIONS.CLIENTS, undefined, 1000);
  return docs.map(d => d.doc).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getClientById(id: string) {
  const result = await luma.getDoc<ClientDoc>(COLLECTIONS.CLIENTS, id);
  return result?.doc || null;
}

export async function createClient(client: Omit<ClientDoc, 'createdAt' | 'updatedAt'>) {
  const now = Date.now();
  const doc: ClientDoc = {
    ...client,
    createdAt: now,
    updatedAt: now,
  };
  await luma.putDoc(COLLECTIONS.CLIENTS, client.id, doc);
  return doc;
}

export async function updateClient(id: string, updates: Partial<Omit<ClientDoc, 'id' | 'createdAt'>>) {
  const existing = await getClientById(id);
  if (!existing) return null;
  
  const doc: ClientDoc = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };
  await luma.putDoc(COLLECTIONS.CLIENTS, id, doc);
  return doc;
}

export interface NotificationDoc {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  projectId?: string;
  phaseId?: string;
  read: boolean;
  readAt?: number;
  createdAt: number;
}

export async function getNotifications(userId: string, limit = 50) {
  const docs = await luma.findDocs<NotificationDoc>(COLLECTIONS.NOTIFICATIONS, { userId }, 1000);
  return docs
    .map(d => d.doc)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}

export async function getUnreadNotificationCount(userId: string) {
  const docs = await luma.findDocs<NotificationDoc>(COLLECTIONS.NOTIFICATIONS, undefined, 1000);
  return docs.filter(d => d.doc.userId === userId && !d.doc.read).length;
}

export async function createNotification(notification: Omit<NotificationDoc, 'createdAt'>) {
  const doc: NotificationDoc = {
    ...notification,
    createdAt: Date.now(),
  };
  await luma.putDoc(COLLECTIONS.NOTIFICATIONS, notification.id, doc);
  return doc;
}

export async function markNotificationAsRead(id: string) {
  const result = await luma.getDoc<NotificationDoc>(COLLECTIONS.NOTIFICATIONS, id);
  if (!result) return null;
  const existing = result.doc;
  
  const doc: NotificationDoc = {
    ...existing,
    read: true,
    readAt: Date.now(),
  };
  await luma.putDoc(COLLECTIONS.NOTIFICATIONS, id, doc);
  return doc;
}

export async function markAllNotificationsAsRead(userId: string) {
  const notifications = await getNotifications(userId, 1000);
  await Promise.all(
    notifications.filter(n => !n.read).map(n => markNotificationAsRead(n.id))
  );
}

export async function deleteProject(id: string) {
  const phases = await getProjectPhases(id);
  for (const phase of phases) {
    const approval = await getPhaseApproval(phase.id);
    if (approval) {
      const files = await getApprovalFiles(approval.id);
      for (const file of files) {
        await deleteApprovalFile(file.id);
      }
      await luma.deleteDoc(COLLECTIONS.PHASE_APPROVALS, approval.id);
    }
    await luma.deleteDoc(COLLECTIONS.PROJECT_PHASES, phase.id);
  }
  
  const allTasks = await luma.findDocs<TaskDoc>(COLLECTIONS.TASKS, undefined, 1000);
  const projectTasks = allTasks.filter(d => d.doc.projectId === id);
  for (const taskDoc of projectTasks) {
    await deleteTask(taskDoc.doc.id);
  }
  
  await luma.deleteDoc(COLLECTIONS.PROJECTS, id);
}
// ===========================================================================
// OKRs — Objectives, Key Results, Initiatives
// ===========================================================================
export interface ObjectiveDoc {
  id: string;
  title: string;
  description?: string;
  level: 'company' | 'team' | 'individual';
  ownerId: string;
  parentId?: string;
  period: string;
  periodType: 'annual' | 'quarterly';
  type: 'aspirational' | 'committed';
  strategicTheme: 'blue_ocean' | 'red_ocean' | 'growth' | 'efficiency' | 'customer' | 'none';
  status: 'draft' | 'on_track' | 'at_risk' | 'behind' | 'done';
  createdAt: number;
  updatedAt?: number;
}

export interface KeyResultDoc {
  id: string;
  objectiveId: string;
  title: string;
  type: 'metric' | 'binary';
  unit?: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
  weight: number;
  confidence: 'on_track' | 'at_risk' | 'off_track';
  ownerId?: string;
  projectId?: string;
  lastCheckinNote?: string;
  lastCheckinAt?: number;
  createdAt: number;
  updatedAt?: number;
}

export interface InitiativeDoc {
  id: string;
  objectiveId: string;
  keyResultId?: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  projectId?: string;
  taskId?: string;
  ownerId?: string;
  createdAt: number;
  updatedAt?: number;
}

/** Score 0–1 de un KR a partir de start/current/target. Soporta metas decrecientes. */
export function keyResultScore(kr: Pick<KeyResultDoc, 'type' | 'startValue' | 'targetValue' | 'currentValue'>): number {
  if (kr.type === 'binary') {
    return kr.currentValue >= (kr.targetValue || 1) ? 1 : 0;
  }
  const denom = kr.targetValue - kr.startValue;
  if (denom === 0) return kr.currentValue >= kr.targetValue ? 1 : 0;
  const raw = (kr.currentValue - kr.startValue) / denom;
  return Math.max(0, Math.min(1, raw));
}

// --- Objectives ---
export async function getObjectives() {
  const docs = await luma.findDocs<ObjectiveDoc>(COLLECTIONS.OBJECTIVES, undefined, 1000);
  return docs.map(d => d.doc);
}

export async function getObjectiveById(id: string) {
  const result = await luma.getDoc<ObjectiveDoc>(COLLECTIONS.OBJECTIVES, id);
  return result?.doc || null;
}

export async function createObjective(obj: Omit<ObjectiveDoc, 'createdAt' | 'updatedAt'>) {
  const now = Date.now();
  const doc: ObjectiveDoc = { ...obj, createdAt: now, updatedAt: now };
  await luma.putDoc(COLLECTIONS.OBJECTIVES, obj.id, doc);
  return doc;
}

export async function updateObjective(id: string, updates: Partial<Omit<ObjectiveDoc, 'id' | 'createdAt'>>) {
  const existing = await getObjectiveById(id);
  if (!existing) return null;
  const doc: ObjectiveDoc = { ...existing, ...updates, updatedAt: Date.now() };
  await luma.putDoc(COLLECTIONS.OBJECTIVES, id, doc);
  return doc;
}

export async function deleteObjective(id: string) {
  // Cascade: remove this objective's key results and initiatives.
  const krs = await getKeyResults({ objectiveId: id });
  for (const kr of krs) await luma.deleteDoc(COLLECTIONS.KEY_RESULTS, kr.id);
  const inits = await getInitiatives({ objectiveId: id });
  for (const it of inits) await luma.deleteDoc(COLLECTIONS.INITIATIVES, it.id);
  await luma.deleteDoc(COLLECTIONS.OBJECTIVES, id);
}

// --- Key Results ---
export async function getKeyResults(filter?: { objectiveId?: string }) {
  const docs = await luma.findDocs<KeyResultDoc>(COLLECTIONS.KEY_RESULTS, buildFilter({ objectiveId: filter?.objectiveId }), 5000);
  return docs.map(d => d.doc);
}

export async function createKeyResult(kr: Omit<KeyResultDoc, 'createdAt' | 'updatedAt'>) {
  const now = Date.now();
  const doc: KeyResultDoc = { ...kr, weight: kr.weight || 1, createdAt: now, updatedAt: now };
  await luma.putDoc(COLLECTIONS.KEY_RESULTS, kr.id, doc);
  return doc;
}

export async function updateKeyResult(id: string, updates: Partial<Omit<KeyResultDoc, 'id' | 'createdAt'>>) {
  const result = await luma.getDoc<KeyResultDoc>(COLLECTIONS.KEY_RESULTS, id);
  if (!result) return null;
  const doc: KeyResultDoc = { ...result.doc, ...updates, updatedAt: Date.now() };
  await luma.putDoc(COLLECTIONS.KEY_RESULTS, id, doc);
  return doc;
}

export async function deleteKeyResult(id: string) {
  await luma.deleteDoc(COLLECTIONS.KEY_RESULTS, id);
}

// --- Initiatives ---
export async function getInitiatives(filter?: { objectiveId?: string }) {
  const docs = await luma.findDocs<InitiativeDoc>(COLLECTIONS.INITIATIVES, buildFilter({ objectiveId: filter?.objectiveId }), 5000);
  return docs.map(d => d.doc);
}

export async function createInitiative(init: Omit<InitiativeDoc, 'createdAt' | 'updatedAt'>) {
  const now = Date.now();
  const doc: InitiativeDoc = { ...init, createdAt: now, updatedAt: now };
  await luma.putDoc(COLLECTIONS.INITIATIVES, init.id, doc);
  return doc;
}

export async function updateInitiative(id: string, updates: Partial<Omit<InitiativeDoc, 'id' | 'createdAt'>>) {
  const result = await luma.getDoc<InitiativeDoc>(COLLECTIONS.INITIATIVES, id);
  if (!result) return null;
  const doc: InitiativeDoc = { ...result.doc, ...updates, updatedAt: Date.now() };
  await luma.putDoc(COLLECTIONS.INITIATIVES, id, doc);
  return doc;
}

export async function deleteInitiative(id: string) {
  await luma.deleteDoc(COLLECTIONS.INITIATIVES, id);
}

/** Objetivos con KRs (scored), iniciativas, dueño y % de avance (roll-up ponderado). */
export async function getObjectivesWithDetails() {
  const [objectives, allKrs, allInits, users] = await Promise.all([
    getObjectives(),
    getKeyResults(),
    getInitiatives(),
    getUsers(),
  ]);
  const userMap = new Map(users.map(u => [u.id, u]));

  const detailed = objectives.map(obj => {
    const keyResults = allKrs
      .filter(k => k.objectiveId === obj.id)
      .map(k => ({ ...k, score: keyResultScore(k) }));
    const initiatives = allInits.filter(i => i.objectiveId === obj.id);
    const totalWeight = keyResults.reduce((s, k) => s + (k.weight || 1), 0);
    const progress = totalWeight > 0
      ? Math.round((keyResults.reduce((s, k) => s + k.score * (k.weight || 1), 0) / totalWeight) * 100)
      : 0;
    return { ...obj, keyResults, initiatives, owner: userMap.get(obj.ownerId), progress };
  });
  return detailed;
}

// ===========================================================================
// Sprints (Scrum) — un proyecto tiene sprints; las tareas con sprintId están
// en un sprint, las que no, en el backlog.
// ===========================================================================
export interface SprintDoc {
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

export async function getSprints(filter?: { projectId?: string; status?: string }) {
  const docs = await luma.findDocs<SprintDoc>(COLLECTIONS.SPRINTS, buildFilter({ projectId: filter?.projectId, status: filter?.status }), 2000);
  return docs.map(d => d.doc).sort((a, b) => (b.createdAt - a.createdAt));
}

export async function getSprintById(id: string) {
  const result = await luma.getDoc<SprintDoc>(COLLECTIONS.SPRINTS, id);
  return result?.doc || null;
}

export async function createSprint(sprint: Omit<SprintDoc, 'createdAt' | 'updatedAt'>) {
  const now = Date.now();
  const doc: SprintDoc = { ...sprint, createdAt: now, updatedAt: now };
  await luma.putDoc(COLLECTIONS.SPRINTS, sprint.id, doc);
  return doc;
}

export async function updateSprint(id: string, updates: Partial<Omit<SprintDoc, 'id' | 'createdAt'>>) {
  const existing = await getSprintById(id);
  if (!existing) return null;
  const doc: SprintDoc = { ...existing, ...updates, updatedAt: Date.now() };
  await luma.putDoc(COLLECTIONS.SPRINTS, id, doc);
  return doc;
}

export async function deleteSprint(id: string) {
  // Move this sprint's issues back to the backlog instead of orphaning them.
  const tasks = await luma.findDocs<TaskDoc>(COLLECTIONS.TASKS, { sprintId: id }, 5000);
  for (const t of tasks) {
    await luma.putDoc(COLLECTIONS.TASKS, t.doc.id, { ...t.doc, sprintId: undefined, updatedAt: Date.now() });
  }
  await luma.deleteDoc(COLLECTIONS.SPRINTS, id);
}

/** Tareas (planas, sin jerarquía) para el tablero — filtrables por proyecto/sprint. */
export async function getBoardTasks(filter: { projectId?: string; sprintId?: string }) {
  const f = buildFilter({ projectId: filter.projectId, sprintId: filter.sprintId });
  const docs = await luma.findDocs<TaskDoc>(COLLECTIONS.TASKS, f, 5000);
  return docs.map(d => d.doc);
}

// ===========================================================================
// Comments — on tasks/issues (entityType:'task') and extensible to others.
// ===========================================================================
export interface CommentDoc {
  id: string;
  entityType: string;   // 'task' | 'project' | ...
  entityId: string;
  userId: string;
  body: string;
  createdAt: number;
  updatedAt?: number;
}

export async function getComments(filter: { entityType?: string; entityId?: string }) {
  const docs = await luma.findDocs<CommentDoc>(COLLECTIONS.COMMENTS, buildFilter({ entityType: filter.entityType, entityId: filter.entityId }), 2000);
  return docs.map(d => d.doc).sort((a, b) => a.createdAt - b.createdAt);
}

export async function createComment(c: Omit<CommentDoc, 'createdAt' | 'updatedAt'>) {
  const now = Date.now();
  const doc: CommentDoc = { ...c, createdAt: now, updatedAt: now };
  await luma.putDoc(COLLECTIONS.COMMENTS, c.id, doc);
  return doc;
}

export async function deleteComment(id: string) {
  await luma.deleteDoc(COLLECTIONS.COMMENTS, id);
}

// ===========================================================================
// Activity log — append-only history of changes on an entity.
// ===========================================================================
export interface ActivityDoc {
  id: string;
  entityType: string;
  entityId: string;
  userId: string;
  action: string;       // e.g. 'created', 'status', 'assignee', 'comment', 'field'
  field?: string;
  from?: string;
  to?: string;
  message?: string;
  createdAt: number;
}

export async function getActivity(filter: { entityType?: string; entityId?: string }) {
  const docs = await luma.findDocs<ActivityDoc>(COLLECTIONS.ACTIVITY, buildFilter({ entityType: filter.entityType, entityId: filter.entityId }), 2000);
  return docs.map(d => d.doc).sort((a, b) => b.createdAt - a.createdAt);
}

export async function logActivity(a: Omit<ActivityDoc, 'id' | 'createdAt'>) {
  const id = `act_${Date.now()}_${a.entityId}_${a.action}`;
  const doc: ActivityDoc = { ...a, id, createdAt: Date.now() };
  await luma.putDoc(COLLECTIONS.ACTIVITY, id, doc);
  return doc;
}

// ===========================================================================
// Organizations (multi-tenant foundation). Entities carry orgId; the default
// org is 'org_1' for seeded data.
// ===========================================================================
export interface OrganizationDoc {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  ownerId: string;
  createdAt: number;
  updatedAt?: number;
}

export async function getOrganizations() {
  const docs = await luma.findDocs<OrganizationDoc>(COLLECTIONS.ORGANIZATIONS, undefined, 1000);
  return docs.map(d => d.doc);
}

export async function getOrganizationById(id: string) {
  const result = await luma.getDoc<OrganizationDoc>(COLLECTIONS.ORGANIZATIONS, id);
  return result?.doc || null;
}

export async function getOrganizationBySlug(slug: string) {
  const docs = await luma.findDocs<OrganizationDoc>(COLLECTIONS.ORGANIZATIONS, { slug }, 1);
  return docs[0]?.doc || null;
}

export async function createOrganization(org: Omit<OrganizationDoc, 'createdAt' | 'updatedAt'>) {
  const now = Date.now();
  const doc: OrganizationDoc = { ...org, createdAt: now, updatedAt: now };
  await luma.putDoc(COLLECTIONS.ORGANIZATIONS, org.id, doc);
  return doc;
}

// ===========================================================================
// Password reset tokens.
// ===========================================================================
export interface PasswordResetDoc {
  id: string;          // the token
  userId: string;
  email: string;
  expiresAt: number;
  used: boolean;
  createdAt: number;
}

export async function createPasswordReset(token: string, userId: string, email: string, ttlMs = 3600_000) {
  const now = Date.now();
  const doc: PasswordResetDoc = { id: token, userId, email, expiresAt: now + ttlMs, used: false, createdAt: now };
  await luma.putDoc(COLLECTIONS.PASSWORD_RESETS, token, doc);
  return doc;
}

export async function getPasswordReset(token: string) {
  const result = await luma.getDoc<PasswordResetDoc>(COLLECTIONS.PASSWORD_RESETS, token);
  return result?.doc || null;
}

export async function markPasswordResetUsed(token: string) {
  const existing = await getPasswordReset(token);
  if (!existing) return;
  await luma.putDoc(COLLECTIONS.PASSWORD_RESETS, token, { ...existing, used: true });
}
