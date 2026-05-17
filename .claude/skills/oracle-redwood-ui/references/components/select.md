# Components — Select: Single, MultiSelect, Filter Toolbar, Filter Pill

---

## Custom Select single (HTML + JS vanilla)

Para HTML puro y Suitelets. Ver JS en references/netsuite.md.

```html
<div data-select class="relative">
  <button class="custom-select-trigger w-full min-h-[40px] px-3 py-2 border border-rw-border
    rounded-rw-md bg-rw-surface text-rw-text text-sm text-left flex items-center justify-between gap-2
    focus:outline-none focus-visible:border-rw-focus"
    aria-expanded="false" aria-haspopup="listbox">
    <span data-select-label class="truncate text-rw-muted">Seleccionar…</span>
    <svg class="w-4 h-4 text-rw-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
    </svg>
  </button>
  <input data-select-value type="hidden" name="campo">
  <div class="custom-select-dropdown absolute z-50 top-full left-0 w-full mt-1
    bg-rw-surface border border-rw-border rounded-rw-md shadow-rw-md hidden overflow-hidden" role="listbox">
    <div class="custom-select-option px-4 py-2.5 text-sm text-rw-text cursor-pointer hover:bg-rw-hover"
      data-value="PE" role="option">Perú</div>
    <div class="custom-select-option px-4 py-2.5 text-sm text-rw-text cursor-pointer hover:bg-rw-hover"
      data-value="CL" role="option">Chile</div>
  </div>
</div>
```
*Opción activa: añadir `bg-rw-selected border-y border-rw-selected-bd`, quitar `hover:bg-rw-hover`.*

---

## Employee MultiSelect (búsqueda + bulk + exclusión)

Modelo: `excludedIds: Set<string>` — vacío = todos activos.

```html
<div class="relative w-full">
  <!-- Trigger -->
  <button type="button" class="h-9 w-full flex items-center justify-between gap-2
    rounded-sm border bg-white px-3 text-sm outline-none transition
    border-redwood-border focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20">
    <span class="truncate text-redwood-text">8 de 12</span>
    <span class="flex shrink-0 items-center gap-1.5">
      <!-- badge exclusión (solo si excludedIds.size > 0) -->
      <span class="rounded-full bg-redwood-danger/10 px-1.5 py-0.5 text-[10px] font-semibold text-redwood-danger">-4</span>
      <svg class="h-4 w-4 text-redwood-muted transition-transform duration-150 -rotate-180"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
      </svg>
    </span>
  </button>

  <!-- Dropdown -->
  <div class="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-lg
    border border-redwood-border bg-white shadow-xl" style="min-width:100%">

    <!-- Search -->
    <div class="border-b border-redwood-border p-2">
      <div class="flex items-center gap-2 rounded-sm border border-redwood-border
        bg-redwood-hover-bg px-2.5 py-1.5">
        <svg class="h-3.5 w-3.5 shrink-0 text-redwood-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="M21 21l-4.35-4.35"/>
        </svg>
        <input type="text" placeholder="Buscar empleado..."
          class="w-full bg-transparent text-xs text-redwood-text outline-none placeholder:text-redwood-muted" />
      </div>
    </div>

    <!-- Bulk actions -->
    <div class="flex items-center justify-between border-b border-redwood-border px-3 py-2">
      <span class="text-[11px] text-redwood-muted">8 activos · 4 excluidos</span>
      <div class="flex gap-2">
        <button class="rounded px-2 py-0.5 text-[11px] font-semibold text-redwood-primary
          hover:bg-redwood-hover-bg transition disabled:opacity-40">Todos</button>
        <button class="rounded px-2 py-0.5 text-[11px] font-semibold text-redwood-danger
          hover:bg-redwood-danger/5 transition disabled:opacity-40">Ninguno</button>
      </div>
    </div>

    <!-- List -->
    <ul class="max-h-60 overflow-y-auto py-1">
      <!-- item activo -->
      <li>
        <label class="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-redwood-hover-bg transition-colors">
          <span class="relative flex h-4 w-4 shrink-0 items-center justify-center">
            <input type="checkbox" checked
              class="h-4 w-4 cursor-pointer appearance-none rounded-sm border-2 transition-all
              border-redwood-primary bg-redwood-primary" />
            <svg class="pointer-events-none absolute h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="flex-1 text-xs text-redwood-text">Ana Torres</span>
        </label>
      </li>
      <!-- item excluido -->
      <li>
        <label class="flex cursor-pointer items-center gap-3 px-3 py-2
          opacity-50 hover:bg-redwood-danger/5 transition-colors">
          <span class="relative flex h-4 w-4 shrink-0 items-center justify-center">
            <input type="checkbox"
              class="h-4 w-4 cursor-pointer appearance-none rounded-sm border-2
              border-redwood-border bg-white" />
          </span>
          <span class="flex-1 text-xs text-redwood-text">Marco Flores</span>
          <span class="rounded-full bg-redwood-danger/10 px-1.5 py-0.5 text-[10px] text-redwood-danger">excluido</span>
        </label>
      </li>
    </ul>

    <!-- Footer -->
    <div class="border-t border-redwood-border px-3 py-2 text-[11px] text-redwood-muted">
      12 de 12 empleados
    </div>
  </div>
</div>
```

**Lógica de estado:** `excludedIds: Set` vacío = todos activos. `toggle(id)` add/delete del Set.
**Trigger label:** `allActive` → "Todos (N)" · `activeCount === 0` → "Ninguno" · default → "X de N"
**Cerrar al clic afuera:** `window click` listener, verificar `triggerEl.contains(e.target)`.

---

## Filter Toolbar (12-col grid)

```html
<section class="grid grid-cols-12 gap-3 rounded-lg border border-redwood-border bg-redwood-surface p-4 shadow-rw">

  <div class="col-span-12 sm:col-span-6 lg:col-span-2">
    <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-redwood-muted">Mes</label>
    <input type="month" class="h-9 w-full rounded-sm border border-redwood-border bg-white px-3 text-sm
      text-redwood-text outline-none transition focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20" />
  </div>

  <div class="col-span-12 sm:col-span-6 lg:col-span-2">
    <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-redwood-muted">Empleados</label>
    <!-- EmployeeMultiSelect component aquí -->
  </div>

  <div class="col-span-12 sm:col-span-6 lg:col-span-2">
    <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-redwood-muted">Riesgo</label>
    <select class="h-9 w-full rounded-sm border border-redwood-border bg-white px-3 text-sm
      text-redwood-text outline-none transition focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20">
      <option value="ALL">Todos</option><option value="Alto">Alto</option>
    </select>
  </div>

  <div class="col-span-12 lg:col-span-6">
    <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-redwood-muted">Búsqueda</label>
    <input type="text" placeholder="Buscar descripción o task"
      class="h-9 w-full rounded-sm border border-redwood-border bg-white px-3 text-sm
      text-redwood-text outline-none transition focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20" />
  </div>

  <div class="col-span-12 flex flex-wrap justify-end gap-2 pt-1">
    <!-- atoms/button.md — compact ghost + cta -->
    <button class="h-9 rounded-sm border border-redwood-border bg-redwood-surface px-4 text-sm font-semibold text-redwood-text hover:bg-redwood-hover-bg transition-colors">Limpiar</button>
    <button class="h-9 rounded-sm bg-redwood-cta px-4 text-sm font-semibold text-white hover:bg-redwood-cta-hover transition-colors">Buscar</button>
  </div>

</section>
```

**Grid por breakpoint:** mobile=12col · sm=6col · lg=2col por campo (6col búsqueda)

---

## Filter Pill (dropdown compact — workspace header)

```html
<div class="relative inline-flex items-center gap-[5px] h-8 px-[11px] border border-rw-border
  rounded-rw-md bg-rw-surface text-rw-text text-xs cursor-pointer whitespace-nowrap
  hover:border-[#a0a0a0] hover:bg-rw-surface-soft transition-all">
  <span class="text-[9px] font-extrabold uppercase tracking-[.12em] text-rw-muted">País</span>
  <span class="w-px h-[10px] bg-rw-border"></span>
  <span class="text-xs font-medium">Argentina</span>
  <svg class="w-3 h-3 text-rw-muted" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
  </svg>
  <!-- Dropdown -->
  <div class="absolute z-[60] top-[calc(100%+5px)] right-0 min-w-[130px] bg-rw-surface
    border border-rw-border rounded-xl shadow-rw-md p-[5px] grid gap-0.5 hidden">
    <button class="w-full border-0 rounded-[7px] bg-transparent text-rw-text px-2.5 py-[7px]
      text-left text-xs font-semibold flex items-center gap-[7px]
      hover:bg-rw-hover transition-colors">
      <span class="w-[5px] h-[5px] rounded-full bg-current flex-shrink-0 opacity-0"></span>
      Argentina
    </button>
    <!-- activa: bg-rw-selected text-rw-selected-bd, dot opacity-100 -->
  </div>
</div>
```
