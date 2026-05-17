# Setup & Render Workflow

## Environment (run once per session)

```bash
# 1. Check mmdc
which mmdc 2>/dev/null || PUPPETEER_SKIP_DOWNLOAD=true npm install -g @mermaid-js/mermaid-cli

# 2. Puppeteer config (required — container runs as root, needs --no-sandbox)
cat > /tmp/mmdc-puppeteer.json << 'EOF'
{
  "executablePath": "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "args": ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
}
EOF

# 3. Mermaid default config
cat > /tmp/mmdc-config.json << 'EOF'
{
  "theme": "default",
  "flowchart": { "curve": "basis" },
  "securityLevel": "loose"
}
EOF
```

**Key facts:**
- Chromium path: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (Playwright-managed, always present)
- `PUPPETEER_SKIP_DOWNLOAD=true` prevents blocked npm Chrome download (403 from Google CDN)
- `--no-sandbox` is **mandatory** when running as root — without it, Chromium refuses to start

---

## Render Command

```bash
PUPPETEER_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  mmdc \
    -i /tmp/<name>.mmd \
    -o /mnt/user-data/outputs/<name>.svg \
    -p /tmp/mmdc-puppeteer.json \
    -c /tmp/mmdc-config.json \
    -q
```

Always write SVG to `/mnt/user-data/outputs/` then call `present_files`.

---

## Full Workflow

1. Read the relevant `references/<type>.md` for exact syntax
2. Write diagram source to `/tmp/<name>.mmd`
3. Ensure `/tmp/mmdc-puppeteer.json` and `/tmp/mmdc-config.json` exist
4. Run the render command above
5. On **error** → read stderr, fix syntax (check `references/errors.md`), retry
6. On **success** → `present_files(["/mnt/user-data/outputs/<name>.svg"])`

**Never pipe directly into mmdc via heredoc** — always write the `.mmd` file first (stdin buffering issues).

---

## CLI Options Reference

| Flag | Default | Notes |
|------|---------|-------|
| `-t` | `default` | Theme: `default` `forest` `dark` `neutral` |
| `-b` | `white` | Background: `white` `transparent` `#RRGGBB` |
| `-w` | `800` | Page width px |
| `-H` | `600` | Page height px |
| `-s` | `1` | Scale (use `2` for high-DPI export) |
| `-c` | — | Mermaid JSON config path |
| `-p` | — | Puppeteer JSON config path (**always pass this**) |
| `-q` | — | Quiet: suppress logs, only show errors |

---

## Frontmatter & Init Directives

Diagrams can override config inline:

```
---
config:
  theme: dark
  look: handDrawn
---
flowchart TD
    A --> B
```

Or with `%%{init}%%` directive:

```
%%{init: {"theme": "forest", "sequence": {"mirrorActors": true}}}%%
sequenceDiagram
    ...
```

Both go at the very top of the `.mmd` file, before the diagram type keyword.

---

## Multiple Diagrams

Render each to a separate file, then present all together:

```bash
mmdc ... -i /tmp/d1.mmd -o /mnt/user-data/outputs/d1.svg ...
mmdc ... -i /tmp/d2.mmd -o /mnt/user-data/outputs/d2.svg ...
```

```python
present_files([
    "/mnt/user-data/outputs/d1.svg",
    "/mnt/user-data/outputs/d2.svg"
])
```

---

## Theming & Sizing Recipes

```bash
# Dark with transparent background
mmdc ... -t dark -b transparent

# High-res for embedding in docs
mmdc ... -s 2 -w 1600

# Wide sequence diagram
mmdc ... -w 1400 -H 900
```

---

## Smoke Test

When mmdc behaves unexpectedly, run this to verify environment:

```bash
echo "mmdc: $(mmdc --version 2>/dev/null)"
echo "chromium: $(/opt/pw-browsers/chromium-1194/chrome-linux/chrome --version 2>/dev/null | head -1)"
echo "puppeteer cfg: $(cat /tmp/mmdc-puppeteer.json 2>/dev/null || echo MISSING)"

printf 'graph TD\n    A[OK] --> B[Done]\n' > /tmp/smoke.mmd
PUPPETEER_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  mmdc -i /tmp/smoke.mmd -o /tmp/smoke.svg -p /tmp/mmdc-puppeteer.json -q
echo "exit: $? | size: $(wc -c < /tmp/smoke.svg 2>/dev/null || echo N/A) bytes"
```
