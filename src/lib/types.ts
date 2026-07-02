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
