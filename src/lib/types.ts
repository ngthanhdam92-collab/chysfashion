import type { SizeChartRow } from "./size-chart";

export interface ProductColor {
  name: string;
  hex: string;
  images?: string[];
}

export interface ProductVariant {
  color: string;
  size: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku: string;
  costPrice?: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
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
  stock: number;
  variants: ProductVariant[];
  videoUrl: string | null;
  relatedProductIds: string[];
  upsellProductIds: string[];
  sizeChartId: string | null;
  sizeChart: Record<string, unknown>;
  costPrice?: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
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
  discount: number;
  total: number;
  promoCode: string | null;
  paymentMethod: "cod" | "bank_transfer";
  paidAt: string | null;
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
  image?: string;
}
