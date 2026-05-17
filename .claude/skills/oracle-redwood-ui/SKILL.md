---
name: oracle-redwood-ui
description: >
  Design and generate production-ready HTML/CSS interfaces using the Oracle Redwood design
  system. Use this skill whenever the user asks to build, design, prototype, or improve any UI
  that follows Oracle/NetSuite visual style — dashboards, data tables, forms, chat interfaces,
  filter toolbars, admin panels, or any component. Trigger for: "make it look like NetSuite",
  "Oracle Redwood style", "Redwood component", "build a Suitelet UI", "multiselect filter",
  or any request for a polished data-dense interface. Works with Svelte, Vue, React, plain HTML,
  or NetSuite Suitelets — framework-agnostic design tokens.
---

# Oracle Redwood UI — Skill

Sistema de diseño Oracle Redwood con Tailwind CSS.
Framework-agnostic: tokens idénticos en Svelte, Vue, React, HTML puro y NetSuite Suitelets.

---

## Paso 1 — Leer siempre

```
references/tokens.md
```

Contiene los design tokens, el bloque CDN play (`rw-*`) y el bloque `@theme` v4 (`redwood-*`).
Lee completo antes de generar cualquier componente.

---

## Paso 2 — Determinar modo de integración

| Contexto | Modo | Nombres de clase |
|---|---|---|
| HTML puro, Suitelet NetSuite | CDN play (`tailwind.config`) | `rw-*`, `badge-*`, `oracle-*` |
| Svelte + Vite, Vue + Vite, React + Vite | Build v4 (`@theme`) | `redwood-*`, `badge-subtle-*` |

**Regla rápida:** `package.json` con Vite → build. Archivo standalone → CDN play.

### CDN play setup
```html
<link rel="stylesheet" href="https://static.oracle.com/cdn/fnd/gallery/2507.0.0/OracleFont/OracleFont.min.css">
<script src="https://cdn.tailwindcss.com"></script>
<script>tailwind.config = { theme: { extend: { /* tokens de tokens.md */ } } }</script>
```

### Build v4 setup
```css
/* app.css */ @import "tailwindcss"; @theme { /* tokens de tokens.md */ }
```
```html
<!-- index.html --> <link rel="stylesheet" href="https://static.oracle.com/cdn/fnd/gallery/2507.0.0/OracleFont/OracleFont.min.css">
```

---

## Paso 3 — Leer según la tarea

Lee **solo** lo que aplica. No cargues archivos que no uses.

### Átomos (piezas pequeñas, reutilizadas por todos los componentes)

| Necesitas | Lee |
|---|---|
| Badges, code pill, status dot | `references/atoms/badge.md` |
| Botones (todas las variantes) | `references/atoms/button.md` |
| Input, select nativo, textarea, labels | `references/atoms/form.md` |
| Alert, toast, empty state, progress bar | `references/atoms/feedback.md` |

### Componentes (combinan átomos)

| Necesitas | Lee |
|---|---|
| Card, stat card, collapsible card | `references/components/card.md` |
| Tabla con header sticky, paginación | `references/components/table.md` |
| Shell de página, sidebar, topbar, tabs | `references/components/layout.md` |
| Select single, MultiSelect, filter toolbar, filter pill | `references/components/select.md` |
| Modal / dialog | `references/components/dialog.md` |
| Chat: bubbles, composer, phase toast, markdown body | `references/components/chat.md` |

### Frameworks (implementaciones listas para copiar)

| Necesitas | Lee |
|---|---|
| Svelte 4/5 | `references/frameworks/svelte.md` |
| Vue 3 | `references/frameworks/vue.md` |
| React (TSX) | `references/frameworks/react.md` |

### Opcional

| Necesitas | Lee |
|---|---|
| NetSuite Suitelet / SuiteScript | `references/netsuite.md` |

---

## Principios de diseño

| Principio | Regla |
|---|---|
| Sin hex hardcoded | Siempre clases de token — nunca `style="color:#227e9e"` |
| Semántica HTML | `<article>` cards · `<aside>` sidebars · `<nav>` navegación · `<section>` zonas |
| Densidad compacta | `h-9` filter toolbar · `min-h-[40px]` formularios normales |
| Oracle Font solo CDN | Nunca `@font-face` local, npm, ni Google Fonts |
| Responsive Tailwind | Breakpoints `sm:` `md:` `lg:` — no media queries manuales |

---

## Checklist antes de entregar

- [ ] Modo determinado: CDN play (`rw-*`) o build v4 (`redwood-*`)
- [ ] Oracle Font CDN en `<head>` o `index.html`
- [ ] `<body>` con `font-sans antialiased bg-[rw/redwood]-page text-[rw/redwood]-text`
- [ ] Sin hex hardcoded fuera de tokens
- [ ] Botones con variante semántica correcta (ver `atoms/button.md`)
- [ ] Badges con variante semántica correcta (ver `atoms/badge.md`)
- [ ] Tabla: `overflow-x-auto` + `border rounded-xl` (CDN) o `overflow-hidden rounded-lg` (build)
- [ ] Framework: lógica `onClickOutside` en dropdowns y selects
- [ ] Responsive con breakpoints Tailwind
