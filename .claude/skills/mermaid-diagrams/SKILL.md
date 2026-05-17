---
name: mermaid-diagrams
description: >
  Generate, render, and display Mermaid diagrams as high-quality SVGs using mermaid-cli (mmdc v11.14.0).
  Activate this skill IMMEDIATELY whenever the user asks to create, draw, render, or visualize ANY diagram
  using Mermaid — flowcharts, sequence diagrams, class diagrams, ER diagrams, Gantt charts, state diagrams,
  mindmaps, C4 diagrams, architecture diagrams, ZenUML, timelines, gitgraphs, kanban, sankey, XY charts,
  block diagrams, packet diagrams, quadrant charts, pie charts, requirement diagrams, radar charts, treemaps,
  and more. Trigger on: "make a diagram", "draw this flow", "visualize this architecture", "create a mermaid
  chart", "diagram of X", "sequence diagram for Y", or any .mmd file reference. Always output SVG — never
  PNG or PDF unless explicitly requested. This skill handles full setup, chromium wiring, icon packs,
  participant stereotypes/annotators, and syntax validation.
---

# Mermaid Diagrams Skill

Render any Mermaid diagram to crisp SVG using `mmdc` (mermaid-cli v11.14.0 / mermaid v11.15.0).

## Reference Files Index

Read the relevant reference file **before** writing any `.mmd` code:

| Reference | Read when... |
|-----------|-------------|
| `references/setup.md` | **Always first** — env bootstrap, render command, workflow |
| `references/sequence.md` | `sequenceDiagram` — full syntax incl. stereotypes (boundary, control, entity, database, collections, queue) |
| `references/zenuml.md` | `zenuml` — alternative sequence with annotators (@Actor, @Database, etc.) |
| `references/flowchart.md` | `flowchart` / `graph` — nodes, edges, shapes, subgraphs, styling |
| `references/architecture.md` | `architecture-beta` — cloud/infra diagrams with icon packs |
| `references/class-er-state.md` | `classDiagram`, `erDiagram`, `stateDiagram-v2` |
| `references/other-diagrams.md` | `gantt`, `gitGraph`, `mindmap`, `timeline`, `pie`, `quadrantChart`, `xyChart`, `kanban`, `sankey`, `block`, `C4Context`, `requirementDiagram`, `packet`, `radar`, `treemap`, `userJourney` |
| `references/errors.md` | Syntax errors, gotchas, escape codes, common fixes |

## Quick Decision Guide

```
User wants a diagram?
  → Always read references/setup.md first
  → Identify diagram type → read the relevant reference
  → Write .mmd → render → present_files
```

**Never guess syntax from memory alone** — Mermaid v11 has many non-obvious rules (e.g. participant stereotypes use JSON `@{}` syntax, ER entity names can't use hyphens). Always check the reference.
