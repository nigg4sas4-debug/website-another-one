# E-commerce database ERD

The diagram below mirrors the Prisma schema in `schema.prisma` and highlights keys, unique constraints, and cascading relations.

```mermaid
erDiagram
  User {
    Int id PK
    String email UNIQUE
    String passwordHash
    String role
    DateTime createdAt
  }
  Category {
    Int id PK
    String name UNIQUE
  }
  Product {
    Int id PK
    String name UNIQUE
    String description
    Float price
    Boolean featured
    Boolean onSale
    Int discountPct
    Int stock
    DateTime? deletedAt
  }
  ProductVariation {
    Int id PK
    String name UNIQUE(productId+name)
    DateTime createdAt
  }
  VariationSize {
    Int id PK
    String label UNIQUE(variationId+label)
    Float price
    Int stock
  }
  CartItem {
    Int id PK
    Int quantity
    UNIQUE(userId+productId)
  }
  Order {
    Int id PK
    String status
    Float total
    String shipping
    DateTime createdAt
  }
  OrderItem {
    Int id PK
    Int quantity
    Float price
  }
  CancellationRequest {
    Int id PK
    String status
    String reason
    UNIQUE(orderId)
  }

  User ||--o{ CartItem : "owns"
  User ||--o{ Order : "places"
  User ||--o{ CancellationRequest : "files"

  Category ||--o{ Product : "categorizes"
  Product ||--o{ ProductVariation : "has"
  ProductVariation ||--o{ VariationSize : "sizes"

  Product ||--o{ CartItem : "in carts"
  Product ||--o{ OrderItem : "ordered as"

  Order ||--o{ OrderItem : "includes"
  Order ||--|| CancellationRequest : "may have"

  CartItem }o--|| User : "belongs to"
  CartItem }o--|| Product : "references"
  OrderItem }o--|| Order : "belongs to"
  OrderItem }o--|| Product : "references"

  CancellationRequest }o--|| User : "by"
```

> Cascades from `User`, `Order`, `Product`, and `ProductVariation` ensure related rows are cleaned up when parents are removed.
