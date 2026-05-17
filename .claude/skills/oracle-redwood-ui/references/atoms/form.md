# Atoms — Form Controls

Input, select nativo, textarea. Altura base: `h-9` (compact) o `min-h-[40px]` (normal).

---

## Label

```html
<!-- normal -->
<label class="text-[13px] font-bold text-rw-text">Nombre del campo</label>
<!-- uppercase (filter toolbar) -->
<label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-rw-muted">Etiqueta</label>
```

---

## Input text / date / month

### CDN play
```html
<input type="text" placeholder="Escribe aquí..."
  class="w-full min-h-[40px] px-3 py-2 border border-rw-border rounded-rw-md bg-rw-surface
  text-rw-text text-sm placeholder:text-rw-muted
  focus:outline-none focus-visible:border-rw-focus focus-visible:ring-2 focus-visible:ring-rw-focus/30
  transition-colors" />
```

### Build v4 (compact h-9 — filter toolbar)
```html
<input type="text"
  class="h-9 w-full rounded-sm border border-redwood-border bg-white px-3 text-sm text-redwood-text
  outline-none transition focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20" />

<input type="date"
  class="h-9 w-full rounded-sm border border-redwood-border bg-white px-3 text-sm text-redwood-text
  outline-none transition focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20" />

<input type="month"
  class="h-9 w-full rounded-sm border border-redwood-border bg-white px-3 text-sm text-redwood-text
  outline-none transition focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20" />
```

---

## Select nativo

```html
<!-- CDN play -->
<select class="w-full min-h-[40px] px-3 py-2 border border-rw-border rounded-rw-md bg-rw-surface
  text-rw-text text-sm focus:outline-none focus-visible:border-rw-focus transition-colors">
  <option value="">Seleccionar...</option>
  <option value="a">Opción A</option>
</select>

<!-- Build v4 compact -->
<select class="h-9 w-full rounded-sm border border-redwood-border bg-white px-3 text-sm text-redwood-text
  outline-none transition focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20">
  <option value="ALL">Todos</option>
  <option value="Alto">Alto</option>
</select>
```

---

## Textarea

```html
<!-- CDN play -->
<textarea rows="4" placeholder="Observaciones..."
  class="w-full px-3 py-2 border border-rw-border rounded-rw-md bg-rw-surface
  text-rw-text text-sm placeholder:text-rw-muted
  focus:outline-none focus-visible:border-rw-focus focus-visible:ring-2 focus-visible:ring-rw-focus/30
  transition-colors resize-y" />

<!-- Build v4 (modal feedback) -->
<textarea class="w-full h-[90px] px-3 py-2.5 border border-redwood-border rounded-rw-md
  bg-redwood-surface-soft text-redwood-text text-sm resize-none outline-none leading-[1.6]
  focus:border-redwood-primary focus:ring-2 focus:ring-redwood-primary/12 transition-all" />
```

---

## Field group (label + control)

```html
<div class="grid gap-1.5 mb-4">
  <label class="text-[13px] font-bold text-rw-text">País</label>
  <input type="text" class="..." />
</div>
```

## Form grid (2 columnas)
```html
<div class="grid grid-cols-2 gap-4 md:grid-cols-1">
  <!-- campos -->
</div>
```
