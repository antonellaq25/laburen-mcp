import { z } from 'zod';
import { createCart, addToCart, updateCartItem, removeFromCart, getCartWithItems } from '../db/queries';
import { toolSuccess, withErrorHandler } from './response';

export function registerCartTools(server: any, env: { DB: D1Database }) {
  server.tool(
    'create_cart',
    'Crear un nuevo carrito de compras vacio. Llama a esta herramienta antes de agregar productos. Devuelve el ID del carrito para usar en operaciones posteriores.',
    {},
    withErrorHandler('Error creando carrito', async () => {
      const cart = await createCart(env.DB);
      return toolSuccess({ cart_id: cart.id, mensaje: 'Carrito creado exitosamente' });
    })
  );

  server.tool(
    'add_to_cart',
    'Agregar un producto a un carrito existente. Si el producto ya esta en el carrito, la cantidad se sumara a la existente.',
    {
      cart_id: z.number().describe('El ID del carrito'),
      product_id: z.number().describe('El ID del producto a agregar'),
      qty: z.number().int().min(1).describe('Cantidad a agregar (minimo 1)'),
    },
    withErrorHandler('Error agregando al carrito', async ({ cart_id, product_id, qty }: { cart_id: number; product_id: number; qty: number }) => {
      const item = await addToCart(env.DB, cart_id, product_id, qty);
      return toolSuccess({ mensaje: 'Producto agregado al carrito', item });
    })
  );

  server.tool(
    'update_cart_item',
    'Actualizar la cantidad de un producto en el carrito. Establece la cantidad al valor especificado (no es incremental).',
    {
      cart_id: z.number().describe('El ID del carrito'),
      product_id: z.number().describe('El ID del producto a actualizar'),
      qty: z.number().int().min(1).describe('Nueva cantidad (reemplaza la cantidad existente)'),
    },
    withErrorHandler('Error actualizando carrito', async ({ cart_id, product_id, qty }: { cart_id: number; product_id: number; qty: number }) => {
      const item = await updateCartItem(env.DB, cart_id, product_id, qty);
      return toolSuccess({ mensaje: 'Producto actualizado en el carrito', item });
    })
  );

  server.tool(
    'remove_from_cart',
    'Eliminar un producto completamente del carrito.',
    {
      cart_id: z.number().describe('El ID del carrito'),
      product_id: z.number().describe('El ID del producto a eliminar'),
    },
    withErrorHandler('Error eliminando del carrito', async ({ cart_id, product_id }: { cart_id: number; product_id: number }) => {
      await removeFromCart(env.DB, cart_id, product_id);
      return toolSuccess({ mensaje: 'Producto eliminado del carrito' });
    })
  );

  server.tool(
    'get_cart',
    'Obtener el contenido completo de un carrito incluyendo detalles de productos, cantidades y precios por volumen.',
    {
      cart_id: z.number().describe('El ID del carrito a consultar'),
    },
    withErrorHandler('Error obteniendo carrito', async ({ cart_id }: { cart_id: number }) => {
      const cartData = await getCartWithItems(env.DB, cart_id);
      return toolSuccess(cartData);
    })
  );
}
