import { env } from 'cloudflare:test';
import { describe, it, expect, beforeEach } from 'vitest';
import { seedDatabase, createMockServer } from './helpers';
import { registerProductTools } from '../src/tools/products';

beforeEach(async () => {
  await seedDatabase(env.DB);
});

describe('search_products tool', () => {
  it('registers the tool', () => {
    const server = createMockServer();
    registerProductTools(server, { DB: env.DB });
    expect(server.tools.has('search_products')).toBe(true);
  });

  it('returns products matching filters', async () => {
    const server = createMockServer();
    registerProductTools(server, { DB: env.DB });
    const handler = server.getHandler('search_products')!;

    const result = await handler({ tipo_prenda: 'Camiseta' });
    expect(result.content[0].type).toBe('text');

    const data = JSON.parse(result.content[0].text);
    expect(data.cantidad).toBeGreaterThan(0);
    expect(data.productos.every((p: any) => p.tipo === 'Camiseta')).toBe(true);
  });

  it('returns message when no products match', async () => {
    const server = createMockServer();
    registerProductTools(server, { DB: env.DB });
    const handler = server.getHandler('search_products')!;

    const result = await handler({ name: 'NoExiste12345' });
    expect(result.content[0].text).toContain('No se encontraron productos');
  });

  it('returns all available products when no filters', async () => {
    const server = createMockServer();
    registerProductTools(server, { DB: env.DB });
    const handler = server.getHandler('search_products')!;

    const result = await handler({});
    const data = JSON.parse(result.content[0].text);
    // Product 11 (disponible=0) should not appear
    expect(data.productos.find((p: any) => p.id === 11)).toBeUndefined();
    expect(data.cantidad).toBe(10); // 10 of the 11 seeded products are available
  });

  it('formats product output correctly', async () => {
    const server = createMockServer();
    registerProductTools(server, { DB: env.DB });
    const handler = server.getHandler('search_products')!;

    const result = await handler({ tipo_prenda: 'Pantalón', talla: 'XXL' });
    const data = JSON.parse(result.content[0].text);
    const product = data.productos[0];

    expect(product).toMatchObject({
      id: 1,
      nombre: 'Pantalón XXL Verde',
      tipo: 'Pantalón',
      talla: 'XXL',
      color: 'Verde',
      categoria: 'Deportivo',
      precio_50_unidades: 1058,
      precio_100_unidades: 1182,
      precio_200_unidades: 462,
    });
  });
});

describe('get_product tool', () => {
  it('registers the tool', () => {
    const server = createMockServer();
    registerProductTools(server, { DB: env.DB });
    expect(server.tools.has('get_product')).toBe(true);
  });

  it('returns product details', async () => {
    const server = createMockServer();
    registerProductTools(server, { DB: env.DB });
    const handler = server.getHandler('get_product')!;

    const result = await handler({ product_id: 3 });
    const data = JSON.parse(result.content[0].text);

    expect(data.id).toBe(3);
    expect(data.nombre).toBe('Camiseta S Negro');
    expect(data.disponible).toBe('Si');
    expect(data.precios.por_50_unidades).toBe(1292);
  });

  it('returns error for non-existent product', async () => {
    const server = createMockServer();
    registerProductTools(server, { DB: env.DB });
    const handler = server.getHandler('get_product')!;

    const result = await handler({ product_id: 9999 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('no encontrado');
  });

  it('shows "No" for unavailable products', async () => {
    const server = createMockServer();
    registerProductTools(server, { DB: env.DB });
    const handler = server.getHandler('get_product')!;

    const result = await handler({ product_id: 11 });
    const data = JSON.parse(result.content[0].text);
    expect(data.disponible).toBe('No');
  });
});
