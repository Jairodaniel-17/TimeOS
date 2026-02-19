import {
  createUser,
  createProject,
  createTask,
  createResource,
  createAllocation,
  createTaskTimeEntry,
  createTimeEntry,
  createApproval,
  getUsers,
  updateUser,
  getProjects,
  updateProject,
  getResources,
  updateResource,
  getApprovals,
} from './luma-docs';

const SEED_DATA = {
  users: [
    { id: 'user_1', name: 'Ana García', email: 'ana.garcia@timeos.com', role: 'admin', password: 'admin123', isActive: true },
    { id: 'user_2', name: 'Carlos López', email: 'carlos.lopez@timeos.com', role: 'member', password: 'carlos123', isActive: true },
    { id: 'user_3', name: 'María Rodríguez', email: 'maria.rodriguez@timeos.com', role: 'member', password: 'maria123', isActive: true },
    { id: 'user_4', name: 'Pedro Sánchez', email: 'pedro.sanchez@timeos.com', role: 'member', password: 'pedro123', isActive: true },
    { id: 'user_5', name: 'Laura Martínez', email: 'laura.martinez@timeos.com', role: 'member', password: 'laura123', isActive: true },
  ],
  approvals: [
    { id: 'apr_1', userId: 'user_2', weekNumber: 8, year: 2026, totalHours: 42, status: 'pending' as const, submittedAt: Date.now() - 86400000 },
    { id: 'apr_2', userId: 'user_3', weekNumber: 8, year: 2026, totalHours: 38, status: 'pending' as const, submittedAt: Date.now() - 86400000 },
    { id: 'apr_3', userId: 'user_4', weekNumber: 8, year: 2026, totalHours: 35, status: 'pending' as const, submittedAt: Date.now() - 86400000 },
  ],
  projects: [
    { id: 'proj_1', name: 'Portal Clientes', code: 'PORT-001', client: 'Acme Corp', billable: true, status: 'active', budget: 50000, budgetHours: 520, hourlyRate: 120, currency: 'USD' },
    { id: 'proj_2', name: 'App Móvil', code: 'MOB-002', client: 'TechStart', billable: true, status: 'active', budget: 35000, budgetHours: 360, hourlyRate: 110, currency: 'USD' },
    { id: 'proj_3', name: 'Integración NetSuite', code: 'INT-003', client: undefined, billable: false, status: 'active', budget: 20000, budgetHours: 200, currency: 'USD' },
    { id: 'proj_4', name: 'Dashboard Analytics', code: 'DASH-004', client: 'DataCorp', billable: true, status: 'active', budget: 25000, budgetHours: 240, hourlyRate: 115, currency: 'USD' },
    { id: 'proj_5', name: 'Migración Cloud', code: 'MIG-005', client: undefined, billable: false, status: 'active', budget: 15000, budgetHours: 160, currency: 'USD' },
  ],
  resources: [
    { id: 'res_1', userId: 'user_2', capacity: 40, skills: ['React', 'TypeScript', 'Node.js'], hourlyRate: 45, monthlySalary: 7200, currency: 'USD' },
    { id: 'res_2', userId: 'user_3', capacity: 40, skills: ['Figma', 'UI/UX', 'Design Systems'], hourlyRate: 42, monthlySalary: 6720, currency: 'USD' },
    { id: 'res_3', userId: 'user_4', capacity: 40, skills: ['Python', 'SQL', 'Backend'], hourlyRate: 50, monthlySalary: 8000, currency: 'USD' },
    { id: 'res_4', userId: 'user_5', capacity: 40, skills: ['Testing', 'QA', 'Automation'], hourlyRate: 38, monthlySalary: 6080, currency: 'USD' },
  ],
  allocations: [
    { id: 'alloc_1', resourceId: 'res_1', projectId: 'proj_1', weekNumber: 8, year: 2026, allocatedHours: 32 },
    { id: 'alloc_2', resourceId: 'res_1', projectId: 'proj_2', weekNumber: 8, year: 2026, allocatedHours: 8 },
    { id: 'alloc_3', resourceId: 'res_2', projectId: 'proj_2', weekNumber: 8, year: 2026, allocatedHours: 40 },
    { id: 'alloc_4', resourceId: 'res_3', projectId: 'proj_1', weekNumber: 8, year: 2026, allocatedHours: 20 },
    { id: 'alloc_5', resourceId: 'res_3', projectId: 'proj_4', weekNumber: 8, year: 2026, allocatedHours: 20 },
    { id: 'alloc_6', resourceId: 'res_4', projectId: 'proj_1', weekNumber: 8, year: 2026, allocatedHours: 16 },
  ],
  tasks: [
    // Portal Clientes - Epic 1
    { id: 'task_epic_1', projectId: 'proj_1', parentId: undefined, name: 'Fase 1: Análisis y Diseño', description: 'Epic: Fase inicial del proyecto', assigneeId: undefined, startDate: '2025-02-17', endDate: '2025-03-07', estimatedHours: 120, actualHours: 110, progress: 100, priority: 'high' as const, status: 'done' as const, dependencies: [] },
    { id: 'task_1', projectId: 'proj_1', parentId: 'task_epic_1', name: 'Análisis de requerimientos', description: 'Documentar todos los requerimientos del cliente', assigneeId: 'user_2', startDate: '2025-02-17', endDate: '2025-02-21', estimatedHours: 40, actualHours: 38, progress: 100, priority: 'high' as const, status: 'done' as const, dependencies: [] },
    { id: 'task_2', projectId: 'proj_1', parentId: 'task_epic_1', name: 'Diseño de UI/UX', description: 'Crear mockups y prototipos', assigneeId: 'user_3', startDate: '2025-02-24', endDate: '2025-03-07', estimatedHours: 80, actualHours: 72, progress: 100, priority: 'high' as const, status: 'done' as const, dependencies: ['task_1'] },
    
    // Portal Clientes - Epic 2
    { id: 'task_epic_2', projectId: 'proj_1', parentId: undefined, name: 'Fase 2: Desarrollo', description: 'Epic: Desarrollo del sistema', assigneeId: undefined, startDate: '2025-03-03', endDate: '2025-04-11', estimatedHours: 320, actualHours: 133, progress: 42, priority: 'high' as const, status: 'in_progress' as const, dependencies: ['task_epic_1'] },
    { id: 'task_3', projectId: 'proj_1', parentId: 'task_epic_2', name: 'Desarrollo Frontend', description: 'Implementación de interfaces', assigneeId: 'user_2', startDate: '2025-03-03', endDate: '2025-03-21', estimatedHours: 120, actualHours: 66, progress: 55, priority: 'high' as const, status: 'in_progress' as const, dependencies: ['task_2'] },
    { id: 'task_3_1', projectId: 'proj_1', parentId: 'task_3', name: 'Login y Autenticación', description: 'Pantalla de login y sistema de auth', assigneeId: 'user_2', startDate: '2025-03-03', endDate: '2025-03-07', estimatedHours: 24, actualHours: 26, progress: 100, priority: 'high' as const, status: 'done' as const, dependencies: [] },
    { id: 'task_3_2', projectId: 'proj_1', parentId: 'task_3', name: 'Dashboard Principal', description: 'Pantalla principal del sistema', assigneeId: 'user_2', startDate: '2025-03-10', endDate: '2025-03-14', estimatedHours: 32, actualHours: 28, progress: 88, priority: 'medium' as const, status: 'in_progress' as const, dependencies: ['task_3_1'] },
    { id: 'task_3_3', projectId: 'proj_1', parentId: 'task_3', name: 'Módulo de Reportes', description: 'Generación de reportes', assigneeId: 'user_2', startDate: '2025-03-17', endDate: '2025-03-21', estimatedHours: 40, actualHours: 12, progress: 30, priority: 'medium' as const, status: 'todo' as const, dependencies: ['task_3_2'] },
    { id: 'task_4', projectId: 'proj_1', parentId: 'task_epic_2', name: 'Desarrollo Backend', description: 'APIs y lógica de negocio', assigneeId: 'user_4', startDate: '2025-03-03', endDate: '2025-03-28', estimatedHours: 160, actualHours: 33, progress: 21, priority: 'high' as const, status: 'in_progress' as const, dependencies: ['task_2'] },
    { id: 'task_4_1', projectId: 'proj_1', parentId: 'task_4', name: 'API Authentication', description: 'Endpoints de autenticación', assigneeId: 'user_4', startDate: '2025-03-03', endDate: '2025-03-07', estimatedHours: 16, actualHours: 18, progress: 100, priority: 'high' as const, status: 'done' as const, dependencies: [] },
    { id: 'task_4_2', projectId: 'proj_1', parentId: 'task_4', name: 'API Clientes', description: 'CRUD de clientes', assigneeId: 'user_4', startDate: '2025-03-10', endDate: '2025-03-14', estimatedHours: 24, actualHours: 15, progress: 63, priority: 'high' as const, status: 'in_progress' as const, dependencies: ['task_4_1'] },
    
    // Portal Clientes - Epic 3
    { id: 'task_epic_3', projectId: 'proj_1', parentId: undefined, name: 'Fase 3: Testing', description: 'Epic: QA y pruebas', assigneeId: undefined, startDate: '2025-03-24', endDate: '2025-04-11', estimatedHours: 80, actualHours: 0, progress: 0, priority: 'medium' as const, status: 'todo' as const, dependencies: ['task_epic_2'] },
    { id: 'task_5', projectId: 'proj_1', parentId: 'task_epic_3', name: 'Testing QA Manual', description: 'Pruebas funcionales manuales', assigneeId: 'user_5', startDate: '2025-03-24', endDate: '2025-04-04', estimatedHours: 60, actualHours: 0, progress: 0, priority: 'medium' as const, status: 'todo' as const, dependencies: ['task_3', 'task_4'] },
    
    // App Móvil
    { id: 'task_m_1', projectId: 'proj_2', parentId: undefined, name: 'Research y Discovery', description: 'Fase de investigación', assigneeId: 'user_3', startDate: '2025-02-17', endDate: '2025-02-28', estimatedHours: 60, actualHours: 54, progress: 90, priority: 'high' as const, status: 'in_progress' as const, dependencies: [] },
    { id: 'task_m_2', projectId: 'proj_2', parentId: undefined, name: 'Wireframes', description: 'Esbozos de pantallas', assigneeId: 'user_3', startDate: '2025-03-03', endDate: '2025-03-14', estimatedHours: 40, actualHours: 0, progress: 0, priority: 'medium' as const, status: 'todo' as const, dependencies: ['task_m_1'] },
  ],
  taskTimeEntries: [
    // Carlos - Análisis
    { id: 'tte_1', taskId: 'task_1', userId: 'user_2', projectId: 'proj_1', hours: 8, date: '2025-02-17', description: 'Reunión con cliente', weekNumber: 8, year: 2026, billable: true },
    { id: 'tte_2', taskId: 'task_1', userId: 'user_2', projectId: 'proj_1', hours: 8, date: '2025-02-18', description: 'Documentación de reqs', weekNumber: 8, year: 2026, billable: true },
    { id: 'tte_3', taskId: 'task_1', userId: 'user_2', projectId: 'proj_1', hours: 8, date: '2025-02-19', description: 'Análisis técnico', weekNumber: 8, year: 2026, billable: true },
    { id: 'tte_4', taskId: 'task_1', userId: 'user_2', projectId: 'proj_1', hours: 6, date: '2025-02-20', description: 'Documentación final', weekNumber: 8, year: 2026, billable: true },
    { id: 'tte_5', taskId: 'task_1', userId: 'user_2', projectId: 'proj_1', hours: 8, date: '2025-02-21', description: 'Review con equipo', weekNumber: 8, year: 2026, billable: true },
    
    // María - Diseño
    { id: 'tte_6', taskId: 'task_2', userId: 'user_3', projectId: 'proj_1', hours: 8, date: '2025-02-24', description: 'Sketching inicial', weekNumber: 9, year: 2026, billable: true },
    { id: 'tte_7', taskId: 'task_2', userId: 'user_3', projectId: 'proj_1', hours: 8, date: '2025-02-25', description: 'Wireframes baja fidelidad', weekNumber: 9, year: 2026, billable: true },
    { id: 'tte_8', taskId: 'task_2', userId: 'user_3', projectId: 'proj_1', hours: 8, date: '2025-02-26', description: 'Wireframes alta fidelidad', weekNumber: 9, year: 2026, billable: true },
    { id: 'tte_9', taskId: 'task_2', userId: 'user_3', projectId: 'proj_1', hours: 8, date: '2025-02-27', description: 'Diseño UI', weekNumber: 9, year: 2026, billable: true },
    { id: 'tte_10', taskId: 'task_2', userId: 'user_3', projectId: 'proj_1', hours: 8, date: '2025-02-28', description: 'Prototipo Figma', weekNumber: 9, year: 2026, billable: true },
    { id: 'tte_11', taskId: 'task_2', userId: 'user_3', projectId: 'proj_1', hours: 8, date: '2025-03-03', description: 'Ajustes finales', weekNumber: 10, year: 2026, billable: true },
    { id: 'tte_12', taskId: 'task_2', userId: 'user_3', projectId: 'proj_1', hours: 8, date: '2025-03-04', description: 'Handoff a dev', weekNumber: 10, year: 2026, billable: true },
    { id: 'tte_13', taskId: 'task_2', userId: 'user_3', projectId: 'proj_1', hours: 8, date: '2025-03-05', description: 'Revisión con stakeholders', weekNumber: 10, year: 2026, billable: true },
    
    // Carlos - Frontend
    { id: 'tte_14', taskId: 'task_3_1', userId: 'user_2', projectId: 'proj_1', hours: 8, date: '2025-03-03', description: 'Setup proyecto', weekNumber: 10, year: 2026, billable: true },
    { id: 'tte_15', taskId: 'task_3_1', userId: 'user_2', projectId: 'proj_1', hours: 9, date: '2025-03-04', description: 'Componente Login', weekNumber: 10, year: 2026, billable: true },
    { id: 'tte_16', taskId: 'task_3_1', userId: 'user_2', projectId: 'proj_1', hours: 9, date: '2025-03-05', description: 'Integración auth', weekNumber: 10, year: 2026, billable: true },
    { id: 'tte_17', taskId: 'task_3_2', userId: 'user_2', projectId: 'proj_1', hours: 8, date: '2025-03-10', description: 'Layout dashboard', weekNumber: 11, year: 2026, billable: true },
    { id: 'tte_18', taskId: 'task_3_2', userId: 'user_2', projectId: 'proj_1', hours: 8, date: '2025-03-11', description: 'Widgets dashboard', weekNumber: 11, year: 2026, billable: true },
    { id: 'tte_19', taskId: 'task_3_2', userId: 'user_2', projectId: 'proj_1', hours: 8, date: '2025-03-12', description: 'Charts y gráficas', weekNumber: 11, year: 2026, billable: true },
    { id: 'tte_20', taskId: 'task_3_2', userId: 'user_2', projectId: 'proj_1', hours: 4, date: '2025-03-13', description: 'Responsive', weekNumber: 11, year: 2026, billable: true },
    
    // Pedro - Backend
    { id: 'tte_21', taskId: 'task_4_1', userId: 'user_4', projectId: 'proj_1', hours: 8, date: '2025-03-03', description: 'Setup API', weekNumber: 10, year: 2026, billable: true },
    { id: 'tte_22', taskId: 'task_4_1', userId: 'user_4', projectId: 'proj_1', hours: 10, date: '2025-03-04', description: 'JWT implementation', weekNumber: 10, year: 2026, billable: true },
    { id: 'tte_23', taskId: 'task_4_2', userId: 'user_4', projectId: 'proj_1', hours: 8, date: '2025-03-10', description: 'Modelo clientes', weekNumber: 11, year: 2026, billable: true },
    { id: 'tte_24', taskId: 'task_4_2', userId: 'user_4', projectId: 'proj_1', hours: 7, date: '2025-03-11', description: 'Endpoints clientes', weekNumber: 11, year: 2026, billable: true },
  ],
};

export async function seedDocumentStore() {
  console.log('Seeding Document Store...');
  
  // Get existing users
  const existingUsers = await getUsers();
  const existingUserIds = new Set(existingUsers.map(u => u.id));
  
  // Create or update users
  for (const user of SEED_DATA.users) {
    try {
      if (existingUserIds.has(user.id)) {
        // Update existing user with password and isActive
        await updateUser(user.id, { 
          password: user.password, 
          isActive: user.isActive 
        });
        console.log('Updated user:', user.email);
      } else {
        await createUser(user);
        console.log('Created user:', user.email);
      }
    } catch (error) {
      console.error('Error with user:', user.id, error);
    }
  }
  
  // Create or update projects
  const existingProjects = await getProjects();
  const existingProjectIds = new Set(existingProjects.map(p => p.id));
  
  for (const project of SEED_DATA.projects) {
    try {
      if (existingProjectIds.has(project.id)) {
        await updateProject(project.id, {
          budget: project.budget,
          budgetHours: project.budgetHours,
          hourlyRate: project.hourlyRate,
          currency: project.currency,
        });
        console.log('Updated project:', project.name);
      } else {
        await createProject(project);
        console.log('Created project:', project.name);
      }
    } catch (error) {
      console.error('Error with project:', project.id, error);
    }
  }
  
  // Create or update resources
  const existingResources = await getResources();
  const existingResourceIds = new Set(existingResources.map(r => r.id));
  
  for (const resource of SEED_DATA.resources) {
    try {
      if (existingResourceIds.has(resource.id)) {
        await updateResource(resource.id, {
          hourlyRate: resource.hourlyRate,
          monthlySalary: resource.monthlySalary,
          currency: resource.currency,
        });
        console.log('Updated resource:', resource.id);
      } else {
        await createResource(resource);
        console.log('Created resource:', resource.id);
      }
    } catch (error) {
      console.error('Error with resource:', resource.id, error);
    }
  }
  
  // Create allocations
  for (const allocation of SEED_DATA.allocations) {
    try {
      await createAllocation(allocation);
    } catch (error) {
      console.log('Allocation may already exist:', allocation.id);
    }
  }
  
  // Create tasks
  for (const task of SEED_DATA.tasks) {
    try {
      await createTask(task);
    } catch (error) {
      console.log('Task may already exist:', task.id);
    }
  }
  
  // Create task time entries
  for (const entry of SEED_DATA.taskTimeEntries) {
    try {
      await createTaskTimeEntry(entry);
    } catch (error) {
      console.log('Time entry may already exist:', entry.id);
    }
  }
  
  // Create approvals
  const existingApprovals = await getApprovals();
  const existingApprovalIds = new Set(existingApprovals.map(a => a.id));
  
  for (const approval of SEED_DATA.approvals) {
    try {
      if (!existingApprovalIds.has(approval.id)) {
        await createApproval(approval);
        console.log('Created approval:', approval.id);
      }
    } catch (error) {
      console.log('Approval may already exist:', approval.id);
    }
  }
  
  console.log('Document Store seeded successfully');
}