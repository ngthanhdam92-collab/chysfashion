import { Product } from "./types";

const colorSets = {
  neutral: [
    { name: "Đen", hex: "#171310" },
    { name: "Kem", hex: "#f1ebe0" },
    { name: "Be", hex: "#c9b79c" },
  ],
  earth: [
    { name: "Nâu rêu", hex: "#5c5340" },
    { name: "Xám tro", hex: "#8a8479" },
    { name: "Trắng ngà", hex: "#f4efe4" },
  ],
  jewel: [
    { name: "Xanh rêu", hex: "#3f5e3f" },
    { name: "Rượu vang", hex: "#6d2f34" },
    { name: "Đen", hex: "#171310" },
  ],
};

const sizesApparel = ["S", "M", "L", "XL"];
const sizesOne = ["Freesize"];

export const products: Product[] = [
  {
    id: "p1",
    slug: "ao-so-mi-lanh-cao-cap",
    name: "Áo Sơ Mi Lanh Cao Cấp",
    category: "ao-so-mi",
    categoryLabel: "Áo sơ mi",
    gender: "nam",
    price: 890000,
    compareAtPrice: 1190000,
    colors: colorSets.neutral,
    sizes: sizesApparel,
    description:
      "Áo sơ mi dệt từ vải lanh nguyên chất, form regular fit tôn dáng, phù hợp cho môi trường công sở lẫn dạo phố. Đường may tỉ mỉ, chất liệu thoáng khí quanh năm.",
    details: [
      "Chất liệu: 100% Linen nhập khẩu",
      "Form dáng: Regular fit",
      "Hướng dẫn giặt: Giặt tay hoặc giặt máy chế độ nhẹ, ủi nhiệt độ thấp",
      "Xuất xứ: Sản xuất tại Việt Nam",
    ],
    isNew: true,
    isBestSeller: true,
    rating: 4.8,
    reviewCount: 214,
  },
  {
    id: "p2",
    slug: "ao-thun-cotton-form-rong",
    name: "Áo Thun Cotton Form Rộng",
    category: "ao-thun",
    categoryLabel: "Áo thun",
    gender: "unisex",
    price: 450000,
    colors: colorSets.earth,
    sizes: sizesApparel,
    description:
      "Áo thun basic form rộng, chất cotton compact cao cấp không xù lông, giữ form dáng bền đẹp sau nhiều lần giặt.",
    details: [
      "Chất liệu: Cotton Compact 240gsm",
      "Form dáng: Oversized",
      "Hướng dẫn giặt: Giặt máy dưới 30 độ",
      "Xuất xứ: Sản xuất tại Việt Nam",
    ],
    isBestSeller: true,
    rating: 4.7,
    reviewCount: 356,
  },
  {
    id: "p3",
    slug: "quan-tay-au-slimfit",
    name: "Quần Tây Âu Slim Fit",
    category: "quan",
    categoryLabel: "Quần",
    gender: "nam",
    price: 990000,
    colors: colorSets.neutral,
    sizes: sizesApparel,
    description:
      "Quần tây dáng slim fit, vải wool blend co giãn nhẹ, đứng phom trong suốt ngày dài di chuyển.",
    details: [
      "Chất liệu: Wool blend 4-way stretch",
      "Form dáng: Slim fit",
      "Hướng dẫn giặt: Giặt khô được khuyến nghị",
      "Xuất xứ: Sản xuất tại Việt Nam",
    ],
    rating: 4.6,
    reviewCount: 128,
  },
  {
    id: "p4",
    slug: "ao-khoac-blazer-len",
    name: "Áo Khoác Blazer Dạ Len",
    category: "ao-khoac",
    categoryLabel: "Áo khoác",
    gender: "nam",
    price: 2190000,
    compareAtPrice: 2590000,
    colors: colorSets.jewel,
    sizes: sizesApparel,
    description:
      "Blazer dạ len cao cấp, thiết kế tối giản sang trọng, lớp lót lụa mềm mại, phù hợp cho các dịp quan trọng.",
    details: [
      "Chất liệu: Dạ len 70% Wool",
      "Form dáng: Tailored fit",
      "Hướng dẫn giặt: Giặt khô",
      "Xuất xứ: Sản xuất tại Việt Nam",
    ],
    isNew: true,
    rating: 4.9,
    reviewCount: 87,
  },
  {
    id: "p5",
    slug: "dam-lua-midi-thanh-lich",
    name: "Đầm Lụa Midi Thanh Lịch",
    category: "dam-vay",
    categoryLabel: "Đầm & Váy",
    gender: "nu",
    price: 1590000,
    colors: colorSets.jewel,
    sizes: sizesApparel,
    description:
      "Đầm midi chất liệu lụa satin, form ôm nhẹ tôn đường cong, thích hợp cho tiệc tối hoặc sự kiện quan trọng.",
    details: [
      "Chất liệu: Lụa satin cao cấp",
      "Form dáng: Ôm nhẹ (bodycon)",
      "Hướng dẫn giặt: Giặt khô hoặc giặt tay nhẹ nhàng",
      "Xuất xứ: Sản xuất tại Việt Nam",
    ],
    isNew: true,
    isBestSeller: true,
    rating: 4.9,
    reviewCount: 163,
  },
  {
    id: "p6",
    slug: "vay-chu-a-linen",
    name: "Váy Chữ A Vải Linen",
    category: "dam-vay",
    categoryLabel: "Đầm & Váy",
    gender: "nu",
    price: 750000,
    colors: colorSets.neutral,
    sizes: sizesApparel,
    description:
      "Váy chữ A phom dáng nhẹ nhàng, chất liệu linen thoáng mát, dễ phối cùng áo sơ mi hoặc áo thun basic.",
    details: [
      "Chất liệu: 100% Linen",
      "Form dáng: Chữ A",
      "Hướng dẫn giặt: Giặt máy chế độ nhẹ",
      "Xuất xứ: Sản xuất tại Việt Nam",
    ],
    rating: 4.5,
    reviewCount: 98,
  },
  {
    id: "p7",
    slug: "ao-so-mi-lua-nu",
    name: "Áo Sơ Mi Lụa Cổ Điển",
    category: "ao-so-mi",
    categoryLabel: "Áo sơ mi",
    gender: "nu",
    price: 950000,
    colors: colorSets.earth,
    sizes: sizesApparel,
    description:
      "Áo sơ mi nữ chất liệu lụa mềm mại, thiết kế cổ điển tinh tế, dễ dàng phối cùng chân váy hoặc quần tây.",
    details: [
      "Chất liệu: Lụa pha 95%",
      "Form dáng: Regular fit",
      "Hướng dẫn giặt: Giặt tay, không vắt mạnh",
      "Xuất xứ: Sản xuất tại Việt Nam",
    ],
    isBestSeller: true,
    rating: 4.7,
    reviewCount: 176,
  },
  {
    id: "p8",
    slug: "ao-khoac-trench-coat",
    name: "Áo Khoác Trench Coat Dáng Dài",
    category: "ao-khoac",
    categoryLabel: "Áo khoác",
    gender: "nu",
    price: 2450000,
    colors: colorSets.neutral,
    sizes: sizesApparel,
    description:
      "Trench coat kinh điển, chất liệu cotton gabardine chống nhăn, thắt eo tôn dáng, item không thể thiếu mỗi mùa thu đông.",
    details: [
      "Chất liệu: Cotton gabardine",
      "Form dáng: Dáng dài, thắt eo",
      "Hướng dẫn giặt: Giặt khô",
      "Xuất xứ: Sản xuất tại Việt Nam",
    ],
    isNew: true,
    rating: 4.8,
    reviewCount: 64,
  },
  {
    id: "p9",
    slug: "quan-jogger-cotton",
    name: "Quần Jogger Cotton Thoải Mái",
    category: "quan",
    categoryLabel: "Quần",
    gender: "unisex",
    price: 590000,
    colors: colorSets.earth,
    sizes: sizesApparel,
    description:
      "Quần jogger phom suông thoải mái, chất cotton fleece giữ ấm nhẹ, phù hợp mặc hằng ngày hoặc tập luyện.",
    details: [
      "Chất liệu: Cotton fleece",
      "Form dáng: Regular fit, bo gấu",
      "Hướng dẫn giặt: Giặt máy dưới 30 độ",
      "Xuất xứ: Sản xuất tại Việt Nam",
    ],
    rating: 4.6,
    reviewCount: 142,
  },
  {
    id: "p10",
    slug: "that-lung-da-that",
    name: "Thắt Lưng Da Thật Khóa Vàng",
    category: "phu-kien",
    categoryLabel: "Phụ kiện",
    gender: "unisex",
    price: 690000,
    colors: [{ name: "Nâu bò", hex: "#5c4224" }, { name: "Đen", hex: "#171310" }],
    sizes: sizesOne,
    description:
      "Thắt lưng da bò thật cao cấp, khóa mạ vàng sang trọng, hoàn thiện tổng thể trang phục công sở hoặc dạo phố.",
    details: [
      "Chất liệu: Da bò thật",
      "Khóa: Hợp kim mạ vàng 18k",
      "Bảo hành: 12 tháng lỗi khóa",
      "Xuất xứ: Sản xuất tại Việt Nam",
    ],
    isBestSeller: true,
    rating: 4.9,
    reviewCount: 201,
  },
  {
    id: "p11",
    slug: "khan-lua-hoa-tiet",
    name: "Khăn Lụa Họa Tiết Vintage",
    category: "phu-kien",
    categoryLabel: "Phụ kiện",
    gender: "nu",
    price: 390000,
    colors: colorSets.jewel,
    sizes: sizesOne,
    description:
      "Khăn lụa họa tiết độc quyền CHYS, có thể quàng cổ, buộc tóc hoặc phối cùng túi xách để tăng điểm nhấn.",
    details: [
      "Chất liệu: Lụa 100%",
      "Kích thước: 90x90cm",
      "Hướng dẫn giặt: Giặt tay nhẹ nhàng",
      "Xuất xứ: Sản xuất tại Việt Nam",
    ],
    isNew: true,
    rating: 4.7,
    reviewCount: 58,
  },
  {
    id: "p12",
    slug: "ao-thun-polo-pique",
    name: "Áo Polo Pique Cao Cấp",
    category: "ao-thun",
    categoryLabel: "Áo thun",
    gender: "nam",
    price: 590000,
    colors: colorSets.neutral,
    sizes: sizesApparel,
    description:
      "Áo polo dệt kim pique, cổ bo chắc chắn không bai giãn, phù hợp phong cách smart-casual mỗi ngày.",
    details: [
      "Chất liệu: Cotton Pique 220gsm",
      "Form dáng: Regular fit",
      "Hướng dẫn giặt: Giặt máy chế độ nhẹ",
      "Xuất xứ: Sản xuất tại Việt Nam",
    ],
    rating: 4.6,
    reviewCount: 189,
  },
];

export function getAllProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, limit)
    .concat(
      products.filter((p) => p.id !== product.id && p.category !== product.category)
    )
    .slice(0, limit);
}

export const categories: { value: Product["category"]; label: string }[] = [
  { value: "ao-so-mi", label: "Áo sơ mi" },
  { value: "ao-thun", label: "Áo thun" },
  { value: "quan", label: "Quần" },
  { value: "ao-khoac", label: "Áo khoác" },
  { value: "dam-vay", label: "Đầm & Váy" },
  { value: "phu-kien", label: "Phụ kiện" },
];
