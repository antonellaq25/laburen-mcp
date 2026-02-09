import { env } from 'cloudflare:test';
import { describe, it, expect, beforeEach } from 'vitest';
import { seedDatabase } from './helpers';
import {
  searchProducts,
  getProductById,
  createCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  getCartWithItems,
} from '../src/db/queries';

beforeEach(async () => {
  await seedDatabase(env.DB);
});

// ---------------------------------------------------------------------------
// searchProducts
// ---------------------------------------------------------------------------
describe('searchProducts', () => {
  it('returns only available products by default', async () => {
    const results = await searchProducts(env.DB);
    // Product 11 has disponible=0 and should be excluded
    expect(results.every((p) => p.disponible === 1)).toBe(true);
    expect(results.find((p) => p.id === 11)).toBeUndefined();
  });

  it('filters by tipo_prenda (case-insensitive)', async () => {
    const results = await searchProducts(env.DB, { tipo_prenda: 'camiseta' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.tipo_prenda === 'Camiseta')).toBe(true);
  });

  it('filters by talla (case-insensitive)', async () => {
    const results = await searchProducts(env.DB, { talla: 'xxl' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.talla === 'XXL')).toBe(true);
  });

  it('filters by color (case-insensitive)', async () => {
    const results = await searchProducts(env.DB, { color: 'verde' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.color === 'Verde')).toBe(true);
  });

  it('filters by categoria (case-insensitive)', async () => {
    const results = await searchProducts(env.DB, { categoria: 'casual' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.categoria === 'Casual')).toBe(true);
  });

  it('filters by name (partial match)', async () => {
    const results = await searchProducts(env.DB, { name: 'Pantalón' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.name.includes('Pantalón'))).toBe(true);
  });

  it('filters by min_price', async () => {
    const results = await searchProducts(env.DB, { min_price: 1200 });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.precio_50 >= 1200)).toBe(true);
  });

  it('filters by max_price', async () => {
    const results = await searchProducts(env.DB, { max_price: 600 });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((p) => p.precio_50 <= 600)).toBe(true);
  });

  it('filters by price range (min + max)', async () => {
    const results = await searchProducts(env.DB, { min_price: 500, max_price: 1000 });
    expect(results.length).toBeGreaterThan(0);
    results.forEach((p) => {
      expect(p.precio_50).toBeGreaterThanOrEqual(500);
      expect(p.precio_50).toBeLessThanOrEqual(1000);
    });
  });

  it('combines multiple filters', async () => {
    const results = await searchProducts(env.DB, {
      tipo_prenda: 'Camiseta',
      talla: 'XXL',
      color: 'Blanco',
    });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe(2);
  });

  it('returns empty array when no match', async () => {
    const results = await searchProducts(env.DB, { name: 'NoExiste12345' });
    expect(results).toEqual([]);
  });

  it('results are ordered by name ASC', async () => {
    const results = await searchProducts(env.DB);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].name >= results[i - 1].name).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// getProductById
// ---------------------------------------------------------------------------
describe('getProductById', () => {
  it('returns the correct product', async () => {
    const product = await getProductById(env.DB, 1);
    expect(product).not.toBeNull();
    expect(product!.id).toBe(1);
    expect(product!.name).toBe('Pantalón XXL Verde');
    expect(product!.tipo_prenda).toBe('Pantalón');
  });

  it('returns null for non-existent product', async () => {
    const product = await getProductById(env.DB, 9999);
    expect(product).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// createCart
// ---------------------------------------------------------------------------
describe('createCart', () => {
  it('creates a cart and returns it with an id', async () => {
    const cart = await createCart(env.DB);
    expect(cart.id).toBeGreaterThan(0);
    expect(cart.created_at).toBeDefined();
    expect(cart.updated_at).toBeDefined();
  });

  it('creates unique carts each time', async () => {
    const cart1 = await createCart(env.DB);
    const cart2 = await createCart(env.DB);
    expect(cart1.id).not.toBe(cart2.id);
  });
});

// ---------------------------------------------------------------------------
// addToCart
// ---------------------------------------------------------------------------
describe('addToCart', () => {
  it('adds a product to the cart', async () => {
    const cart = await createCart(env.DB);
    const item = await addToCart(env.DB, cart.id, 1, 5);
    expect(item.cart_id).toBe(cart.id);
    expect(item.product_id).toBe(1);
    expect(item.qty).toBe(5);
  });

  it('accumulates quantity when adding the same product again', async () => {
    const cart = await createCart(env.DB);
    await addToCart(env.DB, cart.id, 1, 3);
    const item = await addToCart(env.DB, cart.id, 1, 2);
    expect(item.qty).toBe(5);
  });

  it('throws when product does not exist', async () => {
    const cart = await createCart(env.DB);
    await expect(addToCart(env.DB, cart.id, 9999, 1)).rejects.toThrow('no encontrado');
  });

  it('throws when stock is insufficient', async () => {
    const cart = await createCart(env.DB);
    // Product 2 has stock=33
    await expect(addToCart(env.DB, cart.id, 2, 50)).rejects.toThrow('Stock insuficiente');
  });

  it('throws when product is not available (disponible=0)', async () => {
    const cart = await createCart(env.DB);
    // Product 11 has disponible=0
    await expect(addToCart(env.DB, cart.id, 11, 1)).rejects.toThrow('no esta disponible');
  });

  it('throws when cart does not exist', async () => {
    await expect(addToCart(env.DB, 9999, 1, 1)).rejects.toThrow('Carrito con ID 9999 no encontrado');
  });
});

// ---------------------------------------------------------------------------
// updateCartItem
// ---------------------------------------------------------------------------
describe('updateCartItem', () => {
  it('updates quantity to the specified value (not incremental)', async () => {
    const cart = await createCart(env.DB);
    await addToCart(env.DB, cart.id, 1, 5);
    const updated = await updateCartItem(env.DB, cart.id, 1, 10);
    expect(updated.qty).toBe(10);
  });

  it('throws when product does not exist', async () => {
    const cart = await createCart(env.DB);
    await expect(updateCartItem(env.DB, cart.id, 9999, 1)).rejects.toThrow('no encontrado');
  });

  it('throws when stock is insufficient for the new quantity', async () => {
    const cart = await createCart(env.DB);
    await addToCart(env.DB, cart.id, 2, 1);
    // Product 2 has stock=33
    await expect(updateCartItem(env.DB, cart.id, 2, 50)).rejects.toThrow('Stock insuficiente');
  });

  it('throws when product is not in the cart', async () => {
    const cart = await createCart(env.DB);
    await expect(updateCartItem(env.DB, cart.id, 1, 5)).rejects.toThrow(
      'Producto no encontrado en el carrito'
    );
  });
});

// ---------------------------------------------------------------------------
// removeFromCart
// ---------------------------------------------------------------------------
describe('removeFromCart', () => {
  it('removes a product from the cart', async () => {
    const cart = await createCart(env.DB);
    await addToCart(env.DB, cart.id, 1, 3);
    const result = await removeFromCart(env.DB, cart.id, 1);
    expect(result).toBe(true);

    // Verify it's gone
    const cartData = await getCartWithItems(env.DB, cart.id);
    expect(cartData.items.length).toBe(0);
  });

  it('throws when product is not in the cart', async () => {
    const cart = await createCart(env.DB);
    await expect(removeFromCart(env.DB, cart.id, 1)).rejects.toThrow(
      'Producto no encontrado en el carrito'
    );
  });
});

// ---------------------------------------------------------------------------
// getCartWithItems
// ---------------------------------------------------------------------------
describe('getCartWithItems', () => {
  it('returns an empty cart when no items', async () => {
    const cart = await createCart(env.DB);
    const data = await getCartWithItems(env.DB, cart.id);
    expect(data.cart.id).toBe(cart.id);
    expect(data.items).toEqual([]);
    expect(data.item_count).toBe(0);
  });

  it('returns cart with items and correct item_count', async () => {
    const cart = await createCart(env.DB);
    await addToCart(env.DB, cart.id, 1, 3);
    await addToCart(env.DB, cart.id, 2, 7);

    const data = await getCartWithItems(env.DB, cart.id);
    expect(data.items.length).toBe(2);
    expect(data.item_count).toBe(10); // 3 + 7
  });

  it('includes product pricing details in items', async () => {
    const cart = await createCart(env.DB);
    await addToCart(env.DB, cart.id, 1, 2);

    const data = await getCartWithItems(env.DB, cart.id);
    const item = data.items[0];
    expect(item.product_name).toBe('Pantalón XXL Verde');
    expect(item.precio_50).toBe(1058);
    expect(item.precio_100).toBe(1182);
    expect(item.precio_200).toBe(462);
  });

  it('throws when cart does not exist', async () => {
    await expect(getCartWithItems(env.DB, 9999)).rejects.toThrow(
      'Carrito con ID 9999 no encontrado'
    );
  });
});
