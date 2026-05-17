# Atoms — Feedback: Alert, Toast, Empty State, Progress

---

## Alert (warning inline)

```html
<div class="rounded-rw-lg border border-alert-border bg-alert-bg text-alert-text px-4 py-[14px]
  grid gap-2.5 mb-[18px]" style="grid-template-columns:34px minmax(0,1fr)">
  <div class="w-7 h-7 rounded-full bg-[rgba(150,97,28,.16)] text-rw-warning grid place-items-center font-black">!</div>
  <div>
    <div class="font-extrabold mb-0.5">Título del aviso</div>
    <div class="text-[13px] leading-[1.45] text-alert-text">Descripción del criterio o condición.</div>
  </div>
</div>
```

---

## Toast flotante (feedback / confirmación)

Aparece centrado, bottom fijo. Animar con `toast-in`.

```html
<div class="fixed bottom-[88px] left-1/2 -translate-x-1/2
  bg-rw-cta text-white px-5 py-[9px] rounded-full text-[13px] font-medium
  z-[1001] pointer-events-none flex items-center gap-2 shadow-[0_4px_14px_rgba(0,0,0,.2)]"
  style="animation:toast-in .3s cubic-bezier(.34,1.56,.64,1)">
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
  Guardado correctamente.
</div>

<style>
@keyframes toast-in {
  from { opacity:0; transform:translateX(-50%) translateY(12px) scale(.94); }
  to   { opacity:1; transform:translateX(-50%) translateY(0) scale(1); }
}
</style>
```

---

## Empty State

```html
<!-- Genérico -->
<div class="text-center border border-dashed border-[#abcbe0] bg-rw-surface-soft rounded-rw-lg px-7 py-[34px]">
  <div class="w-[54px] h-[54px] mx-auto mb-3.5 rounded-[18px] bg-[#d6e6ef] text-rw-info
    grid place-items-center text-[22px] font-black">0</div>
  <div class="font-extrabold mb-1.5">Sin resultados</div>
  <p class="text-rw-muted text-[13px] leading-[1.5] max-w-[420px] mx-auto m-0">
    Ajusta los filtros para encontrar registros.
  </p>
</div>

<!-- En tabla (td colspan) -->
<tr>
  <td colspan="6" class="px-4 py-8 text-center text-sm text-redwood-muted">
    Sin resultados para los filtros seleccionados.
  </td>
</tr>

<!-- Chat welcome screen -->
<div class="text-center border border-dashed border-rw-border bg-rw-surface-soft rounded-rw-lg px-7 py-11 max-w-[500px] mx-auto">
  <div class="inline-flex items-center h-6 px-3 rounded-full bg-rw-primary text-white
    text-[10px] font-bold tracking-[.12em] uppercase mb-3.5">RAG</div>
  <h3 class="text-[20px] font-bold tracking-[-0.02em] mb-2.5">Consulta tu base de conocimiento</h3>
  <p class="text-sm leading-[1.65] text-rw-muted max-w-[420px] mx-auto m-0">Descripción del sistema.</p>
</div>
```

---

## Progress Bar

```html
<div class="grid gap-3">
  <div class="grid gap-1.5">
    <div class="flex justify-between text-[13px] font-bold text-rw-muted">
      <span>Bajo</span><span>64%</span>
    </div>
    <div class="h-[9px] bg-rw-solid rounded-full overflow-hidden">
      <div class="h-full rounded-full bg-rw-success" style="width:64%"></div>
    </div>
  </div>
  <div class="grid gap-1.5">
    <div class="flex justify-between text-[13px] font-bold text-rw-muted">
      <span>Medio</span><span>25%</span>
    </div>
    <div class="h-[9px] bg-rw-solid rounded-full overflow-hidden">
      <div class="h-full rounded-full bg-[#cd7d1a]" style="width:25%"></div>
    </div>
  </div>
  <div class="grid gap-1.5">
    <div class="flex justify-between text-[13px] font-bold text-rw-muted">
      <span>Alto</span><span>11%</span>
    </div>
    <div class="h-[9px] bg-rw-solid rounded-full overflow-hidden">
      <div class="h-full rounded-full bg-rw-danger" style="width:11%"></div>
    </div>
  </div>
</div>
```
