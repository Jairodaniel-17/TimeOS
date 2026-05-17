# ZenUML Syntax Reference

Keyword: `zenuml`

ZenUML is an **alternative** sequence diagram syntax. It uses code-like syntax instead of arrow declarations. Use it when the user asks for ZenUML specifically, or for complex flows with nesting/returns.

---

## Participants & Annotators

### Implicit (order of first appearance)
```
zenuml
    Alice->Bob: Hello
```

### Explicit order declaration
```
zenuml
    Bob
    Alice
    Alice->Bob: Hi Bob
```

### Annotators — Visual Icons

Use `@AnnotatorName ParticipantId` syntax:

```
zenuml
    @Actor Alice
    @Database Bob
    Alice->Bob: Hi Bob
    Bob->Alice: Hi Alice
```

**All available annotators (from image reference):**

| Annotator | Shape |
|-----------|-------|
| `@Actor` | Stick figure |
| `@Boundary` | UML boundary (circle on line) |
| `@Control` | UML control (circle with arrow) |
| `@Database` | Database cylinder |
| `@Entity` | UML entity (circle with underline) |
| `@CloudWatch` | AWS CloudWatch icon |
| `@CloudFront` | AWS CloudFront |
| `@Cognito` | AWS Cognito |
| `@DynamoDB` | AWS DynamoDB |
| `@EBS` | AWS EBS |
| `@EC2` | AWS EC2 |
| `@ECS` | AWS ECS |
| `@EFS` | AWS EFS |
| `@ElastiCache` | AWS ElastiCache |
| `@ElasticBeanstalk` | AWS Elastic Beanstalk |
| `@ElasticFileSystem` | AWS EFS alt |
| `@Glacier` | AWS Glacier |
| `@IAM` | AWS IAM |
| `@Kinesis` | AWS Kinesis |
| `@Lambda` | AWS Lambda |
| `@LightSail` | AWS LightSail |
| `@RDS` | AWS RDS |
| `@Redshift` | AWS Redshift |
| `@S3` | AWS S3 |
| `@SNS` | AWS SNS |
| `@SQS` | AWS SQS |
| `@Sagemaker` | AWS SageMaker |
| `@VPC` | AWS VPC |
| `@AzureActiveDirectory` | Azure AD |
| `@AzureBackup` | Azure Backup |
| `@AzureCDN` | Azure CDN |
| `@AzureDataFactory` | Azure Data Factory |
| `@AzureDevOps` | Azure DevOps |
| `@AzureFunction` | Azure Functions |
| `@AzureSQL` | Azure SQL |
| `@CosmosDB` | Azure CosmosDB |
| `@LogicApps` | Azure Logic Apps |
| `@VirtualMachine` | Azure VM |
| `@BigTable` | GCP BigTable |
| `@BigQuery` | GCP BigQuery |
| `@CloudCDN` | GCP Cloud CDN |
| `@CloudDNS` | GCP Cloud DNS |
| `@CloudInterconnect` | GCP Interconnect |
| `@CloudLoadBalancing` | GCP Load Balancing |
| `@CloudSQL` | GCP Cloud SQL |
| `@CloudStorage` | GCP Cloud Storage |
| `@DataLab` | GCP DataLab |
| `@DataProc` | GCP DataProc |
| `@GoogleIAM` | GCP IAM |
| `@GoogleSecurity` | GCP Security |
| `@GoogleVPC` | GCP VPC |
| `@PubSub` | GCP Pub/Sub |
| `@SecurityScanner` | GCP Security Scanner |
| `@StackDriver` | GCP Stackdriver |
| `@VisionAPI` | GCP Vision API |

---

## Aliases
```
zenuml
    A as Alice
    J as John
    A->J: Hello John
    J->A: Great!
```

---

## Message Types

### Async (fire-and-forget)
```
zenuml
    Alice->Bob: How are you?
```

### Sync (blocking call with nested body)
```
zenuml
    A.SyncMessage()
    A.SyncMessageWithParams(param1, param2) {
        B.nestedCall()
    }
```

### Object Creation
```
zenuml
    new ServiceA
    new ServiceB(with, params)
```

### Reply Message — 3 ways
```
zenuml
    // 1. Variable assignment
    a = A.method()
    SomeType result = A.method()

    // 2. return keyword
    A.method() {
        return result
    }

    // 3. @return annotator (return to one level up)
    @return
    A->B: result
```

---

## Nesting (sync messages)
```
zenuml
    A.method() {
        B.nestedSync()
        B->C: nested async
    }
```

---

## Control Flow

### Loop
```
zenuml
    while(condition) { ... }
    for(item in list) { ... }
    forEach(item in list) { ... }
    loop { ... }
```

### Alt / Else
```
zenuml
    if(condition1) {
        Bob->Alice: Path A
    } else if(condition2) {
        Bob->Alice: Path B
    } else {
        Bob->Alice: Default
    }
```

### Opt
```
zenuml
    opt {
        Bob->Alice: Optional message
    }
```

### Parallel
```
zenuml
    par {
        Alice->Bob: Hello
        Alice->John: Hello
    }
```

### Try/Catch/Finally
```
zenuml
    try {
        Consumer->API: Request
    } catch {
        API->Consumer: Error
    } finally {
        API->DB: Cleanup
    }
```

---

## Comments
```
zenuml
    // Comment rendered above next message
    // **Markdown** is supported in comments
    BookService.getBook()
```

---

## Full Example — AWS Lambda flow with annotators

```
zenuml
    title AWS Order Processing
    @Actor User
    @Lambda OrderLambda
    @SQS OrderQueue
    @DynamoDB OrdersDB
    @SNS Notifications

    User->OrderLambda: POST /orders {item, qty}
    OrderLambda.processOrder() {
        OrdersDB.putItem(order)
        OrderQueue.sendMessage(orderId)
        return orderId
    }
    if(success) {
        OrderLambda->User: 201 {orderId}
        Notifications.publish(orderConfirmed)
    } else {
        OrderLambda->User: 500 error
    }
```
