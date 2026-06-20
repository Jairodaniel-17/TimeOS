# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Dev server (hot reload; ideal para iterar)
npm run build      # Production build
npm start          # Production server (más rápido que dev; sin hot reload)
npm run lint       # ESLint
npm test           # Vitest (tests unitarios)
npx tsc --noEmit   # Type check
```

Before any PR: `npx tsc --noEmit`, `npm run lint` (0 errores) y `npm test`. Hay además 73 tests e2e de Playwright (`npx playwright test`, requiere la app corriendo).

## Coding discipline (ponytail)

Escribe solo lo que la tarea necesita. Escalera antes de codear: ¿hace falta? → stdlib → feature nativa → dependencia ya instalada → una línea → el mínimo que funcione. **Nunca** recortar validación, manejo de errores, seguridad ni accesibilidad. Código pequeño porque es suficiente, no por golf.

## Architecture

**TimeOS** es un Next.js 16 App Router (TypeScript), open-source y self-hostable, que combina gestión de proyectos + tiempos/costos + OKRs + tablero ágil (Jira + PSA en uno). Páginas autenticadas bajo `src/app/(main)/`. Rutas públicas: `/login`, `/signup`, `/forgot-password`, `/reset-password`.

### Data layer — Luma

No hay base de datos local. Toda la persistencia va a **Luma** (motor convergente en Rust; repo abierto `rust-kiss-vdb`). Se autohospeda: compila `luma serve` (o usa el binario del release) escuchando en `:1234`. La app apunta por **IP** (`LUMA_API_URL=http://127.0.0.1:1234`) → sin dependencia de DNS.

- `src/lib/luma.ts` — `LumaClient`: SQL (`query`/`exec`), document store (`putDoc`/`getDoc`/`findDocs`/`deleteDoc`), state KV, **blobs** (`putBlob`/`getBlob`/`deleteBlob`, almacenamiento tipo S3). Incluye **retry idempotente** ante 5xx/red y caché en memoria (30s). Credenciales SOLO por env (`LUMA_API_URL`, `LUMA_API_KEY`); sin fallback hardcodeado.
- `src/lib/luma-docs.ts` — helpers por colección. **IMPORTANTE: filtran server-side** vía `buildFilter(...)` + `findDocs(col, filter, limit)` (no traer-todo-y-filtrar-en-JS). Colecciones: users, projects, tasks, time_entries, task_time_entries, resources, allocations, approvals, project_phases, phase_approvals, approval_files, clients, notifications, **objectives, key_results, initiatives, sprints, comments, activity, organizations, password_resets**.
- `src/lib/seed-docs.ts` — data de prueba anclada a la semana actual. `POST /api/init` (público) inicializa+siembra; `POST /api/reset` (admin) borra y resiembra. **Escrituras del seed son SECUENCIALES a propósito** — escrituras concurrentes en ráfaga corrompen el índice `find` de Luma.

Los **adjuntos** de aprobación ya NO son base64 en el documento: los bytes viven en el **blob store** (`bucket approval-files`, ver `APPROVAL_FILES_BUCKET`); el doc guarda `blobKey`. Descarga vía `GET /api/approval-files/[id]`.

### Auth

- `POST /api/auth/login` valida contra la colección users; emite un **JWT httpOnly cookie** (`timeos_session`, 8h, firmado con `JWT_SECRET`) y guarda el usuario en **localStorage** (`timeos_user`).
- `src/middleware.ts` verifica el JWT para proteger `/api/*` (salvo `PUBLIC_API_ROUTES`: login, register, forgot/reset-password, init); `/api/reset` y `/api/check-users` exigen rol admin.
- `src/lib/auth.ts` — firma/verifica JWT. **`JWT_SECRET` es obligatorio en producción** (lanza error si falta/<32 chars; fallback inseguro solo en dev).
- `AuthContext` (`src/contexts/AuthContext.tsx`): expone `user` (incl. `orgId`) e intercepta `fetch` global → ante 401 limpia sesión y redirige a `/login` (sincroniza la sesión cliente con la cookie expirada).
- `RouteGuard` (`src/components/RouteGuard.tsx`) protege el layout `(main)`.
- Self-serve: `/signup` (crea organización + admin), `/forgot-password` + `/reset-password` (vía `src/lib/email.ts`, que usa `RESEND_API_KEY` si está, o loguea el link en dev).
- Rate-limiting (`src/lib/rate-limit.ts`) en login/register/forgot.

Credenciales de prueba: `ana.garcia@timeos.com` / `admin123` (admin), `carlos.lopez@timeos.com` / `carlos123` (member).

### Multi-tenancy

Fundación: colección `organizations` + `orgId` en users (en el JWT y AuthContext); el signup crea una org; `/settings/organization` la gestiona. PENDIENTE: scopear TODAS las colecciones por `orgId` en cada query (retrofit no hecho).

### Permissions

`src/hooks/usePermissions.ts` → `{ hasPermission, hasAnyPermission, hasAllPermissions, isAdmin, isManager, isMember }` según el rol.
- **admin** — todo. **manager** — projects, tasks, approvals, costs, resources, timesheets, phases:approve, planning, okrs:manage. **member** — timesheets propios, lectura, okrs:read.

Usa `<PermissionGate permission="...">` / `<AnyPermissionGate permissions={[...]}>`.

### Módulos / páginas

Dashboard (con panel "Equipo" y auto-refresh 30s), Proyectos (+detalle con fases), Tareas, **Tablero** Kanban (drag&drop, tipos de issue, detalle de issue con comentarios + log de actividad), **Sprints** (reportes burndown/velocity), Timesheet (worklog "qué hice" + historial), Aprobaciones (multi-estado, ve el worklog), **OKRs** (árbol de alineación, KRs, check-ins, iniciativas), Recursos, Reportes, Costos, Clientes, Documentos, Notificaciones, Usuarios, Organización, Configuración, Hoja de cálculo.

### API routes

Bajo `src/app/api/`, envelope `{ data?, error?, success }`. Llaman a Luma directo (sin ORM). Incluye `/api/okrs`(+`/[id]`), `/api/key-results`, `/api/initiatives`, `/api/sprints`, `/api/comments`, `/api/activity`, `/api/organizations`, `/api/auth/{login,logout,register,forgot-password,reset-password}`, `/api/approval-files`(+`/[id]` descarga), `/api/tasks?board=true` (lista plana para el tablero).

### Project phases

Cada proyecto tiene 10 fases fijas (`PROJECT_PHASES` en `src/types/index.ts`): `activity`, `prototype_delivery`, `prototype_presentation`, `prototype_approval`, `development_testing`, `sb_delivery`, `client_testing`, `production_release`, `client_confirmation`, `closure`. Las aprobaciones capturan evidencia de llamada + adjuntos (blob store).

### UI

- Tailwind v4 con variables CSS (tokens Redwood: `--bg-base`, `--text-primary`, etc.) en `src/app/globals.css`; dark mode vía `data-theme` en `<html>` (con `suppressHydrationWarning`).
- Componentes propios en `src/components/ui/` (Button con prop `loading`, Card, Input, Textarea, Badge, Tabs). Sin librería de UI.
- Iconos Lucide. Gantt: `gantt-task-react` (impl propia en `GanttChart.tsx`; parsea fechas en local, no UTC). Spreadsheet: Luckysheet (client-only). Fórmulas: HyperFormula.
- Acciones async muestran spinner/disable (patrón `loading={submitting}`).

### Key types

En `src/types/index.ts`: `User`, `Project`, `Task` (+`type`/`sprintId`), `TimeEntry`, `Resource`, `Allocation`, `Approval`, `ProjectPhase`, `PhaseApproval`, `ApprovalFile`, `Client`, `Notification`, `Sprint`, `IssueType`, `Comment`, `Activity`, `Organization`, `Objective`, `KeyResult`, `Initiative`.

### Env vars

Ver `.env.example`. Requeridas: `LUMA_API_URL`, `LUMA_API_KEY`, `JWT_SECRET` (prod). Opcionales: `RESEND_API_KEY`, `EMAIL_FROM` (email real). `.env.local` está gitignored.
