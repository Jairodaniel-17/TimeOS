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
  const doc: UserDoc = {
    ...user,
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
  
  // Simple password comparison (in production use bcrypt)
  if (user.password && user.password !== password) return null;
  
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
  const allDocs = await luma.findDocs<TaskTimeEntryDoc>(COLLECTIONS.TASK_TIME_ENTRIES, undefined, 1000);
  const existing = allDocs.find(d => d.id === id)?.doc;
  if (!existing) return null;
  
  const doc: TaskTimeEntryDoc = { ...existing, ...updates };
  await luma.putDoc(COLLECTIONS.TASK_TIME_ENTRIES, id, doc);
  
  // Recalculate task actualHours
  const taskEntries = await getTaskTimeEntries({ taskId: existing.taskId });
  const totalHours = taskEntries.reduce((sum, e) => sum + e.hours, 0);
  await updateTask(existing.taskId, { actualHours: totalHours });
  
  return doc;
}

export async function deleteTaskTimeEntry(id: string) {
  const allDocs = await luma.findDocs<TaskTimeEntryDoc>(COLLECTIONS.TASK_TIME_ENTRIES, undefined, 1000);
  const entry = allDocs.find(d => d.id === id)?.doc;
  
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
  const allDocs = await luma.findDocs<ApprovalDoc>(COLLECTIONS.APPROVALS, undefined, 1000);
  const existing = allDocs.find(d => d.id === id)?.doc;
  if (!existing) return null;
  
  const doc = { ...existing, ...updates };
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
  const allDocs = await luma.findDocs<TimeEntryDoc>(COLLECTIONS.TIME_ENTRIES, undefined, 1000);
  const existing = allDocs.find(d => d.id === id)?.doc;
  if (!existing) return null;
  
  const doc = { ...existing, ...updates, updatedAt: Date.now() };
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