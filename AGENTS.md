# TimeOS - Guía de Desarrollo y Issues conocidos

## Comandos del Proyecto

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run lint     # ESLint
npx tsc --noEmit # Type checking
```

## Arquitectura

- **Framework**: Next.js 16 (App Router)
- **Base de datos**: Luma API (http://0.0.0.0:1234)
- **UI**: Tailwind CSS + Componentes custom
- **Tipos**: TypeScript en `src/types/index.ts`

---

## Bugs y Errores Críticos

### 1. Error de Pureza en React (CRÍTICO)
- **Archivo**: `src/app/(main)/resources/page.tsx:28`
- **Problema**: `Math.random()` llamado durante el render
- **Solución**: Usar `useMemo` con datos iniciales o mover a `useEffect`

### 2. Semana/Año Hardcodeados
- **Archivos**:
  - `src/app/(main)/timesheet/page.tsx:20-21`
  - `src/app/(main)/page.tsx:56`
- **Problema**: `weekNumber = 8` y `year = 2025` fijos
- **Solución**: Calcular dinámicamente o permitir selección

### 3. Usuario Hardcodeado
- **Archivos**:
  - `src/app/(main)/timesheet/page.tsx:63,124`
  - `src/app/(main)/approvals/page.tsx:59,75`
- **Problema**: `userId: '1'` y `approverId: '1'` fijos
- **Solución**: Implementar sistema de autenticación

---

## Funcionalidad Faltante vs Smartsheet

### Autenticación y Usuarios
- [ ] Sistema de login/logout
- [ ] Gestión de sesiones
- [ ] Permisos por rol (admin/manager/member)
- [ ] Cambio de usuario actual

### Timesheet
- [ ] Selector de semana/año dinámico
- [ ] Validación de horas configurables
- [ ] Copiar/duplicar semanas
- [ ] Importar desde Excel
- [ ] Fórmulas en celdas

### Planificación (Gantt)
- [ ] Drag & drop de tareas
- [ ] Crear/editar/eliminar tareas
- [ ] Gestión de dependencias
- [ ] Zoom dinámico (día/semana/mes)
- [ ] Exportar Gantt

### Recursos
- [ ] Cálculo real de capacidad
- [ ] Asignaciones dinámicas
- [ ] API `/api/resources`
- [ ] Alertas de overbooking

### Reportes
- [ ] Pivot builder funcional
- [ ] Drag & drop de campos
- [ ] Filtros dinámicos
- [ ] Exportar a Excel/PDF

### Documentos
- [ ] API `/api/documents`
- [ ] Upload real de archivos
- [ ] Almacenamiento (S3/local)
- [ ] Versionado

### Procesos/Jobs
- [ ] API `/api/processes`
- [ ] Ejecución real de jobs
- [ ] Cola de tareas
- [ ] Reintentos automáticos

### Integraciones
- [ ] NetSuite (mencionado en settings pero no implementado)
- [ ] Webhooks
- [ ] API pública

---

## Datos Mock vs Reales

| Página | Estado | Datos |
|--------|--------|-------|
| Dashboard | Parcial | KPIs calculados, gráficos hardcodeados |
| Timesheet | Funcional | Usa API real |
| Approvals | Parcial | Lista real, detalle hardcodeado |
| Planning | Mock | Tareas hardcodeadas |
| Resources | Mock | Recursos hardcodeados + `Math.random` |
| Reports | Vacío | Placeholder sin funcionalidad |
| Documents | Mock | Documentos hardcodeados |
| Processes | Mock | Jobs hardcodeados |
| Settings | Mock | No guarda cambios |

---

## Incongruencias

### Dashboard (`src/app/(main)/page.tsx`)
- Línea 127-137: Tendencias falsas (`+12%`, `-3`)
- Línea 42: `usersWithoutEntries` siempre es `0`
- Línea 237-299: Gráficos con datos estáticos
- Línea 79-80: Cálculo de semana puede ser incorrecto

### Sidebar (`src/components/layout/Sidebar.tsx`)
- Línea 20: Badge de aprobaciones hardcodeado (`badge: 3`)

### Approvals (`src/app/(main)/approvals/page.tsx`)
- Línea 211-225: Tabla de detalle hardcodeada, ignora `selectedItem.entries`

---

## APIs Existentes vs Faltantes

### Existentes
- `GET/POST /api/users`
- `GET/POST /api/projects`
- `GET/POST/PUT/DELETE /api/timesheets`
- `GET/POST/PUT /api/approvals`
- `POST /api/init`

### Faltantes
- `/api/resources` - Gestión de recursos
- `/api/allocations` - Asignaciones de recursos
- `/api/tasks` - Tareas del Gantt
- `/api/documents` - Gestión de documentos
- `/api/jobs` o `/api/processes` - Jobs en cola
- `/api/reports` - Generación de reportes
- `/api/settings` - Configuración del sistema
- `/api/auth/*` - Autenticación

---

## Warnings de Lint a Corregir

1. `src/app/(main)/approvals/page.tsx:5` - `Badge` sin usar
2. `src/app/(main)/approvals/page.tsx:50` - Dependencia `selectedItem` faltante en useEffect
3. `src/app/(main)/documents/page.tsx:5` - `FileText` sin usar
4. `src/app/(main)/planning/page.tsx:4` - `Card` sin usar
5. `src/app/(main)/processes/page.tsx:3` - `useEffect` sin usar
6. `src/app/(main)/processes/page.tsx:6` - `Copy` sin usar
7. `src/app/(main)/timesheet/page.tsx:5` - `Card` sin usar
8. `src/app/(main)/timesheet/page.tsx:227` - `rowIndex` sin usar

---

## Tipos Definidos (`src/types/index.ts`)

Tipos disponibles pero **no utilizados**:
- `Resource`
- `ResourceAllocation`
- `Task`
- `Job`
- `Document`
- `AuditLog`

---

## Prioridad de Desarrollo Sugerida

### Alta (Core)
1. Sistema de autenticación
2. Selector de semana/año dinámico
3. Eliminar `Math.random` de render
4. API de recursos

### Media (Funcionalidad)
5. Gantt interactivo con drag & drop
6. Reportes con pivot builder
7. Gestión de documentos real
8. Cálculo real de capacidad

### Baja (Polish)
9. Integraciones externas
10. Notificaciones
11. Workflows configurables
12. API pública
