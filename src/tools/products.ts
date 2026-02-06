import { z } from 'zod';
import { searchProducts, getProductById } from '../db/queries';

export function registerProductTools(server: any, env: { DB: D1Database }) {
  server.tool(
    'search_products',
    'Buscar y listar productos con filtros opcionales. Usa esta herramienta para ayudar a los clientes a encontrar productos por nombre, tipo de prenda, talla, color, categoria o rango de precio.',
    {
      name: z.string().optional().describe('Nombre del producto a buscar (coincidencia parcial)'),
      tipo_prenda: z.string().optional().describe('Tipo de prenda: Pantalon, Camiseta, Falda, Sudadera, Chaqueta'),
      talla: z.string().optional().describe('Talla: S, M, L, XL, XXL'),
      color: z.string().optional().describe('Color: Verde, Blanco, Negro, Azul, Gris, Amarillo, Rojo'),
      categoria: z.string().optional().describe('Categoria: Deportivo, Casual, Formal'),
      min_price: z.number().optional().describe('Precio minimo (basado en precio para 50 unidades)'),
      max_price: z.number().optional().describe('Precio maximo (basado en precio para 50 unidades)'),
    },
    async ({ name, tipo_prenda, talla, color, categoria, min_price, max_price }: {
      name?: string;
      tipo_prenda?: string;
      talla?: string;
      color?: string;
      categoria?: string;
      min_price?: number;
      max_price?: number;
    }) => {
      try {
        const products = await searchProducts(env.DB, { name, tipo_prenda, talla, color, categoria, min_price, max_price });
        if (products.length === 0) {
          return {
            content: [{ type: 'text' as const, text: 'No se encontraron productos con los criterios especificados.' }],
          };
        }
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              cantidad: products.length,
              productos: products.map(p => ({
                id: p.id,
                nombre: p.name,
                tipo: p.tipo_prenda,
                talla: p.talla,
                color: p.color,
                categoria: p.categoria,
                stock: p.stock,
                precio_50_unidades: p.precio_50,
                precio_100_unidades: p.precio_100,
                precio_200_unidades: p.precio_200,
                descripcion: p.description,
              })),
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error buscando productos: ${(error as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'get_product',
    'Obtener informacion detallada de un producto especifico por su ID. Usa esta herramienta cuando un cliente quiera saber mas sobre un producto en particular.',
    {
      product_id: z.number().describe('El ID del producto a consultar'),
    },
    async ({ product_id }: { product_id: number }) => {
      try {
        const product = await getProductById(env.DB, product_id);
        if (!product) {
          return {
            content: [{ type: 'text' as const, text: `Producto con ID ${product_id} no encontrado.` }],
            isError: true,
          };
        }
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              id: product.id,
              nombre: product.name,
              tipo: product.tipo_prenda,
              talla: product.talla,
              color: product.color,
              categoria: product.categoria,
              stock: product.stock,
              disponible: product.disponible ? 'Si' : 'No',
              precios: {
                por_50_unidades: product.precio_50,
                por_100_unidades: product.precio_100,
                por_200_unidades: product.precio_200,
              },
              descripcion: product.description,
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `Error obteniendo producto: ${(error as Error).message}` }],
          isError: true,
        };
      }
    }
  );
}
