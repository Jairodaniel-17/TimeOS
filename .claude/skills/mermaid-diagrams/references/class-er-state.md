# Class, ER, and State Diagram Reference

---

# classDiagram

```
classDiagram
    class Animal {
        +String name
        +int age
        #String species
        -String secret
        ~packageField
        +sound() String
        +move()* void       ← abstract
        +clone()$ Animal    ← static
    }
```

## Visibility modifiers
| Symbol | Meaning |
|--------|---------|
| `+` | Public |
| `-` | Private |
| `#` | Protected |
| `~` | Package/Internal |

## Classifiers (end of method)
| Symbol | Meaning |
|--------|---------|
| `*` | Abstract |
| `$` | Static |

## Generic types — use `~` as angle brackets
```
class Stack~T~ {
    List~T~ items
    push(T item)
    pop() T
}
```

## Class labels
```
class Animal["Animal Base Class"]
class `Special!Class`    ← backticks for special chars
```

## Relationships
```
Animal <|-- Dog          ← Inheritance
Pond *-- Frog            ← Composition
Car o-- Wheel            ← Aggregation
Teacher --> Student      ← Association
ClassA -- ClassB         ← Link (solid)
ClassA ..> ClassB        ← Dependency
ClassA ..|> Interface    ← Realization
ClassA <.. ClassB        ← Dependency (reverse)
```

With label:
```
Animal <|-- Dog : extends
Pond *-- Frog : contains
```

With cardinality:
```
Customer "1" --> "0..*" Order : places
```

## Notes
```
note "General note"
note for Dog "Can fetch things"
```

## Namespace
```
namespace Animals {
    class Dog
    class Cat
}
```

## Full example
```
classDiagram
    namespace Core {
        class Repository~T~ {
            +findById(id) T
            +save(entity T) T
            +delete(id)
        }
        class BaseEntity {
            +UUID id
            +DateTime createdAt
            +DateTime updatedAt
        }
    }
    class UserRepository {
        +findByEmail(email) User
    }
    class User {
        +String email
        +String hashedPassword
        +authenticate(password) bool
    }
    Repository~T~ <|-- UserRepository : extends
    UserRepository --> User : manages
    BaseEntity <|-- User : extends
```

---

# erDiagram

## Relationship cardinality
| Syntax | Meaning |
|--------|---------|
| `\|o` / `o\|` | Zero or one |
| `\|\|` | Exactly one |
| `}o` / `o{` | Zero or more |
| `}\|` / `\|{` | One or more |

## Identification (line type)
| Syntax | Meaning |
|--------|---------|
| `--` | Identifying (solid line) |
| `..` | Non-identifying (dashed) |

## Full relationship syntax
```
ENTITY_A [cardinality_A][id][cardinality_B] ENTITY_B : "label"
```

Examples:
```
CUSTOMER ||--o{ ORDER : places          ← 1 customer, 0+ orders
ORDER ||--|{ LINE_ITEM : contains       ← 1 order, 1+ items
PRODUCT }|..|{ CATEGORY : belongs      ← many-to-many, non-id
```

**⚠ Entity names cannot contain hyphens** — use underscores: `LINE_ITEM` not `LINE-ITEM`

## Attributes
```
erDiagram
    CUSTOMER {
        string id PK
        string name
        string email UK
        int age
    }
    ORDER {
        int orderNumber PK
        string customerId FK
        date orderDate
    }
    CUSTOMER ||--o{ ORDER : places
```

Key modifiers: `PK` `FK` `UK`

## Full example
```
erDiagram
    USER {
        uuid id PK
        string email UK
        string name
        datetime created_at
    }
    PRODUCT {
        uuid id PK
        string name
        decimal price
        int stock
    }
    ORDER {
        uuid id PK
        uuid user_id FK
        datetime placed_at
        string status
    }
    ORDER_ITEM {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        decimal unit_price
    }

    USER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : "appears in"
```

---

# stateDiagram-v2

## Basic states and transitions
```
stateDiagram-v2
    [*] --> Idle          ← start
    Idle --> Processing : submit
    Processing --> Done : success
    Processing --> Error : fail
    Done --> [*]          ← end
```

## State with description
```
stateDiagram-v2
    state "Loading data" as Loading
    s2 : This is a description
```

## Composite (nested) states
```
stateDiagram-v2
    state Processing {
        [*] --> Validating
        Validating --> Executing : valid
        Validating --> [*] : invalid
        Executing --> [*]
    }
```

## Parallel states (fork/join)
```
stateDiagram-v2
    state fork <<fork>>
    state join <<join>>
    [*] --> fork
    fork --> StateA
    fork --> StateB
    StateA --> join
    StateB --> join
    join --> [*]
```

## Choice pseudostate
```
stateDiagram-v2
    state choice <<choice>>
    [*] --> choice
    choice --> ValidState : [valid]
    choice --> InvalidState : [invalid]
```

## Notes
```
stateDiagram-v2
    Idle --> Active
    note right of Idle
        User is idle
    end note
```

## Full example
```
stateDiagram-v2
    [*] --> Draft

    state Draft {
        [*] --> Editing
        Editing --> Reviewing : submit for review
        Reviewing --> Editing : request changes
    }

    Draft --> Published : approve
    Draft --> Archived : discard

    state Published {
        [*] --> Live
        Live --> Scheduled : schedule update
        Scheduled --> Live : publish
    }

    Published --> Archived : unpublish
    Archived --> [*]

    note right of Published
        Live content
        visible to users
    end note
```
