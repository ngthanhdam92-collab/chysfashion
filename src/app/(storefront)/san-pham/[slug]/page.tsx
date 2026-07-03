import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { ProductDetailView } from "@/components/product-detail-view";
import { ProductCard } from "@/components/product-card";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product ? `${product.name} — CHYS Fashion` : "Sản phẩm" };
}

export default async function ProductDetailPage({ params }: Params) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ProductDetailView product={product} />

      <div className="mt-10 lg:grid lg:grid-cols-2 lg:gap-16">
        <div className="lg:col-start-2">
          <div className="divide-y divide-line border-t border-line">
            <details open className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-ink">
                Mô tả sản phẩm
                <ChevronDown
                  size={16}
                  className="transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {product.description}
              </p>
            </details>
            <details className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-ink">
                Chất liệu & bảo quản
                <ChevronDown
                  size={16}
                  className="transition-transform group-open:rotate-180"
                />
              </summary>
              <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-muted">
                {product.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </details>
            <details className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-ink">
                Vận chuyển & đổi trả
                <ChevronDown
                  size={16}
                  className="transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Giao hàng toàn quốc trong 2-5 ngày làm việc. Miễn phí đổi trả
                trong vòng 30 ngày kể từ ngày nhận hàng đối với sản phẩm còn
                nguyên tem mác.
              </p>
            </details>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="font-serif text-2xl text-ink sm:text-3xl">
            Có thể bạn cũng thích
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
