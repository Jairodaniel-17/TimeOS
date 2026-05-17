# Components — Layout: Shell, Topbar, Sidebar, Tabs

---

## Shell — Suitelet / HTML standalone

Grid fijo. Sidebar opcional.

```html
<body class="font-sans antialiased bg-rw-page text-rw-text min-h-screen">
  <!-- con sidebar -->
  <div class="grid min-h-screen" style="grid-template-columns:260px minmax(0,1fr)">
    <aside><!-- sidebar --></aside>
    <main class="min-w-0 p-7"><!-- contenido --></main>
  </div>

  <!-- sin sidebar -->
  <main class="min-w-0 p-7 max-w-[1400px] mx-auto"><!-- contenido --></main>
</body>
```

---

## Shell — SPA / Chat app (paneles flotantes)

Flex con paneles redondeados, padding exterior `14px`.

```html
<body class="font-sans antialiased bg-rw-page text-rw-text" style="height:100%;margin:0">
  <div style="height:100%;padding:14px">
    <div class="flex h-full gap-3 max-w-[1860px] mx-auto overflow-hidden">

      <!-- Sidebar panel colapsable (width:298px collapsed:62px) -->
      <aside class="relative flex-shrink-0 h-full transition-all duration-[250ms]" style="width:298px">
        <div class="bg-oracle-sidebar rounded-[18px] flex flex-col h-full overflow-hidden relative">
          <!-- toggle tab -->
          <button class="absolute top-1/2 -right-6 -translate-y-1/2 z-30 w-6 h-14 rounded-r-rw-md
            border border-white/[.10] border-l-0 bg-oracle-sidebar text-white/60 text-base font-extrabold
            grid place-items-center cursor-pointer hover:bg-[#3f3a36] hover:text-white transition-colors
            shadow-[4px_0_12px_rgba(0,0,0,.15)]">‹</button>
          <!-- panel content -->
        </div>
      </aside>

      <!-- Main workspace -->
      <div class="flex-1 min-w-0 h-full">
        <!-- workspace card -->
        <section class="bg-rw-surface border border-rw-border rounded-[18px] shadow-rw-sm
          flex flex-col h-full overflow-hidden" style="transform:translateZ(0)">
          <!-- header + content + composer -->
        </section>
      </div>

    </div>
  </div>
</body>
```

---

## Sidebar oscuro (nav)

```html
<aside class="bg-oracle-sidebar text-white flex flex-col gap-5 px-[18px] py-6">
  <!-- brand mark -->
  <div class="flex items-center gap-3 px-1.5 pb-[18px] border-b border-white/[.18]">
    <div class="w-[38px] h-[38px] rounded-xl bg-oracle-red grid place-items-center
      font-extrabold tracking-tighter text-white shrink-0">O</div>
    <div>
      <div class="text-[15px] font-bold leading-tight">Módulo</div>
      <div class="text-xs opacity-70 mt-0.5">Subtítulo</div>
    </div>
  </div>

  <!-- nav items -->
  <nav class="grid gap-1.5">
    <!-- activo -->
    <button class="w-full text-left text-white bg-white/[.12] rounded-rw-md px-3 py-2.5
      flex items-center gap-2.5 text-sm font-medium transition-colors">
      <span class="w-2 h-2 rounded-full bg-current opacity-75 shrink-0"></span>Dashboard
    </button>
    <!-- inactivo -->
    <button class="w-full text-left text-white/[.82] hover:text-white hover:bg-white/[.12]
      rounded-rw-md px-3 py-2.5 flex items-center gap-2.5 text-sm font-medium transition-colors">
      <span class="w-2 h-2 rounded-full bg-current opacity-75 shrink-0"></span>Reportes
    </button>
  </nav>
</aside>
```

---

## Topbar (header de página)

```html
<header class="flex justify-between items-start gap-5 mb-6">
  <div>
    <div class="text-[13px] font-semibold uppercase tracking-[.08em] text-rw-muted mb-2">Módulo / sección</div>
    <h1 class="text-[30px] leading-[1.12] tracking-[-0.035em] font-bold">Título de la página</h1>
    <p class="mt-2 text-rw-muted text-[15px] max-w-[720px] leading-[1.55]">Descripción breve.</p>
  </div>
  <div class="flex gap-2.5 flex-wrap justify-end">
    <!-- buttons de atoms/button.md -->
  </div>
</header>
```

---

## Tabs

### CDN play
```html
<div class="flex border-b border-rw-border gap-1 mb-5">
  <button class="px-4 py-2.5 text-sm font-semibold border-b-[3px] border-rw-primary text-rw-primary -mb-px bg-transparent">Activa</button>
  <button class="px-4 py-2.5 text-sm font-semibold border-b-[3px] border-transparent text-rw-muted hover:text-rw-text -mb-px bg-transparent transition-colors">Otra</button>
</div>
```

### Build v4 (Svelte — DashboardTabs pattern)
```html
<!-- Tab con counter badge opcional -->
<nav class="flex gap-1 overflow-x-auto border-b border-redwood-border pb-px">
  <!-- activa -->
  <button class="inline-flex shrink-0 items-center gap-2 rounded-t-lg border border-redwood-border
    border-b-0 px-4 py-3 text-sm font-semibold text-redwood-text bg-redwood-surface transition-colors">
    <span>Resumen</span>
    <small class="rounded-full border border-redwood-border bg-redwood-hover-bg
      px-2 py-0.5 text-[11px] font-semibold text-redwood-muted">24</small>
  </button>
  <!-- inactiva -->
  <button class="inline-flex shrink-0 items-center gap-2 rounded-t-lg border border-transparent
    border-b-0 px-4 py-3 text-sm font-semibold text-redwood-muted
    hover:bg-redwood-hover-bg hover:text-redwood-text transition-colors">
    <span>Por área</span>
  </button>
</nav>
```
Props `DashboardTabs`: `tabs: [{id, label, count?}]`, `activeTab: string` → emit `change`
