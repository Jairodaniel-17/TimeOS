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
│   │   ├── planning/     # Gantt
│   │   ├── tasks/       # Tareas
│   │   ├── timesheet/    # Registro de horas
│   │   ├── approvals/    # Aprobaciones
│   │   ├── reports/      # Reportes de horas
│   │   ├── costs/       # Dashboard de costos
│   │   ├── resources/    # Gestión de recursos
│   │   └── users/       # Gestión de usuarios
│   ├── api/             # Rutas API
│   └── login/           # Página de login
├── components/
│   ├── layout/          # Sidebar, Header, Layout
│   └── ui/              # Componentes UI
├── contexts/
│   ├── AuthContext.tsx  # Autenticación
│   └── SidebarContext.tsx # Estado del sidebar
├── hooks/
│   └── usePermissions.ts # Permisos por rol
├── lib/
│   ├── luma-docs.ts     # Cliente Luma (NoSQL)
│   └── seed-docs.ts     # Datos de ejemplo
└── types/
    └── index.ts         # Tipos TypeScript
```

---

## APIs Existentes

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/users` | GET, POST | Gestión de usuarios |
| `/api/projects` | GET, POST, PUT | Gestión de proyectos |
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

1. **Completar Fase 3**: Gantt avanzado con dependencias, cascade, ruta crítica
2. **Fase 4**: Integrar HyperFormula para hojas de cálculo
3. **Fase 5**: Tablas dinámicas con react-pivottable
4. **Fase 6**: Dashboards profesionales con Tremor
5. **Integración NetSuite**: Usar Records de NetSuite para almacenamiento

---

## Notas Importantes

- El sistema usa Luma API como Document Store NoSQL
- Los datos se persisten en NetSuite mediante Records
- El frontend está optimizado para React 18+ con Next.js 16
- Se requiere autenticación para todas las rutas excepto /login
