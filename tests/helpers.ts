/**
 * Shared test helpers: seeds the D1 database with schema + sample data,
 * and provides a mock MCP server for tool registration tests.
 */

const SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    tipo_prenda TEXT NOT NULL,
    talla TEXT NOT NULL,
    color TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
    precio_50 REAL NOT NULL,
    precio_100 REAL NOT NULL,
    precio_200 REAL NOT NULL,
    disponible INTEGER NOT NULL DEFAULT 1,
    categoria TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cart_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1 CHECK(qty > 0),
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    UNIQUE(cart_id, product_id)
);
`;

const SEED = `
INSERT INTO products (id, name, tipo_prenda, talla, color, stock, precio_50, precio_100, precio_200, disponible, categoria, description)
VALUES
  (1, 'Pantalón XXL Verde',  'Pantalón',  'XXL', 'Verde',   177, 1058, 1182, 462, 1, 'Deportivo', 'Ideal para uso diario.'),
  (2, 'Camiseta XXL Blanco', 'Camiseta',  'XXL', 'Blanco',   33,  510,  975, 739, 1, 'Deportivo', 'Prenda cómoda y ligera.'),
  (3, 'Camiseta S Negro',    'Camiseta',  'S',   'Negro',   457, 1292,  457, 873, 1, 'Casual',    'Diseño moderno y elegante.'),
  (4, 'Falda S Blanco',      'Falda',     'S',   'Blanco',  414, 1138,  986, 386, 1, 'Casual',    'Ideal para uso diario.'),
  (5, 'Sudadera XL Verde',   'Sudadera',  'XL',  'Verde',   151,  603,  799, 367, 1, 'Formal',    'Diseño moderno y elegante.'),
  (6, 'Chaqueta S Amarillo', 'Chaqueta',  'S',   'Amarillo', 223,  961,  636,1014, 1, 'Deportivo', 'Prenda cómoda y ligera.'),
  (7, 'Pantalón L Gris',     'Pantalón',  'L',   'Gris',    436, 1331, 1222, 516, 1, 'Deportivo', 'Diseño moderno y elegante.'),
  (8, 'Falda XXL Blanco',    'Falda',     'XXL', 'Blanco',  441, 1286, 1306, 613, 1, 'Casual',    'Prenda cómoda y ligera.'),
  (9, 'Camiseta M Rojo',     'Camiseta',  'M',   'Rojo',    200,  800,  600, 400, 1, 'Casual',    'Color vibrante.'),
  (10,'Pantalón S Azul',     'Pantalón',  'S',   'Azul',      0,  950,  850, 500, 1, 'Formal',    'Sin stock.'),
  (11,'Chaqueta L Negro',    'Chaqueta',  'L',   'Negro',   100, 1500, 1200, 900, 0, 'Formal',    'No disponible.');
`;

export function createMockServer() {
  const tools = new Map<string, { description: string; schema: any; handler: Function }>();
  return {
    tool(name: string, description: string, schema: any, handler: Function) {
      tools.set(name, { description, schema, handler });
    },
    getHandler(name: string) {
      return tools.get(name)?.handler;
    },
    tools,
  };
}

export async function seedDatabase(db: D1Database) {
  // Drop existing tables (order matters for foreign keys)
  await db.prepare('DROP TABLE IF EXISTS cart_items').run();
  await db.prepare('DROP TABLE IF EXISTS carts').run();
  await db.prepare('DROP TABLE IF EXISTS products').run();

  // Create tables
  for (const stmt of SCHEMA.split(';').filter((s) => s.trim())) {
    await db.prepare(stmt).run();
  }
  // Insert seed data
  for (const stmt of SEED.split(';').filter((s) => s.trim())) {
    await db.prepare(stmt).run();
  }
}
