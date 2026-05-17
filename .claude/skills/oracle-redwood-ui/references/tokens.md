# Oracle Redwood — Design Tokens → Tailwind Classes

Fuente de verdad para todos los valores visuales del sistema.
**Nunca usar hex hardcoded fuera de esta tabla en componentes nuevos.**

---

## Tailwind Config Block (copiar al `<head>` de cada documento)

```js
tailwind.config = {
  theme: {
    extend: {
      colors: {
        rw: {
          page:          '#f2f2f4',   /* bg-rw-page       */
          surface:       '#ffffff',   /* bg-rw-surface     */
          'surface-soft':'#f8f9fb',   /* bg-rw-surface-soft*/
          solid:         '#e5e8eb',   /* bg-rw-solid       */
          hover:         '#efefef',   /* hover:bg-rw-hover */
          selected:      '#eaf2fb',   /* bg-rw-selected    */
          'selected-bd': '#0572ce',   /* border-rw-selected-bd / text-rw-selected-bd */
          primary:       '#227e9e',   /* bg-rw-primary / text-rw-primary  */
          'primary-h':   '#045a9c',   /* hover:bg-rw-primary-h            */
          cta:           '#312d2a',   /* bg-rw-cta                        */
          'cta-h':       '#1a1816',   /* hover:bg-rw-cta-h                */
          danger:        '#b23021',   /* bg-rw-danger / text-rw-danger    */
          'danger-h':    '#8c2418',   /* hover:bg-rw-danger-h             */
          success:       '#436a28',   /* text-rw-success                  */
          warning:       '#96611c',   /* text-rw-warning                  */
          info:          '#006692',   /* text-rw-info                     */
          text:          '#161513',   /* text-rw-text                     */
          muted:         '#5c5c5c',   /* text-rw-muted                    */
          border:        '#dfe4e9',   /* border-rw-border                 */
          focus:         '#2a688b',   /* focus-visible:outline-rw-focus   */
        },
        badge: {
          'neutral-bg':  '#e9e9e9',   /* bg-badge-neutral-bg  */
          'success-bg':  '#d7e8cc',   /* bg-badge-success-bg  */
          'warning-bg':  '#f8ead4',   /* bg-badge-warning-bg  */
          'info-bg':     '#d6e6ef',   /* bg-badge-info-bg     */
          'danger-bg':   '#fde0df',   /* bg-badge-danger-bg   */
        },
        oracle: {
          red:           '#c74634',   /* bg-oracle-red    (brand mark) */
          sidebar:       '#312d2a',   /* bg-oracle-sidebar             */
        },
        alert: {
          bg:            '#f8ead4',   /* bg-alert-bg     */
          border:        '#e6d0a7',   /* border-alert-border */
          text:          '#4c4237',   /* text-alert-text */
        },
        code: {
          bg:            '#edf2f7',   /* bg-code-bg   */
          text:          '#305d63',   /* text-code-text */
        }
      },
      fontFamily: {
        sans: ['"Oracle Sans"', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'rw-sm': '6px',    /* rounded-rw-sm — code-pill, badges         */
        'rw-md': '10px',   /* rounded-rw-md — inputs, botones, nav-item */
        'rw-lg': '14px',   /* rounded-rw-lg — cards, stat-cards, alert  */
      },
      boxShadow: {
        'rw-sm': '0 1px 3px rgba(0,0,0,.10)',    /* shadow-rw-sm — cards          */
        'rw-md': '0 8px 22px rgba(0,0,0,.08)',   /* shadow-rw-md — dropdowns      */
        'rw-lg': '0 18px 45px rgba(0,0,0,.12)',  /* shadow-rw-lg — dialogs/modals */
      },
    }
  }
}
```

---

## Mapeo de tokens a clases Tailwind

### Fondos
| Token | Color | Clase Tailwind |
|---|---|---|
| page | `#f2f2f4` | `bg-rw-page` |
| surface | `#ffffff` | `bg-rw-surface` |
| surface-soft | `#f8f9fb` | `bg-rw-surface-soft` |
| solid | `#e5e8eb` | `bg-rw-solid` |
| hover | `#efefef` | `hover:bg-rw-hover` |
| selected | `#eaf2fb` | `bg-rw-selected` |

### Acciones
| Token | Color | Clase Tailwind |
|---|---|---|
| primary | `#227e9e` | `bg-rw-primary` / `text-rw-primary` |
| primary-hover | `#045a9c` | `hover:bg-rw-primary-h` |
| cta | `#312d2a` | `bg-rw-cta` |
| cta-hover | `#1a1816` | `hover:bg-rw-cta-h` |
| danger | `#b23021` | `bg-rw-danger` / `text-rw-danger` |
| danger-hover | `#8c2418` | `hover:bg-rw-danger-h` |

### Texto
| Token | Color | Clase Tailwind |
|---|---|---|
| text | `#161513` | `text-rw-text` |
| muted | `#5c5c5c` | `text-rw-muted` |
| success | `#436a28` | `text-rw-success` |
| warning | `#96611c` | `text-rw-warning` |
| info | `#006692` | `text-rw-info` |

### Bordes y foco
| Token | Color | Clase Tailwind |
|---|---|---|
| border | `#dfe4e9` | `border-rw-border` |
| focus | `#2a688b` | `focus-visible:outline-rw-focus` |
| selected-border | `#0572ce` | `border-rw-selected-bd` |

### Radios
| Token | Valor | Clase Tailwind |
|---|---|---|
| sm | `6px` | `rounded-rw-sm` |
| md | `10px` | `rounded-rw-md` |
| lg | `14px` | `rounded-rw-lg` |

### Sombras
| Token | Clase Tailwind |
|---|---|
| sm — cards | `shadow-rw-sm` |
| md — dropdowns | `shadow-rw-md` |
| lg — dialogs | `shadow-rw-lg` |

### Badges
| Variante | BG clase | Text clase |
|---|---|---|
| neutral | `bg-badge-neutral-bg` | `text-rw-text` |
| success | `bg-badge-success-bg` | `text-rw-success` |
| warning | `bg-badge-warning-bg` | `text-rw-warning` |
| info | `bg-badge-info-bg` | `text-rw-info` |
| danger | `bg-badge-danger-bg` | `text-rw-danger` |

---

## Tokens especiales (Tailwind arbitrario o clase directa)

| Token | Valor | Uso | Notación Tailwind |
|---|---|---|---|
| Sidebar bg | `#312d2a` | Fondo del `<aside>` | `bg-oracle-sidebar` |
| Brand mark | `#c74634` | Cuadrado de logo | `bg-oracle-red` |
| Sidebar text | `rgba(255,255,255,.82)` | Nav items inactivos | `text-white/[.82]` |
| Sidebar hover | `rgba(255,255,255,.12)` | Nav item activo/hover | `bg-white/[.12]` |
| Sidebar divider | `rgba(255,255,255,.18)` | Borde brand section | `border-white/[.18]` |
| Warning border (stat) | `#cd7d1a` | `border-l` del stat-card.warning | `border-l-[#cd7d1a]` |
| Warning fill (progress) | `#cd7d1a` | progress-fill warning | `bg-[#cd7d1a]` |
| Alert icon bg | `rgba(150,97,28,.16)` | Fondo del ícono de alert | `bg-[rgba(150,97,28,.16)]` |
| Alert bg | `#f8ead4` | Fondo de alert | `bg-alert-bg` |
| Alert border | `#e6d0a7` | Borde de alert | `border-alert-border` |
| Alert text | `#4c4237` | Texto de alert | `text-alert-text` |
| Empty state border | `#abcbe0` | Borde dashed empty-state | `border-[#abcbe0]` |
| Empty mark bg | `#d6e6ef` | Fondo ícono empty-state | `bg-[#d6e6ef]` |
| Code pill bg | `#edf2f7` | Fondo de code-pill | `bg-code-bg` |
| Code pill text | `#305d63` | Texto de code-pill | `text-code-text` |

---

## Tipografía — clases Tailwind

| Elemento | font-size | font-weight | Clase Tailwind |
|---|---|---|---|
| h1 (page title) | 30px | 700 | `text-[30px] font-bold tracking-[-0.035em]` |
| card-title | 17px | 700 | `text-[17px] font-bold tracking-[-0.01em]` |
| dialog-title | 18px | 800 | `text-lg font-extrabold` |
| stat-value | 30px | 800 | `text-[30px] font-extrabold leading-none tracking-[-0.04em]` |
| btn | 14px | 600 | `text-sm font-semibold` |
| label | 13px | 700 | `text-[13px] font-bold` |
| eyebrow | 13px | 600 | `text-[13px] font-semibold uppercase tracking-[.08em] text-rw-muted` |
| thead | 12px | 800 | `text-xs font-extrabold uppercase tracking-[.05em] text-rw-muted` |
| badge | 12px | 700 | `text-xs font-bold` |
| cell-sub | 12px | 400 | `text-xs text-rw-muted mt-0.5` |
| lead | 15px | 400 | `text-[15px] text-rw-muted leading-[1.55]` |

---

## Dimensiones fijas

| Elemento | Valor | Clase Tailwind |
|---|---|---|
| Sidebar width | 260px | `style="grid-template-columns: 260px minmax(0,1fr)"` |
| Input/btn min-height | 40px | `min-h-[40px]` |
| Stat card min-height | 118px | `min-h-[118px]` |
| Stat card border-left | 4px | `border-l-4` |
| Progress track height | 9px | `h-[9px]` |
| Tab border-bottom active | 3px | `border-b-[3px]` |
| Empty-mark size | 54px | `w-[54px] h-[54px]` |
| Alert icon size | 28px | `w-7 h-7` |
| Brand mark size | 38px | `w-[38px] h-[38px]` |
| Nav dot size | 8px | `w-2 h-2` |

---

## Tailwind v4 — `@theme` (proyectos con build)

Para proyectos Svelte/Vue/React con Vite y `@import "tailwindcss"` en el CSS principal.
Los nombres de clase son `redwood-*` en vez de `rw-*`.

```css
/* app.css o globals.css */
@import "tailwindcss";

@theme {
  --color-redwood-page:           #f2f2f4;
  --color-redwood-surface:        #ffffff;
  --color-redwood-primary:        #227e9e;
  --color-redwood-primary-hover:  #045a9c;
  --color-redwood-danger:         #b23021;
  --color-redwood-danger-hover:   #8c2418;
  --color-redwood-cta:            #312d2a;
  --color-redwood-cta-hover:      #1a1816;
  --color-redwood-hover-bg:       #efefef;
  --color-redwood-selected-bg:    #eaf2fb;
  --color-redwood-selected-border:#0572ce;
  --color-redwood-focus-ring:     #2a688b;
  --color-redwood-text:           #161513;
  --color-redwood-muted:          #5c5c5c;
  --color-redwood-border:         #dfe4e9;
  --color-redwood-solid-bg:       #e5e8eb;
  --color-redwood-green:          #436a28;

  /* Badges — variante subtle */
  --color-badge-subtle-neutral-bg: #e9e9e9;
  --color-badge-subtle-danger-bg:  #fde0df;
  --color-badge-subtle-warning-bg: #f8ead4;
  --color-badge-subtle-success-bg: #d7e8cc;
  --color-badge-subtle-info-bg:    #d6e6ef;

  /* Badges — variante strong */
  --color-badge-strong-neutral-bg: #777777;
  --color-badge-strong-warning-bg: #96611c;
  --color-badge-strong-success-bg: #436a28;
  --color-badge-strong-info-bg:    #006692;

  --font-sans: "Oracle Sans", ui-sans-serif, system-ui, sans-serif;

  --shadow-rw:          0 1px 3px rgba(0,0,0,.10);
  --shadow-rw-dropdown: 0 8px 22px rgba(0,0,0,.08);
  --shadow-rw-lg:       0 18px 45px rgba(0,0,0,.12);
}

html, body, #app { min-height: 100%; }
body { @apply bg-redwood-page text-redwood-text font-sans antialiased; }
```

### Mapeo CDN play → v4 build

| CDN play (`tailwind.config extend`) | v4 build (`@theme`) |
|---|---|
| `bg-rw-page` | `bg-redwood-page` |
| `bg-rw-primary` | `bg-redwood-primary` |
| `border-rw-border` | `border-redwood-border` |
| `text-rw-muted` | `text-redwood-muted` |
| `bg-badge-neutral-bg` | `bg-badge-subtle-neutral-bg` |
| `shadow-rw-sm` | `shadow-rw` |
| `hover:bg-rw-hover` | `hover:bg-redwood-hover-bg` |
| `focus-visible:border-rw-focus` | `focus:border-redwood-focus-ring` |
