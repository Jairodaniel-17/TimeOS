# Components — Dialog / Modal

---

## Modal base

```html
<!-- Overlay -->
<div class="fixed inset-0 bg-black/[.45] backdrop-blur-[4px] flex items-center justify-center z-[1000]"
  style="animation:softEnter .2s ease-out">
  <!-- Content card -->
  <div class="w-full max-w-[430px] bg-rw-surface rounded-2xl shadow-rw-lg overflow-hidden border border-rw-border">
    <div class="px-5 py-[18px] border-b border-rw-border">
      <h3 class="text-lg font-extrabold">Confirmar exportación</h3>
    </div>
    <div class="p-5 text-rw-muted text-sm leading-[1.55]">
      Descripción de la acción. Esta operación no se puede deshacer.
    </div>
    <div class="px-5 pb-5 pt-3.5 flex justify-end gap-2.5">
      <!-- atoms/button.md — subtle + cta/danger -->
      <button class="h-[40px] px-4 rounded-rw-md bg-transparent text-rw-text border border-rw-border hover:bg-rw-hover text-sm font-semibold transition-colors">Cancelar</button>
      <button class="h-[40px] px-4 rounded-rw-md bg-rw-cta text-white hover:bg-rw-cta-h text-sm font-semibold transition-colors">Exportar</button>
    </div>
  </div>
</div>
```

---

## Modal con textarea (feedback dislike)

```html
<div class="fixed inset-0 bg-black/[.45] backdrop-blur-[4px] flex items-center justify-center z-[1000]">
  <div class="w-full max-w-[420px] bg-rw-surface rounded-2xl shadow-rw-lg border border-rw-border p-7">
    <h3 class="text-base font-bold mb-1.5">¿Por qué no fue útil?</h3>
    <p class="text-[13px] text-rw-muted mb-4">Tu opinión nos ayuda a mejorar las respuestas.</p>
    <textarea rows="4" placeholder="Ej: La respuesta estaba incompleta..."
      autofocus
      class="w-full px-3 py-2.5 border border-rw-border rounded-rw-md bg-rw-surface-soft text-rw-text
      text-sm resize-none outline-none leading-[1.6] mb-[18px]
      focus:border-rw-primary focus:ring-2 focus:ring-rw-primary/12 transition-all"></textarea>
    <div class="flex justify-end gap-2.5">
      <button class="h-[40px] px-4 rounded-rw-md bg-transparent text-rw-muted border border-rw-border hover:bg-rw-hover hover:text-rw-text text-sm font-semibold transition-colors">Cancelar</button>
      <button class="h-[40px] px-4 rounded-rw-md bg-rw-primary text-white hover:bg-rw-primary-h text-sm font-semibold transition-colors">Enviar feedback</button>
    </div>
  </div>
</div>
```

---

## Animación de entrada

```css
@keyframes softEnter {
  from { opacity: 0; transform: translateY(5px); }
  to   { opacity: 1; transform: translateY(0); }
}
```
