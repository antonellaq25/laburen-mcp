export interface Env {
  DB: D1Database;
  MCP_OBJECT: DurableObjectNamespace;
}

export interface Product {
  id: number;
  name: string;
  tipo_prenda: string;
  talla: string;
  color: string;
  stock: number;
  precio_50: number;
  precio_100: number;
  precio_200: number;
  disponible: number;
  categoria: string;
  description: string | null;
}

export interface Cart {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  qty: number;
}

export interface CartItemWithProduct extends CartItem {
  product_name: string;
  precio_50: number;
  precio_100: number;
  precio_200: number;
}

export interface CartWithItems {
  cart: Cart;
  items: CartItemWithProduct[];
  item_count: number;
}
