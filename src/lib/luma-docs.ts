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
} as const;

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
  return docs.map(d => d.doc).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getUserById(id: string) {
  const result = await luma.getDoc<UserDoc>(COLLECTIONS.USERS, id);
  return result?.doc || null;
}

export async function getUserByEmail(email: string) {
  const docs = await luma.findDocs<UserDoc>(COLLECTIONS.USERS, undefined, 1000);
  return docs.find(d => d.doc.email.toLowerCase() === email.toLowerCase())?.doc || null;
}

export async function createUser(user: Omit<UserDoc, 'createdAt' | 'updatedAt'>) {
  const now = Date.now();
  let password = user.password;
  if (password && !password.startsWith('$2b$') && !password.startsWith('$2a$')) {
    password = await bcrypt.hash(password, 10);
  }
  const doc: UserDoc = {
    ...user,
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
  // Get all tasks for this project
  const allDocs = await luma.findDocs<TaskDoc>(COLLECTIONS.TASKS, undefined, 1000);
  const projectTasks = allDocs.filter(d => d.doc.projectId === projectId);
  
  // Get all time entries for this project
  const timeEntries = await getTaskTimeEntries({ projectId });
  
  // Calculate total hours and cost
  let totalHours = 0;
  let totalCost = 0;
  
  for (const entry of timeEntries) {
    totalHours += entry.hours;
    
    // Get resource hourly rate for this user
    const resources = await getResources();
    const resource = resources.find(r => r.userId === entry.userId);
    if (resource) {
      totalCost += entry.hours * resource.hourlyRate;
    }
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
  createdAt: number;
  updatedAt: number;
}

export async function getTasks(filter?: { projectId?: string; assigneeId?: string; parentId?: string | null }) {
  const allDocs = await luma.findDocs<TaskDoc>(COLLECTIONS.TASKS, undefined, 1000);
  let tasks = allDocs.map(d => d.doc);
  
  if (filter?.projectId) {
    tasks = tasks.filter(t => t.projectId === filter.projectId);
  }
  
  if (filter?.assigneeId) {
    tasks = tasks.filter(t => t.assigneeId === filter.assigneeId);
  }
  
  if (filter?.parentId !== undefined) {
    if (filter.parentId === null) {
      tasks = tasks.filter(t => !t.parentId);
    } else {
      tasks = tasks.filter(t => t.parentId === filter.parentId);
    }
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
  const allDocs = await luma.findDocs<TaskTimeEntryDoc>(COLLECTIONS.TASK_TIME_ENTRIES, undefined, 1000);
  let entries = allDocs.map(d => d.doc);
  
  if (filter?.taskId) entries = entries.filter(e => e.taskId === filter.taskId);
  if (filter?.userId) entries = entries.filter(e => e.userId === filter.userId);
  if (filter?.projectId) entries = entries.filter(e => e.projectId === filter.projectId);
  if (filter?.weekNumber) entries = entries.filter(e => e.weekNumber === filter.weekNumber);
  if (filter?.year) entries = entries.filter(e => e.year === filter.year);
  
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
  const resources = await getResources();
  return resources.find(r => r.userId === userId) || null;
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
  const allDocs = await luma.findDocs<AllocationDoc>(COLLECTIONS.ALLOCATIONS, undefined, 1000);
  let allocations = allDocs.map(d => d.doc);
  
  if (filter?.resourceId) allocations = allocations.filter(a => a.resourceId === filter.resourceId);
  if (filter?.projectId) allocations = allocations.filter(a => a.projectId === filter.projectId);
  if (filter?.weekNumber) allocations = allocations.filter(a => a.weekNumber === filter.weekNumber);
  if (filter?.year) allocations = allocations.filter(a => a.year === filter.year);
  
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
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  submittedAt?: number;
  reviewedAt?: number;
  createdAt: number;
}

export async function getApprovals(filter?: { status?: string; userId?: string }) {
  const allDocs = await luma.findDocs<ApprovalDoc>(COLLECTIONS.APPROVALS, undefined, 1000);
  let approvals = allDocs.map(d => d.doc);
  
  if (filter?.status) approvals = approvals.filter(a => a.status === filter.status);
  if (filter?.userId) approvals = approvals.filter(a => a.userId === filter.userId);
  
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

export async function getTimeEntries(filter?: { userId?: string; projectId?: string; weekNumber?: number; year?: number }) {
  const allDocs = await luma.findDocs<TimeEntryDoc>(COLLECTIONS.TIME_ENTRIES, undefined, 1000);
  let entries = allDocs.map(d => d.doc);
  
  if (filter?.userId) entries = entries.filter(e => e.userId === filter.userId);
  if (filter?.projectId) entries = entries.filter(e => e.projectId === filter.projectId);
  if (filter?.weekNumber) entries = entries.filter(e => e.weekNumber === filter.weekNumber);
  if (filter?.year) entries = entries.filter(e => e.year === filter.year);
  
  return entries.sort((a, b) => b.createdAt - a.createdAt);
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
  const allTasks = await luma.findDocs<TaskDoc>(COLLECTIONS.TASKS, undefined, 1000);
  const phaseTasks = allTasks.filter(d => d.doc.projectId === projectId && d.doc.phaseId === phaseId);
  
  let totalHours = 0;
  let totalCost = 0;
  
  for (const taskDoc of phaseTasks) {
    const task = taskDoc.doc;
    const timeEntries = await getTaskTimeEntries({ taskId: task.id });
    
    for (const entry of timeEntries) {
      totalHours += entry.hours;
      const resources = await getResources();
      const resource = resources.find(r => r.userId === entry.userId);
      if (resource) {
        totalCost += entry.hours * resource.hourlyRate;
      }
    }
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
  const docs = await luma.findDocs<NotificationDoc>(COLLECTIONS.NOTIFICATIONS, undefined, 1000);
  return docs
    .map(d => d.doc)
    .filter(n => n.userId === userId)
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