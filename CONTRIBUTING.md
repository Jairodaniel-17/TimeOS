# Contribuir a TimeOS

Gracias por tu interés en mejorar TimeOS. Esta guía describe cómo configurar el entorno de desarrollo y las convenciones que seguimos.

## Configuración del entorno de desarrollo

1. Haz un fork del repositorio y clónalo.
2. Asegúrate de tener **Node.js 18+** instalado.
3. Levanta un backend **Luma** local (`luma serve` en el puerto `1234`).
4. Copia las variables de entorno y complétalas:

   ```bash
   cp .env.example .env.local
   ```

5. Instala las dependencias y arranca el servidor de desarrollo:

   ```bash
   npm install
   npm run dev
   ```

6. Inicializa los datos semilla con `POST /api/init` (ver [README](./README.md)).

No hay servicios externos obligatorios más allá de Luma; el email (Resend) es opcional.

## Flujo de trabajo (ramas y PRs)

- Crea una rama descriptiva a partir de `main`:
  - `feat/<descripcion>` para nuevas funcionalidades
  - `fix/<descripcion>` para correcciones
  - `docs/<descripcion>` para documentación
  - `refactor/<descripcion>` para refactors sin cambio de comportamiento
- Haz commits pequeños y con mensajes claros (se recomienda [Conventional Commits](https://www.conventionalcommits.org/)).
- Abre un Pull Request hacia `main` describiendo el qué y el porqué del cambio. Vincula los issues relacionados.
- Mantén el PR enfocado: un cambio lógico por PR facilita la revisión.

## Antes de abrir un PR

Ejecuta y verifica que todo pase localmente:

```bash
npm run lint        # ESLint
npm run test        # Tests (Vitest)
npx tsc --noEmit    # Comprobación de tipos
```

No se admite un PR con errores de lint, tests fallando o errores de tipos.

## Estilo de código

- **TypeScript estricto**: respeta la configuración de `tsconfig.json`. No introduzcas errores de tipo.
- **Prohibido `any`**: usa tipos precisos o `unknown` con narrowing. Los modelos de dominio viven en `src/types/index.ts`.
- **Tailwind CSS**: usa las utilidades de Tailwind y los tokens de diseño (variables CSS de tema, p. ej. `--bg-base`, `--text-primary`) definidos en `src/app/globals.css`. Respeta el sistema de tokens (estilo Redwood) en lugar de colores hardcodeados.
- **Componentes UI**: reutiliza los componentes de `src/components/ui/` (Button, Card, Input, Badge, Tabs). No agregues librerías de UI nuevas sin discutirlo antes.
- **API**: los endpoints siguen el envelope de respuesta `{ data?, error?, success }`. Mantén la consistencia.
- **Permisos**: respeta el modelo de roles (admin/manager/member) y usa los hooks/utilidades existentes (`usePermissions`, `PermissionGate`).

## Reporte de seguridad

Si tu contribución está relacionada con una vulnerabilidad, **no abras un issue público**. Sigue el proceso descrito en [SECURITY.md](./SECURITY.md).

## Licencia

Al contribuir, aceptas que tu aportación se distribuya bajo la licencia [MIT](./LICENSE) del proyecto.
