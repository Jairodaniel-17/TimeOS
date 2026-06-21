# TimeOS — Documento de traspaso (handoff)

> Generado: 2026-06-20 · Branch: `main` · Último commit: `6864f59 feat: multi-tenancy (orgs), auto-refresh, tests unitarios`

## 1. Qué es

Plataforma self-hostable de gestión de proyectos + tiempos/costos + OKRs + tablero ágil (Jira + PSA en uno). **Next.js 16** (App Router, React 19, TS), **Tailwind v4**. Sin base de datos local: toda la persistencia va a **Luma** (motor convergente en Rust, repo `rust-kiss-vdb`) vía API HTTP en `:1234`.

## 2. Estado actual (verificado hoy)

| Check | Resultado |
|-------|-----------|
| `git status` | limpio |
| `npx tsc --noEmit` | ✅ 0 errores |
| `npm test` (Vitest) | ✅ 5/5 (1 archivo) |
| e2e Playwright | 73 tests (requieren app + Luma corriendo) |

Sin TODO/FIXME reales pendientes en código.

## 3. Arrancar de cero

```bash
cp .env.example .env.local          # rellenar LUMA_API_URL, LUMA_API_KEY, JWT_SECRET
# Levantar Luma aparte:  luma serve  (escucha en :1234)
npm install
npm run dev                          # http://localhost:3000
# Inicializar + sembrar data de prueba:
curl -X POST http://localhost:3000/api/init
```

**Env requeridas:** `LUMA_API_URL`, `LUMA_API_KEY`, `JWT_SECRET` (≥32 chars, obligatorio en prod). Opcionales: `RESEND_API_KEY`, `EMAIL_FROM` (email real; si faltan, el link se loguea en dev).

**Credenciales de prueba:** `ana.garcia@timeos.com` / `admin123` (admin) · `carlos.lopez@timeos.com` / `carlos123` (member).

## 4. Comandos

```bash
npm run dev        # dev con hot reload
npm run build      # build prod
npm start          # server prod
npm run lint       # ESLint (debe dar 0)
npm test           # Vitest (tests unitarios en test/)
npx tsc --noEmit   # type check
npx playwright test # e2e (con app + Luma corriendo)
```

### Correr la suite e2e (73 tests, verde)

Los e2e necesitan **Luma + la app corriendo**, y dos detalles que descubrimos cuesta arriba:

1. **Usa el binario de Luma en `release`, no `debug`.** El debug es ~10–50× más lento; el dashboard hace ~10 lecturas por login y los tests se van a timeout.
   ```bash
   # en el repo de Luma (github.com/Jairodaniel-17/luma):
   cargo build --release
   ./target/release/luma serve          # escucha en :1234 (lee luma.toml, api_key="dev")
   ```
2. **Desactiva el rate-limit con `RATE_LIMIT_DISABLED=true`.** La suite hace un login fresco por test desde la misma IP; con el rate-limit activo (login: 10/5 min) se topa con HTTP 429 tras el 10º y el resto falla por timeout. La env está apagada por defecto (`src/lib/rate-limit.ts`); actívala SOLO para tests.

```bash
# 1) Luma release en :1234 (ver arriba)
# 2) app con rate-limit desactivado:
RATE_LIMIT_DISABLED=true npm start
curl -X POST http://localhost:3000/api/init     # init + seed (estampa orgId)
# 3) e2e:
npx playwright test                              # 73/73 en ~2 min
```

Resultado de referencia (validado): `tsc` 0 · `lint` 0 · `vitest` 11/11 · `playwright` **73/73**.
**Antes de cualquier PR:** `npx tsc --noEmit` + `npm run lint` + `npm test`.

## 5. Arquitectura — dónde está cada cosa

- **Data layer (Luma):** `src/lib/luma.ts` (`LumaClient`: SQL, doc store, KV, blobs estilo S3, retry idempotente + caché 30s). `src/lib/luma-docs.ts` (helpers por colección — **filtran server-side** con `buildFilter` + `findDocs`, no traer-todo-y-filtrar-en-JS). `src/lib/seed-docs.ts` (data de prueba; **escrituras SECUENCIALES a propósito** — la ráfaga concurrente corrompe el índice `find` de Luma).
- **Auth:** `src/lib/auth.ts` (firma/verifica JWT), `src/middleware.ts` (protege `/api/*` salvo `PUBLIC_API_ROUTES`), `src/contexts/AuthContext.tsx` (user + intercepta fetch global → 401 cierra sesión), `src/components/RouteGuard.tsx`. Sesión = JWT httpOnly cookie `timeos_session` (8h) + `timeos_user` en localStorage.
- **Permisos:** `src/hooks/usePermissions.ts` + `<PermissionGate>` / `<AnyPermissionGate>`. Roles: admin / manager / member.
- **Tipos:** `src/types/index.ts` (incluye `PROJECT_PHASES`: 10 fases fijas por proyecto).
- **Páginas:** `src/app/(main)/` (autenticadas) · públicas: `/login`, `/signup`, `/forgot-password`, `/reset-password`.
- **API:** `src/app/api/` (37 routes, envelope `{ data?, error?, success }`, llaman a Luma directo sin ORM).
- **UI:** componentes propios en `src/components/ui/` (sin librería externa), iconos Lucide, Gantt `gantt-task-react`, spreadsheet Luckysheet + HyperFormula. Tailwind v4 con tokens CSS Redwood, dark mode por `data-theme`.

## 6. Pendientes conocidos / riesgos

- **✅ Multi-tenancy completa (retrofit hecho):** todas las colecciones se scopean por `orgId`. El middleware reenvía `x-org-id` (verificado del JWT) y `luma-docs.ts` lo aplica en cada lectura/escritura vía `src/lib/org-context.ts` (`tenantFilter`/`scopedDoc`/`ownerOrg`). IDOR cerrado en accesos por id; listas fail-closed sin sesión. Rutas con Luma directo (`jobs`, `documents`, `spreadsheets`, `allocations`) scopeadas inline; `spreadsheets` usa el `userId` de la sesión. Test: `src/lib/__tests__/org-scope.test.ts`. **Acción requerida tras deploy:** correr `/api/reset` (admin) para estampar `orgId` en la data ya persistida; lo no re-sembrado no aparecerá bajo el scope. Globales a propósito: `organizations`/`password_resets`/`roles`.
- **Seed sensible a concurrencia:** mantener las escrituras del seed secuenciales.
- **Blobs:** adjuntos de aprobación viven en el blob store (bucket `approval-files`), el doc solo guarda `blobKey`. Descarga por `GET /api/approval-files/[id]`.

## 7. Convención de trabajo

Disciplina "ponytail": escribir solo lo que la tarea necesita; nunca recortar validación, errores, seguridad ni accesibilidad. Acciones async muestran spinner/disable (`loading={submitting}`).
