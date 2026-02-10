# Agente de Ventas E-Commerce con IA - Diseño Conceptual

## 1. Arquitectura del Sistema

El sistema se compone de tres capas principales desplegadas en la infraestructura de Cloudflare:

```
WhatsApp → Twilio → Chatwoot → Laburen (Agente IA) → MCP Server (Cloudflare Worker) → D1 Database
```

- **Twilio**: Gateway de mensajeria que recibe los mensajes de WhatsApp y los envia a Chatwoot
- **MCP Server**: Cloudflare Worker con Durable Objects (`McpAgent`) para manejo de sesiones
- **Base de Datos**: Cloudflare D1 (SQLite) con tablas relacionales y foreign keys
- **Transporte**: Streamable HTTP en endpoint `/mcp`
- **Autenticacion**: Sin autenticacion (authless) para el alcance del challenge

## 2. Modelo de Datos

| Tabla | Campos Clave | Notas |
|-------|-------------|-------|
| `products` | id, name, tipo_prenda, talla, color, stock, precio_50/100/200, disponible, categoria, description | 100 productos de ropa con precios por volumen |
| `carts` | id, created_at, updated_at | Un carrito por conversacion |
| `cart_items` | id, cart_id (FK), product_id (FK), qty | UNIQUE(cart_id, product_id) para evitar duplicados |

## 3. Especificacion de Endpoints (Herramientas MCP)

| Herramienta | Parametros | Descripcion |
|-------------|-----------|-------------|
| `search_products` | name?, tipo_prenda?, talla?, color?, categoria?, min_price?, max_price? | Buscar productos con filtros multiples |
| `get_product` | product_id | Obtener detalle completo de un producto |
| `create_cart` | (ninguno) | Crear carrito vacio, retorna cart_id |
| `add_to_cart` | cart_id, product_id, qty | Agregar producto al carrito (upsert) |
| `update_cart_item` | cart_id, product_id, qty | Actualizar cantidad de un item |
| `remove_from_cart` | cart_id, product_id | Eliminar item del carrito |
| `get_cart` | cart_id | Obtener contenido del carrito con precios |
| `handoff_to_human` | reason, tags?, cart_id?, customer_message? | Escalar a agente humano con contexto |

## 4. Flujo de Interaccion

El agente sigue un flujo conversacional natural:

1. **Exploracion de productos**: El cliente pregunta por productos y el agente usa `search_products` con filtros apropiados segun lo que el cliente menciona (tipo, talla, color, etc.)
2. **Detalle de producto**: Cuando el cliente se interesa en un producto especifico, se usa `get_product` para mostrar toda la informacion incluyendo precios por volumen
3. **Creacion de carrito**: Al detectar intencion de compra, el agente crea un carrito con `create_cart` y agrega productos con `add_to_cart`
4. **Edicion del carrito**: El cliente puede modificar cantidades (`update_cart_item`) o eliminar productos (`remove_from_cart`)
5. **Revision**: Se usa `get_cart` para mostrar el resumen del carrito con precios
6. **Escalacion**: Si el agente no puede resolver una consulta, se usa `handoff_to_human` con etiquetas de contexto para enrutar correctamente
