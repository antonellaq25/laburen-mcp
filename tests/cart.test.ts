import { env } from 'cloudflare:test';
import { describe, it, expect, beforeEach } from 'vitest';
import { seedDatabase } from './helpers';
import { registerCartTools } from '../src/tools/cart';

function createMockServer() {
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

beforeEach(async () => {
  await seedDatabase(env.DB);
});

describe('create_cart tool', () => {
  it('registers the tool', () => {
    const server = createMockServer();
    registerCartTools(server, { DB: env.DB });
    expect(server.tools.has('create_cart')).toBe(true);
  });

  it('creates a cart and returns cart_id', async () => {
    const server = createMockServer();
    registerCartTools(server, { DB: env.DB });
    const handler = server.getHandler('create_cart')!;

    const result = await handler({});
    const data = JSON.parse(result.content[0].text);
    expect(data.cart_id).toBeGreaterThan(0);
    expect(data.mensaje).toContain('Carrito creado');
  });
});

describe('add_to_cart tool', () => {
  it('registers the tool', () => {
    const server = createMockServer();
    registerCartTools(server, { DB: env.DB });
    expect(server.tools.has('add_to_cart')).toBe(true);
  });

  it('adds a product and returns success message', async () => {
    const server = createMockServer();
    registerCartTools(server, { DB: env.DB });
    const createHandler = server.getHandler('create_cart')!;
    const addHandler = server.getHandler('add_to_cart')!;

    const cartResult = await createHandler({});
    const cartId = JSON.parse(cartResult.content[0].text).cart_id;

    const result = await addHandler({ cart_id: cartId, product_id: 1, qty: 2 });
    const data = JSON.parse(result.content[0].text);
    expect(data.mensaje).toContain('Producto agregado');
    expect(data.item.qty).toBe(2);
  });

  it('returns error for insufficient stock', async () => {
    const server = createMockServer();
    registerCartTools(server, { DB: env.DB });
    const createHandler = server.getHandler('create_cart')!;
    const addHandler = server.getHandler('add_to_cart')!;

    const cartResult = await createHandler({});
    const cartId = JSON.parse(cartResult.content[0].text).cart_id;

    const result = await addHandler({ cart_id: cartId, product_id: 2, qty: 50 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Stock insuficiente');
  });
});

describe('update_cart_item tool', () => {
  it('registers the tool', () => {
    const server = createMockServer();
    registerCartTools(server, { DB: env.DB });
    expect(server.tools.has('update_cart_item')).toBe(true);
  });

  it('updates quantity and returns success message', async () => {
    const server = createMockServer();
    registerCartTools(server, { DB: env.DB });
    const createHandler = server.getHandler('create_cart')!;
    const addHandler = server.getHandler('add_to_cart')!;
    const updateHandler = server.getHandler('update_cart_item')!;

    const cartResult = await createHandler({});
    const cartId = JSON.parse(cartResult.content[0].text).cart_id;

    await addHandler({ cart_id: cartId, product_id: 1, qty: 2 });
    const result = await updateHandler({ cart_id: cartId, product_id: 1, qty: 10 });
    const data = JSON.parse(result.content[0].text);
    expect(data.mensaje).toContain('actualizado');
    expect(data.item.qty).toBe(10);
  });

  it('returns error when product not in cart', async () => {
    const server = createMockServer();
    registerCartTools(server, { DB: env.DB });
    const createHandler = server.getHandler('create_cart')!;
    const updateHandler = server.getHandler('update_cart_item')!;

    const cartResult = await createHandler({});
    const cartId = JSON.parse(cartResult.content[0].text).cart_id;

    const result = await updateHandler({ cart_id: cartId, product_id: 1, qty: 5 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('no encontrado');
  });
});

describe('remove_from_cart tool', () => {
  it('registers the tool', () => {
    const server = createMockServer();
    registerCartTools(server, { DB: env.DB });
    expect(server.tools.has('remove_from_cart')).toBe(true);
  });

  it('removes a product and returns success message', async () => {
    const server = createMockServer();
    registerCartTools(server, { DB: env.DB });
    const createHandler = server.getHandler('create_cart')!;
    const addHandler = server.getHandler('add_to_cart')!;
    const removeHandler = server.getHandler('remove_from_cart')!;

    const cartResult = await createHandler({});
    const cartId = JSON.parse(cartResult.content[0].text).cart_id;

    await addHandler({ cart_id: cartId, product_id: 1, qty: 2 });
    const result = await removeHandler({ cart_id: cartId, product_id: 1 });
    const data = JSON.parse(result.content[0].text);
    expect(data.mensaje).toContain('eliminado');
  });

  it('returns error when product not in cart', async () => {
    const server = createMockServer();
    registerCartTools(server, { DB: env.DB });
    const createHandler = server.getHandler('create_cart')!;
    const removeHandler = server.getHandler('remove_from_cart')!;

    const cartResult = await createHandler({});
    const cartId = JSON.parse(cartResult.content[0].text).cart_id;

    const result = await removeHandler({ cart_id: cartId, product_id: 1 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('no encontrado');
  });
});

describe('get_cart tool', () => {
  it('registers the tool', () => {
    const server = createMockServer();
    registerCartTools(server, { DB: env.DB });
    expect(server.tools.has('get_cart')).toBe(true);
  });

  it('returns cart contents with pricing', async () => {
    const server = createMockServer();
    registerCartTools(server, { DB: env.DB });
    const createHandler = server.getHandler('create_cart')!;
    const addHandler = server.getHandler('add_to_cart')!;
    const getHandler = server.getHandler('get_cart')!;

    const cartResult = await createHandler({});
    const cartId = JSON.parse(cartResult.content[0].text).cart_id;

    await addHandler({ cart_id: cartId, product_id: 1, qty: 3 });
    await addHandler({ cart_id: cartId, product_id: 2, qty: 5 });

    const result = await getHandler({ cart_id: cartId });
    const data = JSON.parse(result.content[0].text);
    expect(data.items.length).toBe(2);
    expect(data.item_count).toBe(8); // 3 + 5
  });

  it('returns error for non-existent cart', async () => {
    const server = createMockServer();
    registerCartTools(server, { DB: env.DB });
    const getHandler = server.getHandler('get_cart')!;

    const result = await getHandler({ cart_id: 9999 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('no encontrado');
  });
});
