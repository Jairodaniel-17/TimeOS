# TimeOS - Workspace Operations Platform

Plataforma unificada de gestión del trabajo con Next.js y Luma.

## Requisitos

- Node.js 18+
- Luma API ejecutándose en `http://0.0.0.0:1234`

## Instalación

```bash
npm install
```

## Configuración

1. Copia el archivo de ejemplo de variables de entorno:
```bash
cp .env.example .env.local
```

2. Configura las variables según tu entorno:
```
LUMA_API_URL=http://0.0.0.0:1234
LUMA_API_KEY=dev
```

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Características

- **Dashboard**: Visión ejecutiva con KPIs y actividad reciente
- **Timesheet**: Registro de horas tipo hoja de cálculo
- **Aprobaciones**: Flujo de aprobación de timesheets
- **Planificación**: Gantt interactivo con dependencias
- **Recursos**: Heatmap de capacidad de recursos
- **Reportes**: Pivot builder con drag & drop
- **Documentos**: Gestión de documentos
- **Procesos**: Monitor de jobs en tiempo real
- **Configuración**: Ajustes del sistema

## API Endpoints

- `GET/POST /api/users` - Gestión de usuarios
- `GET/POST /api/projects` - Gestión de proyectos
- `GET/POST/PUT/DELETE /api/timesheets` - Gestión de entradas de tiempo
- `GET/POST/PUT /api/approvals` - Gestión de aprobaciones
- `GET/POST /api/init` - Inicialización de base de datos

## Arquitectura

```
src/
├── app/
│   ├── (main)/          # Páginas con layout principal
│   │   ├── page.tsx     # Dashboard
│   │   ├── timesheet/   # Timesheet
│   │   ├── approvals/   # Aprobaciones
│   │   └── ...
│   ├── api/             # API Routes
│   └── layout.tsx       # Root layout
├── components/
│   ├── ui/              # Componentes de UI
│   └── layout/          # Layout components
├── lib/
│   ├── luma.ts          # Cliente de Luma API
│   └── db.ts            # Inicialización de BD
└── types/               # Tipos TypeScript
```

## Tecnologías

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Lucide Icons
- Luma (Vector DB + SQL + State)
