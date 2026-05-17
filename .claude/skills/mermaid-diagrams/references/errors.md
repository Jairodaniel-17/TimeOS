# Errors, Gotchas & Fixes

---

## Runtime / Setup Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Failed to launch the browser process` + `--no-sandbox` | Running as root without sandbox flag | Ensure `/tmp/mmdc-puppeteer.json` has `"args": ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]` |
| `npm error: Failed to set up chrome v148` | Blocked CDN during npm install | Always install with `PUPPETEER_SKIP_DOWNLOAD=true npm install -g @mermaid-js/mermaid-cli` |
| `mmdc: command not found` | Not installed | Run `PUPPETEER_SKIP_DOWNLOAD=true npm install -g @mermaid-js/mermaid-cli` |
| Output SVG is empty / 0 bytes | Render failed silently with `-q` | Remove `-q` temporarily to see full error |

---

## Parse Errors

| Error message | Cause | Fix |
|--------------|-------|-----|
| `Parse error on line N: Expecting 'NEWLINE'` | Missing newline between statements | Each node/edge on its own line |
| `Parse error on line N: got 'NODE_STRING'` | Invalid char or unquoted special char | Wrap label in `"quotes"` |
| `Unknown diagram type` | Typo in diagram keyword | Use exact keyword (case-sensitive): `flowchart` `sequenceDiagram` `classDiagram` `erDiagram` `stateDiagram-v2` `gantt` `mindmap` `timeline` `quadrantChart` `gitGraph` `C4Context` `architecture-beta` `zenuml` `kanban` `sankey` `xychart` `block` `pie` `requirementDiagram` `packet-beta` `journey` `radar` `treemap` |
| `The word "end" breaks the diagram` | `end` used as node label | Use `(end)` `[end]` `{end}` or `"end"` |

---

## Diagram-specific Gotchas

### Flowchart
- `A---oB` → circle edge (not a link). Use `A --- oB` (space) or `A---OB` (capitalize).
- `A---xB` → cross edge. Same fix: space or capitalize.
- Labels with parentheses: `A(text with (parens))` fails → use `A["text with (parens)"]`
- Subgraph direction only works if no external edges connect to internal nodes (otherwise inherits parent direction)
- `end` as node label breaks diagrams — capitalize: `End` or `END`

### Sequence Diagram
- `"end"` in message text is OK; as a participant name it breaks — use `[end]`
- Semicolons (`;`) act as line breaks in message text — use `#59;` to include a literal semicolon
- Participant stereotypes use exact JSON key `"type"` with these values only: `"boundary"` `"control"` `"entity"` `"database"` `"collections"` `"queue"`
- `create` only works for **recipient**, not sender

### ER Diagram
- **Hyphen in entity name parses as subtraction** → `LINE-ITEM` breaks; use `LINE_ITEM`
- Relationship label must be in quotes if multi-word: `CUSTOMER ||--o{ ORDER : "places order"`

### Class Diagram
- Generic type syntax uses tilde `~` not angle brackets: `List~int~` not `List<int>`
- Class names with special chars need backticks: `` `My Class!` ``
- Visibility symbols (`+` `-` `#` `~`) must immediately precede the member name — no space

### State Diagram
- Use `stateDiagram-v2` (not `stateDiagram`) for nested states and parallel regions
- `[*]` for start/end — direction of transition determines which

### Gantt
- `excludes weekends` doesn't accept `weekdays` — only specific dates, day names, or `weekends`
- Milestone duration must be `0d`
- `until taskId` requires v10.9+

### Architecture
- Edge sides are strict: `L` `R` `T` `B` — must match case exactly
- `{group}` modifier: use `service{group}:side`, not `groupId:side`
- Default icons: only `cloud` `database` `disk` `internet` `server` — others need icon pack

### ZenUML
- Keyword is `zenuml` (not `zenuml-sequence` or anything else)
- Annotators are `@AnnotatorName ParticipantId` — the `@` is literal, not JSON
- Async: `A->B: msg`, Sync: `A.method()` — different syntax!

### Mindmap
- Pure indentation-based — no arrows, no explicit edges
- Inconsistent indentation = parse error

---

## Special Characters & Escapes

### In flowchart labels
```
A["Text with <angle> brackets"]
A["Text & ampersand"]
A["Quote: #quot;hello#quot;"]
A["Hash: #35;"]
```

HTML entity codes work in labels:
| Want | Code |
|------|------|
| `<` | `#lt;` |
| `>` | `#gt;` |
| `&` | `#amp;` |
| `"` | `#quot;` |
| `#` | `#35;` |

### In sequence message text
```
A->>B: I #9829; you!       ← ♥ (heart)
A->>B: #infin; times       ← ∞
A->>B: #semi; in text      ← ; (semicolon — use #59; alternatively)
```

### Line breaks in labels
- Flowchart nodes: use markdown strings with backticks `` "`line1\nline2`" ``
- Sequence notes/messages: use `<br/>`
- Sequence actor name with line break: requires alias: `participant Alice as Alice<br/>Johnson`

---

---

## Color Support Matrix (validated empirically)

### ✅ FUNCIONA

| Método | Dónde | Ejemplo |
|--------|-------|---------|
| Hex `#RRGGBB` | `style`, `classDef`, cualquier diagrama | `style A fill:#4CAF50,color:#fff,stroke:#2E7D32` |
| Named colors CSS | `style`, `classDef` | `style A fill:tomato,color:white,stroke:darkred` |
| `themeVariables` vía `%%{init}%%` | Cualquier diagrama | `%%{init: {"theme":"base","themeVariables":{"primaryColor":"#BB2528"}}}%%` |
| `themeVariables` vía JSON config `-c` | Cualquier diagrama | Poner `themeVariables` en `/tmp/mmdc-config.json` con `"theme":"base"` |
| Temas built-in `-t` | Global | `-t default` `-t forest` `-t dark` `-t neutral` |
| Background `-b` | Canvas del SVG | `-b transparent` `-b white` `-b "#1a2b3c"` |
| External CSS `--cssFile` | Clases CSS del SVG renderizado | `--cssFile /tmp/styles.css` (usar `!important`) |
| `stroke-dasharray` | `style`/`classDef` | `stroke-dasharray:5 5` (valores separados por **espacio**, no coma) |
| `rgb(R,G,B)` / `rgba()` | Solo en `rect` de `sequenceDiagram` | `rect rgb(191, 223, 255)` |
| `rgb(R,G,B)` / `rgba()` | Solo en `box` de `sequenceDiagram` | `box rgb(33,66,99)` |
| `pie1`..`pie12` en `themeVariables` | `pie` diagram | `"themeVariables": {"pie1": "#FF6B6B", ...}` |
| `git0`..`git7` en `themeVariables` | `gitGraph` | `"themeVariables": {"git0": "#FF6B6B", ...}` |
| `actorBkg`, `signalColor`, etc. | `sequenceDiagram` themeVars | Ver lista abajo |
| `classDef` en `stateDiagram-v2` | Estados | `classDef myStyle fill:#4CAF50` |
| `style` en `classDiagram` | Clases | `style MyClass fill:#1565C0,color:#fff` |
| `look: handDrawn` + estilos hex | Flowchart | Via frontmatter `---\nconfig:\n  look: handDrawn\n---` |

### ❌ NO FUNCIONA (parse error)

| Método | Error | Workaround |
|--------|-------|-----------|
| `style fill:rgb(R,G,B)` en flowchart | `Parse error: got 'PS'` | Usar hex equivalente |
| `classDef fill:rgb(R,G,B)` en flowchart | `Parse error: got 'PS'` | Usar hex equivalente |
| `style fill:rgba(R,G,B,A)` en flowchart | `Parse error: got 'PS'` | Usar hex con opacity via themeVariables |
| `stroke-dasharray:5,5` con coma | Parse error | Usar espacio: `stroke-dasharray:5 5` |

**Regla clave:** `rgb()` y `rgba()` solo funcionan en contextos donde el parser no usa `,` como delimitador de propiedades. En `style` y `classDef` de flowchart/graph, la coma es delimitador → `rgb()` rompe. En `sequenceDiagram rect` y `box` tienen su propio parser que sí acepta `rgb()`.

### themeVariables de secuencia más útiles

```json
{
  "theme": "base",
  "themeVariables": {
    "actorBkg": "#1a237e",
    "actorTextColor": "#ffffff",
    "actorLineColor": "#7986cb",
    "signalColor": "#e91e63",
    "signalTextColor": "#ffffff",
    "noteBkgColor": "#fff9c4",
    "noteTextColor": "#f57f17",
    "activationBkgColor": "#e8f5e9",
    "activationBorderColor": "#2e7d32",
    "labelBoxBkgColor": "#f3e5f5",
    "labelBoxBorderColor": "#9c27b0",
    "loopTextColor": "#1b5e20",
    "sequenceNumberColor": "#ffffff"
  }
}
```

### themeVariables de flowchart más útiles

```json
{
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#1565C0",
    "primaryTextColor": "#ffffff",
    "primaryBorderColor": "#0D47A1",
    "lineColor": "#E91E63",
    "secondaryColor": "#2E7D32",
    "tertiaryColor": "#F57F17",
    "mainBkg": "#E3F2FD",
    "clusterBkg": "#E8F5E9",
    "edgeLabelBackground": "#fff9c4",
    "fontFamily": "monospace"
  }
}
```

---

## Debugging Checklist

When a diagram fails to render:

1. Remove `-q` flag to see full error output
2. Check the diagram keyword is spelled exactly right
3. Verify `/tmp/mmdc-puppeteer.json` exists and has `--no-sandbox`
4. Check for `end` as unquoted node label
5. Check for hyphens in ER entity names
6. Check for unquoted special chars (`<>(){}`) in labels
7. Check for consistent indentation (mindmap)
8. Run smoke test from `references/setup.md`

---

## Common Fixes Quick Reference

```bash
# Recreate puppeteer config if missing
cat > /tmp/mmdc-puppeteer.json << 'EOF'
{
  "executablePath": "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "args": ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
}
EOF

# Run without quiet to see errors
PUPPETEER_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  mmdc -i /tmp/diagram.mmd -o /tmp/test.svg -p /tmp/mmdc-puppeteer.json
  # (no -q flag)
```
