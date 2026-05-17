# Atoms — Badge, Code Pill, Status Dot

---

## Badge (subtle — default)

Pill redondeado para estados semánticos.

### CDN play (`rw-*`)
```html
<span class="inline-flex items-center min-h-6 rounded-full px-2.5 py-0.5 text-xs font-bold bg-badge-neutral-bg text-rw-text whitespace-nowrap">Inactivo</span>
<span class="inline-flex items-center min-h-6 rounded-full px-2.5 py-0.5 text-xs font-bold bg-badge-info-bg text-rw-info whitespace-nowrap">Periodo</span>
<span class="inline-flex items-center min-h-6 rounded-full px-2.5 py-0.5 text-xs font-bold bg-badge-success-bg text-rw-success whitespace-nowrap">Aprobado</span>
<span class="inline-flex items-center min-h-6 rounded-full px-2.5 py-0.5 text-xs font-bold bg-badge-warning-bg text-rw-warning whitespace-nowrap">Pendiente</span>
<span class="inline-flex items-center min-h-6 rounded-full px-2.5 py-0.5 text-xs font-bold bg-badge-danger-bg text-rw-danger whitespace-nowrap">Alto riesgo</span>
```

### Build v4 (`redwood-*`) — con borde sutil
```html
<span class="inline-flex items-center min-h-6 rounded-full border px-3 py-1 text-[11px] font-semibold whitespace-nowrap bg-badge-subtle-success-bg text-redwood-text border-redwood-green/20">Bajo</span>
<span class="inline-flex items-center min-h-6 rounded-full border px-3 py-1 text-[11px] font-semibold whitespace-nowrap bg-badge-subtle-warning-bg text-redwood-text border-badge-strong-warning-bg/20">Medio</span>
<span class="inline-flex items-center min-h-6 rounded-full border px-3 py-1 text-[11px] font-semibold whitespace-nowrap bg-badge-subtle-danger-bg text-redwood-text border-redwood-danger/15">Alto</span>
<span class="inline-flex items-center min-h-6 rounded-full border px-3 py-1 text-[11px] font-semibold whitespace-nowrap bg-badge-subtle-info-bg text-redwood-text border-redwood-primary/15">Info</span>
```

| Variante | Cuándo |
|---|---|
| `danger` | Riesgo alto, error, rechazado |
| `warning` | Riesgo medio, pendiente |
| `success` | Riesgo bajo, aprobado, activo |
| `info` | Periodo, referencia informativa |
| `neutral` | Estado desconocido, inactivo |

---

## Code Pill

Para IDs técnicos, códigos de registro, hashes.

```html
<span class="inline-flex items-center h-6 rounded-rw-sm px-2 bg-code-bg text-code-text font-mono text-xs font-bold">BC-PE-001</span>
```

---

## Status Dot

Indicador de estado en tiempo real — headers de workspace, sidebar, history items.

```html
<!-- ready -->
<span class="w-2 h-2 rounded-full bg-rw-success flex-shrink-0"></span>
<!-- busy (animado) -->
<span class="w-2 h-2 rounded-full bg-rw-primary flex-shrink-0" style="animation:pulse 1.2s ease-in-out infinite"></span>
<!-- error -->
<span class="w-2 h-2 rounded-full bg-rw-danger flex-shrink-0"></span>
```

```css
@keyframes pulse {
  0%   { box-shadow: 0 0 0 0 rgba(34,126,158,.4); }
  70%  { box-shadow: 0 0 0 7px rgba(34,126,158,0); }
  100% { box-shadow: 0 0 0 0 rgba(34,126,158,0); }
}
```

**Sidebar (fondo oscuro):** cambiar `bg-rw-primary` por color semántico + usar `pulseWhite`:
```css
@keyframes pulseWhite {
  0%   { box-shadow: 0 0 0 0 rgba(255,255,255,.4); }
  70%  { box-shadow: 0 0 0 7px rgba(255,255,255,0); }
  100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
}
```
History dot colors: ok/ready → `#6ab04c` · error → `#e55039` · busy → `#3498db`
