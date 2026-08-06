import { NextResponse, type NextRequest } from "next/server";
import { getAllProducts } from "@/lib/products";
import { checkInternalSecret } from "@/lib/internal-api-auth";

// Fold Vietnamese accents so "quan"/"ao" match "Quần"/"Áo".
function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d");
}

// Product search for CHYS Chat's order dialog. Server-side, secret-guarded.
export async function GET(req: NextRequest) {
  const denied = checkInternalSecret(req);
  if (denied) return denied;

  const q = fold((req.nextUrl.searchParams.get("q") ?? "").trim());
  if (!q) return NextResponse.json({ products: [] });

  const all = await getAllProducts();
  const products = all
    .filter((p) => fold(p.name).includes(q))
    .slice(0, 10)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      image: p.images?.[0] ?? null,
    }));

  return NextResponse.json({ products });
}
