import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/products";

const DOMAIN = "https://chysfashion.online";
const BRAND = "Chys Fashion";

const CATEGORY_MAP: Record<string, string> = {
  "ao-thun": "Apparel & Accessories > Clothing > Shirts & Tops",
  "so-mi": "Apparel & Accessories > Clothing > Shirts & Tops",
  quan: "Apparel & Accessories > Clothing > Pants",
  dam: "Apparel & Accessories > Clothing > Dresses",
  "ao-khoac": "Apparel & Accessories > Clothing > Outerwear",
  vay: "Apparel & Accessories > Clothing > Skirts",
};

function googleCategory(cat: string) {
  return CATEGORY_MAP[cat] ?? "Apparel & Accessories > Clothing";
}

// Strip HTML tags and HTML entities, then escape for XML
function clean(s: string): string {
  return s
    .replace(/<[^>]*>/g, " ")           // remove HTML tags
    .replace(/&[a-z#0-9]+;/gi, " ")     // remove HTML entities (&nbsp; &amp; etc)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // remove invalid XML control chars
    .replace(/\s+/g, " ")
    .trim();
}

function esc(s: string): string {
  return clean(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// For URLs: only escape & (no HTML stripping needed)
function escUrl(s: string): string {
  return s.replace(/&/g, "&amp;");
}

function mapGender(g: string) {
  if (g === "nam") return "male";
  if (g === "nu") return "female";
  return "unisex";
}

export const revalidate = 3600;

export async function GET() {
  const products = await getAllProducts();

  const items = products
    .filter((p) => p.images[0])
    .map((p) => {
      const url = `${DOMAIN}/san-pham/${p.slug}`;
      const extraImages = p.images.slice(1, 11);
      const regularPrice = p.compareAtPrice ?? p.price;
      const salePrice = p.compareAtPrice ? p.price : null;
      const color = p.colors[0]?.name ?? "";
      const firstSize = p.sizes[0] ?? "";
      const availability = p.stock > 0 ? "in stock" : "out of stock";
      const desc = esc((p.description || p.name).slice(0, 5000));

      const lines = [
        `  <item>`,
        `    <g:id>${esc(p.id)}</g:id>`,
        `    <g:title>${esc(p.name)}</g:title>`,
        `    <g:description>${desc}</g:description>`,
        `    <g:link>${escUrl(url)}</g:link>`,
        `    <g:image_link>${escUrl(p.images[0])}</g:image_link>`,
        ...extraImages.map((img) => `    <g:additional_image_link>${escUrl(img)}</g:additional_image_link>`),
        `    <g:availability>${availability}</g:availability>`,
        `    <g:price>${regularPrice} VND</g:price>`,
        ...(salePrice !== null ? [`    <g:sale_price>${salePrice} VND</g:sale_price>`] : []),
        `    <g:condition>new</g:condition>`,
        `    <g:brand>${BRAND}</g:brand>`,
        `    <g:google_product_category>${googleCategory(p.category)}</g:google_product_category>`,
        `    <g:gender>${mapGender(p.gender)}</g:gender>`,
        `    <g:age_group>adult</g:age_group>`,
        ...(color ? [`    <g:color>${esc(color)}</g:color>`] : []),
        ...(firstSize ? [`    <g:size>${esc(firstSize)}</g:size>`] : []),
        `  </item>`,
      ];

      return lines.join("\n");
    })
    .join("\n");

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">`,
    `  <channel>`,
    `    <title>${BRAND}</title>`,
    `    <link>${DOMAIN}</link>`,
    `    <description>Thời trang cao cấp CHYS Fashion</description>`,
    items,
    `  </channel>`,
    `</rss>`,
  ].join("\n");

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=UTF-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
