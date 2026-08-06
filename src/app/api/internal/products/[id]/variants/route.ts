import { NextResponse, type NextRequest } from "next/server";
import { getProductById } from "@/lib/products";
import { checkInternalSecret } from "@/lib/internal-api-auth";

// Variants (color/size/price/inventory) for one product.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = checkInternalSecret(req);
  if (denied) return denied;

  const { id } = await params;
  const product = await getProductById(id);
  if (!product) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const variants = (product.variants ?? []).map((v) => ({
    color: v.color,
    size: v.size,
    price: v.price,
    stock: v.stock,
    sku: v.sku,
  }));

  return NextResponse.json({
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    variants,
  });
}
