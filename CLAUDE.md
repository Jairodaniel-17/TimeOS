# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Dev server
npm run build      # Production build
npm run lint       # ESLint
npx tsc --noEmit   # Type check without emitting
```

No test suite is configured. Validate changes by running the dev server and exercising the UI.

## Architecture

**TimeOS** is a Next.js 16 App Router project (TypeScript) that replaces Smartsheet. All authenticated pages live under `src/app/(main)/`. Public routes: `/login`.

### Data layer — Luma API

There is no local database. All persistence goes through Luma, a hosted API that exposes both SQL and a NoSQL document store:

- `src/lib/luma.ts` — `LumaClient` wrapping SQL (`query`/`exec`) and document store (`getCollection`, `insertDocument`, `updateDocument`, `deleteDocument`) plus a key-value state API.
- `src/lib/luma-docs.ts` — higher-level helpers for each collection (users, projects, tasks, timeEntries, resources, allocations, approvals, projectPhases, phaseApprovals, approvalFiles, clients, notifications).
- `src/lib/db.ts` — SQL schema + seed data; call `POST /api/init` to initialize and `POST /api/reset` to wipe and re-seed.

Approval file attachments are stored as base64 strings inside Luma documents (recommended max 5 MB per file).

### Auth

- Login: `POST /api/auth/login` validates credentials against the Luma users collection.
- Session is kept in **localStorage** (`timeos_user`), read by `AuthContext` (`src/contexts/AuthContext.tsx`).
- `RouteGuard` (`src/components/RouteGuard.tsx`) wraps the `(main)` layout and redirects unauthenticated visitors to `/login`.

Test credentials: `ana.garcia@timeos.com` / `admin123` (admin), `carlos.lopez@timeos.com` / `carlos123` (member).

### Permissions

`src/hooks/usePermissions.ts` returns `{ hasPermission, hasAnyPermission, hasAllPermissions, isAdmin, isManager, isMember }` derived from the role stored in AuthContext.

Roles and their access:
- **admin** — all permissions
- **manager** — projects, tasks, approvals, costs, resources, timesheets, phases:approve
- **member** — timesheets only (own entries)

Use `<PermissionGate permission="...">` or `<AnyPermissionGate permissions={[...]}>` for conditional UI rendering.

### API routes

All routes are under `src/app/api/`. They follow a consistent response envelope: `{ data?: T, error?: string, success: boolean }`.

Notable patterns:
- Dynamic project routes: `/api/projects/[id]`, `/api/projects/[id]/phases`, `/api/projects/[id]/phases/[phaseId]/approval`
- All API handlers call Luma directly — there is no ORM or intermediate service layer.

### Project phases

Every project has exactly 10 fixed phases (defined as `PROJECT_PHASES` in `src/types/index.ts`). Phase IDs in order: `activity`, `prototype_delivery`, `prototype_presentation`, `prototype_approval`, `development_testing`, `sb_delivery`, `client_testing`, `production_release`, `client_confirmation`, `closure`.

Phase approvals capture call evidence (date, time, contact, notes) plus file attachments stored in the `approval_files` collection.

### UI

- Tailwind CSS v4 with custom CSS variables for theming (`--bg-base`, `--text-primary`, etc.) defined in `src/app/globals.css`. Dark mode is toggled via `data-theme` on `<html>`.
- Custom components in `src/components/ui/` (Button, Card, Input, Badge, Tabs). No UI library (no shadcn, no MUI).
- Icons: Lucide React.
- Gantt: `gantt-task-react`. Spreadsheet: Luckysheet (loaded client-side only). Formula engine: HyperFormula.

### Key types

All domain models are in `src/types/index.ts`: `User`, `Project`, `Task`, `TimeEntry`, `Resource`, `Allocation`, `Approval`, `ProjectPhase`, `PhaseApproval`, `ApprovalFile`, `Client`, `Notification`.
