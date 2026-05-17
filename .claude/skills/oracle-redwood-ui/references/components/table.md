# Components — Table

Tabla con header sticky, hover, empty state inline, footer con paginación.

---

## HTML puro (CDN play)

```html
<div class="overflow-x-auto border border-rw-border rounded-xl">
  <table class="w-full border-collapse text-sm min-w-[760px]">
    <thead>
      <tr>
        <th class="sticky top-0 z-10 px-[14px] py-[13px] border-b border-rw-border text-left
          bg-rw-page text-xs font-extrabold uppercase tracking-[.05em] text-rw-muted">Empleado</th>
        <th class="sticky top-0 z-10 px-[14px] py-[13px] border-b border-rw-border text-left
          bg-rw-page text-xs font-extrabold uppercase tracking-[.05em] text-rw-muted">Horas</th>
        <th class="sticky top-0 z-10 px-[14px] py-[13px] border-b border-rw-border text-left
          bg-rw-page text-xs font-extrabold uppercase tracking-[.05em] text-rw-muted">Riesgo</th>
        <th class="sticky top-0 z-10 px-[14px] py-[13px] border-b border-rw-border
          bg-rw-page"></th>
      </tr>
    </thead>
    <tbody>
      <!-- row normal -->
      <tr class="hover:bg-rw-hover transition-colors">
        <td class="px-[14px] py-[13px] border-b border-rw-border align-top">
          <div class="font-bold text-rw-text">Ana Torres</div>
          <div class="mt-0.5 text-xs text-rw-muted">ID 1024 · Consultoría funcional</div>
        </td>
        <td class="px-[14px] py-[13px] border-b border-rw-border align-top">42.0</td>
        <td class="px-[14px] py-[13px] border-b border-rw-border align-top">
          <!-- badge de atoms/badge.md -->
        </td>
        <td class="px-[14px] py-[13px] border-b border-rw-border align-top">
          <!-- ghost button de atoms/button.md -->
        </td>
      </tr>
      <!-- empty state inline -->
      <tr>
        <td colspan="4" class="px-4 py-8 text-center text-sm text-rw-muted">
          Sin resultados para los filtros seleccionados.
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## Build v4 (Svelte — EmployeeSummaryTable pattern)

Envuelve en `section` con `shadow-rw`. Header con acciones. Max-height en el wrapper de scroll.

```html
<section class="overflow-hidden rounded-lg border border-redwood-border bg-redwood-surface shadow-rw">
  <header class="flex flex-col gap-3 border-b border-redwood-border px-5 py-4
    md:flex-row md:items-center md:justify-between">
    <h3 class="text-base font-bold text-redwood-text">Resumen por empleado</h3>
    <div class="flex items-center gap-3">
      <span class="text-xs text-redwood-muted">Sort: Horas ↓</span>
      <button class="rounded border border-redwood-selected-border px-3 py-1.5 text-xs font-semibold
        text-redwood-primary hover:bg-redwood-hover-bg transition-colors">Exportar vista</button>
    </div>
  </header>

  <!-- scroll wrapper con max-height -->
  <div class="max-h-[420px] overflow-auto">
    <table class="min-w-[920px] w-full border-collapse">
      <thead>
        <tr class="bg-redwood-hover-bg">
          <th class="sticky top-0 z-10 border-b border-redwood-border bg-redwood-hover-bg
            px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-redwood-muted">Empleado</th>
          <!-- más th... -->
        </tr>
      </thead>
      <tbody>
        <!-- empty -->
        <tr><td colspan="6" class="px-4 py-8 text-center text-sm text-redwood-muted">Sin resultados.</td></tr>
        <!-- row con hover selected -->
        <tr class="transition-colors hover:bg-redwood-selected-bg/55">
          <td class="border-b border-redwood-border px-4 py-3 text-sm font-medium text-redwood-text">Ana Torres</td>
          <!-- más td... -->
        </tr>
      </tbody>
    </table>
  </div>

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

## Diferencias clave CDN vs build

| Aspecto | CDN play | Build v4 |
|---|---|---|
| Hover row | `hover:bg-rw-hover` | `hover:bg-redwood-selected-bg/55` (azul suave) |
| Thead bg | `bg-rw-page` | `bg-redwood-hover-bg` |
| Wrapper | `overflow-x-auto border rounded-xl` | `section` con `overflow-hidden rounded-lg` |
| Sticky header | `sticky top-0 z-10` | igual + repetir bg en cada th |
