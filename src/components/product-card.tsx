import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import { formatVnd } from "@/lib/utils";
import { ProductImagePlaceholder } from "./product-image-placeholder";

export function ProductCard({ product }: { product: Product }) {
  const cover = product.images[0];

  return (
    <Link href={`/san-pham/${product.slug}`} className="group block">
      <div className="relative overflow-hidden">
        {cover ? (
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-cream">
            <Image
              src={cover}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </div>
        ) : (
          <ProductImagePlaceholder
            seed={product.id}
            label={product.categoryLabel}
            className="transition-transform duration-500 ease-out group-hover:scale-105"
          />
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.isNew && (
            <span className="bg-ink px-2.5 py-1 text-[10px] tracking-label uppercase text-paper">
              Mới
            </span>
          )}
          {product.compareAtPrice && (
            <span className="bg-gold px-2.5 py-1 text-[10px] tracking-label uppercase text-paper">
              Sale
            </span>
          )}
        </div>
        {product.stock === 0 && (
          <div className="absolute inset-x-0 bottom-0 bg-ink/70 py-2 text-center text-[11px] tracking-label uppercase text-paper">
            Hết hàng
          </div>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-[11px] tracking-label uppercase text-muted">
          {product.categoryLabel}
        </p>
        <h3 className="text-sm text-ink transition-colors group-hover:text-gold-dark">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink">
            {formatVnd(product.price)}
          </span>
          {product.compareAtPrice && (
            <span className="text-xs text-muted line-through">
              {formatVnd(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
