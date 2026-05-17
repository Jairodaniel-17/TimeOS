# Oracle Redwood — NetSuite / Suitelet

Guía específica para usar el sistema Redwood en NetSuite Suitelets y SuiteScript.
Lee este archivo solo cuando el target sea NetSuite (`context.response.write(html)`).

---

## Modo CDN play (obligatorio en Suitelet)

Suitelets no tienen build step. Usa siempre el CDN play de Tailwind con config inline:

```html
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = { theme: { extend: { /* tokens aquí */ } } }
</script>
```

No uses `@import "tailwindcss"` ni `@theme {}` — esos requieren build (Vite/webpack).
Ver bloque completo de config en `tokens.md`.

---

## Estructura de Suitelet

```javascript
// SuiteScript 2.1 — Suitelet entry point
define(['N/ui/serverWidget', 'N/record'], (ui, record) => {
  const onRequest = (context) => {
    if (context.request.method === 'GET') {
      context.response.write(buildHtml())
    }
  }
  return { onRequest }
})

function buildHtml() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet"
    href="https://static.oracle.com/cdn/fnd/gallery/2507.0.0/OracleFont/OracleFont.min.css">
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script>
    tailwind.config = { /* ... */ }
  <\/script>
</head>
<body class="font-sans antialiased bg-rw-page text-rw-text min-h-screen">
  <!-- contenido -->
</body>
</html>`
}
```

---

## Diferencias Suitelet vs SPA

| Aspecto | Suitelet | SPA (Vue/Svelte/React) |
|---|---|---|
| Tailwind | CDN play + `tailwind.config` | `@theme {}` en CSS (v4) o `tailwind.config.js` (v3) |
| Nombres de clase | `rw-*`, `badge-*` (config extend) | `redwood-*` (v4 `@theme`) |
| JS interactivo | Vanilla JS al final del `<body>` | Componentes reactivos del framework |
| Fuente de Oracle | CDN en `<head>` (igual) | CDN en `index.html` o `<head>` (igual) |
| Forms | `<form method="POST">` a la misma URL | fetch/axios a API |
| Custom Select | JS vanilla `data-select` pattern | Componente framework |

---

## Nota sobre nombres de clase por modo

El CDN play usa `extend` → los tokens son `rw-page`, `badge-neutral-bg`, etc.
El modo build con v4 usa `@theme` → los tokens son `redwood-page`, `redwood-border`, etc. (como en `app.css` del proyecto Svelte).

Cuando generes código para Suitelet, usa los nombres del CDN play.
Cuando generes para un proyecto con build, usa los nombres del `@theme` del proyecto.
Si no está claro, pregunta o asume CDN play (más compatible).

---

## RESTlet endpoint pattern

Para Suitelets que consumen un RESTlet:

```javascript
// fetch desde el Suitelet HTML (JS vanilla)
async function callRESTlet(payload) {
  const url = document.getElementById('restlet-url').value
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return res.json()
}
```

```html
<!-- Pasar URL desde SuiteScript al HTML -->
<input type="hidden" id="restlet-url"
  value="${restletUrl}">
```
