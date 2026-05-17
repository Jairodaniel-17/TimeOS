# Other Diagram Types Reference

---

## gantt

```
gantt
    title Project Plan
    dateFormat YYYY-MM-DD
    excludes weekends
    weekend friday          ← Fri-Sat weekends (v11.0+)

    section Phase 1
        Task A          :done,    t1, 2024-01-01, 7d
        Task B          :active,  t2, after t1, 5d
        Task C          :crit,    t3, after t2, 3d
        Milestone       :milestone, m1, 2024-01-20, 0d

    section Phase 2
        Task D          :t4, after t3, 10d
        Task E          :t5, after t4, until m2
        Milestone 2     :milestone, m2, 2024-02-10, 0d
```

### Task metadata format
```
Task label : [tags,] [id,] [start,] duration-or-end
```

Tags (first, optional): `done` `active` `crit` `milestone`

### Duration suffixes
`ms` `s` `m` `h` `d` `w` `M` `y`   (e.g. `3d`, `2w`, `1.5h`)

### Start specifiers
- `2024-01-15` — absolute date
- `after taskId` — after another task ends
- `after t1 t2` — after latest of t1, t2

### End specifier
- `until taskId` — end when another task starts (v10.9+)

---

## gitGraph

```
gitGraph
    commit
    commit id: "feat: login"
    branch develop
    checkout develop
    commit
    commit id: "fix: bug" type: HIGHLIGHT
    branch feature/oauth
    checkout feature/oauth
    commit
    commit
    checkout develop
    merge feature/oauth id: "Merge OAuth"
    checkout main
    merge develop tag: "v1.0.0"
    commit type: REVERSE
```

### Commit types
`NORMAL` (default) | `HIGHLIGHT` | `REVERSE`

### Operations
```
commit                      ← on current branch
commit id: "message"
commit tag: "v1.0"
commit type: HIGHLIGHT
branch branchName
checkout branchName         ← also: switch branchName
merge branchName
merge branchName id: "merge commit" tag: "tag" type: HIGHLIGHT
cherry-pick id: "commitId"
```

### Config
```
%%{init: {"gitGraph": {
    "mainBranchName": "main",
    "showCommitLabel": true,
    "rotateCommitLabel": true
}}}%%
gitGraph
    ...
```

---

## mindmap

```
mindmap
  root((Central Topic))
    Branch A
      Leaf 1
      Leaf 2
        Sub-leaf
    Branch B
      ::icon(fa fa-bolt)     ← FontAwesome icon
      Leaf 3
    Branch C
      Leaf 4[Square]
      Leaf 5(Rounded)
      Leaf 6((Circle))
      Leaf 7))Bang((
      Leaf 8)Cloud(
      Leaf 9{{Hexagon}}
```

Indentation defines hierarchy. No arrows — tree structure only.

**Node shapes in mindmap:**
| Syntax | Shape |
|--------|-------|
| `text` | default (rectangle) |
| `[text]` | square |
| `(text)` | rounded |
| `((text))` | circle |
| `))text((` | bang |
| `)text(` | cloud |
| `{{text}}` | hexagon |

---

## timeline

```
timeline
    title History of Technology
    2000 : Y2K Bug (didn't happen)
    2004 : Facebook founded
         : Second event same year
    2007 : iPhone launched
    2008 : Bitcoin whitepaper
    2010 : iPad released

    section 2020s
        2020 : COVID pandemic
             : Remote work boom
        2022 : ChatGPT launch
        2023 : AI revolution
```

Sections group time periods visually.

---

## pie

```
pie title "Device Share Q1 2024"
    "Mobile" : 54.8
    "Desktop" : 38.2
    "Tablet" : 7.0
```

With data values:
```
pie showData title "Sales by Category"
    "Electronics" : 42.3
    "Clothing" : 28.1
    "Food" : 19.6
    "Other" : 10.0
```

Values must be **positive numbers > 0**.

---

## quadrantChart

```
quadrantChart
    title Effort vs Impact Matrix
    x-axis Low Effort --> High Effort
    y-axis Low Impact --> High Impact
    quadrant-1 Quick Wins
    quadrant-2 Major Projects
    quadrant-3 Fill-ins
    quadrant-4 Thankless Tasks
    Fix Login Bug: [0.2, 0.9]
    Rewrite DB: [0.8, 0.7]
    Update Docs: [0.3, 0.3]
    Add Dark Mode: [0.5, 0.5]
```

Point values: both x and y must be between 0 and 1.

---

## xychart (XY Chart)

```
xychart
    title "Monthly Revenue 2024"
    x-axis [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
    y-axis "Revenue ($)" 0 --> 50000
    bar [12000, 15000, 18000, 14000, 20000, 25000, 30000, 28000, 22000, 19000, 16000, 35000]
    line [12000, 15000, 18000, 14000, 20000, 25000, 30000, 28000, 22000, 19000, 16000, 35000]
```

Horizontal orientation:
```
xychart horizontal
    ...
```

---

## kanban

```
kanban
    todo[To Do]
        t1[Write tests]
        t2[Fix login bug]
        t3[Update README]
    in_progress[In Progress]
        t4[Implement OAuth]@{ ticket: DEV-123, priority: High }
        t5[Database migration]
    review[Review]
        t6[API rate limiting]
    done[Done]
        t7[Setup CI/CD]
        t8[Docker containerization]
```

Task metadata (optional): `@{ ticket: "X", priority: "High" }`

---

## sankey

```
---
config:
  sankey:
    showValues: true
---
sankey
    Source A, Target B, 100
    Source A, Target C, 50
    Source B, Target D, 80
    Source C, Target D, 40
    Source C, Target E, 10
```

Format: `Source, Target, Value` (CSV-like, one flow per line).

---

## block

```
block
    columns 3
    A["Block A"]
    B["Block B"]
    C["Block C"]
    space
    D["Wide Block"]:3      ← span 3 columns
    A --> D
    B --> D
    C --> D
    style D fill:#f9f,stroke:#333
```

---

## C4Context / C4Container / C4Component / C4Dynamic

```
C4Context
    title System Context — Payment Platform

    Enterprise_Boundary(b0, "Company") {
        Person(customer, "Customer", "Makes purchases")
        System(payment, "Payment System", "Processes transactions")
        SystemDb(ledger, "Ledger DB", "Stores transactions")
    }

    System_Ext(bank, "Banking API", "External bank")
    System_Ext(email, "Email Service", "Sends receipts")

    Rel(customer, payment, "Uses", "HTTPS")
    Rel(payment, ledger, "Reads/Writes")
    Rel(payment, bank, "Charges card", "REST")
    Rel(payment, email, "Sends receipt", "SMTP")
    BiRel(customer, bank, "Checks balance")
```

**C4 diagram types:** `C4Context` `C4Container` `C4Component` `C4Dynamic` `C4Deployment`

**C4 elements:**
```
Person(id, "Label", "Description")
Person_Ext(id, "Label", "Description")
System(id, "Label", "Description")
System_Ext(id, "Label")
SystemDb(id, "Label", "Description")
SystemDb_Ext(id, "Label")
SystemQueue(id, "Label")
Container(id, "Label", "Tech", "Description")
ContainerDb(id, "Label", "Tech")
Component(id, "Label", "Tech")
Enterprise_Boundary(id, "Label") { ... }
System_Boundary(id, "Label") { ... }
Boundary(id, "Label", "type") { ... }
```

**C4 relationships:**
```
Rel(from, to, "label")
Rel(from, to, "label", "technology")
BiRel(from, to, "label")
Rel_U / Rel_D / Rel_L / Rel_R  ← directional hints
```

---

## requirementDiagram

```
requirementDiagram
    requirement test_req {
        id: 1
        text: "System shall handle 1000 concurrent users"
        risk: high
        verifymethod: test
    }
    functionalRequirement performance_req {
        id: 2
        text: "Response time under 200ms"
        risk: medium
        verifymethod: demonstration
    }
    element api_system {
        type: system
        docref: "API Spec v2.0"
    }
    api_system - satisfies -> test_req
    api_system - traces -> performance_req
```

---

## packet (Packet Diagram)

```
packet-beta
    title UDP Datagram
    0-15: "Source Port"
    16-31: "Destination Port"
    32-47: "Length"
    48-63: "Checksum"
    64-95: "Data (variable)"
```

---

## userJourney

```
journey
    title My Day
    section Morning
        Wake up: 3: Me
        Shower: 5: Me
        Breakfast: 4: Me, Partner
    section Work
        Commute: 2: Me
        Meetings: 1: Me
        Code review: 4: Me, Team
    section Evening
        Dinner: 5: Me, Partner
        Watch TV: 4: Me
```

Score 1–5 (low to high satisfaction). Multiple actors per step.

---

## radar (Radar Chart)

```
---
config:
  radar:
    axisScaleFactor: 0.8
---
radar
    title "Team Skills Assessment"
    "Python" : 90, 70, 85
    "JavaScript" : 75, 95, 60
    "DevOps" : 60, 50, 80
    "Architecture" : 85, 65, 70
    "Testing" : 70, 80, 75
```

---

## treemap

```
treemap
    title "Codebase Size by Module"
    root
        frontend: 45
        backend
            api: 30
            services: 25
            models: 15
        infrastructure: 20
        tests: 35
```
