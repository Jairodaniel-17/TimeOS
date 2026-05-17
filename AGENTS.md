# TimeOS - Sistema de Gestión de Proyectos tipo Smartsheet

## Objetivo Principal
Reemplazar Smartsheet con una solución propia para evitar costos elevados de licencias. 
El sistema debe permitir:
- Registro de tiempos/hours por todos los empleados
- Gestión de proyectos con líneas base
- Fórmulas Excel
- Tablas dinámicas
- Dashboards tipo PowerBI
- Gantt tipo Microsoft Project
- Gestión de recursos humanos

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript
- **Base de datos**: Luma API (Document Store NoSQL) - Almacenamiento en NetSuite
- **UI**: Tailwind CSS + Componentes custom
- **Gantt**: gantt-task-react
- **Gráficos**: Recharts / Tremor (pendiente)
- **Fórmulas Excel**: HyperFormula (pendiente)
- **Tablas Dinámicas**: react-pivottable (pendiente)

## Comandos del Proyecto

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run lint     # ESLint
npx tsc --noEmit # Type checking
```

---

## CHECKPOINT: Sistema de Fases de Proyecto (04/03/2026)

### ✅ COMPLETADO

#### Backend (APIs y Datos)
- [x] **Nuevos tipos en `types/index.ts`**:
  - `ProjectPhase` - Fases del proyecto
  - `PhaseApproval` - Aprobaciones de fase
  - `ApprovalFile` - Archivos de evidencia (base64)
  - `Client` - Entidad de clientes
  - `Notification` - Sistema de notificaciones
  - `PROJECT_PHASES` - 10 fases fijas del proyecto

- [x] **Nuevas colecciones en `luma-docs.ts`**:
  - `project_phases` - Fases de cada proyecto
  - `phase_approvals` - Aprobaciones de fase
  - `approval_files` - Archivos de evidencia
  - `clients` - Clientes persistentes
  - `notifications` - Notificaciones del sistema

- [x] **Nuevas APIs**:
  - `GET/PUT/DELETE /api/projects/[id]` - Detalle, editar, eliminar proyecto
  - `GET /api/projects/[id]/phases` - Lista de fases con costos
  - `GET/POST /api/projects/[id]/phases/[phaseId]/approval` - Aprobación de fase
  - `GET/POST/DELETE /api/approval-files` - Gestión de archivos
  - `GET/POST /api/clients` - Clientes persistentes
  - `GET/PUT/POST /api/notifications` - Sistema de notificaciones

#### Frontend (Páginas y Componentes)
- [x] **Página de detalle de proyecto** (`/projects/[id]/page.tsx`):
  - Header con info del proyecto
  - KPIs de progreso, horas, costos
  - Timeline de 10 fases
  - Modal de edición de proyecto
  - Confirmación de eliminación

- [x] **Componente PhaseTimeline** (`/components/projects/PhaseTimeline.tsx`):
  - Timeline vertical de fases
  - Estado visual (pendiente/en progreso/completado)
  - Horas y costos por fase
  - Expansión para ver detalles
  - Botón de aprobación

- [x] **Componente PhaseApprovalModal** (`/components/projects/PhaseApprovalModal.tsx`):
  - Campos de evidencia de llamada (fecha, hora, persona, notas)
  - Notas generales
  - Upload de archivos (imágenes, PDFs)
  - Guardado en base64 en Luma

- [x] **Acciones en lista de proyectos** (`/projects/page.tsx`):
  - Ver detalles (navega a `/projects/[id]`)
  - Editar (modal inline)
  - Eliminar (con confirmación)
  - Establecer línea base

- [x] **Sistema de notificaciones**:
  - `NotificationBell` - Campana en header con contador
  - `Dropdown` - Lista de últimas notificaciones
  - Página `/notifications` - Bandeja completa
  - Tipos: phase_approved, phase_rejected, hours_reminder, deadline_warning, project_assigned

- [x] **Header actualizado**:
  - Campana de notificaciones
  - Menú de usuario
  - Logout

### 🔄 PENDIENTE

#### Prioridad Alta
- [ ] **Asignar tareas a fases**: Modificar tareas existentes para incluir `phaseId`
- [ ] **Seed data actualizado**: Agregar fases a proyectos de ejemplo
- [ ] **Cálculo automático de costos**: Integrar en registro de horas
- [ ] **Notificación de recordatorio de horas**: Verificar al login si el usuario no ha registrado horas hoy

#### Prioridad Media
- [ ] **Vista de tareas por fase**: En la página de detalle, mostrar tareas de cada fase
- [ ] **Exportar fase a PDF**: Generar reporte de fase aprobada
- [ ] **Historial de aprobaciones**: Ver quiénes aprobaron cada fase
- [ ] **Filtros en timeline**: Filtrar por estado de fase

#### Prioridad Baja
- [ ] **Notificaciones por email**: Enviar correo al aprobar fase
- [ ] **Comentarios en fases**: Sistema de comentarios por fase
- [ ] **Plantillas de fases**: Fases predefinidas por tipo de proyecto

---

## Las 10 Fases Fijas del Proyecto

| # | ID | Nombre |
|---|-----|--------|
| 1 | `activity` | Actividad |
| 2 | `prototype_delivery` | Elaboración y Entrega de Prototipos |
| 3 | `prototype_presentation` | Presentación de Prototipo |
| 4 | `prototype_approval` | Aprobación de prototipo |
| 5 | `development_testing` | Desarrollo y Pruebas |
| 6 | `sb_delivery` | Entrega en SB a cliente |
| 7 | `client_testing` | Pruebas del cliente, solución de obs y correcciones |
| 8 | `production_release` | Pase a producción |
| 9 | `client_confirmation` | Confirmación cliente |
| 10 | `closure` | Cierre |

---

## Plan de Fases de Desarrollo

### Fase 1: Fundamentos ✅ (COMPLETADO)
- [x] Sistema de autenticación (login/logout)
- [x] Timesheet y registro de horas
- [x] Permisos por rol (admin/manager/member)
- [x] Dashboard básico con KPIs
- [x] Gantt básico con gantt-task-react
- [x] API de proyectos, tareas, recursos

### Fase 2: Gestión de Proyectos ✅ (COMPLETADO)
- [x] Crear/editar proyectos con cliente, presupuesto, fecha inicio/fin
- [x] Línea base (baseline) del proyecto
- [x] Estado del proyecto: En Tiempo / Atrasado / Completado
- [x] Porcentaje de avance global del proyecto
- [x] Tabla de resumen: Proyecto | Inicio | Fin | Presupuesto | Avance | Estado
- [x] Alertas de proyectos cercanos a deadline

### Fase 3: Gantt Avanzado ✅ (COMPLETADO)
- [x] Panel de tareas estilo Excel/Grid
- [x] Diagrama de Gantt integrado con grid
- [x] Dependencias entre tareas (FS, SS, FF, SF) - campo en edición
- [x] Epics y subtareas (cascada) - expandable
- [x] Hitos (milestones)
- [x] Zoom: día / semana / mes
- [x] Asignación de recursos
- [ ] Exportar a PDF/PNG

### Fase 4: Hojas de Cálculo (Excel/Smartsheet) ✅ (COMPLETADO)
- [x] Integrar Luckysheet (Excel clone open source)
- [x] Mostrar proyectos en formato spreadsheet
- [x] Mostrar tareas en formato spreadsheet
- [x] Hoja de resumen con métricas
- [x] Navegación por hojas (Proyectos, Tareas, Resumen)
- [ ] Fórmulas avanzadas (SUM, AVERAGE, IF, VLOOKUP, etc.)
- [ ] Formatos condicionales
- [ ] Validación de datos

### Fase 5: Tablas Dinámicas
- [ ] Integrar pivot tables en Luckysheet
- [ ] Arrastrar campos para agrupar
- [ ] Múltiples métricas (suma, promedio, conteo)
- [ ] Filtros por proyecto, usuario, fecha

### Fase 6: Dashboards Avanzados
- [ ] Integrar Tremor para KPIs
- [ ] Gráficos interactivos
- [ ] Filtros globales
- [ ] Dashboards por proyecto
- [ ] Exportar a PDF

### Fase 7: Gestión de Recursos
- [ ] Capacidad por recurso (horas/semana)
- [ ] Asignación de tareas a recursos
- [ ] Vista de carga de trabajo (workload)
- [ ] Alertas de sobre-asignación
- [ ] Calendario de recursos

### Fase 8: Reporting y Exportación
- [ ] Reportes PDF automatizados
- [ ] Exportar a Excel
- [ ] Programación de reportes (envío por email)
- [ ] Dashboard ejecutivo

---

## Sistema de Roles y Permisos

### Roles Disponibles
- **admin**: Acceso completo a todas las funcionalidades
- **manager**: Gestión de proyectos, tareas, aprobaciones
- **member**: Solo puede registrar y ver sus propias horas

### Permisos por Rol

| Permiso | Admin | Manager | Member |
|---------|-------|---------|--------|
| projects:* | ✓ | ✓ | ✗ |
| tasks:* | ✓ | ✓ | ✗ |
| approvals:manage | ✓ | ✓ | ✗ |
| reports:costs | ✓ | ✓ | ✗ |
| resources:* | ✓ | ✓ | read only |
| timesheets:* | ✓ | ✓ | ✓ (propias) |
| users:* | ✓ | ✗ | ✗ |
| **phases:approve** | ✓ | ✓ | ✗ |

### Credenciales de Prueba
- Admin: `ana.garcia@timeos.com` / `admin123`
- Member: `carlos.lopez@timeos.com` / `carlos123`

---

## Librerías Recomendadas

### Gantt
- **gantt-task-react** (INSTALADA) - Componente React para Gantt con drag & drop
- Alternativas: SVAR React Gantt, Frappe Gantt

### Fórmulas Excel
- **HyperFormula** - Motor de cálculo JavaScript con 400+ funciones Excel
- **Formula.js** - Biblioteca de funciones Excel

### Tablas Dinámicas
- **react-pivottable** - Tablas dinámicas con drag & drop (basado en PivotTable.js)
- **ReactPivot** - Tabla dinámica estilo pivot

### Dashboards
- **Tremor** (PENDIENTE) - Componentes para dashboards, KPIs, gráficos
- **Recharts** - Gráficos React populares
- **Ant Design Charts** - Gráficos basados en G2Plot

### Grid/Excel
- **ReactGrid** - Componente de hoja de cálculo para React
- **Handsontable** - Grid comercial con fórmulas (costoso)

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── (main)/           # Rutas autenticadas
│   │   ├── page.tsx      # Dashboard
│   │   ├── projects/     # Gestión de proyectos
│   │   │   ├── page.tsx  # Lista de proyectos
│   │   │   └── [id]/     # Detalle de proyecto (NUEVO)
│   │   ├── planning/     # Gantt
│   │   ├── tasks/       # Tareas
│   │   ├── timesheet/    # Registro de horas
│   │   ├── approvals/    # Aprobaciones
│   │   ├── reports/      # Reportes de horas
│   │   ├── costs/       # Dashboard de costos
│   │   ├── resources/    # Gestión de recursos
│   │   ├── notifications/ # Bandeja de notificaciones (NUEVO)
│   │   └── users/       # Gestión de usuarios
│   ├── api/             # Rutas API
│   │   ├── projects/[id]/           # NUEVO
│   │   ├── projects/[id]/phases/    # NUEVO
│   │   ├── projects/[id]/phases/[phaseId]/approval/  # NUEVO
│   │   ├── approval-files/          # NUEVO
│   │   ├── notifications/           # NUEVO
│   │   └── ...
│   └── login/           # Página de login
├── components/
│   ├── layout/          # Sidebar, Header, Layout
│   ├── ui/              # Componentes UI
│   ├── projects/        # Componentes de proyectos (NUEVO)
│   │   ├── PhaseTimeline.tsx
│   │   └── PhaseApprovalModal.tsx
│   └── notifications/   # Componentes de notificaciones (NUEVO)
│       └── NotificationBell.tsx
├── contexts/
│   ├── AuthContext.tsx  # Autenticación
│   └── SidebarContext.tsx # Estado del sidebar
├── hooks/
│   └── usePermissions.ts # Permisos por rol
├── lib/
│   ├── luma-docs.ts     # Cliente Luma (NoSQL) - ACTUALIZADO
│   └── seed-docs.ts     # Datos de ejemplo
└── types/
    └── index.ts         # Tipos TypeScript - ACTUALIZADO
```

---

## APIs Existentes

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/users` | GET, POST | Gestión de usuarios |
| `/api/projects` | GET, POST, PUT | Gestión de proyectos |
| `/api/projects/[id]` | GET, PUT, DELETE | Detalle/Editar/Eliminar proyecto |
| `/api/projects/[id]/phases` | GET | Fases del proyecto con costos |
| `/api/projects/[id]/phases/[phaseId]/approval` | GET, POST | Aprobación de fase |
| `/api/approval-files` | GET, POST, DELETE | Archivos de evidencia |
| `/api/clients` | GET, POST | Gestión de clientes |
| `/api/notifications` | GET, PUT, POST | Sistema de notificaciones |
| `/api/tasks` | GET, POST, PUT | Gestión de tareas |
| `/api/timesheets` | GET, POST, PUT | Registro de horas |
| `/api/approvals` | GET, POST, PUT | Aprobaciones de timesheet |
| `/api/resources` | GET, POST | Gestión de recursos |
| `/api/task-time-entries` | GET, POST | Entradas de tiempo por tarea |
| `/api/allocations` | GET, POST | Asignaciones de recursos |
| `/api/reports/employee-hours` | GET | Reporte de horas por empleado |
| `/api/auth/login` | POST | Inicio de sesión |
| `/api/init` | POST | Inicializar base de datos |
| `/api/reset` | POST | Resetear base de datos |

---

## Funcionalidades Actuales

### Dashboard
- KPIs de horas registradas
- Aprobaciones pendientes
- Entradas recientes
- Gráfico de distribución por proyecto
- Gráfico de horas por día

### Proyectos
- Tabla de proyectos con estado, progreso, presupuesto
- Indicadores de estado de tiempo (En Tiempo/En Riesgo/Atrasado)
- Línea base (baseline)
- Alertas de proyectos cercanos a deadline (14 días)
- Modal para crear nuevos proyectos
- KPIs: Activos, Completados, En Riesgo, Cerca deadline
- **NUEVO**: Ver detalles (página de detalle)
- **NUEVO**: Editar proyecto (modal inline)
- **NUEVO**: Eliminar proyecto (con confirmación)

### Detalle de Proyecto (NUEVO)
- Header con info del proyecto (cliente, fechas, presupuesto, estado)
- KPIs: Fases completadas, Horas totales, Costo real, Progreso
- Timeline de 10 fases con estado
- Horas y costos por fase
- Modal de aprobación de fase con evidencia
- Modal de edición de proyecto
- Confirmación de eliminación

### Fases del Proyecto (NUEVO)
- 10 fases fijas por proyecto
- Estado: Pendiente / En Progreso / Completado
- Aprobación con evidencia:
  - Fecha y hora de aprobación
  - Evidencia de llamada (fecha, hora, persona, notas)
  - Notas generales
  - Archivos adjuntos (imágenes, PDFs en base64)
- Cálculo automático de horas y costos por fase

### Notificaciones (NUEVO)
- Campana en header con contador de no leídas
- Dropdown con últimas notificaciones
- Página de bandeja completa
- Tipos: fase aprobada, fase rechazada, recordatorio de horas, alerta de deadline, proyecto asignado
- Marcar como leída individual o todas

### Planificación (Gantt)
- Panel de tareas estilo Excel/Grid (Microsoft Project)
- Diagrama de Gantt integrado con grid
- Epics y subtareas en cascada (expandibles)
- Asignación de recursos
- Dependencias entre tareas
- Hitos (milestones)
- Vista: Día/Semana/Mes
- Drag & drop de tareas
- Cambio de progreso visual

### Tiempos (Timesheet)
- Registro de horas por día
- Envío para aprobación
- Selector de proyecto y actividad

### Aprobaciones
- Lista de aprobaciones pendientes
- Aprobar/Rechazar (solo admin/manager)
- Ver detalle de timesheet

### Reportes
- Reporte de horas por empleado estilo Power BI
- Sistema Kanban por estado de horas
- Filtro por semana/año
- Exportar a CSV

### Costos
- Dashboard de costos y rentabilidad
- Comparativa presupuesto vs costo real
- Costos por recurso

### Usuarios
- Lista de usuarios
- Crear nuevos usuarios
- Roles: admin/manager/member

---

## Próximos Pasos Inmediatos

1. **Asignar tareas a fases**: Modificar tareas existentes para incluir `phaseId`
2. **Seed data actualizado**: Agregar fases a proyectos de ejemplo
3. **Notificación de recordatorio**: Verificar al login si el usuario no ha registrado horas hoy
4. **Fase 5**: Tablas dinámicas con react-pivottable
5. **Fase 6**: Dashboards profesionales con Tremor

---

## Notas Importantes

- El sistema usa Luma API como Document Store NoSQL
- Los datos se persisten en NetSuite mediante Records
- El frontend está optimizado para React 18+ con Next.js 16
- Se requiere autenticación para todas las rutas excepto /login
- **Archivos de evidencia**: Se almacenan en base64 en Luma (máximo recomendado 5MB por archivo)
- **Permisos de aprobación**: Solo admin y manager pueden aprobar fases