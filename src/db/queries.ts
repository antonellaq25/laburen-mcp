import type { Product, Cart, CartItem, CartItemWithProduct, CartWithItems } from '../types';

export async function searchProducts(
  db: D1Database,
  filters?: {
    name?: string;
    tipo_prenda?: string;
    talla?: string;
    color?: string;
    categoria?: string;
    min_price?: number;
    max_price?: number;
  }
): Promise<Product[]> {
  let sql = 'SELECT * FROM products WHERE disponible = 1';
  const params: unknown[] = [];

  if (filters?.name) {
    sql += ' AND name LIKE ?';
    params.push(`%${filters.name}%`);
  }
  if (filters?.tipo_prenda) {
    sql += ' AND LOWER(tipo_prenda) = LOWER(?)';
    params.push(filters.tipo_prenda);
  }
  if (filters?.talla) {
    sql += ' AND UPPER(talla) = UPPER(?)';
    params.push(filters.talla);
  }
  if (filters?.color) {
    sql += ' AND LOWER(color) = LOWER(?)';
    params.push(filters.color);
  }
  if (filters?.categoria) {
    sql += ' AND LOWER(categoria) = LOWER(?)';
    params.push(filters.categoria);
  }
  if (filters?.min_price !== undefined) {
    sql += ' AND precio_50 >= ?';
    params.push(filters.min_price);
  }
  if (filters?.max_price !== undefined) {
    sql += ' AND precio_50 <= ?';
    params.push(filters.max_price);
  }

  sql += ' ORDER BY name ASC LIMIT 50';

  const stmt = db.prepare(sql);
  const { results } = await (params.length > 0 ? stmt.bind(...params) : stmt).all<Product>();
  return results ?? [];
}

export async function getProductById(db: D1Database, id: number): Promise<Product | null> {
  return await db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first<Product>();
}

export async function createCart(db: D1Database): Promise<Cart> {
  const result = await db
    .prepare("INSERT INTO carts (created_at, updated_at) VALUES (datetime('now'), datetime('now')) RETURNING *")
    .first<Cart>();
  if (!result) throw new Error('Error al crear el carrito');
  return result;
}

export async function addToCart(
  db: D1Database,
  cartId: number,
  productId: number,
  qty: number
): Promise<CartItem> {
  const product = await getProductById(db, productId);
  if (!product) throw new Error(`Producto con ID ${productId} no encontrado`);
  if (product.stock < qty) throw new Error(`Stock insuficiente. Disponible: ${product.stock}, solicitado: ${qty}`);
  if (!product.disponible) throw new Error(`El producto "${product.name}" no esta disponible actualmente`);

  const cart = await db.prepare('SELECT id FROM carts WHERE id = ?').bind(cartId).first();
  if (!cart) throw new Error(`Carrito con ID ${cartId} no encontrado`);

  const result = await db
    .prepare(`
      INSERT INTO cart_items (cart_id, product_id, qty)
      VALUES (?, ?, ?)
      ON CONFLICT(cart_id, product_id) DO UPDATE SET qty = qty + excluded.qty
      RETURNING *
    `)
    .bind(cartId, productId, qty)
    .first<CartItem>();

  if (!result) throw new Error('Error al agregar producto al carrito');

  await db.prepare("UPDATE carts SET updated_at = datetime('now') WHERE id = ?").bind(cartId).run();

  return result;
}

export async function updateCartItem(
  db: D1Database,
  cartId: number,
  productId: number,
  qty: number
): Promise<CartItem> {
  const product = await getProductById(db, productId);
  if (!product) throw new Error(`Producto con ID ${productId} no encontrado`);
  if (product.stock < qty) throw new Error(`Stock insuficiente. Disponible: ${product.stock}, solicitado: ${qty}`);

  const result = await db
    .prepare('UPDATE cart_items SET qty = ? WHERE cart_id = ? AND product_id = ? RETURNING *')
    .bind(qty, cartId, productId)
    .first<CartItem>();

  if (!result) throw new Error('Producto no encontrado en el carrito');

  await db.prepare("UPDATE carts SET updated_at = datetime('now') WHERE id = ?").bind(cartId).run();
  return result;
}

export async function removeFromCart(db: D1Database, cartId: number, productId: number): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?')
    .bind(cartId, productId)
    .run();

  if (result.meta.changes === 0) throw new Error('Producto no encontrado en el carrito');

  await db.prepare("UPDATE carts SET updated_at = datetime('now') WHERE id = ?").bind(cartId).run();
  return true;
}

export async function getCartWithItems(db: D1Database, cartId: number): Promise<CartWithItems> {
  const cart = await db.prepare('SELECT * FROM carts WHERE id = ?').bind(cartId).first<Cart>();
  if (!cart) throw new Error(`Carrito con ID ${cartId} no encontrado`);

  const { results: items } = await db
    .prepare(`
      SELECT
        ci.id, ci.cart_id, ci.product_id, ci.qty,
        p.name AS product_name,
        p.precio_50,
        p.precio_100,
        p.precio_200
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ?
      ORDER BY ci.id ASC
    `)
    .bind(cartId)
    .all<CartItemWithProduct>();

  return {
    cart,
    items: items ?? [],
    item_count: (items ?? []).reduce((sum, item) => sum + item.qty, 0),
  };
}
