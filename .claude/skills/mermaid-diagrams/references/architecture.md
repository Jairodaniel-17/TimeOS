# Architecture Diagram Syntax Reference

Keyword: `architecture-beta`  (v11.1.0+)

For cloud/infra architecture diagrams. Services are connected by explicit directional edges.

---

## Basic Structure

```
architecture-beta
    group {groupId}({icon})[{label}] (in {parentGroupId})?
    service {serviceId}({icon})[{label}] (in {groupId})?
    junction {junctionId} (in {groupId})?

    {serviceId}:{side} {arrow}? {side}:{serviceId}
```

---

## Groups

```
architecture-beta
    group api(cloud)[Public API]
    group db_layer(database)[Data Layer] in api
```

Groups can be nested using `in`.

---

## Services

```
architecture-beta
    service web(server)[Web Server]
    service db(database)[Postgres] in api
    service store(disk)[File Storage] in api
```

---

## Edges

### Syntax
```
serviceA:R -- L:serviceB          ← line, right of A to left of B
serviceA:T --> B:serviceB         ← arrow into serviceB from top of A
serviceA:L <-- R:serviceB         ← arrow into serviceA
serviceA:R <--> L:serviceB        ← bidirectional
```

### Side modifiers: `T` `B` `L` `R`
A colon binds the side to the service: `serviceId:SIDE`

### Edges out of groups
```
server{group}:B --> T:subnet{group}
```
Use `{group}` modifier on a **service** (not a groupId) to route the edge out of/into the parent group boundary.

---

## Junctions (4-way splits)

```
architecture-beta
    service disk1(disk)[Disk 1]
    service disk2(disk)[Disk 2]
    service gw1(internet)[Gateway 1]
    junction jCenter
    junction jRight

    disk1:R -- L:jCenter
    disk2:T -- B:jCenter
    jCenter:R -- L:jRight
    gw1:B -- T:jRight
```

---

## Built-in Icons

Default icons (no pack needed):
- `cloud` `database` `disk` `internet` `server`

---

## Icon Packs (Iconify)

Install via `--iconPacks` flag in mmdc or pre-install npm packages.

### Using mmdc CLI with icon packs
```bash
PUPPETEER_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  mmdc \
    -i /tmp/arch.mmd \
    -o /mnt/user-data/outputs/arch.svg \
    -p /tmp/mmdc-puppeteer.json \
    --iconPacks @iconify-json/logos @iconify-json/aws
```

### In diagram after icon pack is registered
Format: `{packPrefix}:{icon-name}`

```
architecture-beta
    group api(logos:aws-lambda)[API]
    service db(logos:aws-aurora)[Database] in api
    service store(logos:aws-s3)[Storage] in api
    service cache(logos:aws-elasticache)[Cache] in api
    service fn(logos:aws-lambda)[Functions] in api

    db:L -- R:fn
    store:T -- B:fn
    cache:T -- B:db
```

### Common icon pack prefixes

**AWS** (`@iconify-json/logos` prefix `logos:`)
- `logos:aws-lambda` `logos:aws-aurora` `logos:aws-s3` `logos:aws-ec2`
- `logos:aws-rds` `logos:aws-dynamodb` `logos:aws-sqs` `logos:aws-sns`
- `logos:aws-cloudfront` `logos:aws-api-gateway` `logos:aws-cognito`
- `logos:aws-elasticache` `logos:aws-kinesis` `logos:aws-glacier`

**Azure** (`logos:`)
- `logos:microsoft-azure` `logos:azure-active-directory`

**GCP** (`logos:`)
- `logos:google-cloud` `logos:firebase`

> **Note:** Icon pack support in mmdc CLI requires internet access to fetch from unpkg.com. In restricted environments, pre-install: `npm install -g @iconify-json/logos`

---

## Layout Configuration (v11.14.0+)

Via frontmatter:
```
%%{init: {"architecture": {
    "randomize": false,
    "seed": 1,
    "nodeSeparation": 75,
    "idealEdgeLengthMultiplier": 1.5,
    "edgeElasticity": 0.45,
    "numIter": 2500
}}}%%
architecture-beta
    ...
```

| Option | Default | Effect |
|--------|---------|--------|
| `randomize` | `false` | Randomize node positions |
| `seed` | `1` | Deterministic layout seed |
| `nodeSeparation` | `75` | Min px between sibling nodes |
| `idealEdgeLengthMultiplier` | `1.5` | Stretches intra-group edges |
| `edgeElasticity` | `0.45` | Spring force on edges |
| `numIter` | `2500` | Layout iterations |

---

## Full Example — Microservices Architecture

```
architecture-beta
    group internet(cloud)[Internet]
    group app(server)[Application Tier]
    group data(database)[Data Tier]

    service cdn(internet)[CDN] in internet
    service lb(server)[Load Balancer] in internet

    service api1(server)[API Server 1] in app
    service api2(server)[API Server 2] in app
    service worker(server)[Worker] in app

    service pg(database)[PostgreSQL] in data
    service redis(disk)[Redis] in data
    service s3(disk)[Object Store] in data

    cdn:B --> T:lb
    lb:B --> T:api1
    lb:B --> T:api2
    api1:B --> T:pg
    api2:B --> T:pg
    api1:R --> L:redis
    worker:B --> T:pg
    worker:R --> L:s3
```
