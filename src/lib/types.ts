export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: "ao-so-mi" | "ao-thun" | "quan" | "ao-khoac" | "dam-vay" | "phu-kien";
  categoryLabel: string;
  gender: "nam" | "nu" | "unisex";
  price: number;
  compareAtPrice?: number;
  colors: ProductColor[];
  sizes: string[];
  description: string;
  details: string[];
  isNew?: boolean;
  isBestSeller?: boolean;
  rating: number;
  reviewCount: number;
  images: string[];
}

export interface OrderItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  color: string;
  size: string;
  quantity: number;
}

export type OrderStatus = "moi" | "dang_xu_ly" | "da_giao" | "da_huy";

export interface Order {
  id: string;
  orderCode: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  note: string | null;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  price: number;
  color: string;
  size: string;
  quantity: number;
}
