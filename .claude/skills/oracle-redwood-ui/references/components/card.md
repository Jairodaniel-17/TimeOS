# Components — Card, Stat Card, Collapsible Card

---

## Card base

```html
<article class="bg-rw-surface border border-rw-border rounded-rw-lg shadow-rw-sm overflow-hidden">
  <div class="px-5 py-[18px] border-b border-rw-border flex justify-between items-start gap-4">
    <div>
      <h2 class="text-[17px] font-bold tracking-[-0.01em]">Título</h2>
      <p class="mt-1 text-[13px] text-rw-muted">Descripción secundaria.</p>
    </div>
    <!-- badge opcional -->
    <span class="inline-flex items-center min-h-6 rounded-full px-2.5 py-0.5 text-xs font-bold bg-badge-info-bg text-rw-info">Abril 2026</span>
  </div>
  <div class="p-5">
    <!-- body content -->
  </div>
</article>
```

### Build v4 (Svelte/Vue)
```html
<section class="overflow-hidden rounded-lg border border-redwood-border bg-redwood-surface shadow-rw">
  <header class="flex flex-col gap-3 border-b border-redwood-border px-5 py-4
    md:flex-row md:items-center md:justify-between">
    <h3 class="text-base font-bold text-redwood-text">Título</h3>
    <div class="flex items-center gap-3">
      <span class="text-xs text-redwood-muted">Metadata</span>
      <button class="rounded border border-redwood-selected-border px-3 py-1.5 text-xs font-semibold
        text-redwood-primary hover:bg-redwood-hover-bg transition-colors">Acción</button>
    </div>
  </header>
  <div class="p-5"><!-- body --></div>
  <footer class="flex flex-col gap-3 border-t border-redwood-border px-5 py-4 text-xs text-redwood-muted
    md:flex-row md:items-center md:justify-between">
    <span>Mostrando 1-N de N</span>
    <div class="flex gap-2">
      <button disabled class="rounded border border-redwood-border px-3 py-1.5 text-xs
        text-redwood-muted disabled:opacity-60 disabled:cursor-not-allowed">Anterior</button>
      <button class="rounded border border-redwood-border px-3 py-1.5 text-xs
        text-redwood-text hover:bg-redwood-hover-bg transition-colors">Siguiente</button>
    </div>
  </footer>
</section>
```

---

## Stat Card (con border-left semántico)

Grid de 4. `border-l-4` + color semántico = variante visual.

```html
<section class="grid grid-cols-4 gap-4 mb-[18px] md:grid-cols-2 sm:grid-cols-1">

  <article class="bg-rw-surface border border-rw-border border-l-4 border-l-rw-primary
    rounded-rw-lg shadow-rw-sm p-[18px] min-h-[118px] flex flex-col justify-between">
    <div>
      <div class="text-[13px] font-semibold text-rw-muted">Procesados</div>
      <div class="mt-2 text-[30px] leading-none font-extrabold tracking-[-0.04em]">1,284</div>
    </div>
    <div class="text-xs text-rw-muted">Entradas evaluadas</div>
  </article>

  <!-- success -->
  <article class="... border-l-rw-success ...">...</article>
  <!-- warning -->
  <article class="... border-l-[#cd7d1a] ...">...</article>
  <!-- danger -->
  <article class="... border-l-rw-danger ...">...</article>

</section>
```

### Build v4 (Svelte — KPIStatCard)
```html
<!-- KPIStatCard.svelte pattern -->
<article class="min-h-[132px] rounded-lg border border-redwood-border bg-redwood-surface
  px-5 py-4 shadow-rw transition-colors"
  class:border-redwood-primary={emphasis}>
  <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-redwood-muted">{title}</p>
  <p class="mt-2 text-[28px] leading-none font-bold text-redwood-text">{value}</p>
  <p class="mt-3 text-xs text-redwood-muted">{subtitle}</p>
  <!-- trend opcional -->
  <p class="mt-2 text-xs font-medium text-redwood-primary">{trend}</p>
</article>
```
Props: `title`, `value`, `subtitle`, `trend?`, `emphasis?: boolean`

---

## Collapsible Card (acordeón)

```html
<article class="bg-rw-surface border border-rw-border rounded-rw-lg shadow-rw-sm overflow-hidden mb-3">
  <button class="w-full flex justify-between items-start gap-3 px-4 py-[13px]
    border-0 bg-transparent cursor-pointer border-b border-rw-border">
    <div>
      <div class="text-sm font-bold tracking-[-0.01em] text-rw-text text-left">Título</div>
      <div class="mt-[3px] text-xs text-rw-muted text-left">Subtítulo</div>
    </div>
    <div class="flex items-center gap-2 flex-shrink-0">
      <!-- badge opcional -->
      <span class="... bg-badge-info-bg text-rw-info">Info</span>
      <span class="text-[13px] text-rw-muted font-bold">›</span><!-- ‹ cuando open -->
    </div>
  </button>
  <div class="p-4"><!-- body --></div>
</article>
```
