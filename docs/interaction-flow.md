# Flujo de Interaccion

## Diagramas de Secuencia

### Flujo de Mensajeria

Todos los mensajes entre el cliente y el agente siguen este patron:

```mermaid
sequenceDiagram
    participant C as Cliente (WhatsApp)
    participant T as Twilio
    participant W as Chatwoot
    participant L as Laburen - AI Agent

    C->>T: Mensaje del cliente
    T->>W: Webhook
    W->>L: Webhook
    L-->>W: Respuesta del agente
    W-->>T: Respuesta
    T-->>C: Respuesta del agente
```

![Flujo de Mensajeria](messages-flow.svg)

Los siguientes diagramas muestran la interaccion entre el agente y el MCP Server para cada fase.

### Fase 1: Exploracion de Productos

```mermaid
sequenceDiagram
    participant C as Cliente
    participant L as Laburen - AI Agent
    participant M as MCP Server
    participant D as D1

    C->>L: "Hola, busco camisetas deportivas"
    L->>M: search_products(tipo_prenda: "Camiseta", categoria: "Deportivo")
    M->>D: SELECT * FROM products WHERE tipo_prenda='Camiseta'
    D-->>M: [Lista de camisetas deportivas]
    M-->>L: Productos encontrados con precios
    L-->>C: "Tenemos estas camisetas deportivas disponibles..."
```

![Fase 1: Exploracion de Productos](phase1.svg)

### Fase 2: Detalle de Producto

```mermaid
sequenceDiagram
    participant C as Cliente
    participant L as Laburen - AI Agent
    participant M as MCP Server
    participant D as D1

    C->>L: "Me interesa la camiseta azul talla S"
    Note over L: El agente identifica el producto de los resultados anteriores
    L->>M: get_product(product_id: 17)
    M->>D: SELECT * FROM products WHERE id = 17
    D-->>M: Detalles del producto
    M-->>L: Info completa con precios por volumen
    L-->>C: "Camiseta S Azul - $1128 (50u), $1351 (100u), $737 (200u)"
```

![Fase 2: Detalle de Producto](phase2.svg)

### Fase 3: Creacion de Carrito

```mermaid
sequenceDiagram
    participant C as Cliente
    participant L as Laburen - AI Agent
    participant M as MCP Server
    participant D as D1

    C->>L: "Quiero comprar 100 unidades"
    L->>M: create_cart()
    M->>D: INSERT INTO carts
    D-->>M: Cart {id: 1}
    M-->>L: cart_id: 1
    L->>M: add_to_cart(cart_id: 1, product_id: 17, qty: 100)
    M->>D: Verificar stock + INSERT INTO cart_items
    D-->>M: CartItem creado
    M-->>L: Producto agregado
    L-->>C: "He agregado 100 unidades de Camiseta S Azul a tu carrito"
```

![Fase 3: Creacion de Carrito](phase3.svg)

### Fase 4: Edicion del Carrito

```mermaid
sequenceDiagram
    participant C as Cliente
    participant L as Laburen - AI Agent
    participant M as MCP Server
    participant D as D1

    C->>L: "Cambia la cantidad a 50"
    L->>M: update_cart_item(cart_id: 1, product_id: 17, qty: 50)
    M->>D: UPDATE cart_items SET qty = 50
    M-->>L: Actualizado
    L-->>C: "Cantidad actualizada a 50 unidades"
```

![Fase 4: Edicion del Carrito](phase4.svg)

### Fase 5: Revision del Carrito

```mermaid
sequenceDiagram
    participant C as Cliente
    participant L as Laburen - AI Agent
    participant M as MCP Server
    participant D as D1

    C->>L: "Muestrame el carrito"
    L->>M: get_cart(cart_id: 1)
    M->>D: SELECT con JOIN products
    D-->>M: Carrito con items y precios
    M-->>L: Resumen del carrito
    L-->>C: "Tu carrito: 50x Camiseta S Azul..."
```

![Fase 5: Revision del Carrito](phase5.svg)

### Fase 6: Escalacion

```mermaid
sequenceDiagram
    participant C as Cliente
    participant L as Laburen - AI Agent
    participant M as MCP Server

    C->>L: "Necesito un descuento por volumen especial"
    L->>M: handoff_to_human(reason: "solicitud descuento", tags: ["ventas", "descuento"])
    M-->>L: Escalacion confirmada
    L-->>C: "Te conecto con un agente que puede ayudarte con descuentos especiales"
```

![Fase 6: Escalacion](phase6.svg)

## Diagrama de Componentes

```mermaid
graph TD
    A[Cliente - WhatsApp] -->|Mensajes| T[Twilio]
    T -->|Webhook| B[Chatwoot]
    B -->|Webhook| C[Laburen - AI Agent]
    C -->|MCP Tools| D[Cloudflare Worker - MCP Server]

    subgraph "MCP Server (Cloudflare Worker)"
        D --> F[Product Tools]
        D --> G[Cart Tools]
        D --> H[Support Tools]
    end

    F -->|SQL Queries| E[Cloudflare D1 - SQLite]
    G -->|SQL Queries| E
    H -->|SQL Queries| E

    subgraph "Database (D1)"
        E --> I[products]
        E --> J[carts]
        E --> K[cart_items]
    end

    J -.->|FK| K
    I -.->|FK| K
```

![Diagrama de Componentes](component-diagram.svg)
