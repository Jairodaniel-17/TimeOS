# Sequence Diagram Syntax Reference

Keyword: `sequenceDiagram`

---

## Participant Types (Stereotypes)

All use the JSON config syntax `@{ "type": "..." }`:

```
sequenceDiagram
    participant Alice@{ "type": "boundary" }   ← system boundary (UML)
    participant Bob@{ "type": "control" }       ← controller/use-case
    participant Srv@{ "type": "entity" }        ← entity/domain object
    participant DB@{ "type": "database" }       ← cylinder database
    participant Col@{ "type": "collections" }   ← stacked cylinders
    participant Q@{ "type": "queue" }           ← queue/message shape
    actor User                                  ← stick figure (no @{} needed)
    participant Plain                           ← default rectangle
```

**All 7 stereotypes:**

| Keyword / config type | Shape |
|----------------------|-------|
| `actor` | Stick figure |
| `@{ "type": "boundary" }` | Circle on line (UML boundary) |
| `@{ "type": "control" }` | Circle with arrow (UML control) |
| `@{ "type": "entity" }` | Circle with line (UML entity) |
| `@{ "type": "database" }` | Cylinder |
| `@{ "type": "collections" }` | Stacked cylinders |
| `@{ "type": "queue" }` | Queue symbol |

---

## Aliases

### External alias (`as` keyword) — **takes precedence**
```
participant A as Alice
participant API@{ "type": "boundary" } as Public API
actor DB@{ "type": "database" } as User DB
```

### Inline alias (inside config object)
```
participant API@{ "type": "boundary", "alias": "Public API" }
participant DB@{ "type": "database", "alias": "User Database" }
```

### Combined — external wins
```
participant API@{ "type": "boundary", "alias": "Internal" } as External Name
```
Renders "External Name", not "Internal".

---

## Message Arrow Types

### Standard
| Syntax | Description |
|--------|-------------|
| `A->B:` | Solid line, no arrowhead |
| `A-->B:` | Dotted line, no arrowhead |
| `A->>B:` | Solid line + arrowhead |
| `A-->>B:` | Dotted line + arrowhead |
| `A<<->>B:` | Solid bidirectional (v11.0+) |
| `A<<-->>B:` | Dotted bidirectional (v11.0+) |
| `A-xB:` | Solid + cross at end |
| `A--xB:` | Dotted + cross at end |
| `A-)B:` | Solid + open arrow (async) |
| `A--)B:` | Dotted + open arrow (async) |

### Half-Arrows (v11.12.3+) — for BPMN/signal flows
| Syntax | Description |
|--------|-------------|
| `A-\|\ B:` | Top half arrowhead |
| `A--\|\ B:` | Dotted top half |
| `A-\|/ B:` | Bottom half arrowhead |
| `A--\|/ B:` | Dotted bottom half |

---

## Central Connections (v11.12.3+)

Append `()` to arrow for central lifeline connections:

```
sequenceDiagram
    participant Alice
    participant John
    Alice->>()John: Hello John     ← from Alice to center point before John
    Alice()->>John: How are you?   ← from center after Alice to John
    John()->>()Alice: Great!       ← center-to-center
```

---

## Activations

```
sequenceDiagram
    Alice->>John: Request
    activate John
    John-->>Alice: Response
    deactivate John
```

Shortcut with `+`/`-`:
```
Alice->>+John: Request
John-->>-Alice: Response
```

Stacked (same actor):
```
Alice->>+John: First
Alice->>+John: Second
John-->>-Alice: Reply 1
John-->>-Alice: Reply 2
```

---

## Notes

```
Note right of John: Text here
Note left of Alice: Text here
Note over Alice,John: Spanning note
```

Line breaks inside notes: use `<br/>`

---

## Grouping / Boxes

```
box Aqua Group Description
    participant A
    participant B
end
box rgb(33,66,99)
    participant C
end
box transparent Aqua    ← force transparent when group name is a color word
    participant D
end
```

---

## Control Flow

### Loop
```
loop Every minute
    John-->Alice: Ping
end
```

### Alt / Else / Opt
```
alt is sick
    Bob->>Alice: Not so good :(
else is well
    Bob->>Alice: Feeling great!
end

opt Extra response
    Bob->>Alice: Thanks for asking
end
```

### Parallel
```
par Alice to Bob
    Alice->>Bob: Hello!
and Alice to John
    Alice->>John: Hello!
end
```

### Critical Region
```
critical Establish DB connection
    Service-->DB: connect
option Network timeout
    Service-->Service: Log error
option Credentials rejected
    Service-->Service: Log different error
end
```

### Break
```
break when booking fails
    API-->Consumer: show failure
end
```

### Background Highlighting
```
rect rgb(191, 223, 255)
    Alice->>+John: Hello
    John-->>-Alice: Hi
end

rect rgba(0, 0, 255, .1)
    ...
end
```

---

## Actor Creation & Destruction (v10.3.0+)

```
create participant Carl
Alice->>Carl: Hi Carl!
create actor D as Donald
Carl->>D: Hi!
destroy Carl
Alice-xCarl: We are too many
destroy Bob
Bob->>Alice: I agree
```

Only the **recipient** can be created. Either sender or recipient can be destroyed.

---

## Sequence Numbers

```
sequenceDiagram
    autonumber
    Alice->>John: Hello
    John-->>Alice: Hi

    autonumber 10 5   ← start at 10, increment by 5 (v11.15.0+)
```

---

## Actor Menus (links)
```
link Alice: Dashboard @ https://dashboard.example.com
link Alice: Wiki @ https://wiki.example.com
```

Advanced JSON:
```
links Alice: {"Dashboard": "https://...", "Wiki": "https://..."}
```

---

## Comments
```
%% this is a comment — ignored by parser
```

---

## Escape Characters
```
A->>B: I #9829; you!     ← ♥
A->>B: #infin; times     ← ∞
```
Use `#59;` for semicolons in message text (`;` = line break in mermaid).

---

## Sequence Config (via mermaid config file)

```json
{
  "sequence": {
    "mirrorActors": true,
    "diagramMarginX": 50,
    "diagramMarginY": 10,
    "actorFontSize": 14,
    "noteFontSize": 14,
    "messageFontSize": 16,
    "noteAlign": "center"
  }
}
```

---

## Full Example — Realistic API Auth Flow

```
sequenceDiagram
    participant Client@{ "type": "boundary" } as Browser
    participant API@{ "type": "control" } as Auth API
    participant DB@{ "type": "database" } as Users DB
    participant Cache@{ "type": "collections" } as Redis Cache

    Client->>+API: POST /login {email, password}
    API->>DB: SELECT user WHERE email=?
    DB-->>API: user record

    alt credentials valid
        API->>Cache: SET session:{token} user_id TTL 3600
        API-->>-Client: 200 {access_token, refresh_token}
    else invalid
        API-->>Client: 401 Unauthorized
    end

    Note over Client,API: Subsequent requests

    Client->>+API: GET /profile (Bearer token)
    API->>Cache: GET session:{token}
    Cache-->>API: user_id (cache hit)
    API-->>-Client: 200 {user profile}
```
