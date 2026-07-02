import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { ProductPurchasePanel } from "@/components/product-purchase-panel";
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
  const gallery = product.images.length > 0 ? product.images : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          {gallery ? (
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-cream">
              <Image
                src={gallery[0]}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <ProductImagePlaceholder seed={product.id} />
          )}
          <div className="mt-3 grid grid-cols-4 gap-3">
            {gallery
              ? gallery.slice(0, 4).map((src, i) => (
                  <div key={src} className="relative aspect-[3/4] overflow-hidden bg-cream">
                    <Image
                      src={src}
                      alt={`${product.name} ${i + 1}`}
                      fill
                      sizes="25vw"
                      className="object-cover"
                    />
                  </div>
                ))
              : [0, 1, 2, 3].map((i) => (
                  <ProductImagePlaceholder key={i} seed={`${product.id}-${i}`} />
                ))}
          </div>
        </div>

        <div>
          <ProductPurchasePanel product={product} />

          <div className="mt-10 divide-y divide-line border-t border-line">
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
