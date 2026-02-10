# Laburen E-Commerce MCP Server

Servidor MCP (Model Context Protocol) para un agente de ventas de e-commerce, desplegado en Cloudflare Workers con base de datos D1.

## Requisitos

- Node.js 20+
- Cuenta de Cloudflare (tier gratuito)
- Wrangler CLI

## Setup

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear la base de datos D1

```bash
npx wrangler d1 create laburen-db
```

Copiar el `database_id` devuelto al archivo `wrangler.toml`.

### 3. Aplicar migraciones

```bash
# Local
npm run db:migrate:local

# Remoto
npm run db:migrate:remote
```

### 4. Generar y cargar datos de productos

```bash
# Generar SQL desde products.xlsx
npm run xlsx-to-sql

# Cargar datos localmente
npm run db:seed:local

# Cargar datos en remoto
npm run db:seed:remote
```

### 5. Desarrollo local

```bash
npm run dev
```

El servidor estara disponible en `http://localhost:8787`.

### 6. Desplegar

```bash
npm run deploy
```

## Endpoints

| Ruta | Descripcion |
|------|-------------|
| `GET /` | Health check |
| `/mcp` | Endpoint MCP (Streamable HTTP) |
| `/sse` | Endpoint MCP (SSE, legacy) |

## Herramientas MCP

| Herramienta | Descripcion |
|-------------|-------------|
| `search_products` | Buscar productos con filtros (tipo, talla, color, categoria, precio) |
| `get_product` | Obtener detalle de un producto por ID |
| `create_cart` | Crear un carrito de compras vacio |
| `add_to_cart` | Agregar un producto al carrito |
| `update_cart_item` | Actualizar la cantidad de un item en el carrito |
| `remove_from_cart` | Eliminar un item del carrito |
| `get_cart` | Obtener contenido del carrito con precios |
| `handoff_to_human` | Escalar a agente humano con contexto |

## Testing

### Unit tests

```bash
npm test
```

### MCP Inspector

Conectar con MCP Inspector:

```bash
npx @modelcontextprotocol/inspector@latest
```

Luego conectar con transport type **Streamable HTTP** al endpoint `http://localhost:8787/mcp`.

## Estructura del Proyecto

```
src/
  index.ts          - McpAgent + Worker fetch handler
  types.ts          - Interfaces TypeScript
  db/queries.ts     - Consultas D1 con prepared statements
  tools/
    products.ts     - Herramientas de busqueda de productos
    cart.ts         - Herramientas de gestion de carrito
    support.ts      - Herramienta de escalacion a humano
migrations/         - SQL de migracion D1
seeds/              - SQL de datos generado desde XLSX
docs/               - Documentacion conceptual
```

## Documentacion

- [Diseño Conceptual](docs/conceptual-design.md) - Arquitectura del sistema, modelo de datos y especificacion de herramientas MCP
- [Flujo de Interaccion](docs/interaction-flow.md) - Diagramas de secuencia y componentes del sistema
