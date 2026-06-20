# TimeOS

> Gestión de proyectos, tiempos, costos y OKRs — Jira + PSA en uno, self-hostable y open-source.

TimeOS es una plataforma de operaciones de trabajo construida con Next.js 16 (App Router) y TypeScript. Unifica la gestión de proyectos, el registro de horas, los costos, la planificación de recursos y los OKRs en una sola aplicación que puedes alojar en tu propia infraestructura. Toda la persistencia se realiza a través de [Luma](#stack), un backend self-hosted; no depende de ningún servicio SaaS propietario.

## Características

- **Proyectos y tareas** — Gestión de proyectos con fases, tareas y dependencias.
- **Planificación (Gantt)** — Diagrama de Gantt interactivo con dependencias.
- **Tablero Kanban y sprints** — Tablero de tareas y gestión de sprints.
- **Timesheets y aprobaciones** — Registro de horas tipo hoja de cálculo y flujo de aprobación.
- **OKRs** — Objetivos, resultados clave (key results) e iniciativas.
- **Recursos y costos** — Asignación de recursos, capacidad y seguimiento de costos.
- **Multi-organización** — Soporte para varias organizaciones.
- **Clientes, documentos y notificaciones** — Gestión de clientes, documentos adjuntos y notificaciones.
- **Reportes** — Constructor de reportes y vistas pivote.
- **Hoja de cálculo** — Editor de hoja de cálculo con motor de fórmulas.

> Los roles disponibles son **admin**, **manager** y **member**, cada uno con permisos diferenciados (ver [Seguridad](#seguridad)).

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (con variables CSS para theming claro/oscuro)
- **Luma** — backend self-hosted que expone SQL + almacén de documentos (no hay base de datos local ni ORM)
- **jose** (JWT) + **bcryptjs** para autenticación
- **Zod** para validación
- **Lucide React** (iconos), **gantt-task-react** (Gantt), **Luckysheet** + **HyperFormula** (hoja de cálculo), **Recharts** (gráficos)

## Quickstart de autohospedaje

Requisitos previos: **Node.js 18+** y un backend **Luma** en ejecución.

1. **Clona el repositorio**

   ```bash
   git clone <url-del-repo> timeos-app
   cd timeos-app
   ```

2. **Levanta Luma localmente**

   TimeOS necesita un backend Luma corriendo. Inicia el binario compilado de Luma escuchando en el puerto `1234`:

   ```bash
   luma serve
   ```

   Por defecto la app espera Luma en `http://127.0.0.1:1234`.

3. **Configura las variables de entorno**

   ```bash
   cp .env.example .env.local
   ```

   Edita `.env.local` y completa al menos `LUMA_API_KEY` y `JWT_SECRET`. Consulta los comentarios de `.env.example` para saber qué es requerido y qué es opcional.

4. **Instala las dependencias**

   ```bash
   npm install
   ```

5. **Compila y arranca** (producción) o usa el modo desarrollo:

   ```bash
   npm run build && npm start
   # o, para desarrollo:
   npm run dev
   ```

   La app queda disponible en [http://localhost:3000](http://localhost:3000).

6. **Inicializa los datos**

   Con la app en ejecución, crea el esquema y los datos semilla:

   ```bash
   curl -X POST http://localhost:3000/api/init
   ```

   > Para reiniciar y volver a sembrar los datos: `POST /api/reset`.

### Credenciales de prueba

Tras inicializar los datos semilla puedes acceder con:

| Rol    | Email                    | Contraseña |
| ------ | ------------------------ | ---------- |
| Admin  | `ana.garcia@timeos.com`  | `admin123` |
| Member | `carlos.lopez@timeos.com`| `carlos123`|

> Cambia o elimina estas credenciales antes de exponer la app en producción.

## Scripts

| Script          | Descripción                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Servidor de desarrollo               |
| `npm run build` | Compilación de producción            |
| `npm run start` | Sirve la compilación de producción   |
| `npm run lint`  | Linter (ESLint)                      |
| `npm run test`  | Tests (Vitest)                       |

Comprobación de tipos sin emitir: `npx tsc --noEmit`.

## Seguridad

Consulta [SECURITY.md](./SECURITY.md) para reportar vulnerabilidades y para la checklist de **hardening en producción** (JWT_SECRET fuerte, HTTPS, rotación de claves, etc.).

## Contribuir

¡Las contribuciones son bienvenidas! Lee [CONTRIBUTING.md](./CONTRIBUTING.md) para conocer el flujo de desarrollo, las convenciones de ramas/PR y el estilo de código.

## Licencia

Distribuido bajo licencia [MIT](./LICENSE).
