# Atoms — Buttons

Altura base: `h-[40px]` (formularios normales) o `h-9` (filter toolbar, compact).
Todas las variantes usan `active:scale-[.98]` y `transition-all`.

---

## Variantes

```html
<!-- Primary — acción principal de navegación/filtro -->
<button class="h-[40px] px-4 rounded-rw-md bg-rw-primary text-white text-sm font-semibold
  hover:bg-rw-primary-h active:scale-[.98] inline-flex items-center gap-2 transition-all whitespace-nowrap">
  Acción principal
</button>

<!-- CTA — acción irreversible, exportación -->
<button class="h-[40px] px-4 rounded-rw-md bg-rw-cta text-white text-sm font-semibold
  hover:bg-rw-cta-h active:scale-[.98] inline-flex items-center gap-2 transition-all whitespace-nowrap">
  Exportar XLSX
</button>

<!-- Danger — eliminar, rechazar -->
<button class="h-[40px] px-4 rounded-rw-md bg-rw-danger text-white text-sm font-semibold
  hover:bg-rw-danger-h active:scale-[.98] inline-flex items-center gap-2 transition-all whitespace-nowrap">
  Eliminar
</button>

<!-- Subtle — cancelar en formularios -->
<button class="h-[40px] px-4 rounded-rw-md bg-rw-solid text-rw-text text-sm font-semibold
  hover:bg-rw-hover active:scale-[.98] inline-flex items-center gap-2 transition-all whitespace-nowrap">
  Cancelar
</button>

<!-- Ghost — acciones secundarias, detalle en tabla -->
<button class="h-[40px] px-4 rounded-rw-md bg-transparent text-rw-text border border-rw-border text-sm font-semibold
  hover:bg-rw-hover active:scale-[.98] inline-flex items-center gap-2 transition-all whitespace-nowrap">
  Ver detalle
</button>
```

### Build v4 (`redwood-*`)
```html
<button class="rounded bg-redwood-cta px-4 py-2 text-sm font-semibold text-white hover:bg-redwood-cta-hover transition-colors">CTA</button>
<button class="rounded border border-redwood-border bg-redwood-surface px-4 py-2 text-sm font-semibold text-redwood-text hover:bg-redwood-hover-bg transition-colors">Ghost</button>
<button class="rounded border border-redwood-selected-border px-3 py-1.5 text-xs font-semibold text-redwood-primary hover:bg-redwood-hover-bg transition-colors">Outlined</button>
```

---

## Compact (h-9 — filter toolbar)

```html
<button class="h-9 rounded-sm px-4 text-sm font-semibold bg-redwood-cta text-white hover:bg-redwood-cta-hover transition-colors">Buscar</button>
<button class="h-9 rounded-sm border border-redwood-border bg-redwood-surface px-4 text-sm font-semibold text-redwood-text hover:bg-redwood-hover-bg transition-colors">Limpiar</button>
```

---

## Mini (h-[30px] — dentro de cards/panels)

```html
<!-- Dentro de sidebar oscuro -->
<button class="h-[30px] px-[11px] border border-white/[.20] rounded-rw-md bg-transparent text-white/[.72]
  text-[11px] font-bold uppercase tracking-[.08em]
  hover:bg-white/[.11] hover:border-white/[.36] hover:text-white transition-colors whitespace-nowrap">
  Nuevo
</button>

<!-- Dentro de card surface -->
<button class="h-[30px] px-2.5 inline-flex items-center gap-1.5 border border-rw-border rounded-rw-md
  bg-rw-surface text-rw-muted text-[11px] font-semibold
  hover:border-rw-primary hover:text-rw-primary hover:bg-rw-selected transition-colors">
  PDF
</button>
```

---

## Icon-only (msg-actions)

Para barras de acciones en mensajes — transparente, revela borde en hover.

```html
<button class="bg-transparent border border-transparent text-rw-muted px-2 py-1 rounded-[6px]
  hover:bg-rw-hover hover:text-rw-text hover:border-rw-border
  inline-flex items-center gap-1 text-xs transition-colors cursor-pointer">
  <svg width="14" height="14">...</svg>
</button>

<!-- feedback like — hover azul -->
<button class="... hover:text-rw-primary hover:bg-[rgba(34,126,158,0.08)] hover:border-[rgba(34,126,158,0.2)]">...</button>

<!-- feedback dislike — hover naranja -->
<button class="... hover:text-rw-warning hover:bg-[rgba(150,97,28,0.08)] hover:border-[rgba(150,97,28,0.2)]">...</button>
```

---

## Disabled state

```html
<button disabled class="... disabled:opacity-40 disabled:cursor-not-allowed">...</button>
<!-- send button cuando loading -->
<button disabled class="... disabled:bg-rw-solid disabled:text-rw-muted disabled:cursor-default">...</button>
```
