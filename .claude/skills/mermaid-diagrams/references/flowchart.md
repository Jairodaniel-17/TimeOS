# Flowchart Syntax Reference

Keywords: `flowchart` or `graph` (both work)

---

## Direction

```
flowchart TD   ← Top-Down (also TB)
flowchart LR   ← Left-Right
flowchart RL   ← Right-Left
flowchart BT   ← Bottom-Top
```

---

## Node Shapes (classic)

```
A              ← default rectangle (id = label)
A[Label]       ← rectangle with label
A(Label)       ← rounded corners
A([Label])     ← stadium/pill
A[[Label]]     ← subroutine (double vertical bar)
A[(Label)]     ← cylinder/database
A((Label))     ← circle
A>Label]       ← asymmetric (flag right)
A{Label}       ← diamond/rhombus
A{{Label}}     ← hexagon
A[/Label/]     ← parallelogram (lean right)
A[\Label\]     ← parallelogram alt (lean left)
A[/Label\]     ← trapezoid
A[\Label/]     ← trapezoid alt
A(((Label)))   ← double circle
```

---

## Expanded Node Shapes (v11.3.0+)

Use `@{ shape: name }` syntax:

```
A@{ shape: rect }         ← rectangle (proc, process, rectangle)
A@{ shape: rounded }      ← event (event)
A@{ shape: stadium }      ← terminal (pill, terminal)
A@{ shape: fr-rect }      ← subprocess (framed-rectangle, subproc, subroutine)
A@{ shape: cyl }          ← database (cylinder, database, db)
A@{ shape: circle }       ← start (circ)
A@{ shape: sm-circ }      ← small start (small-circle, start)
A@{ shape: dbl-circ }     ← stop (double-circle)
A@{ shape: fr-circ }      ← framed stop (framed-circle, stop)
A@{ shape: diam }         ← decision (decision, diamond, question)
A@{ shape: hex }          ← prepare/condition (hexagon, prepare)
A@{ shape: lean-r }       ← data input/output (in-out, lean-right)
A@{ shape: lean-l }       ← data output/input (lean-left, out-in)
A@{ shape: trap-b }       ← priority (priority, trapezoid, trapezoid-bottom)
A@{ shape: trap-t }       ← manual op (inv-trapezoid, manual, trapezoid-top)
A@{ shape: doc }          ← document (doc, document)
A@{ shape: docs }         ← multi-doc (documents, st-doc, stacked-document)
A@{ shape: delay }        ← delay (half-rounded-rectangle)
A@{ shape: h-cyl }        ← direct access storage (das, horizontal-cylinder)
A@{ shape: lin-cyl }      ← disk storage (disk, lined-cylinder)
A@{ shape: curv-trap }    ← display (curved-trapezoid, display)
A@{ shape: div-rect }     ← divided process (div-proc, divided-process)
A@{ shape: notch-rect }   ← card (card, notched-rectangle)
A@{ shape: lin-rect }     ← shaded process (lin-proc, lined-process)
A@{ shape: fork }         ← fork/join (join)
A@{ shape: f-circ }       ← junction (filled-circle, junction)
A@{ shape: cross-circ }   ← summary (crossed-circle, summary)
A@{ shape: bow-rect }     ← stored data (bow-tie-rectangle, stored-data)
A@{ shape: cloud }        ← cloud
A@{ shape: bolt }         ← com link (com-link, lightning-bolt)
A@{ shape: tri }          ← extract (extract, triangle)
A@{ shape: win-pane }     ← internal storage (internal-storage, window-pane)
A@{ shape: hourglass }    ← collate (collate)
A@{ shape: brace }        ← comment left (brace-l, comment)
A@{ shape: brace-r }      ← comment right
A@{ shape: braces }       ← comment both sides
A@{ shape: notch-pent }   ← loop limit (loop-limit, notched-pentagon)
A@{ shape: flip-tri }     ← manual file (flipped-triangle, manual-file)
A@{ shape: sl-rect }      ← manual input (manual-input, sloped-rectangle)
A@{ shape: flag }         ← paper tape (paper-tape)
A@{ shape: tag-doc }      ← tagged document
A@{ shape: tag-rect }     ← tagged process (tag-proc, tagged-process)
A@{ shape: datastore }    ← data store (data-store)
A@{ shape: odd }          ← odd shape
A@{ shape: text }         ← text block
```

### Icon and Image shapes (v11.3.0+)
```
A@{ shape: icon, icon: "fa:fa-rocket", form: "circle", label: "Launch" }
A@{ img: "https://example.com/img.png", label: "My Image", h: 60, constraint: "on" }
```

---

## Links / Edges

```
A --> B          ← arrow
A --- B          ← open link (no arrow)
A -- text --> B  ← arrow with label
A -->|text| B    ← arrow with label (alt syntax)
A -.-> B         ← dotted arrow
A -. text .-> B  ← dotted with label
A ==> B          ← thick arrow
A == text ==> B  ← thick with label
A ~~~ B          ← invisible link (layout helper)
A --o B          ← circle edge
A --x B          ← cross edge
A <--> B         ← bidirectional arrow
```

### Link length (extra dashes = longer span)
```
A --> B     ← rank span 1
A ---> B    ← span 2
A ----> B   ← span 3
A ==> B / A ===> B / A ====> B
A -.-> B / A -..-> B / A -...-> B
```

### Edge IDs and animation (v11+)
```
e1@A --> B
e1@{ animate: true }
e2@A --> C
e2@{ animation: fast }   ← or: slow
```

---

## Subgraphs

```
subgraph Title
    A --> B
end

subgraph myId[My Title]
    C --> D
end

subgraph myId
    direction LR    ← subgraph-level direction
    E --> F
end
```

Edges to/from subgraphs:
```
A --> myId
myId --> B
```

---

## Styling

### Inline style
```
style A fill:#f9f,stroke:#333,stroke-width:2px,color:#fff
```

### classDef
```
classDef myClass fill:#f96,stroke:#333,stroke-width:2px
class A,B myClass

%%  Or inline with :::
A:::myClass --> B
```

---

## Markdown Labels (bold/italic in nodes)
```
flowchart LR
    A["`**Bold** and *italic*`"] --> B["`Normal text
    with line break`"]
```

---

## Special characters
Wrap in quotes to use `<>(){}`:
```
A["Node with (parens)"] --> B["Text & more"]
```
Entity codes: `#lt;` `#gt;` `#amp;` `#quot;` `#35;` (for #)

---

## Full Example
```
flowchart TD
    Start([Start]) --> Auth{Authenticated?}
    Auth -->|yes| Dashboard[/Load Dashboard/]
    Auth -->|no| Login[(Login Form)]
    Login --> Validate@{ shape: diam }
    Validate -->|valid| Dashboard
    Validate -->|invalid| Error[Error Message]
    Dashboard --> End([End])

    style Start fill:#4CAF50,color:#fff
    style Error fill:#f44336,color:#fff
```
