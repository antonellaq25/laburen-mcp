import { z } from 'zod';
import { createCart, addToCart, updateCartItem, removeFromCart, getCartWithItems } from '../db/queries';

export function registerCartTools(server: any, env: { DB: D1Database }) {
  server.tool(
    'create_cart',
    'Crear un nuevo carrito de compras vacio. Llama a esta herramienta antes de agregar productos. Devuelve el ID del carrito para usar en operaciones posteriores.',
    {},
    async () => {
      try {
        const cart = await createCart(env.DB);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ cart_id: cart.id, mensaje: 'Carrito creado exitosamente' }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error creando carrito: ${(error as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'add_to_cart',
    'Agregar un producto a un carrito existente. Si el producto ya esta en el carrito, la cantidad se sumara a la existente.',
    {
      cart_id: z.number().describe('El ID del carrito'),
      product_id: z.number().describe('El ID del producto a agregar'),
      qty: z.number().int().min(1).describe('Cantidad a agregar (minimo 1)'),
    },
    async ({ cart_id, product_id, qty }: { cart_id: number; product_id: number; qty: number }) => {
      try {
        const item = await addToCart(env.DB, cart_id, product_id, qty);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              mensaje: 'Producto agregado al carrito',
              item: item,
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error agregando al carrito: ${(error as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'update_cart_item',
    'Actualizar la cantidad de un producto en el carrito. Establece la cantidad al valor especificado (no es incremental).',
    {
      cart_id: z.number().describe('El ID del carrito'),
      product_id: z.number().describe('El ID del producto a actualizar'),
      qty: z.number().int().min(1).describe('Nueva cantidad (reemplaza la cantidad existente)'),
    },
    async ({ cart_id, product_id, qty }: { cart_id: number; product_id: number; qty: number }) => {
      try {
        const item = await updateCartItem(env.DB, cart_id, product_id, qty);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              mensaje: 'Producto actualizado en el carrito',
              item: item,
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error actualizando carrito: ${(error as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'remove_from_cart',
    'Eliminar un producto completamente del carrito.',
    {
      cart_id: z.number().describe('El ID del carrito'),
      product_id: z.number().describe('El ID del producto a eliminar'),
    },
    async ({ cart_id, product_id }: { cart_id: number; product_id: number }) => {
      try {
        await removeFromCart(env.DB, cart_id, product_id);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ mensaje: 'Producto eliminado del carrito' }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error eliminando del carrito: ${(error as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'get_cart',
    'Obtener el contenido completo de un carrito incluyendo detalles de productos, cantidades y precios por volumen.',
    {
      cart_id: z.number().describe('El ID del carrito a consultar'),
    },
    async ({ cart_id }: { cart_id: number }) => {
      try {
        const cartData = await getCartWithItems(env.DB, cart_id);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify(cartData, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error obteniendo carrito: ${(error as Error).message}` }],
          isError: true,
        };
      }
    }
  );
}
