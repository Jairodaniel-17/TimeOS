# Frameworks — Svelte

Componentes Redwood implementados en Svelte 5 / Svelte 4.
Usan `@theme` de Tailwind v4 → clases `redwood-*`.

**Setup:** `@import "tailwindcss"` + bloque `@theme` en `app.css`. Oracle Font en `index.html`.

---

## KPIStatCard

```svelte
<!-- KPIStatCard.svelte -->
<script>
  export let title = ""
  export let value = ""
  export let subtitle = ""
  export let trend = ""
  export let emphasis = false
</script>

<article class="min-h-[132px] rounded-lg border border-redwood-border bg-redwood-surface
  px-5 py-4 shadow-rw transition-colors"
  class:border-redwood-primary={emphasis}>
  <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-redwood-muted">{title}</p>
  <p class="mt-2 text-[28px] leading-none font-bold text-redwood-text">{value}</p>
  <p class="mt-3 text-xs text-redwood-muted">{subtitle}</p>
  {#if trend}
    <p class="mt-2 text-xs font-medium text-redwood-primary">{trend}</p>
  {/if}
</article>
```
Props: `title`, `value`, `subtitle`, `trend?`, `emphasis?: boolean`

---

## RiskBadge

```svelte
<!-- RiskBadge.svelte -->
<script>
  export let level = "Bajo"

  const classes = {
    Alto:  "bg-badge-subtle-danger-bg  text-redwood-text border-redwood-danger/15",
    Medio: "bg-badge-subtle-warning-bg text-redwood-text border-badge-strong-warning-bg/20",
    Bajo:  "bg-badge-subtle-success-bg text-redwood-text border-redwood-green/20",
  }
</script>

<span class="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold whitespace-nowrap {classes[level] ?? classes.Bajo}">
  {level}
</span>
```
Props: `level: "Alto" | "Medio" | "Bajo"`

---

## DashboardTabs

```svelte
<!-- DashboardTabs.svelte -->
<script>
  import { createEventDispatcher } from "svelte"
  export let tabs = []   // [{ id, label, count? }]
  export let activeTab = ""
  const dispatch = createEventDispatcher()
</script>

<nav class="flex gap-1 overflow-x-auto border-b border-redwood-border pb-px">
  {#each tabs as tab}
    <button type="button"
      on:click={() => { activeTab = tab.id; dispatch("change", { id: tab.id }) }}
      class="inline-flex shrink-0 items-center gap-2 rounded-t-lg border border-b-0 px-4 py-3
        text-sm font-semibold transition-colors"
      class:border-redwood-border={activeTab === tab.id}
      class:bg-redwood-surface={activeTab === tab.id}
      class:text-redwood-text={activeTab === tab.id}
      class:border-transparent={activeTab !== tab.id}
      class:text-redwood-muted={activeTab !== tab.id}
      class:hover:bg-redwood-hover-bg={activeTab !== tab.id}
      class:hover:text-redwood-text={activeTab !== tab.id}>
      <span>{tab.label}</span>
      {#if tab.count != null}
        <small class="rounded-full border border-redwood-border bg-redwood-hover-bg
          px-2 py-0.5 text-[11px] font-semibold text-redwood-muted">{tab.count}</small>
      {/if}
    </button>
  {/each}
</nav>
```
Events: `change: { id: string }`

---

## EmployeeMultiSelect

```svelte
<!-- EmployeeMultiSelect.svelte -->
<script>
  import { createEventDispatcher, onDestroy } from "svelte"
  export let options = []        // { value, label }[]
  export let excludedIds = new Set()
  export let triggerId = "multiselect"

  const dispatch = createEventDispatcher()
  let open = false, search = "", triggerEl, panelEl

  $: filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
  $: activeCount = options.filter(o => !excludedIds.has(o.value)).length
  $: allActive = excludedIds.size === 0

  function toggle(value) {
    const next = new Set(excludedIds)
    next.has(value) ? next.delete(value) : next.add(value)
    dispatch("change", next)
  }
  function selectAll()   { dispatch("change", new Set()) }
  function deselectAll() { dispatch("change", new Set(options.map(o => o.value))) }
  function onWindowClick(e) {
    if (!open || triggerEl?.contains(e.target) || panelEl?.contains(e.target)) return
    open = false; search = ""
  }
</script>

<svelte:window on:click={onWindowClick} />

<div class="relative w-full">
  <button id={triggerId} bind:this={triggerEl} type="button"
    on:click|stopPropagation={() => { open = !open; if (!open) search = "" }}
    class="h-9 w-full flex items-center justify-between gap-2 rounded-sm border bg-white
      px-3 text-sm outline-none transition {open
        ? 'border-redwood-focus-ring ring-2 ring-redwood-focus-ring/20'
        : 'border-redwood-border'}">
    <span class="truncate text-redwood-text">
      {#if allActive}Todos ({options.length})
      {:else if activeCount === 0}Ninguno
      {:else}{activeCount} de {options.length}{/if}
    </span>
    <span class="flex shrink-0 items-center gap-1.5">
      {#if excludedIds.size > 0}
        <span class="rounded-full bg-redwood-danger/10 px-1.5 py-0.5 text-[10px] font-semibold text-redwood-danger">
          -{excludedIds.size}
        </span>
      {/if}
      <svg class="h-4 w-4 text-redwood-muted transition-transform duration-150"
        class:-rotate-180={open} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
      </svg>
    </span>
  </button>

  {#if open}
    <div bind:this={panelEl}
      class="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-lg
        border border-redwood-border bg-white shadow-xl" style="min-width:100%">
      <!-- search, bulk actions, list, footer — ver components/select.md para HTML completo -->
    </div>
  {/if}
</div>
```
Events: `change: Set<string>`

---

## FilterToolbar (composición)

```svelte
<!-- FilterToolbar.svelte -->
<script>
  import { createEventDispatcher } from "svelte"
  import EmployeeMultiSelect from "./EmployeeMultiSelect.svelte"
  export let allEmployeeOptions = []
  export let excludedEmployeeIds = new Set()
  export let filters = { startDate: "", endDate: "", risk: "ALL", search: "" }
  const dispatch = createEventDispatcher()
</script>

<section class="grid grid-cols-12 gap-3 rounded-lg border border-redwood-border bg-redwood-surface p-4 shadow-rw">
  <div class="col-span-12 sm:col-span-6 lg:col-span-2">
    <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-redwood-muted">Mes</label>
    <input type="month" class="h-9 w-full rounded-sm border border-redwood-border bg-white px-3 text-sm
      text-redwood-text outline-none transition focus:border-redwood-focus-ring focus:ring-2 focus:ring-redwood-focus-ring/20" />
  </div>
  <div class="col-span-12 sm:col-span-6 lg:col-span-2">
    <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-redwood-muted">Empleados</label>
    <EmployeeMultiSelect options={allEmployeeOptions} excludedIds={excludedEmployeeIds}
      on:change={e => dispatch("excludeChange", e.detail)} />
  </div>
  <!-- más campos... ver components/select.md para estructura completa -->
  <div class="col-span-12 flex flex-wrap justify-end gap-2 pt-1">
    <button on:click={() => dispatch("reset")} class="h-9 rounded-sm border border-redwood-border
      bg-redwood-surface px-4 text-sm font-semibold text-redwood-text hover:bg-redwood-hover-bg transition-colors">Limpiar</button>
    <button on:click={() => dispatch("search")} class="h-9 rounded-sm bg-redwood-cta px-4 text-sm
      font-semibold text-white hover:bg-redwood-cta-hover transition-colors">Buscar</button>
  </div>
</section>
```
Events: `search`, `reset`, `excludeChange: Set<string>`
