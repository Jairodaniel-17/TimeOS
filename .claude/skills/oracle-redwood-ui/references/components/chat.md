# Components — Chat UI

Componentes específicos de interfaces conversacionales y pipelines en tiempo real.
Usan átomos de `atoms/badge.md` (status dot), `atoms/button.md` (icon-only, send),
`atoms/form.md` (textarea), `atoms/feedback.md` (toast, empty state).

---

## Message Bubbles

```html
<!-- User (derecha) -->
<div class="flex justify-end">
  <div class="relative max-w-[84%] rounded-2xl rounded-br-[4px] px-[15px] py-3
    text-sm leading-[1.7] bg-rw-cta text-white" style="animation:softEnter .22s ease-out both">
    Texto del usuario
  </div>
</div>

<!-- Assistant (izquierda) con acciones en hover -->
<div class="flex justify-start">
  <div class="relative max-w-[84%] rounded-2xl rounded-bl-[4px] px-[15px] py-3
    text-sm leading-[1.7] bg-rw-surface border border-rw-border text-rw-text shadow-rw-sm group"
    style="animation:softEnter .22s ease-out both">
    <!-- markdown body aquí -->
    <div class="markdown-body">...</div>

    <!-- msg-actions: hidden, visible en hover (group-hover) y siempre en último mensaje -->
    <div class="flex items-center gap-0.5 mt-2.5 pt-2 border-t border-rw-border
      opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <!-- copy — atoms/button.md icon-only -->
      <!-- like — hover azul -->
      <!-- dislike — hover naranja -->
      <!-- retry — normal -->
      <!-- separador visual -->
      <span class="w-[3px] h-[3px] rounded-full bg-rw-border mx-1 flex-shrink-0"></span>
    </div>
  </div>
</div>
```

**Truco:** `group` en el bubble + `group-hover:opacity-100` en msg-actions.
**Último mensaje:** siempre visible → añadir clase `opacity-100` condicionalmente.

---

## Phase Toast (estado del pipeline)

```html
<div class="flex justify-start" style="animation:softEnter .22s ease-out both">
  <div class="inline-flex items-center gap-[9px] border border-rw-border rounded-full
    bg-rw-surface px-[15px] py-[7px] text-[13px] font-medium text-rw-muted shadow-rw-sm">
    <span class="w-[7px] h-[7px] rounded-full bg-rw-primary flex-shrink-0"
      style="animation:pulse 1.2s ease-in-out infinite"></span>
    Buscando en la base de conocimiento…
  </div>
</div>
```

Labels por fase: `init` → "Iniciando…" · `searching` → "Buscando…" · `expanding` → "Expandiendo grafo…" · `generating` → "Generando respuesta…"

---

## Composer (textarea auto-expand + send)

```html
<div class="border-t border-rw-border px-[18px] py-3 pb-3.5 flex-shrink-0">
  <div class="flex items-end gap-2 border border-rw-border rounded-2xl px-3.5 py-1.5 pr-1.5
    bg-rw-surface focus-within:border-rw-focus focus-within:shadow-[0_0_0_3px_rgba(42,104,139,.10)]
    transition-all">
    <textarea rows="1" placeholder="Escribe tu pregunta aquí..."
      class="flex-1 min-h-[36px] max-h-[180px] resize-none border-0 bg-transparent text-rw-text
      text-sm leading-[1.6] py-[5px] outline-none placeholder:text-[#8c8c8c]"></textarea>
    <!-- Send button (busy: pulse dot, enabled: arrow icon) -->
    <button class="w-[38px] h-[38px] flex-shrink-0 border-0 rounded-rw-md bg-rw-primary text-white
      grid place-items-center hover:bg-rw-primary-h active:scale-[.96]
      disabled:bg-rw-solid disabled:text-rw-muted disabled:cursor-default transition-all">
      <!-- cuando loading -->
      <span class="w-[7px] h-[7px] rounded-full bg-white/80" style="animation:pulse 1.2s ease-in-out infinite"></span>
      <!-- cuando enabled -->
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"/>
        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
      </svg>
    </button>
  </div>
  <div class="flex justify-between pt-[5px] px-0.5 text-[10px] font-semibold uppercase tracking-[.06em] text-rw-muted opacity-55">
    <span>Enter envía · Shift+Enter nueva línea</span>
    <span>128 chars</span>
  </div>
</div>
```

**Auto-expand:** en JS/framework, al cambiar value: `el.style.height='0'; el.style.height=min(el.scrollHeight,200)+'px'`

---

## Markdown Body

Aplicar como bloque `<style>` ya que Tailwind CDN no incluye `@tailwindcss/typography`.

```css
.markdown-body { color: var(--rw-text, #161513); font-size: 14px; line-height: 1.76; }
.markdown-body h1,.markdown-body h2,.markdown-body h3 { margin: 1rem 0 .55rem; font-weight:700; letter-spacing:-.02em; }
.markdown-body p,.markdown-body ul,.markdown-body ol,.markdown-body pre,.markdown-body table,.markdown-body blockquote { margin: .65rem 0; }
.markdown-body ul,.markdown-body ol { padding-left: 1.3rem; }
.markdown-body blockquote { border-left: 3px solid var(--rw-primary,#227e9e); padding-left:.9rem; color:var(--rw-muted,#5c5c5c); }
.markdown-body code { background:var(--rw-solid,#e5e8eb); padding:.1rem .3rem; border-radius:6px; font-size:.88em; }
.markdown-body pre { background:var(--rw-cta,#312d2a); color:#f8fafc; padding:.9rem 1rem; border-radius:10px; overflow-x:auto; }
.markdown-body pre code { background:transparent; padding:0; color:inherit; }
.markdown-body table { width:100%; border-collapse:collapse; border:1px solid var(--rw-border,#dfe4e9); border-radius:10px; overflow:hidden; }
.markdown-body th,.markdown-body td { border-bottom:1px solid var(--rw-border,#dfe4e9); padding:.6rem .75rem; text-align:left; vertical-align:top; }
.markdown-body th { background:var(--rw-page,#f2f2f4); font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.05em; }
```

---

## Animaciones del sistema

```css
@keyframes softEnter { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
@keyframes pulse      { 0%{box-shadow:0 0 0 0 rgba(34,126,158,.4)} 70%{box-shadow:0 0 0 7px rgba(34,126,158,0)} 100%{box-shadow:0 0 0 0 rgba(34,126,158,0)} }
@keyframes pulseWhite { 0%{box-shadow:0 0 0 0 rgba(255,255,255,.4)} 70%{box-shadow:0 0 0 7px rgba(255,255,255,0)} 100%{box-shadow:0 0 0 0 rgba(255,255,255,0)} }
@keyframes icon-pop   { from{transform:scale(.6);opacity:0} to{transform:scale(1);opacity:1} }
@keyframes toast-in   { from{opacity:0;transform:translateX(-50%) translateY(12px) scale(.94)} to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} }
```
